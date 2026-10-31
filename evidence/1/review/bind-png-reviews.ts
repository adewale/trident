import { readFileSync, writeFileSync } from 'node:fs'
import { sourceHash } from '/workspace/trident-ecosystem-results/unified/docs-drawings.ts'
import { docsExpectationsHash, admitPngReviews } from '/workspace/trident-ecosystem-results/unified/docs-png-drawings.ts'
const root = '/workspace/trident-ecosystem-2026-10-31-campaign'
const read = (p:string) => JSON.parse(readFileSync(p,'utf8'))
const facts = read('/workspace/trident-ecosystem-results/corpus/docs-reviewed.json')
const decisions = read(root+'/review/manual-decisions.json')
const manifests = [...read(root+'/review/contact-sheets.json').filter((x:any)=>x.project!=='Latias94/merman'),...read(root+'/review/merman-contact-sheets.json')]
const reviews = new Map<string,any>()
for (const sheet of manifests) for (const panel of sheet.panels) {
 const decision=decisions[sheet.project]; if(!decision) throw Error('Missing project decision: '+sheet.project)
 const status=decision.correct.includes(panel.number)?'correct':decision.incorrect[panel.number]?'incorrect':null
 if(!status) { if(!decision.unknown.includes(panel.number)) throw Error('Missing panel decision'); continue }
 if (!panel.pngSha256 || sourceHash(readFileSync(panel.path))!==panel.pngSha256) throw Error('PNG witness mismatch')
 const expected = facts[panel.number]
 const positive=panel.number===13?'Title, three labelled slices and their visible proportions match the source (386:85:15; about 79%, 17%, 3%). No claim of hidden numeric readback.':'Visible source labels, required node bodies, relationships, direction and grouping agree with the complete source expectations. Typography and aesthetic preferences are outside this contract.'
 const review={id:panel.id,sourceSha256:expected.sourceSha256,pngSha256:panel.pngSha256,expectationsSha256:docsExpectationsHash(expected),status,reviewedBy:'Codex, actual retained PNG inspection, 2026-10-31',review:`Viewed the actual retained PNG against corpus/docs-reviewed.json, contact sheet ${sheet.sheet.split('/').at(-1)}, panel ${panel.number}. ${status==='correct'?positive:decision.incorrect[panel.number]}`}
 const key=JSON.stringify([panel.id,panel.pngSha256]); const previous=reviews.get(key)
 if(previous && previous.status!==status) throw Error('Conflicting review of identical PNG: '+sheet.project+' '+panel.number+' '+JSON.stringify(previous))
 reviews.set(key,review)
}
const result=[...reviews.values()];admitPngReviews(read(root+'/docs/inventory.json').cases,facts,result)
writeFileSync(root+'/review/png-reviews.json',JSON.stringify(result,null,2)+'\n')
console.log({reviews:result.length,projects:Object.keys(decisions).length})
