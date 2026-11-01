import {FamilyCanvas,familyChecks,familyTitle,same,setFamilyCheck} from './terminal-family-canvas.ts'
import type {TerminalSourceContract} from './terminal-source.ts'
/** Only called after exact artifact/wheel/member admission. These glyph codes
 * are public Termaid0.10.0 output syntax, not a universal emotion/score scale. */
export function inspectTerminalEncodedJourney(output:string,contract:TerminalSourceContract){
 const checks=familyChecks(contract),canvas=new FamilyCanvas(output);if(canvas.error)return checks
 familyTitle(canvas,checks)
 const boxes=canvas.boxes.sort((a,b)=>a.x-b.x);if(!boxes.length||boxes.some(box=>box.y!==boxes[0]!.y||box.bottom!==box.y+2||box.lines.filter(Boolean).length!==1))return checks
 const top=boxes[0]!.y,legends=new Map<string,string>(),sections:{x:number;right:number;label:string}[]=[],faces=new Map([['😞',1],['😟',2],['😐',3],['😊',4],['😄',5]])
 for(let y=0;y<top;y++){
  if(canvas.owned.has('0,'+y)||!canvas.row(y).trim())continue
  const row=canvas.row(y),legend=/^\s*([●◆■▲★◉◈▶])\s+(.+?)\s*$/.exec(row)
  if(legend){if(legends.has(legend[1]!)||[...legends.values()].includes(legend[2]!))return checks;legends.set(legend[1]!,legend[2]!.normalize('NFC'));canvas.claimRow(y);continue}
  for(let x=0;x<canvas.grid[y]!.length;x++)if(canvas.cell(x,y)==='╭'){
   const right=canvas.grid[y]!.findIndex((glyph,at)=>at>x&&glyph==='╮');if(right<0)return checks
   const label=canvas.grid[y]!.slice(x+1,right).join('').replace(/─/g,' ').trim().normalize('NFC');if(!label)return checks
   sections.push({x,right,label});for(let at=x;at<=right;at++)canvas.claim(at,y);x=right
  }
 }
 if(!sections.length||new Set(sections.map(section=>section.label)).size!==sections.length)return checks
 const tasks:{section:string;label:string;score:number;actors:string[]}[]=[]
 for(const box of boxes){
  const parents=sections.filter(section=>section.x<=box.x&&section.right>=box.right);if(parents.length!==1)return checks
  const symbols=canvas.grid[box.y]!.slice(box.x+1,box.right).filter(glyph=>glyph!=='─'),actors=symbols.map(symbol=>legends.get(symbol));if(actors.some(actor=>!actor)||new Set(actors).size!==actors.length)return checks
  const observed=canvas.grid[box.bottom+1]?.flatMap((glyph,x)=>faces.has(glyph)&&x>box.x&&x<box.right?[{x,glyph}]:[])??[]
  if(observed.length!==1||Math.abs(observed[0]!.x+1-(box.x+box.right)/2)>1)return checks
  const face=observed[0]!;canvas.claim(face.x,box.bottom+1);canvas.claim(face.x+1,box.bottom+1);canvas.claimBox(box)
  tasks.push({section:parents[0]!.label,label:box.lines.filter(Boolean)[0]!.normalize('NFC'),score:faces.get(face.glyph)!,actors:actors as string[]})
 }
 const y=top+1,heads=canvas.grid[y]!.flatMap((glyph,x)=>glyph==='►'?[x]:[])
 if(heads.length!==1||heads[0]!<=boxes.at(-1)!.right)return checks
 let broken=false
 for(let x=boxes[0]!.x-1;x<=heads[0]!;x++)if(!boxes.some(box=>x>=box.x&&x<=box.right)){if(canvas.cell(x,y)!==(x===heads[0]?'►':'─'))broken=true;canvas.claim(x,y)}
 if(canvas.leftovers())return checks
 const expected=contract.facts.find(f=>f.criterion==='journey-tasks')?.expected as typeof tasks,canonical=(items:typeof tasks)=>items.map(task=>({...task,actors:[...task.actors].sort()}))
 setFamilyCheck(checks,'journey-tasks',!broken&&same(canonical(tasks),canonical(expected))?'passed':'failed','Exact admitted native face codes own numeric scores; actual actor legend, marked box headers, section spans and the continuous rightward timeline independently own the complete ordered task facts',tasks)
 return checks
}
