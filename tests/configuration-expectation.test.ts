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
test('timeline uses requested palette tokens and monochrome equality without a renderer brightness constant',()=>{
  const row=source('---\nconfig:\n  theme: base\n  timeline:\n    disableMulticolor: true\n  themeVariables:\n    cScale0: "#123456"\n    cScaleLabel0: "#abcdef"\n---\ntimeline\n2020 : First : Second\n2021 : Third')
  const paint:any=row.expected!.facts!['theme-paint']
  expect(paint).toEqual({theme:'base',family:'timeline',quantizationTolerancePerChannel:1,comparison:'source-paint-tokens',roles:[{owner:'2020',kind:'period',sourceOrdinal:0,fill:'#123456',foreground:'#abcdef'},{owner:'First',kind:'event',sourceOrdinal:0,fill:'#123456',foreground:'#abcdef'},{owner:'Second',kind:'event',sourceOrdinal:1,fill:'#123456',foreground:'#abcdef'},{owner:'2021',kind:'period',sourceOrdinal:1,fill:'#123456',foreground:'#abcdef'},{owner:'Third',kind:'event',sourceOrdinal:2,fill:'#123456',foreground:'#abcdef'}],equalities:[{property:'fill',roleIndices:[0,3]},{property:'fill',roleIndices:[1,2,4]}]})
  expect(row.expected!.facts!['authored-config']).toBeUndefined()
  expect(row.profileExpected!.facts!['authored-config']).toEqual({theme:'base',timeline:{disableMulticolor:true},themeVariables:{cScale0:'#123456',cScaleLabel0:'#abcdef'}})
  expect(row.expected!.facts!.periods).toEqual(row.profileExpected!.facts!.periods)
})
test('git colors obey source-defined branch order and keep special glyph requests required',()=>{
  const row=source('---\nconfig:\n  theme: default\n  gitGraph:\n    mainBranchOrder: 2\n  themeVariables:\n    git0: "#ff0000"\n    git1: "#00ff00"\n    gitInv0: "#123456"\n---\ngitGraph\ncommit\nbranch develop\ncommit')
  const paint:any=row.expected!.facts!['theme-paint']
  expect(paint.roles.filter((r:any)=>r.kind==='branch').map((r:any)=>[r.owner,r.fill])).toEqual([['develop','#ff0000'],['main','#00ff00']])
  expect(row.expected!.facts!['authored-config']).toEqual({gitGraph:{mainBranchOrder:2},themeVariables:{gitInv0:'#123456'}})
  for(const body of ['commit\nbranch first\nbranch zero order:0','commit\n'+Array.from({length:10},(_,i)=>'branch b'+i).join('\n')]){
    const unsupported=source('---\nconfig:\n  theme: base\n---\ngitGraph\n'+body)
    expect(unsupported.expected!.facts!['theme-paint']).toBeUndefined()
    expect(unsupported.expected!.facts!['authored-config']).toEqual({theme:'base'})
  }
})
test('unsupported named themes and concrete variables fail closed rather than disappearing',()=>{
  const row=source('---\nconfig:\n  theme: forest\n  themeVariables:\n    arbitraryColor: red\n---\nflowchart LR\nA --> B')
  expect(row.expected!.facts!['authored-config']).toEqual({theme:'forest',themeVariables:{arbitraryColor:'red'}})
  expect(row.expected!.facts!['theme-paint']).toBeUndefined()
  expect(row.profileExpected).toBeUndefined()
  for(const look of ['handDrawn','neo'])expect(source('---\nconfig:\n  look: '+look+'\n---\nflowchart LR\nA --> B').expected!.facts!['authored-config']).toEqual({look})
  for(const variable of ['primaryColor','secondaryColor','tertiaryColor','darkMode','scaleLabelColor','labelTextColor']){
    const value=variable==='darkMode'?true:'#ff0000',yamlValue=typeof value==='boolean'?String(value):'"'+value+'"'
    const custom=source('---\nconfig:\n  theme: base\n  themeVariables:\n    '+variable+': '+yamlValue+'\n---\ntimeline\n2020 : Event')
    expect(custom.expected!.facts!['theme-paint']).toBeUndefined()
    expect(custom.expected!.facts!['authored-config']).toEqual({theme:'base',themeVariables:{[variable]:value}})
  }
  for(const look of ['neo','handDrawn'])expect(source('---\nconfig:\n  theme: base\n  look: '+look+'\n---\ntimeline\n2020 : Event').expected!.facts!['theme-paint']).toBeUndefined()
  const roleOverride=source('---\nconfig:\n  theme: redux-color\n  themeVariables:\n    usecaseActorBkg: "#ff0000"\n---\nusecase-beta\nactor A')
  expect(roleOverride.expected!.facts!['theme-paint']).toBeUndefined()
  expect(roleOverride.expected!.facts!['authored-config']).toEqual({theme:'redux-color',themeVariables:{usecaseActorBkg:'#ff0000'}})
  for(const value of ['red','rgb(255,0,0)','#ff000080']){
    const color=source('---\nconfig:\n  theme: base\n  themeVariables:\n    cScale0: "'+value+'"\n---\ntimeline\n2020 : Event')
    expect(color.expected!.facts!['theme-paint']).toBeUndefined()
    expect(color.expected!.facts!['authored-config']).toEqual({theme:'base',themeVariables:{cScale0:value}})
  }
})
test('redux role and rotation policies bind real node/group/route owners',()=>{
  const role=source('---\nconfig:\n  theme: redux-color\n---\nusecase-beta\nactor Customer\nsystemBoundary Catalogue\nBrowse[Browse]\nend\nCheckout[Checkout]\nCheckout ..> : include Browse')
  const paint:any=role.expected!.facts!['theme-paint']
  expect(paint.roles).toContainEqual({owner:'Customer',kind:'actor',sourceOrdinal:0,fill:'#F5F3FF',stroke:'#A78BFA',foreground:'#28253D'})
  expect(paint.roles).toContainEqual({owner:'Catalogue',kind:'boundary',sourceOrdinal:0,fill:'#FDF4FF',stroke:'#E879F9',foreground:'#000000'})
  expect(paint.roles).toContainEqual({owner:'Checkout->Browse',kind:'include',stroke:'#38BDF8'})
  const rotated=source('---\nconfig:\n  theme: redux-color\n  usecase:\n    colorScheme: rotate\n---\nusecase-beta\nactor Customer\nactor Auditor\nBrowse[Browse]\nCheckout[Checkout]')
  expect((rotated.expected!.facts!['theme-paint'] as any).roles.map((r:any)=>r.fill)).toEqual(['#FDF4FF','#F0FDFA','#FFF7ED','#ECFEFF'])
})
test('canonical forest treemap requires named palette tokens without unrequested alpha or width',()=>{
  const inventory=JSON.parse(gunzipSync(readFileSync(new URL('../corpus/docs-source-inventory.json.gz',import.meta.url))).toString())
  const input=inventory.cases.find((row:any)=>row.id.endsWith('treemap.md:115')),row=reviewDocumentationSource(input),paint:any=row.expected!.facts!['theme-paint'],palette=sourceThemePalette('forest')
  expect(paint.roles).toHaveLength(6)
  expect(paint.roles[0]).toEqual({owner:'Category A',kind:'section',sourceOrdinal:0,fill:palette.scale[1]!.hex,foreground:palette.scale[1]!.foreground,stroke:palette.scale[1]!.peer})
  expect(paint.roles[1]).toEqual({owner:'Category A/Item A1',kind:'leaf',sourceOrdinal:1,fill:palette.scale[1]!.hex,foreground:palette.scale[1]!.foreground,stroke:palette.scale[1]!.hex})
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
test('default skin has no inherited palette and explicit active tokens remain required individually',()=>{
  for(const body of ['timeline\n2020 : First\n2021 : Second','gitGraph\ncommit\nbranch develop\ncommit','treemap-beta\n"Group"\n  "Leaf": 10']){
    const row=source('---\nconfig:\n  theme: default\n---\n'+body)
    expect(row.expected!.facts!['theme-paint']).toBeUndefined()
    expect(row.expected!.facts!['authored-config']).toBeUndefined()
    expect(row.profileExpected!.facts!['authored-config']).toEqual({theme:'default'})
  }
  const row=source('---\nconfig:\n  theme: default\n  themeVariables:\n    cScale0: "#123456"\n---\ntimeline\n2020 : First\n2021 : Second'),paint:any=row.expected!.facts!['theme-paint']
  expect(paint.roles).toEqual([{owner:'2020',kind:'period',sourceOrdinal:0,fill:'#123456'},{owner:'First',kind:'event',sourceOrdinal:0,fill:'#123456'}])
  expect(row.profileExpected!.facts!['authored-config']).toEqual({theme:'default',themeVariables:{cScale0:'#123456'}})
})
test('default disableMulticolor requires owned equality without selecting any fixed color',()=>{
  const row=source('---\nconfig:\n  theme: default\n  timeline:\n    disableMulticolor: true\n---\ntimeline\n2020 : First\n2021 : Second'),paint:any=row.expected!.facts!['theme-paint']
  expect(paint.roles).toEqual([{owner:'2020',kind:'period',sourceOrdinal:0},{owner:'First',kind:'event',sourceOrdinal:0},{owner:'2021',kind:'period',sourceOrdinal:1},{owner:'Second',kind:'event',sourceOrdinal:1}])
  expect(paint.equalities).toEqual([{property:'fill',roleIndices:[0,2]},{property:'fill',roleIndices:[1,3]}])
})
test('explicit owned style overrides win over palette defaults and retain authored widths',()=>{
  const row=source('---\nconfig:\n  theme: redux-color\n---\nusecase-beta\nBrowse[Browse]\nstyle Browse fill:#ff0000,stroke:#00ff00,stroke-width:7px'),paint:any=row.expected!.facts!['theme-paint']
  expect(paint.roles).toEqual([{owner:'Browse',kind:'usecase',sourceOrdinal:0,foreground:'#28253D'}])
  expect(row.expected!.facts!['node-paint']).toEqual([{id:'Browse',properties:{fill:'#ff0000',stroke:'#00ff00','stroke-width':'7px'}}])
  const raw:MeaningExpectation={labels:['Node'],nodes:[{id:'n',label:'Node'}],facts:{'authored-config':{theme:'base'},'authored-style':[{kind:'style',selection:'n',attributes:[{property:'opacity',value:'0.2'},{property:'filter',value:'brightness(0.8)'}]}]}}
  const unsupported=projectVisualExpectation('timeline',raw)
  expect(unsupported.expected.facts!['authored-style']).toEqual(raw.facts!['authored-style'])
  expect(unsupported.expected.facts!['authored-config']).toEqual(raw.facts!['authored-config'])
})
test('monochrome equality excludes fully lowered owner overrides and fails closed on unqualified styles',()=>{
  const raw:MeaningExpectation={labels:['2020','2021','2022'],nodes:['2020','2021','2022'].map(id=>({id,label:id})),facts:{'authored-config':{theme:'default',timeline:{disableMulticolor:true}},periods:['2020','2021','2022'].map(period=>({period,events:[]})),'authored-style':[{kind:'style',selection:'2020',attributes:[{property:'fill',value:'#123456'}]}]}}
  const result=projectVisualExpectation('timeline',raw).expected,paint:any=result.facts!['theme-paint']
  expect(paint.roles).toEqual([{owner:'2021',kind:'period',sourceOrdinal:1},{owner:'2022',kind:'period',sourceOrdinal:2}])
  expect(paint.equalities).toEqual([{property:'fill',roleIndices:[0,1]}])
  expect(result.facts!['node-paint']).toEqual([{id:'2020',properties:{fill:'#123456'}}])
  ;(raw.facts!['authored-style'] as any)[0].attributes.push({property:'opacity',value:'0.3'})
  const unqualified=projectVisualExpectation('timeline',raw).expected
  expect(unqualified.facts!['theme-paint']).toBeUndefined()
  expect(unqualified.facts!['authored-config']).toEqual({timeline:{disableMulticolor:true}})
  expect(unqualified.facts!['authored-style']).toEqual(raw.facts!['authored-style'])
})
