"""Bounded raster observation: OCR labels, closed rectangles and isolated routes.
No SVG, renderer model, IDs, filenames or reference image supplies observations.
Unsupported shapes, merged routes or uncertain OCR remain unknown.
"""
import sys,json,base64,io,subprocess,collections,math
import numpy as np
from PIL import Image

def observe(job):
    raw=base64.b64decode(job['png']); image=Image.open(io.BytesIO(raw))
    if image.format!='PNG': raise ValueError('Not PNG')
    image=image.convert('RGBA'); w,h=image.size
    if w*h>4000000: return {'status':'unknown','reason':'Raster observer pixel bound exceeded'}
    back=Image.new('RGBA',image.size,'white');back.alpha_composite(image);rgb=np.asarray(back.convert('RGB')).astype(np.int16)
    corners=rgb[[0,0,h-1,h-1],[0,w-1,0,w-1]]; bg=np.median(corners,axis=0)
    if np.max(np.abs(corners-bg))>12:return {'status':'unknown','reason':'Nonuniform raster background'}
    ink=np.max(np.abs(rgb-bg),axis=2)>40
    gx=np.max(np.abs(rgb[:,1:]-rgb[:,:-1]),axis=2)>35;gy=np.max(np.abs(rgb[1:]-rgb[:-1]),axis=2)>35
    outline=np.zeros((h,w),dtype=bool);outline[:,:-1]|=gx;outline[:,1:]|=gx;outline[:-1]|=gy;outline[1:]|=gy
    # Identify closed frame candidates from actual horizontal and vertical edges.
    horizontal=collections.defaultdict(list)
    for y,row in enumerate(outline):
        padded=np.pad(row,(1,1));changes=np.flatnonzero(padded[1:]!=padded[:-1])
        for x0,x1 in zip(changes[::2],changes[1::2]):
            if x1-x0>=18:horizontal[(round(int(x0)/3),round(int(x1)/3))].append((y,int(x0),int(x1)))
    frames=[]
    for lines in horizontal.values():
        lines=sorted(lines);selected=[]
        for line in lines:
            if not selected or line[0]-selected[-1][0]>3:selected.append(line)
        for i,(y0,x0,x1) in enumerate(selected):
            for y1,l0,l1 in selected[i+1:]:
                if y1-y0<14 or y1-y0>1000:continue
                if x1-x0<20:continue
                left=outline[y0:y1+1,max(0,x0-2):min(w,x0+3)].any(axis=1).mean()
                right=outline[y0:y1+1,max(0,x1-3):min(w,x1+2)].any(axis=1).mean()
                if min(left,right)<.75:continue
                box=(x0,y0,x1,y1)
                if not any(max(abs(a-b) for a,b in zip(box,f))<=4 for f in frames):frames.append(box)
    # OCR the actual frame interiors: Tesseract suppresses enclosed text in
    # whole-diagram segmentation. No expected label is supplied to OCR.
    if len(frames)>32:return {'status':'unknown','reason':'Raster frame bound exceeded'}
    tiles=[];height=20;width=1
    for frame in frames:
        x0,y0,x1,y1=frame
        if x1-x0<=8 or y1-y0<=8:continue
        crop=rgb[y0+4:y1-3,x0+4:x1-3]
        if not crop.size:continue
        corner=np.array([crop[0,0],crop[0,-1],crop[-1,0],crop[-1,-1]])
        background=np.median(corner,axis=0)
        pixels=np.where((np.max(np.abs(crop-background),axis=2)>35)[...,None],0,255).astype(np.uint8)
        tile=Image.fromarray(np.repeat(pixels,3,axis=2),'RGB').resize((crop.shape[1]*2,crop.shape[0]*2))
        tiles.append((frame,tile,height));height+=tile.height+30;width=max(width,tile.width+40)
    words=[]
    if tiles:
        if width*height>8000000:return {'status':'unknown','reason':'OCR observation bound exceeded'}
        sheet=Image.new('RGB',(width,height),'white')
        for frame,tile,y in tiles:sheet.paste(tile,(20,y))
        b=io.BytesIO();sheet.save(b,format='PNG')
        ocr=subprocess.run(['tesseract','stdin','stdout','--psm','11','tsv'],input=b.getvalue(),stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,timeout=15)
        if ocr.returncode:return {'status':'unknown','reason':'OCR invocation failed'}
        for line in ocr.stdout.decode().splitlines()[1:]:
            parts=line.split('\t')
            if len(parts)<12 or not parts[11].strip() or float(parts[10])<90:continue
            x,y,bw,bh=[float(parts[i]) for i in [6,7,8,9]]
            for frame,tile,offset in tiles:
                if offset<=y and y+bh<=offset+tile.height:
                    if x<=21 or y<=offset+1 or x+bw>=19+tile.width or y+bh>=offset+tile.height-1:continue
                    words.append({'text':parts[11].strip(),'x':frame[0]+4+(x-20)/2,'y':frame[1]+4+(y-offset)/2,'w':bw/2,'h':bh/2})
                    break
    def contained(word,box,pad=1):return word['x']>=box[0]-pad and word['y']>=box[1]-pad and word['x']+word['w']<=box[2]+pad and word['y']+word['h']<=box[3]+pad
    frame_words=[sorted([word for word in words if contained(word,f)],key=lambda x:(round(x['y']/8),x['x'])) for f in frames]
    expected=job['expected']; nodes=expected.get('nodes')
    if job['family']!='flowchart' or nodes is None:return {'status':'unknown','reason':'Independent raster topology observer supports flowchart frames only'}
    norm=lambda text:' '.join(text.split())
    assigned=[]
    for n in nodes:
        matches=[];taken=[a['frame'] for a in assigned];label=norm(n['label'])
        for i,(f,ws) in enumerate(zip(frames,frame_words)):
            if i in taken:continue
            text=norm(' '.join(word['text'] for word in ws))
            if text==label:matches.append((i,f))
        if not matches:return {'status':'unknown','reason':'No uniquely OCR-owned closed frame for '+n['id'],'observedWords':[x['text'] for x in words]}
        matches.sort(key=lambda t:(t[1][2]-t[1][0])*(t[1][3]-t[1][1]))
        if len(matches)>1 and (matches[0][1][2]-matches[0][1][0])*(matches[0][1][3]-matches[0][1][1])==(matches[1][1][2]-matches[1][1][0])*(matches[1][1][3]-matches[1][1][1]):return {'status':'unknown','reason':'Ambiguous repeated label frames'}
        i,f=matches[0];assigned.append({'id':n['id'],'label':n['label'],'frame':i,'box':list(f)})
    if expected.get('groups'):return {'status':'unknown','reason':'Raster group enclosure observation is unavailable'}
    if not nodes and ink.sum():return {'status':'unknown','reason':'Empty source raster has unexplained visible ink'}
    # Unassigned labeled frames cannot silently disappear from the inventory.
    taken=[a['frame'] for a in assigned]
    extras=[i for i,ws in enumerate(frame_words) if ws and i not in taken and not any(all(contained(word,f) for word in ws) and f!=frames[i] and (f[2]-f[0])*(f[3]-f[1])<(frames[i][2]-frames[i][0])*(frames[i][3]-frames[i][1]) for f in frames)]
    if extras:return {'status':'unknown','reason':'Additional labeled frame requires semantic classification'}
    routes_mask=ink.copy()
    for a in assigned:
        x0,y0,x1,y1=a['box'];routes_mask[max(0,y0-2):min(h,y1+3),max(0,x0-2):min(w,x1+3)]=False
    for word in words:
        if not any(contained(word,a['box']) for a in assigned):
            x0,y0=int(word['x'])-2,int(word['y'])-2;x1,y1=math.ceil(word['x']+word['w'])+2,math.ceil(word['y']+word['h'])+2
            routes_mask[max(0,y0):min(h,y1),max(0,x0):min(w,x1)]=False
    points=set(zip(*np.nonzero(routes_mask)))
    if len(points)>150000:return {'status':'unknown','reason':'Unclassified large raster paint region'}
    routes=[];uncertain=False
    while points:
        first=points.pop();todo=[first];component=[first]
        while todo:
            y,x=todo.pop()
            for dy in [-1,0,1]:
                for dx in [-1,0,1]:
                    p=(y+dy,x+dx)
                    if p in points:points.remove(p);todo.append(p);component.append(p)
        if len(component)<5:continue
        contacts=[]
        for node in assigned:
            x0,y0,x1,y1=node['box'];near=[(y,x) for y,x in component if x0-7<=x<=x1+7 and y0-7<=y<=y1+7]
            if near:contacts.append((node,near))
        if not contacts:
            return {'status':'unknown','reason':'Unassigned raster ink outside the owned nodes and routes'}
        if len(contacts)!=2:uncertain=True;continue
        def head(contact):
            node,near=contact;x0,y0,x1,y1=node['box'];cy,cx=np.mean(near,axis=0)
            sides=[(abs(cx-x0),-1,0,x0,cy),(abs(cx-x1),1,0,x1,cy),(abs(cy-y0),0,-1,cx,y0),(abs(cy-y1),0,1,cx,y1)]
            _,dx,dy,ax,ay=min(sides)
            counts=[]
            for dist in range(3,19):
                selected=[(y,x) for y,x in component if abs((x-ax)*dx+(y-ay)*dy-dist)<.7 and abs((y-ay)*dx-(x-ax)*dy)<15]
                counts.append(len(selected))
            if not counts or max(counts)<4:return False
            peak=max(counts); baseline=max(1,float(np.median(counts[-5:])))
            # A filled triangle grows toward a flat base, then drops abruptly
            # to its shaft. Round/dot/diamond markers must not count as arrows.
            for i in range(2,min(12,len(counts)-1)):
                if counts[i]>=max(5,baseline*2.2) and counts[i]-counts[i+1]>=max(3,counts[i]*.45):
                    prefix=counts[:i+1]
                    if sum(prefix[j+1]>=prefix[j]-1 for j in range(len(prefix)-1))>=len(prefix)-2 and np.corrcoef(range(len(prefix)),prefix)[0,1]>.75:return True
            return False
        a,b=contacts;ha,hb=head(a),head(b)
        if ha and hb:uncertain=True;continue
        source,target=(b[0],a[0]) if ha else (a[0],b[0])
        routes.append({'source':source['id'],'target':target['id'],'directed':ha or hb})
    if uncertain:return {'status':'unknown','reason':'Merged, branching or ambiguous raster connector components','nodes':assigned,'routes':routes}
    wanted=expected.get('edges',[])
    if any(e.get('label') for e in wanted):return {'status':'unknown','reason':'Raster connector-caption ownership is unavailable','nodes':assigned,'routes':routes}
    if any(e.get('startMarker','none')!='none' or e.get('endMarker','arrow') not in ['arrow','none'] for e in wanted):return {'status':'unknown','reason':'Raster marker convention is outside the qualified profile'}
    def edgekey(e):return (e['source'],e['target'],e.get('directed',False)) if e.get('directed') else (*sorted([e['source'],e['target']]),False)
    if sorted(map(edgekey,wanted))!=sorted(map(edgekey,routes)):
        return {'status':'unknown','reason':'Raster route/arrow observations do not establish the declared topology','nodes':assigned,'routes':routes}
    if expected.get('facts',{}).get('direction') and not job.get('layout') and len(nodes)>1:return {'status':'unknown','reason':'Required raster direction lacks a qualified order constraint'}
    supported={'node-shapes','direction'}
    facts=expected.get('facts',{})
    unsupported=set(facts)-supported
    if unsupported:return {'status':'unknown','reason':'Additional required raster facts lack observers: '+', '.join(sorted(unsupported))}
    if any(s.get('shape')!='rectangle' for s in facts.get('node-shapes',[])):return {'status':'unknown','reason':'Nonrectangular raster shapes need a shape observer'}
    for shape in facts.get('node-shapes',[]):
        node=next((n for n in assigned if n['id']==shape['id']),None)
        if node is None:return {'status':'unknown','reason':'Shape ownership unavailable'}
        x0,y0,x1,y1=node['box']
        for x,y in [(x0,y0),(x0,y1),(x1,y0),(x1,y1)]:
            if not outline[max(0,y-2):min(h,y+3),max(0,x-2):min(w,x+3)].any():return {'status':'unknown','reason':'Rectangle corners are not qualified'}

    if job.get('geometry'):return {'status':'unknown','reason':'Additional regression geometry is not qualified for this raster profile'}
    order=job.get('layout',[])
    index={n['id']:n for n in assigned}
    for o in order:
        a,b=index.get(o['before']),index.get(o['after'])
        if a is None or b is None:return {'status':'unknown','reason':'Layout anchor unavailable'}
        axis=0 if o['axis']=='x' else 1
        if (a['box'][axis]+a['box'][axis+2])/2 >= (b['box'][axis]+b['box'][axis+2])/2:return {'status':'incorrect','reason':'Observed raster layout order contradicts the source'}
    return {'status':'correct','reason':'OCR-owned closed frames and isolated raster connector components satisfy all declared facts','nodes':assigned,'routes':routes}

for line in sys.stdin:
    job=json.loads(line)
    try:result=observe(job)
    except Exception as e:result={'status':'unknown','reason':'Raster observer unavailable: '+type(e).__name__+': '+str(e)}
    result['id']=job.get('id');print(json.dumps(result),flush=True)
