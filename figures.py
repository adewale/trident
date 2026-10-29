import json,pathlib,shutil
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from PIL import Image,ImageDraw,ImageFont
base=pathlib.Path('/workspace/seven-png-campaign');out=pathlib.Path('/workspace/trident/docs/evidence/seven-png');stats=json.loads((base/'timing-statistics.json').read_text());r=stats['ranked']
labels=[f"{x['name']} {x['version']}" for x in r];values=[x['geometricMs'] for x in r];lower=[x['geometricMs']-x['geometricMsCi95'][0] for x in r];upper=[x['geometricMsCi95'][1]-x['geometricMs'] for x in r]
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'svg.fonttype':'none'})
fig,ax=plt.subplots(figsize=(10,5.4));ax.barh(range(7),values,color='#376b9b',height=.58,xerr=[lower,upper],error_kw={'ecolor':'#17232d','capsize':3,'linewidth':1.2});ax.set_yticks(range(7),labels);ax.invert_yaxis();ax.set_xlim(0,103);ax.set_xlabel('Client time to binary PNG bytes (ms), geometric mean');ax.set_title('DaveBench PNG: 13 common reviewed inputs',loc='left',weight='bold',pad=20);ax.grid(axis='x',alpha=.17);ax.set_axisbelow(True)
for i,x in enumerate(r):ax.text(x['geometricMsCi95'][1]+1.4,i,f"{x['geometricMs']:.1f} ms",va='center',fontsize=10)
for edge in ['top','right','left']:ax.spines[edge].set_visible(False)
fig.text(.02,.015,'20 fresh launches × 3 calls/input. Error bars: 95% launch-block bootstrap. Dart/Pele and Zombie/Beautiful ordering unresolved.',fontsize=9)
fig.tight_layout(rect=(0,.06,1,1));fig.savefig(out/'timing.svg');fig.savefig(out/'timing.png',dpi=160);plt.close(fig)
q=base/'qualification-client';rows=[json.loads(l) for l in (q/'rows.jsonl').open() if json.loads(l)['phase']=='qualification'];font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',15);tiles=[]
for x in r:
 row=next(row for row in rows if row['participant']==x['participant'] and row['case'].endswith('classDiagram.md:180'));shutil.copyfile(q/row['png'],out/(x['participant']+'.png'));image=Image.open(q/row['png']).convert('RGB');box=row['inspection']['inkBounds'];image=image.crop((box['x0']-8,box['y0']-8,box['x1']+9,box['y1']+9));tile=Image.new('RGB',(max(420,image.width),image.height+38),'#eeeeee');tile.paste(image,(0,38));ImageDraw.Draw(tile).text((8,10),x['name']+' '+x['version'],font=font,fill='#111111');tiles.append(tile)
width=max(t.width for t in tiles);height=max(t.height for t in tiles);contact=Image.new('RGB',(width*2+12,height*4+36),'#dddddd')
for i,tile in enumerate(tiles):contact.paste(tile,((i%2)*(width+12),(i//2)*(height+12)))
contact.save(out/'painted-contact.png')
print(out)
