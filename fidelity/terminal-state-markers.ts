import type {TerminalRectangle} from './terminal-rectangles.ts'
/** A finite equivalent final-state style: one double-circle endpoint, outside
 * ordinary captions, with one visible incoming head/stem and no other contact.
 * No source transition or hidden route selects an endpoint. Plain circles,
 * duplicate markers and unowned glyphs do not establish a final-state role. */
export function observedTerminalDoubleCircleEnd(grid:string[][],boxes:readonly TerminalRectangle[],ordinary:readonly TerminalRectangle[]){
 const cell=(x:number,y:number)=>grid[y]?.[x]??' ',inside=(box:TerminalRectangle,x:number,y:number)=>x>=box.x&&x<=box.right&&y>=box.y&&y<=box.bottom
 const candidates=grid.flatMap((row,y)=>row.flatMap((glyph,x)=>glyph==='◎'&&!ordinary.some(box=>inside(box,x,y))?[{x,y}]:[]))
 if(candidates.length!==1||grid.some((row,y)=>row.some((glyph,x)=>glyph==='◉'&&!ordinary.some(box=>inside(box,x,y)))))return
 const marker=candidates[0]!,owners=boxes.filter(box=>inside(box,marker.x,marker.y))
 if(owners.length>1)return
 const carrier=owners[0]
 if(carrier&&carrier.lines.filter(Boolean).join(' ').trim()!=='◎')return
 const x=carrier?.x??marker.x,right=carrier?.right??marker.x,y=carrier?.y??marker.y,bottom=carrier?.bottom??marker.y
 const heads:Record<string,number>={'▲':0,'^':0,'↑':0,'►':1,'▶':1,'>':1,'→':1,'▼':2,'v':2,'↓':2,'◄':3,'◀':3,'<':3,'←':3},dx=[0,1,0,-1],dy=[-1,0,1,0],contacts:{x:number;y:number;heading:number}[]=[]
 const outside:{x:number;y:number;heading:number}[]=[]
 if(carrier){
  for(let at=x+1;at<right;at++){outside.push({x:at,y:y-1,heading:2},{x:at,y:bottom+1,heading:0})}
  for(let at=y+1;at<bottom;at++){outside.push({x:x-1,y:at,heading:1},{x:right+1,y:at,heading:3})}
 }else for(let heading=0;heading<4;heading++)outside.push({x:x-dx[heading]!,y:y-dy[heading]!,heading})
 for(const point of outside){
  const glyph=cell(point.x,point.y);if(!glyph.trim())continue
  const before=cell(point.x-dx[point.heading]!,point.y-dy[point.heading]!),continuous=point.heading%2?/^[─━┄┈╌-]$/.test(before):/^[│┃┆┊╎|]$/.test(before)
  if(heads[glyph]!==point.heading||!continuous)return
  contacts.push(point)
 }
 return contacts.length===1?{glyph:'◎' as const,x:marker.x,y:marker.y,carrier:carrier?{x,right,y,bottom}:null,head:contacts[0]!}:undefined
}
