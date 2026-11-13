import {FamilyCanvas,setFamilyCheck,type familyChecks} from './terminal-family-canvas.ts'
import {terminalTextWidth} from './terminal-display.ts'
type HistoryEvent={operation:string;branch:string;id?:string;tag?:string;msg?:string;type?:string;from?:string;parents:number[]}
/** Exact native lane encoding: every dot/label, continuous branch track and
 * two-ended vertical stem is observed before any source-history comparison.
 * Source operations project to their visible parent graph; hidden enum names
 * are not recovered from generated IDs such as B-cherry. */
export function inspectTerminalGitLanes(canvas:FamilyCanvas,checks:ReturnType<typeof familyChecks>,expected:any,required:HistoryEvent[]){
 const tracks=canvas.grid.flatMap((row,y)=>{const text=row.join(''),m=/^\s*(\S+)\s{2,}([─●┼]+)\s*$/.exec(text);return m?[{name:m[1]!,y,start:row.findIndex(glyph=>/[─●┼]/.test(glyph)),end:row.length-1}]:[]})
 if(!tracks.length||new Set(tracks.map(t=>t.name)).size!==tracks.length||tracks.some(track=>!canvas.grid[track.y]!.includes('●')))return false
 const markers=tracks.flatMap(track=>canvas.grid[track.y]!.flatMap((glyph,x)=>glyph==='●'?[{x,track,id:'',tag:undefined as string|undefined}]:[])).sort((a,b)=>a.x-b.x)
 if(new Set(markers.map(marker=>marker.x)).size!==markers.length)return false
 const claimToken=(text:string,y:number,index:number)=>{const x=terminalTextWidth(canvas.row(y).slice(0,index)),width=terminalTextWidth(text);for(let at=x;at<x+width;at++)canvas.claim(at,y);return{x,width}}
 for(const marker of markers){
  const row=canvas.row(marker.track.y+1),labels=[...row.matchAll(/[^\s│─┼]+/gu)].filter(match=>!/^\[.*\]$/.test(match[0])).map(match=>({match,x:terminalTextWidth(row.slice(0,match.index!)),width:terminalTextWidth(match[0])})).filter(label=>label.x+Math.floor(label.width/2)===marker.x)
  if(labels.length!==1)return false
  marker.id=labels[0]!.match[0].normalize('NFC');claimToken(labels[0]!.match[0],marker.track.y+1,labels[0]!.match.index!)
  const tagRow=canvas.row(marker.track.y-1),tags=[...tagRow.matchAll(/\[([^\]]+)\]/g)].filter(match=>terminalTextWidth(tagRow.slice(0,match.index!))+Math.floor(terminalTextWidth(match[0])/2)===marker.x)
  if(tags.length>1)return false;if(tags[0]){marker.tag=tags[0][1]!.normalize('NFC');claimToken(tags[0][0],marker.track.y-1,tags[0].index!)}
 }
 if(new Set(markers.map(marker=>marker.id)).size!==markers.length)return false
 tracks.forEach(track=>canvas.claimRow(track.y))
 const visible={branches:tracks.map(track=>track.name),commits:markers.map(marker=>({branch:marker.track.name,id:marker.id,...(marker.tag?{tag:marker.tag}:{})}))}
 if(markers.length!==required.length||JSON.stringify([...expected.branches].sort())!==JSON.stringify([...visible.branches].sort())||required.some((event,index)=>event.id&&event.id!==markers[index]?.id||event.tag&&event.tag!==markers[index]?.tag)){setFamilyCheck(checks,'git-operations','failed','The complete independently owned lane/commit caption inventory loses an authored branch, commit ID or requested tag; no hidden route is inferred',visible);return true}
 const events:{branch:string;id:string;tag?:string;parents:number[]}[]=[],heads=new Map<string,number>()
 for(const marker of markers){
  const secondary:number[]=[]
  for(const direction of[-1,1]){
   let y=marker.track.y+direction;if(canvas.cell(marker.x,y)!=='│'){
    if(direction===1&&canvas.owned.has(marker.x+','+y)&&canvas.cell(marker.x,y+1)==='│'){setFamilyCheck(checks,'git-operations','unknown','Complete visible branch/commit IDs and tags are owned, but a commit-label row occludes the parent stem at its dot column. The documented encoder explains the overlay; no hidden path is reconstructed or selected from expected parents.',visible);return true}
    continue
   }
   while(y>=0&&y<canvas.grid.length&&!tracks.some(track=>track.y===y)){if(canvas.cell(marker.x,y)!=='│')return false;canvas.claim(marker.x,y);y+=direction}
   const source=tracks.find(track=>track.y===y);if(!source||canvas.cell(marker.x,y)!=='┼'||canvas.cell(marker.x,y+direction)==='│')return false
   const parent=heads.get(source.name);if(parent===undefined)return false;secondary.push(parent)
  }
  if(secondary.length>1)return false
  const parent=heads.get(marker.track.name),parents=[parent,...secondary].filter((n):n is number=>n!==undefined)
  events.push({branch:marker.track.name,id:marker.id,...(marker.tag?{tag:marker.tag}:{}),parents});heads.set(marker.track.name,events.length-1)
 }
 if(canvas.leftovers())return false
 // A non-head copy is not identifiable from a branch-level transfer stem.
 // Do not use its source ID to select an unseen edge or invert a suffix.
 let uncertain=required.some(event=>event.msg||event.type)
 for(const [index,event] of required.entries())if(event.operation==='cherry-pick'){
  const picked=event.parents.at(-1),sourceBranch=picked===undefined?undefined:required[picked]?.branch,prior=required.slice(0,index).map((e,i)=>({e,i})).filter(row=>row.e.branch===sourceBranch).at(-1)?.i
  if(picked!==prior)uncertain=true
 }
 const wanted=required.map(event=>({branch:event.branch,parents:event.parents,...(event.id?{id:event.id}:{}),...(event.tag?{tag:event.tag}:{})})),actual=events.map((event,index)=>({branch:event.branch,parents:event.parents,...(required[index]?.id?{id:event.id}:{}),...(required[index]?.tag?{tag:event.tag}:{})})),equal=JSON.stringify(wanted)===JSON.stringify(actual)
 if(events.some((event,index)=>!required[index]?.id&&!/^\d+$/.test(event.id)&&!events.slice(0,index).some(parent=>new RegExp('^'+parent.id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'-cherry(?:-cp)*$').test(event.id))))uncertain=true
 setFamilyCheck(checks,'git-operations',!equal?'failed':uncertain?'unknown':'passed','The exact admitted native lane encoding retains all ordered branch/commit IDs, requested tags and uniquely drawn current-head parent/provenance stems. Source operations are forward projected to this visible graph, not inverse inferred as native history; non-head copies and unprinted messages/types remain unknown.',{branches:tracks.map(track=>track.name),events})
 return true
}
