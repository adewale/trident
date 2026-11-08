import {FamilyCanvas,expectedFact,same,setFamilyCheck,type familyChecks} from './terminal-family-canvas.ts'
import {terminalTextWidth} from './terminal-display.ts'
import type {TerminalEncodingContext} from './terminal-encoding.ts'
import type {TerminalSourceContract} from './terminal-source.ts'
/** Month/day tick coordinates calibrate the axis before any expected bar is
 * inspected. Literal source dates are forward projected; unprinted year/ID or
 * after-syntax is not inverse inferred. One day of printed tick precision plus
 * one display cell bounds the projection; no expected bar fits the scale. */
export function inspectTerminalGanttAxis(canvas:FamilyCanvas,checks:ReturnType<typeof familyChecks>,contract:TerminalSourceContract,encoding?:TerminalEncodingContext){
 const axes=canvas.grid.flatMap((row,y)=>{const x=row.indexOf('└');return x>=0&&row.slice(0,x).every(c=>!c.trim())&&/^[─┬]+$/.test(row.slice(x+1).join(''))?[{x,y}]:[]});if(axes.length!==1)return
 const axis=axes[0]!,expected=expectedFact<any>(contract,'gantt-tasks'),monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],ticks=canvas.grid[axis.y]!.flatMap((glyph,x)=>glyph==='┬'?[x]:[]),labelRow=canvas.row(axis.y+1),labels=[...labelRow.matchAll(/\b([A-Z][a-z]{2}) (\d{2})\b/g)]
 if(ticks.length<3||labels.length!==ticks.length||expected.dateFormat!=='YYYY-MM-DD'||!expected.tasks.length)return
 const literalDates=expected.tasks.flatMap((task:any)=>[Date.parse(task.startDate+'T00:00:00Z'),Date.parse(task.endDate+'T00:00:00Z')]);if(literalDates.some((date:number)=>!Number.isFinite(date)))return
 const firstSource=new Date(Math.min(...literalDates)),firstMonth=monthNames.indexOf(labels[0]![1]!);if(firstMonth<0)return
 let year=firstSource.getUTCFullYear()-(firstMonth>firstSource.getUTCMonth()?1:0),previousMonth=firstMonth,previousTime=-Infinity
 const observedTicks:{x:number;day:number;label:string}[]=[],claimed=new Set<number>()
 for(const match of labels){
  const month=monthNames.indexOf(match[1]!),date=Number(match[2]);if(month<0)return;if(month<previousMonth)year++
  const time=Date.UTC(year,month,date),decoded=new Date(time),center=terminalTextWidth(labelRow.slice(0,match.index!))+Math.floor(terminalTextWidth(match[0])/2),owners=ticks.filter(x=>Math.abs(x-center)<=1)
  if(decoded.getUTCMonth()!==month||decoded.getUTCDate()!==date||time<=previousTime||owners.length!==1||claimed.has(owners[0]!))return
  claimed.add(owners[0]!);observedTicks.push({x:owners[0]!,day:time/86400000,label:match[0]});previousTime=time;previousMonth=month
 }
 const first=observedTicks[0]!,last=observedTicks.at(-1)!,scale=(last.x-first.x)/(last.day-first.day),column=first.x-scale*first.day,tolerance=1.01+scale
 if(!Number.isFinite(scale)||scale<=0||last.day-first.day>366||observedTicks.some(tick=>Math.abs(tick.x-(column+scale*tick.day))>tolerance))return
 let lowerScale=0,upperScale=Infinity
 for(let i=0;i<observedTicks.length;i++)for(let j=i+1;j<observedTicks.length;j++){const a=observedTicks[i]!,b=observedTicks[j]!,days=b.day-a.day,columns=b.x-a.x;lowerScale=Math.max(lowerScale,(columns-1)/(days+1));if(days>1)upperScale=Math.min(upperScale,(columns+1)/(days-1))}
 if(!(lowerScale>0&&Number.isFinite(upperScale)&&lowerScale<=upperScale))return
 const projected=(day:number,x:number,quantum=1.51)=>observedTicks.every(tick=>{const low=day-tick.day-1,high=day-tick.day,min=Math.min(low*lowerScale,low*upperScale,high*lowerScale,high*upperScale),max=Math.max(low*lowerScale,low*upperScale,high*lowerScale,high*upperScale);return x>=tick.x+min-quantum&&x<=tick.x+max+quantum})
 const sections:string[]=[],tasks:{section:string;label:string;left:number;right:number;glyph:string}[]=[];let section=''
 canvas.claimRow(axis.y);canvas.claimRow(axis.y+1)
 for(let y=0;y<axis.y;y++){
  if(!canvas.row(y).trim()||canvas.owned.has('0,'+y))continue
  if(canvas.cell(axis.x,y)!=='│')return
  const label=canvas.grid[y]!.slice(0,axis.x).join('').trim().normalize('NFC'),right=canvas.grid[y]!.slice(axis.x+1),ink=right.flatMap((glyph,offset)=>glyph.trim()?[{glyph,x:axis.x+1+offset}]:[])
  if(!label)return
  if(!ink.length){section=label;sections.push(section)}else{
   if(!section||!ink.every(point=>point.glyph===ink[0]!.glyph)||!/^[█▓░◆]$/.test(ink[0]!.glyph)||ink.some((point,n)=>n&&point.x!==ink[n-1]!.x+1)||ink[0]!.glyph==='◆'&&ink.length!==1)return
   tasks.push({section,label,left:ink[0]!.x,right:ink.at(-1)!.x+1,glyph:ink[0]!.glyph})
  }
  canvas.claimRow(y)
 }
 if(canvas.leftovers()||!tasks.length)return
 let failed=!same(sections,expected.sections)||tasks.length!==expected.tasks.length,unknown=false
 const actual=tasks.map((task,index)=>{
  const source=expected.tasks[index],matches=expected.tasks.filter((item:any)=>item.label===task.label)
  if(matches.length!==1||!source||source.label!==task.label||source.section!==task.section){failed=true;return task}
  const start=Date.parse(source.startDate+'T00:00:00Z')/86400000,end=Date.parse(source.endDate+'T00:00:00Z')/86400000,milestone=source.status.includes('milestone'),wantedLeft=column+scale*(milestone?(start+end)/2:start),wantedRight=column+scale*end
  if(!projected(milestone?(start+end)/2:start,task.left,milestone?2.51:1.51)||!milestone&&!projected(end,task.right)||milestone!==(task.glyph==='◆'))failed=true
  // No arbitrary skin decoder: only this exact admitted public encoder owns
  // these status codes. Its █ is deliberately noninjective (normal or crit).
  const decoded=task.glyph==='░'?['done']:task.glyph==='▓'?['active']:task.glyph==='◆'?['milestone']:['normal','crit']
  if(!encoding?.capabilities.includes('gantt')||task.glyph==='█')unknown=true
  else if(!same(decoded,source.status))failed=true
  return {...task,decodedStatus:encoding?.capabilities.includes('gantt')?decoded:null,projectedSourceInterval:{start:source.startDate,end:source.endDate},expectedColumns:{left:wantedLeft,right:wantedRight}}
 })
 setFamilyCheck(checks,'gantt-tasks',failed?'failed':unknown?'unknown':'passed',failed?'Owned task captions/sections, literal interval projections, milestone position or independently decoded status contradict the visible day axis':unknown?'Every owned interval/section matches the independently calibrated day axis; unprinted year/IDs/after syntax are forward projected, not inverse inferred. Status remains unqualified without its exact encoder; native █ cannot distinguish normal from critical.':'Full owned intervals/sections and injective admitted status codes match the source-forward calendar projection; source year/IDs/after syntax are retained without requiring printed native fields',{sections,tasks:actual,ticks:observedTicks,scale,axisScaleInterval:{lower:lowerScale,upper:upperScale},barCellQuantum:1.51,milestoneCellQuantum:2.51})
 const title=checks.find(check=>check.criterion==='title');if(title?.status==='unknown')setFamilyCheck(checks,'title','failed','Complete axis/task grammar contains no visible authored title row')
}
