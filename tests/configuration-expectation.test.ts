import {expect,test} from 'bun:test'
import {readFileSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {reviewDocumentationSource} from '../unified/docs-source-review.ts'
import {projectVisualExpectation} from '../fidelity/visual-expectation.ts'
import {sourceThemePalette} from '../fidelity/theme-source-policy.ts'
import type {MeaningExpectation} from '../fidelity/meaning.ts'

const source=(text:string)=>reviewDocumentationSource({id:'synthetic-config',family:'synthetic-config',source:text})
test('implementation identifiers become exact advisories while every concrete setting remains required',()=>{
  const row=source('---\nconfig:\n  theme: default\n  look: classic\n  layout: elk\n  htmlLabels: false\n  fontSize: 22\n  flowchart:\n    nodeSpacing: 80\n---\nflowchart LR\nA --> B')
  expect(row.expected!.facts!['authored-config']).toEqual({fontSize:22,flowchart:{nodeSpacing:80}})
  expect(row.expected!.advisoryFacts!['configuration-identifiers-and-tokens']).toEqual({theme:'default',look:'classic',layout:'elk',htmlLabels:false})
  expect(row.profileExpected!.facts!['authored-config']).toEqual({theme:'default',look:'classic',layout:'elk',htmlLabels:false,fontSize:22,flowchart:{nodeSpacing:80}})
  expect(row.expected!.nodes).toEqual(row.profileExpected!.nodes)
  expect(row.expected!.edges).toEqual(row.profileExpected!.edges)
})
test('timeline palette uses source owners and event brightness, not unused scale entries or theme spelling',()=>{
  const row=source('---\nconfig:\n  theme: base\n  timeline:\n    disableMulticolor: true\n  themeVariables:\n    cScale0: "#123456"\n    cScaleLabel0: "#abcdef"\n---\ntimeline\n2020 : First : Second\n2021 : Third')
  const paint:any=row.expected!.facts!['theme-paint']
  expect(paint).toEqual({theme:'base',family:'timeline',quantizationTolerancePerChannel:1,roles:[{owner:'2020',kind:'period',sourceOrdinal:0,fill:'#123456',foreground:'#abcdef'},{owner:'First',kind:'event',sourceOrdinal:0,fill:'#123456',foreground:'#abcdef',brightness:1.2},{owner:'Second',kind:'event',sourceOrdinal:1,fill:'#123456',foreground:'#abcdef',brightness:1.2},{owner:'2021',kind:'period',sourceOrdinal:1,fill:'#123456',foreground:'#abcdef'},{owner:'Third',kind:'event',sourceOrdinal:2,fill:'#123456',foreground:'#abcdef',brightness:1.2}]})
  expect(row.expected!.facts!['authored-config']).toBeUndefined()
  expect(row.profileExpected!.facts!['authored-config']).toEqual({theme:'base',timeline:{disableMulticolor:true},themeVariables:{cScale0:'#123456',cScaleLabel0:'#abcdef'}})
  expect(row.expected!.facts!.periods).toEqual(row.profileExpected!.facts!.periods)
})
test('git colors obey source-defined branch order and keep special glyph requests required',()=>{
  const row=source('---\nconfig:\n  theme: default\n  gitGraph:\n    mainBranchOrder: 2\n  themeVariables:\n    git0: "#ff0000"\n    git1: "#00ff00"\n    gitInv0: "#123456"\n---\ngitGraph\ncommit\nbranch develop\ncommit')
  const paint:any=row.expected!.facts!['theme-paint']
  expect(paint.roles.filter((r:any)=>r.kind==='branch').map((r:any)=>[r.owner,r.fill])).toEqual([['develop','#ff0000'],['main','#00ff00']])
  expect(row.expected!.facts!['authored-config']).toEqual({gitGraph:{mainBranchOrder:2},themeVariables:{gitInv0:'#123456'}})
})
test('unsupported named themes and concrete variables fail closed rather than disappearing',()=>{
  const row=source('---\nconfig:\n  theme: forest\n  themeVariables:\n    arbitraryColor: red\n---\nflowchart LR\nA --> B')
  expect(row.expected!.facts!['authored-config']).toEqual({theme:'forest',themeVariables:{arbitraryColor:'red'}})
  expect(row.expected!.facts!['theme-paint']).toBeUndefined()
  expect(row.profileExpected).toBeUndefined()
  for(const look of ['handDrawn','neo'])expect(source('---\nconfig:\n  look: '+look+'\n---\nflowchart LR\nA --> B').expected!.facts!['authored-config']).toEqual({look})
})
test('redux role and rotation policies bind real node/group/route owners',()=>{
  const role=source('---\nconfig:\n  theme: redux-color\n---\nusecase-beta\nactor Customer\nsystemBoundary Catalogue\nBrowse[Browse]\nend\nCheckout[Checkout]\nCheckout ..> : include Browse')
  const paint:any=role.expected!.facts!['theme-paint']
  expect(paint.roles).toContainEqual({owner:'Customer',kind:'actor',sourceOrdinal:0,fill:'#F5F3FF',stroke:'#A78BFA',foreground:'#28253D',strokeWidth:2})
  expect(paint.roles).toContainEqual({owner:'Catalogue',kind:'boundary',sourceOrdinal:0,fill:'#FDF4FF',stroke:'#E879F9',foreground:'#000000',strokeWidth:1})
  expect(paint.roles).toContainEqual({owner:'Checkout->Browse',kind:'include',stroke:'#38BDF8'})
  const rotated=source('---\nconfig:\n  theme: redux-color\n  usecase:\n    colorScheme: rotate\n---\nusecase-beta\nactor Customer\nactor Auditor\nBrowse[Browse]\nCheckout[Checkout]')
  expect((rotated.expected!.facts!['theme-paint'] as any).roles.map((r:any)=>r.fill)).toEqual(['#FDF4FF','#F0FDFA','#FFF7ED','#ECFEFF'])
})
test('canonical forest treemap palette has parent ownership and independent alpha composition',()=>{
  const inventory=JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz',import.meta.url))).toString())
  const input=inventory.cases.find((row:any)=>row.id.endsWith('treemap.md:115')),row=reviewDocumentationSource(input),paint:any=row.expected!.facts!['theme-paint'],palette=sourceThemePalette('forest')
  expect(paint.roles).toHaveLength(6)
  expect(paint.roles[0]).toMatchObject({owner:'Category A',kind:'section',fill:palette.scale[1]!.hex,fillOpacity:0.6,stroke:palette.scale[1]!.peer,strokeWidth:2,strokeOpacity:0.4})
  expect(paint.roles[1]).toMatchObject({owner:'Category A/Item A1',kind:'leaf',fill:palette.scale[1]!.hex,fillOpacity:0.3,stroke:palette.scale[1]!.hex,strokeWidth:3})
  expect(paint.roles[3]).toMatchObject({owner:'Category B',kind:'section',fill:palette.scale[0]!.hex})
  expect(row.profileExpected!.facts!.values).not.toEqual(row.expected!.facts!.values)
  expect(row.profileExpected!.facts!.values).toContainEqual({id:'Category A/Item A1',value:10})
})
test('layout algorithm metadata is advisory while enclosure, members and shape stay required',()=>{
  const literal:MeaningExpectation={labels:['a','Tools'],nodes:[{id:'a',label:'a'}],groups:[{id:'tools',label:'Tools',members:['a']}],facts:{'node-attributes':[{id:'a',attributes:{shape:'tool'}},{id:'tools',attributes:{algorithm:'elk.rectpacking'}}]}}
  const row=projectVisualExpectation('agentflow',literal)
  expect(row.expected.facts!['node-attributes']).toEqual([{id:'a',attributes:{shape:'tool'}}])
  expect(row.expected.groups).toEqual(literal.groups)
  expect(row.profileExpected).toEqual(literal)
})
test('documented mindmap depth policy binds root, child bodies and child-owned edges',()=>{
  const row=source('---\nconfig:\n  theme: base\n  mindmap:\n    colorBy: depth\n  themeVariables:\n    git0: "#374151"\n    gitBranchLabel0: "#ffffff"\n    cScale1: "#bfdbfe"\n    cScaleLabel1: "#172554"\n---\nmindmap\nroot((Root))\n  first[First]\n  second[Second]')
  expect((row.expected!.facts!['theme-paint'] as any).roles).toContainEqual({owner:'root',kind:'node',sourceOrdinal:0,fill:'#374151',foreground:'#ffffff'})
  expect((row.expected!.facts!['theme-paint'] as any).roles).toContainEqual({owner:'first',kind:'node',sourceOrdinal:1,fill:'#bfdbfe',foreground:'#172554'})
  expect((row.expected!.facts!['theme-paint'] as any).roles).toContainEqual({owner:'root->second',kind:'edge',stroke:'#bfdbfe'})
  expect(row.expected!.facts!['authored-config']).toBeUndefined()
  expect(row.profileExpected!.facts!['authored-config']).toMatchObject({mindmap:{colorBy:'depth'}})
})
test('radar explicit source colors and zero opacity become owned curve paint, retaining curve geometry settings',()=>{
  const row=source('---\nconfig:\n  theme: base\n  radar:\n    curveTension: 0.1\n  themeVariables:\n    cScale0: "#FF0000"\n    radar:\n      curveOpacity: 0\n---\nradar-beta\naxis A, B, C\ncurve one{1,2,3}')
  expect((row.expected!.facts!['theme-paint'] as any).roles).toEqual([{owner:'one',kind:'curve',sourceOrdinal:0,fill:'#FF0000',stroke:'#FF0000',fillOpacity:0}])
  expect(row.expected!.facts!['authored-config']).toEqual({radar:{curveTension:0.1}})
})
