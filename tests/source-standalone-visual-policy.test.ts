import {expect,test} from 'bun:test'
import {projectVisualExpectation} from '../fidelity/visual-expectation.ts'
import {reviewDocumentationSource} from '../unified/docs-source-review.ts'

const review=(source:string)=>reviewDocumentationSource({id:'standalone-source-control',family:'source-control',source})

test('layout spacing inputs do not invent fixed pixel anchors; explicit fonts, padding and other families retain their metrics',()=>{
  const source='---\nconfig:\n  usecase:\n    nodeSpacing: 60\n    rankSpacing: 70\n    actorFontSize: 16\n    diagramPadding: 24\n---\nusecase-beta\nactor Customer\nBrowse("Browse catalog")\nCustomer --> Browse'
  const row=review(source),raw=reviewDocumentationSource({id:'standalone-source-control',family:'source-control',source},{visual:false})
  expect(row.expected!.facts!['authored-config']).toEqual({usecase:{actorFontSize:16,diagramPadding:24}})
  expect(row.expected!.advisoryFacts!['standalone-input-provenance']).toEqual({'usecase.nodeSpacing':60,'usecase.rankSpacing':70})
  expect(row.profileExpected!.facts!['authored-config']).toEqual(raw.expected!.facts!['authored-config'])
  expect(row.expected!.nodes).toEqual(raw.expected!.nodes)
  expect(row.expected!.edges).toEqual(raw.expected!.edges)
  const agent=review('---\nconfig:\n  agentflow:\n    nodeSpacing: 70\n    rankSpacing: 70\n---\nagentflow-beta TB\na[A] --> b[B]')
  expect(agent.expected!.facts!['authored-config']).toBeUndefined()
  expect(agent.profileExpected!.facts!['authored-config']).toEqual({agentflow:{nodeSpacing:70,rankSpacing:70}})
  const radar=review('---\nconfig:\n  radar:\n    curveTension: 0.1\n---\nradar-beta\naxis A,B,C\ncurve X{1,2,3}')
  expect(radar.expected!.facts!['authored-config']).toEqual({radar:{curveTension:0.1}})
  const tree=review('---\nconfig:\n  treeView:\n    rowIndent: 80\n    lineThickness: 3\n---\ntreeView-beta\n"A"\n  "B"')
  expect(tree.expected!.facts!['authored-config']).toEqual({treeView:{rowIndent:80,lineThickness:3}})
})

test('mindmap host class names without a stylesheet stay native; icons and supplied concrete CSS remain required',()=>{
  const row=review('mindmap\n  Root\n    A[A]\n    :::urgent large\n    ::icon(fa fa-book)')
  expect(row.expected!.facts!.decorations).toEqual([{id:'A',decoration:'::icon(fa fa-book)'}])
  expect(row.profileExpected!.facts!.decorations).toEqual([{id:'A',decoration:':::urgent large'},{id:'A',decoration:'::icon(fa fa-book)'}])
  expect(row.expected!.nodes!.map(node=>node.label)).toEqual(['Root','A'])
  const supplied=projectVisualExpectation('mindmap',{labels:['A'],nodes:[{id:'A',label:'A'}],facts:{decorations:[{id:'A',decoration:':::urgent'}],'css-classes':[{id:'A',class:'urgent'}],'authored-style':[{kind:'classDef',selection:'urgent',attributes:[{property:'fill',value:'#ff0000'}]}]}}).expected
  expect(supplied.facts!.decorations).toEqual([{id:'A',decoration:':::urgent'}])
  expect(supplied.facts!['node-paint']).toEqual([{id:'A',properties:{fill:'#ff0000'}}])
  expect(supplied.advisoryFacts?.['standalone-input-provenance']).toBeUndefined()
})

test('bare invalid CSS colour is retained without inserting #; valid authored paint and chart dimensions stay required',()=>{
  const source='---\nconfig:\n  quadrantChart:\n    chartWidth: 400\n    chartHeight: 400\n  themeVariables:\n    quadrant1TextFill: "ff0000"\n---\nquadrantChart\nquadrant-1 Plan'
  const invalid=review(source),valid=review(source.replace('"ff0000"','"#ff0000"'))
  expect(invalid.expected!.facts!['authored-config']).toEqual({quadrantChart:{chartWidth:400,chartHeight:400}})
  expect(invalid.profileExpected!.facts!['authored-config']).toEqual({quadrantChart:{chartWidth:400,chartHeight:400},themeVariables:{quadrant1TextFill:'ff0000'}})
  expect(invalid.expected!.advisoryFacts!['standalone-input-provenance']).toEqual({'themeVariables.quadrant1TextFill':'ff0000'})
  expect(valid.expected!.facts!['authored-config']).toEqual({quadrantChart:{chartWidth:400,chartHeight:400},themeVariables:{quadrant1TextFill:'#ff0000'}})
  expect(invalid.expected!.labels).toEqual(valid.expected!.labels)
})

test('Kanban priority remains an exact task-owned enum without demanding duplicate text; real captions and wrong priorities remain distinct',()=>{
  const source='kanban\nTodo\n  task[Work]@{ ticket: MC-2037, assigned: person, priority: High }',row=review(source),low=review(source.replace('priority: High','priority: Low'))
  expect(row.expected!.labels).toEqual(['Todo','Work','MC-2037','person'])
  expect(row.profileExpected!.labels).toContain('High')
  expect((row.expected!.facts!.columns as any[])[0].tasks[0].attributes).toEqual({ticket:'MC-2037',assigned:'person',priority:'High'})
  expect((low.expected!.facts!.columns as any[])[0].tasks[0].attributes.priority).toBe('Low')
  expect(row.expected!.facts!.columns).not.toEqual(low.expected!.facts!.columns)
  expect(review(source.replace('task[Work]','task[High]')).expected!.labels).toContain('High')
  expect(review(source.replace('assigned: person','assigned: High')).expected!.labels).toContain('High')
  expect(review(source.replace('priority: High','priority: Unspecified')).expected!.labels).toContain('Unspecified')
})

test('quadrant point styles lower class then direct overrides and require border colour only with an effective width',()=>{
  const source='quadrantChart\nA:::custom: [0.2,0.4] color: #ff3300, radius: 12\nB: [0.4,0.5] color: #00ff00, stroke-color: #00ffff\nC:::border: [0.6,0.7]\nclassDef custom color: #109060,radius: 10\nclassDef border stroke-color: #123456,stroke-width: 5px'
  const row=review(source),raw=reviewDocumentationSource({id:'standalone-source-control',family:'source-control',source},{visual:false})
  expect(row.expected!.facts!['point-appearance']).toEqual([{label:'A',properties:{color:'#ff3300',radius:'12'}},{label:'B',properties:{color:'#00ff00'}},{label:'C',properties:{'stroke-color':'#123456','stroke-width':'5px'}}])
  expect(row.expected!.facts!['authored-style']).toBeUndefined()
  expect(row.profileExpected).toEqual(raw.expected)
  expect(review(source.replace('stroke-width: 5px','stroke-width: 6px')).expected!.facts).not.toEqual(row.expected!.facts)
  expect(review(source.replace('color: #ff3300','color: #ff3301')).expected!.facts).not.toEqual(row.expected!.facts)
  expect(review(source.replace('A:::custom:','A:::custom,border:')).expected!.facts!['authored-style']).toEqual(raw.expected!.facts!['authored-style'])
  expect(review(source+'\nclassDef unused color: #112233').expected!.facts!['authored-style']).toBeDefined()
})
