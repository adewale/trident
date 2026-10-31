import json,hashlib,math
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
root=Path('/workspace/trident-ecosystem-2026-10-31-campaign')
reviews=json.load(open('/workspace/trident-ecosystem-results/corpus/docs-reviewed.json'))
reviews=[(i,r) for i,r in enumerate(reviews) if r['intent']=='drawing']
rows=json.load(open(root/'docs/png/observations.json'))
projects=list(dict.fromkeys(row['metrics']['project'] for row in rows))
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
manifest=[]
for project in projects:
    panels=[]
    for number,review in reviews:
        own=next((r for r in rows if r['metrics']['project']==project and r['caseId']==review['id'] and r['operation']=='drawing-checks'),None)
        witness=own and own.get('metrics',{}).get('witness')
        path=root/'docs/png'/witness if witness else None
        panels.append((number,review,own,path))
    for page in range(4):
        sheet=Image.new('RGB',(1240,1080),'#e8edf2');draw=ImageDraw.Draw(sheet)
        draw.text((20,12),project+' | PNG inspection '+str(page+1)+'/4',font=font,fill='#111827')
        draw.text((20,36),'Actual retained PNGs, scaled to fit only. Source facts in corpus/docs-reviewed.json; no SVG-derived credit.',font=small,fill='#334155')
        entries=[]
        for position,(number,review,own,path) in enumerate(panels[page*4:page*4+4]):
            x=20+(position%2)*610;y=70+(position//2)*500
            draw.rectangle((x,y,x+590,y+480),fill='white',outline='#94a3b8',width=2)
            title=str(number)+' | '+review['id'].split('/syntax/')[1]
            draw.text((x+10,y+8),title,font=font,fill='#111827')
            expected=review['expected'];labels=', '.join(expected.get('labels',[]))
            draw.text((x+10,y+32),'Expected: '+labels[:72],font=small,fill='#334155')
            sha=None
            if path and path.exists():
                data=path.read_bytes();sha=hashlib.sha256(data).hexdigest()
                try:
                    image=Image.open(path).convert('RGBA')
                    size=image.size
                    image=ImageOps.contain(image,(568,390))
                    background=Image.new('RGBA',image.size,'white');background.alpha_composite(image)
                    sheet.paste(background.convert('RGB'),(x+10+(568-image.width)//2,y+64+(390-image.height)//2))
                    draw.text((x+10,y+456),'PNG '+sha[:16]+' | '+str(size[0])+' x '+str(size[1]),font=small,fill='#334155')
                except Exception as e:draw.text((x+10,y+180),'PNG inspection unavailable: '+str(e)[:65],font=font,fill='#991b1b')
            else:draw.text((x+10,y+180),'No retained PNG: unknown drawing content',font=font,fill='#991b1b')
            entries.append({'number':number,'id':review['id'],'pngSha256':sha,'path':str(path) if path else None,'originalVerdict':own and own['status']})
        slug=project.replace('/','--').replace(':','-')
        target=root/'review'/(slug+'-'+str(page+1)+'.png');sheet.save(target)
        manifest.append({'project':project,'page':page+1,'sheet':str(target),'panels':entries})
(root/'review/contact-sheets.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Created',len(manifest),'inspection sheets for',len(projects),'completed PNG project units')
