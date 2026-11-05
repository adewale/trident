// Reviewed schema views: see views/index.mjs for the module contract.
//
// Class, ER, flowchart, C4, kanban and the smaller families for the bridged projects that
// are not Mermaid ports. Each getter here replaces the same getter of the view in
// ../schema-views.mjs (or of the generic field-name projection). The doctrine is that file's:
// a field is translated only from what the native model carries, a concept the model does
// not carry is declared absent with its reason, and nothing is parsed from source text or
// re-split from a display string. Every mapping was checked against the project's parser
// source where it is cited, and against probe output (scripts/fidelity-probe.ts).
import { entriesOf, record, styleList, styleStrings, classView, card, headOf, shapeOf, edgeType, strokeOf, c4View, C4_MACRO, C4_BOUNDARY_MACRO, text, WRAP, flowchartView, VERTEX_ABSENT, nativeSchemaView, erView, identifying } from '../schema-views.mjs'

// ---------------------------------------------------------------------------------------
// Class diagrams.
//
// Mermaid's ClassNode (classTypes.ts) starts with cssClasses 'default'; every cssClass
// statement or :::name shorthand appends ' name', and a link or click callback appends
// ' clickable' (classDb.setCssClass, setLink, setClickEvent) in statement order.
// ClassMember keeps visibility, id, parameters, returnType and classifier ('$' static,
// '*' abstract) from its own parse; getDisplayDetails() and text are computed from those
// fields alone. Where a native model keeps the same fields (under its own names, or as a
// member's own display text), they are translated and Mermaid's computation is applied.
const CLASS_FIELDS = ['id', 'type', 'label', 'text', 'cssClasses', 'methods', 'members', 'annotations', 'domId', 'styles', 'parent', 'link', 'linkTarget', 'haveCallback', 'tooltip']
const MEMBER_FIELDS = ['id', 'memberType', 'visibility', 'classifier', 'parameters', 'returnType', 'text', 'cssStyle', 'getDisplayDetails']
const NAMESPACE_FIELDS = ['id', 'label', 'domId', 'classes', 'notes', 'children', 'parent', 'explicit']
const CLASS_RENDERER = {
  domId: "a class's domId is Mermaid's renderer identity (with a running counter)",
}
const NAMESPACE_RENDERER = { domId: "a namespace's domId is Mermaid's renderer identity (with a running counter)" }
const CLASS_LAYOUT = "Mermaid's class getData() is its renderer's layout data under the host configuration"

/** Mermaid's parseGenericTypes (diagrams/common/common.ts), which getDisplayDetails and
 * ClassMember.text apply to a member's id, parameters and return type. */
function parseGenericTypes(input) {
  const count = (value, part) => Math.max(0, value.split(part).length - 1)
  const processSet = set => {
    const tildes = count(set, '~')
    if (tildes <= 1) return set
    let leading = false
    if (tildes % 2 !== 0 && set.startsWith('~')) { set = set.substring(1); leading = true }
    const chars = [...set]
    let first = chars.indexOf('~'), last = chars.lastIndexOf('~')
    while (first !== -1 && last !== -1 && first !== last) {
      chars[first] = '<'; chars[last] = '>'
      first = chars.indexOf('~'); last = chars.lastIndexOf('~')
    }
    if (leading) chars.unshift('~')
    return chars.join('')
  }
  const sets = input.split(/(,)/), output = []
  for (let index = 0; index < sets.length; index++) {
    let set = sets[index]
    if (set === ',' && index > 0 && index + 1 < sets.length && count(sets[index - 1], '~') === 1 && count(sets[index + 1], '~') === 1) {
      set = sets[index - 1] + ',' + sets[index + 1]
      index++
      output.pop()
    }
    output.push(processSet(set))
  }
  return output.join('')
}
const CLASSIFIER_STYLE = { '*': 'font-style:italic;', $: 'text-decoration:underline;' }
const classifierOf = (isStatic, isAbstract) => (isStatic ? '$' : isAbstract ? '*' : '')
/** Mermaid's single classifier from static/abstract flags; a member with both has none. */
const flags = item => (item.isStatic && item.isAbstract ? {} : { classifier: classifierOf(item.isStatic, item.isAbstract) })

/** A Mermaid ClassMember from native fields already in Mermaid's vocabulary. `fields` may
 * carry `display` (the member's own display text, used as displayText) instead of id and
 * parameters; `absent` names member fields the model does not carry. */
function classMember(fields, absent, hooks) {
  const { display, ...own } = fields
  const has = key => own[key] !== undefined || key in own
  const computable = !display && has('id') && has('visibility') && has('classifier') && (own.memberType !== 'method' || (has('parameters') && has('returnType')))
  const details = () => {
    if (display) {
      const style = has('classifier') ? { cssStyle: CLASSIFIER_STYLE[own.classifier] ?? '' } : {}
      return record({ displayText: display.trim(), ...style }, 'class member display', ['displayText', 'cssStyle'], absent, hooks)
    }
    if (!computable) {
      const missing = ['id', 'visibility', 'classifier', 'parameters', 'returnType'].find(key => !has(key) && absent[key])
      return missing ? hooks.unsupported(absent[missing]) : hooks.unavailable('class member.getDisplayDetails')
    }
    let displayText = own.visibility + parseGenericTypes(own.id)
    if (own.memberType === 'method') {
      displayText += `(${parseGenericTypes(own.parameters.trim())})`
      if (own.returnType) displayText += ' : ' + parseGenericTypes(own.returnType)
    }
    return { displayText: displayText.trim(), cssStyle: CLASSIFIER_STYLE[own.classifier] ?? '' }
  }
  const text = () => {
    const method = own.memberType === 'method'
    let value = `${own.visibility ? '\\' + own.visibility : ''}${parseGenericTypes(own.id)}${method ? `(${parseGenericTypes(own.parameters)})${own.returnType ? ' : ' + parseGenericTypes(own.returnType) : ''}` : ''}`
    value = value.replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    return value.startsWith('\\&lt;') ? value.replace('\\&lt;', '~') : value
  }
  // Mermaid sets no cssStyle on a member, and an attribute has no parameters or return type.
  const object = { cssStyle: undefined, ...(own.memberType === 'attribute' ? { parameters: undefined, returnType: undefined } : {}), ...own, getDisplayDetails: details }
  if (computable) Object.defineProperty(object, 'text', { get: text, enumerable: true })
  return record(object, 'class member', MEMBER_FIELDS, absent, hooks)
}

/** Mermaid's cssClasses from the classes a model assigned and whether a link or callback
 * made the class clickable. With both, the statement order Mermaid follows is not kept. */
function cssClasses(assigned, clickable, name, hooks) {
  const names = (assigned ?? []).filter(Boolean)
  if (names.length && clickable) return hooks.unsupported(`${name} does not record whether a class's css classes or its click came first`)
  return ['default', ...names, ...(clickable ? ['clickable'] : [])].join(' ')
}

/** getClasses/getClass/getNamespaces/getNamespace and the diagram-level getters from one
 * project-specific reading. classes() returns [id, fields] with members and methods as
 * Mermaid member fields; a field may be a function, evaluated when read. */
function classesView(model, hooks) {
  const absent = { ...CLASS_RENDERER, ...(model.absent.class ?? {}) }
  const memberAbsent = model.absent.member ?? {}
  const node = (id, fields) => {
    const object = { id }
    for (const [key, value] of Object.entries(fields)) {
      if (key === 'members' || key === 'methods') object[key] = value.map(member => classMember({ memberType: key === 'methods' ? 'method' : 'attribute', ...member }, memberAbsent, hooks))
      else if (typeof value === 'function') Object.defineProperty(object, key, { get: value, enumerable: true })
      else object[key] = value
    }
    return record(object, 'class', CLASS_FIELDS, absent, hooks)
  }
  const classes = () => new Map(model.classes().map(([id, fields]) => [id, node(id, fields)]))
  const view = { getClasses: classes, getClass: id => classes().get(id), getData: () => hooks.unsupported(CLASS_LAYOUT) }
  if (model.namespaces) {
    const namespaces = () => {
      const all = classes()
      return new Map(model.namespaces().map(space => {
        const { classIds, ...rest } = space
        return [space.id, record({ ...rest, classes: new Map(classIds.filter(id => all.has(id)).map(id => [id, all.get(id)])) }, 'namespace', NAMESPACE_FIELDS, { ...NAMESPACE_RENDERER, ...(model.absent.namespace ?? {}) }, hooks)]
      }))
    }
    view.getNamespaces = namespaces
    view.getNamespace = id => namespaces().get(id)
  } else if (model.absent.getNamespaces) view.getNamespaces = view.getNamespace = () => hooks.unsupported(model.absent.getNamespaces)
  for (const key of ['getAccTitle', 'getAccDescription', 'getDirection']) {
    if (key in model) view[key] = () => model[key]
    else if (model.absent[key]) view[key] = () => hooks.unsupported(model.absent[key])
  }
  return view
}
/** The namespace a class belongs to, when the model lists each namespace's classes and
 * a class is in at most one of them. */
const parentFrom = (spaces, id, name, hooks) => {
  const owners = spaces.filter(space => (space.classIds ?? []).includes(id))
  if (owners.length > 1) return () => hooks.unsupported(`${name} lists a class in several namespaces without recording which one it was declared in`)
  return owners[0]?.id
}
const accAbsent = name => ({ getAccTitle: `${name}'s class model keeps no accessibility title`, getAccDescription: `${name}'s class model keeps no accessibility description` })

// mermaid_core 0.3.2 (Mermaid Dart and Mermaid Flutter): a member is its display text
// ('+getAge(int x) : int', generics resolved) with isStatic/isAbstract flags; cssClasses,
// one link, styles and a flat namespace list naming its classes. A generic type parameter
// is folded into the display label ('Box<T>'), and accTitle/accDescr, tooltips, link
// targets and click callbacks are not kept.
function dartClassModel(raw, hooks) {
  const spaces = raw.namespaces ?? []
  const member = item => ({ display: item.text, ...flags(item) })
  const flat = "mermaid_core keeps namespaces as a flat list without nesting"
  return {
    classes: () => entriesOf(raw.classes).map(([id, item]) => [id, {
      label: item.label,
      annotations: item.annotations ?? [],
      members: (item.attributes ?? []).map(member),
      methods: (item.methods ?? []).map(member),
      styles: styleStrings(item.styles),
      cssClasses: () => cssClasses(item.cssClasses, Boolean(item.link), 'mermaid_core', hooks),
      ...(item.link ? { link: item.link } : {}),
      parent: parentFrom(spaces, id, 'mermaid_core', hooks),
    }]),
    namespaces: () => spaces.map(space => ({ id: space.id, label: space.label ?? space.id, classIds: space.classIds ?? [] })),
    getDirection: typeof raw.direction === 'string' ? raw.direction.toUpperCase() : undefined,
    absent: {
      class: { type: "mermaid_core keeps a generic class's type parameter only in its display label", tooltip: "mermaid_core's class model keeps no tooltips", linkTarget: "mermaid_core's class model keeps no link targets", haveCallback: "mermaid_core's class model keeps no click callbacks" },
      member: Object.fromEntries(['id', 'visibility', 'parameters', 'returnType', 'text'].map(key => [key, "mermaid_core keeps a class member as its display text with static/abstract flags, not Mermaid's parsed member fields"])),
      namespace: { children: flat, parent: flat, explicit: flat, notes: "mermaid_core keeps class notes outside its namespaces" },
      ...accAbsent('mermaid_core'),
    },
  }
}

// zombie-mermaid 5.14.1 ClassMember: visibility symbol, name (an attribute's whole text,
// 'int age' or 'foo : string'; a method's name), params and type (a method's return type),
// isStatic/isAbstract. Class assignments (one class name per class), click interactions
// (href, tooltip, target, callback) and node styles are separate maps; namespaces list
// their classes. A generic type parameter is folded into the label ('Box<T>').
// beautiful-mermaid 1.1.3 and ascii-mermaid share the types but split an attribute at its
// first whitespace into type and name (beautiful-mermaid dist parseMember), keep no class
// assignments, interactions or styles, and ascii-mermaid keeps no method parameters.
function zombieClassModel(raw, name, hooks) {
  const zombie = name === 'zombie-mermaid', ascii = name === 'ascii-mermaid'
  const spaces = (raw.namespaces ?? []).map(space => ({ id: space.name ?? space.id, classIds: space.classIds ?? [] }))
  const get = (map, key) => (map instanceof Map ? map.get(key) : undefined)
  const member = (item, method) => {
    if (method) return { visibility: item.visibility ?? '', id: item.name, ...(ascii ? {} : { parameters: item.params ?? '' }), returnType: item.type ?? '', ...flags(item) }
    return { visibility: item.visibility ?? '', id: zombie || item.type === undefined ? item.name : `${item.type} ${item.name}`, ...flags(item) }
  }
  const none = what => `${name}'s class model keeps no ${what}`
  return {
    classes: () => raw.classes.map(item => {
      const interaction = get(raw.interactions, item.id)
      return [item.id, {
        label: item.label,
        annotations: item.annotation ? [item.annotation] : item.annotations ?? [],
        members: (item.attributes ?? []).map(m => member(m, false)),
        methods: (item.methods ?? []).map(m => member(m, true)),
        ...(zombie ? {
          cssClasses: () => cssClasses(String(get(raw.classAssignments, item.id) ?? '').split(/\s+/), Boolean(interaction?.href || interaction?.callback), name, hooks),
          styles: styleStrings(get(raw.nodeStyles, item.id)),
          link: interaction?.href ?? undefined,
          tooltip: interaction?.tooltip ?? undefined,
          haveCallback: interaction?.callback ? true : undefined,
        } : {}),
        parent: parentFrom(spaces, item.id, name, hooks),
      }]
    }),
    namespaces: () => spaces.map(space => ({ ...space, label: space.id })),
    // zombie-mermaid records a direction only when one is written; Mermaid's default is TB.
    ...(zombie ? { getDirection: raw.direction ?? 'TB' } : {}),
    absent: {
      class: {
        type: `${name} keeps a generic class's type parameter only in its display label`,
        ...(zombie ? {} : { cssClasses: none('class assignments'), styles: none('class styles'), link: none('links'), tooltip: none('tooltips'), haveCallback: none('click callbacks') }),
        linkTarget: zombie ? `${name} keeps a link target only when one is written` : none('link targets'),
      },
      member: ascii ? { parameters: "ascii-mermaid's class member keeps no method parameters" } : {},
      namespace: { children: `${name} keeps namespaces as a flat list without nesting`, parent: `${name} keeps namespaces as a flat list without nesting`, explicit: `${name} keeps namespaces as a flat list without nesting`, notes: `${name}'s namespaces keep no notes` },
      ...accAbsent(name),
      ...(zombie ? {} : { getDirection: none('direction') }),
    },
  }
}

// vitepress-plugin-mermaid-diagram 0.3.2 parseMember (dist/index.js): visibility words for
// + - # ~, isStatic/isAbstract from a trailing $ or *; a method keeps name, parameters and
// returnType; an attribute keeps its whole text as name unless written 'name : type'
// (/^(\S+)\s*:\s*(.+)$/), which it keeps as name and returnType. Classes keep a generic,
// a namespace and members; there are no class assignments, links, styles or acc fields.
const VITEPRESS_VISIBILITY = { public: '+', private: '-', protected: '#', internal: '~' }
function vitepressClassModel(raw) {
  const spaces = (raw.namespaces ?? []).map(space => ({ id: space.id, classIds: space.classIds ?? [] }))
  const member = m => {
    const classifier = classifierOf(m.isStatic, m.isAbstract), visibility = m.visibility ? VITEPRESS_VISIBILITY[m.visibility] : ''
    if (m.isMethod) return { memberType: 'method', visibility, id: m.name, parameters: m.parameters ?? '', returnType: m.returnType ?? '', classifier }
    return { memberType: 'attribute', visibility, id: m.returnType === undefined ? m.name : `${m.name} : ${m.returnType}`, classifier }
  }
  const none = what => `vitepress-plugin-mermaid-diagram's class model keeps no ${what}`
  return {
    classes: () => entriesOf(raw.classes).map(([id, item]) => [id, {
      label: item.label ?? id,
      annotations: item.annotation ? [item.annotation] : [],
      members: item.members.filter(m => !m.isMethod).map(member),
      methods: item.members.filter(m => m.isMethod).map(member),
      type: item.generic ?? '',
      parent: item.namespace ?? undefined,
    }]),
    namespaces: () => spaces.map(space => ({ ...space, label: space.id })),
    // A direction is recorded only when written (parseClass dirMatch); Mermaid's default is TB.
    getDirection: raw.direction ?? 'TB',
    absent: {
      class: { cssClasses: none('class assignments'), styles: none('class styles'), link: none('links'), tooltip: none('tooltips'), haveCallback: none('click callbacks'), linkTarget: none('link targets') },
      namespace: { children: none('namespace nesting'), parent: none('namespace nesting'), explicit: none('namespace nesting'), notes: none('notes') },
      ...accAbsent('vitepress-plugin-mermaid-diagram'),
    },
  }
}

// termaid 0.10.0 parser/classdiagram.py _parse_member_text: visibility and classifier
// symbols; a method's name keeps its parameter list ('getAge(int x)') with the return type
// apart; an attribute 'Type name' (a capitalized or builtin first word) is kept as
// return_type and name, otherwise whole. namespace, style, classDef, cssClass, click,
// callback and link lines are skipped (_SKIP_RE), and accTitle/accDescr are not kept.
function termaidClassModel(raw, hooks) {
  const member = m => {
    if (m.is_method) {
      // The name holds Mermaid's id and its parenthesized parameters together, so Mermaid's
      // display text is the visibility, that name and ' : ' with the return type.
      return { display: m.visibility + parseGenericTypes(m.name) + (m.return_type ? ' : ' + parseGenericTypes(m.return_type) : ''), visibility: m.visibility, classifier: m.classifier, returnType: m.return_type }
    }
    return { visibility: m.visibility, id: m.return_type ? `${m.return_type} ${m.name}` : m.name, classifier: m.classifier }
  }
  const skipped = what => `termaid skips class ${what} lines`
  return {
    classes: () => entriesOf(raw.classes).map(([id, item]) => [id, {
      label: item.name,
      annotations: item.annotation ? [item.annotation] : [],
      members: item.members.filter(m => !m.is_method).map(member),
      methods: item.members.filter(m => m.is_method).map(member),
    }]),
    ...(typeof raw.direction === 'string' ? { getDirection: raw.direction } : {}),
    absent: {
      class: { type: "termaid's class model keeps no generic type", cssClasses: skipped('cssClass'), styles: skipped('style'), link: skipped('link and click'), tooltip: skipped('link and click'), haveCallback: skipped('click and callback'), linkTarget: skipped('link and click'), parent: skipped('namespace') },
      member: { id: "termaid keeps a method's name and parameter list as one name", parameters: "termaid keeps a method's name and parameter list as one name" },
      getNamespaces: skipped('namespace'),
      ...accAbsent('termaid'),
    },
  }
}

// merslim 0.2.3 parseToIR class: a member has kind, a visibility word, name, parameters
// and returnType. An attribute written 'int age' or 'age : int' is kept as name 'age' and
// returnType 'int' alike, so the written form Mermaid displays is not recorded; no static
// or abstract flag is kept. A class keeps one stereotype; no class assignments, links,
// styles, namespaces or acc fields.
function merslimClassModel(raw) {
  const visibility = word => (word ? VITEPRESS_VISIBILITY[word] ?? word : '')
  const member = m => (m.kind === 'method' ? { visibility: visibility(m.visibility), id: m.name, parameters: m.parameters ?? '', returnType: m.returnType ?? '' } : { visibility: visibility(m.visibility) })
  const none = what => `Merslim's class model keeps no ${what}`
  return {
    classes: () => raw.classes.map(item => [item.id, {
      label: item.label ?? item.id,
      annotations: item.stereotype ? [item.stereotype] : [],
      members: item.members.filter(m => m.kind !== 'method').map(member),
      methods: item.members.filter(m => m.kind === 'method').map(member),
    }]),
    absent: {
      class: { type: none('generic type'), cssClasses: none('class assignments'), styles: none('class styles'), link: none('links'), tooltip: none('tooltips'), haveCallback: none('click callbacks'), linkTarget: none('link targets'), parent: none('namespaces') },
      member: { id: "Merslim keeps an attribute written 'int age' or 'age : int' as the same name and type", classifier: "Merslim's class member keeps no static or abstract classifier" },
      getNamespaces: none('namespaces'),
      getDirection: none('direction'),
      ...accAbsent('Merslim'),
    },
  }
}

// Loom (pi-loom-mermaid 0.10.0), Grok and MermaidText draw a class as a box of display
// rows: Loom's sections are [header rows, attribute rows, method rows] (annotations are
// «name» header rows), Grok and MermaidText keep attrs and methods rows beside the graph.
// A row is the member's display text as written (generics resolved, a $ or * classifier
// kept in the text), so it answers displayText; no other member field is kept.
const ROW_ABSENT = name => Object.fromEntries(['id', 'visibility', 'classifier', 'parameters', 'returnType', 'text', 'cssStyle'].map(key => [key, `${name} keeps a class member as one display row, not Mermaid's parsed member fields`]))
function rowClassModel(entries, name, extra) {
  return {
    classes: () => entries().map(([id, fields]) => [id, { ...fields, members: fields.members.map(row => ({ display: row })), methods: fields.methods.map(row => ({ display: row })) }]),
    ...extra,
    absent: {
      ...extra.absent,
      class: { type: `${name} keeps a generic class's type parameter only in its display label`, linkTarget: `${name}'s class model keeps no link targets`, haveCallback: `${name}'s class model keeps no click callbacks`, tooltip: `${name}'s class model keeps no tooltips`, parent: `${name}'s class model keeps no namespaces`, ...extra.absent.class },
      member: ROW_ABSENT(name),
      getNamespaces: `${name}'s class model keeps no namespaces`,
      ...accAbsent(name),
    },
  }
}
const indexIds = graph => {
  const ids = []
  for (const [id, index] of entriesOf(graph.index)) if (ids[index] === undefined) ids[index] = id
  return ids
}
const DIRECTION_WORD = { down: 'TB', topdown: 'TB', tb: 'TB', td: 'TB', up: 'BT', bottomtop: 'BT', bt: 'BT', right: 'LR', leftright: 'LR', lr: 'LR', left: 'RL', rightleft: 'RL', rl: 'RL' }
const directionWord = dir => (typeof dir === 'string' ? DIRECTION_WORD[dir.toLowerCase().replace(/^dir/, '')] : undefined)
function loomClassModel(raw, hooks) {
  const ids = indexIds(raw)
  return rowClassModel(
    () => raw.nodes.map((node, index) => [ids[index], { label: node.label, members: node.sections?.[1] ?? [], methods: node.sections?.[2] ?? [], cssClasses: () => cssClasses(node.classes, Boolean(node.href), 'Loom', hooks), ...(node.href ? { link: node.href } : {}) }]),
    'Loom',
    { ...(directionWord(raw.dir) ? { getDirection: directionWord(raw.dir) } : {}), absent: { class: { annotations: 'Loom keeps annotations as «name» display rows of the class header', styles: "Loom's class model keeps no per-class styles" } } },
  )
}
function graphClassModel(raw, name) {
  const [graph, details] = raw
  const ids = indexIds(graph)
  return rowClassModel(
    () => graph.nodes.map((node, index) => [ids[index], { label: node.label, annotations: details?.[index]?.annotation ? [details[index].annotation] : [], members: details?.[index]?.attrs ?? [], methods: details?.[index]?.methods ?? [] }]),
    name,
    { ...(directionWord(graph.dir) ? { getDirection: directionWord(graph.dir) } : {}), absent: { class: { cssClasses: `${name}'s class model keeps no class assignments`, styles: `${name}'s class model keeps no per-class styles`, link: `${name}'s class model keeps no links` } } },
  )
}

// agentic-mermaid 0.5.6 class body: a class keeps its body as raw rows (annotation rows
// such as <<interface>> included), one className from cssClass or :::, href and tooltip,
// a generic and a qualified namespace; namespaces keep name and label.
function agenticClassModel(raw, hooks) {
  const rows = 'agentic-mermaid keeps a class body as raw rows, not split into annotations, attributes and methods'
  return {
    classes: () => raw.classes.map(item => [item.id, {
      label: item.label ?? item.id,
      ...(item.generic ? { type: item.generic } : { type: '' }),
      cssClasses: () => cssClasses(item.className ? [item.className] : [], Boolean(item.href), 'agentic-mermaid', hooks),
      link: item.href ?? undefined,
      tooltip: item.tooltip ?? undefined,
      parent: item.namespace ?? undefined,
    }]),
    namespaces: () => (raw.namespaces ?? []).map(space => ({ id: space.name, label: space.label ?? space.name, classIds: raw.classes.filter(item => item.namespace === space.name).map(item => item.id) })),
    absent: {
      class: { members: rows, methods: rows, annotations: rows, styles: "agentic-mermaid's class model keeps no per-class styles", haveCallback: "agentic-mermaid's class model keeps no click callbacks", linkTarget: "agentic-mermaid's class model keeps no link targets" },
      namespace: { children: "agentic-mermaid's namespace keeps no nesting", parent: "agentic-mermaid's namespace keeps no nesting", explicit: "agentic-mermaid's namespace keeps no nesting", notes: "agentic-mermaid's namespaces keep no notes" },
      getDirection: "agentic-mermaid's class model keeps no direction",
      ...accAbsent('agentic-mermaid'),
    },
  }
}

// XMermaid 0.4.2 class: one annotation as written ('<<interface>>'), members and methods
// as one display list; no class assignments, links, styles or namespaces.
function xmermaidClassModel(raw) {
  const list = "XMermaid keeps class members and methods as one display list"
  const none = what => `XMermaid's class model keeps no ${what}`
  return {
    classes: () => raw.classes.map(item => [item.id, { label: item.label, annotations: item.annotation ? [/^<<(.*)>>$/s.exec(item.annotation)?.[1] ?? item.annotation] : [] }]),
    ...(typeof raw.direction === 'string' ? { getDirection: raw.direction } : {}),
    absent: {
      class: { members: list, methods: list, type: none('generic type'), cssClasses: none('class assignments'), styles: none('class styles'), link: none('links'), tooltip: none('tooltips'), haveCallback: none('click callbacks'), linkTarget: none('link targets'), parent: none('namespaces') },
      getNamespaces: none('namespaces'),
      ...accAbsent('XMermaid'),
    },
  }
}

// mermaid-rs-renderer: a class diagram is its graph IR; each class is a node whose label
// folds the annotations, name and member rows into one display text
// ('<<interface>>\nA\n---\n+int age\n---\n+getAge() : int'). Its class parser records no
// class assignments, links, styles or namespaces (node_classes, node_links and
// node_styles stay empty), and a generic class keeps '~T~' in its id.
function mmdrClassModel(raw) {
  const folded = "mermaid-rs-renderer folds a class's annotations, label and members into one display label"
  const none = what => `mermaid-rs-renderer's class parser records no ${what}`
  return {
    classes: () => entriesOf(raw.nodes).sort((a, b) => (raw.node_order?.[a[0]] ?? 0) - (raw.node_order?.[b[0]] ?? 0)).map(([id]) => [id, {}]),
    ...(directionWord(raw.direction) ? { getDirection: directionWord(raw.direction) } : {}),
    absent: {
      class: { label: folded, text: folded, members: folded, methods: folded, annotations: folded, type: "mermaid-rs-renderer keeps a generic class's type parameter in its id", cssClasses: none('class assignments'), styles: none('class styles'), link: none('links'), tooltip: none('tooltips'), haveCallback: none('click callbacks'), linkTarget: none('link targets'), parent: none('namespaces') },
      getNamespaces: none('namespaces'),
      ...accAbsent('mermaid-rs-renderer'),
    },
  }
}

// mermaid-rs-renderer class edges: an arrow end (arrow_start/arrow_end with OpenTriangle
// for <|, ClassDependency for <) or a decoration (DiamondFilled for *, Diamond for o) at
// each end, a Solid or Dotted style, start/end cardinality labels and the label.
const MMDR_ARROW = { OpenTriangle: 1, ClassDependency: 3 }
const MMDR_DECORATION = { DiamondFilled: 2, Diamond: 0 }
function mmdrRelations(raw, hooks) {
  const end = (arrow, kind, decoration) => (arrow ? MMDR_ARROW[kind] : decoration ? MMDR_DECORATION[decoration] : 'none')
  return classView({
    classes: () => [],
    relations: () => raw.edges.map(edge => ({
      id1: edge.from,
      id2: edge.to,
      relation: { type1: end(edge.arrow_start, edge.arrow_start_kind, edge.start_decoration), type2: end(edge.arrow_end, edge.arrow_end_kind, edge.end_decoration), lineType: { Solid: 0, Dotted: 1 }[edge.style] },
      relationTitle1: card(edge.start_label),
      relationTitle2: card(edge.end_label),
      ...(edge.label ? { title: edge.label } : {}),
    })),
    absent: {},
  }, hooks).getRelations
}

// Crafter (@crafter/mermaid-renderer 0.0.3): accTitle/accDescr lines are read as classes
// and a direction statement is not kept; the generic projection answers the rest.
const crafterClass = (_raw, hooks) => {
  const none = what => () => hooks.unsupported(`Crafter's class model keeps no ${what}`)
  return { getAccTitle: none('accessibility title'), getAccDescription: none('accessibility description'), getDirection: none('direction') }
}

// Frankenmermaid 0.4.0 IR (diagram_type Class): class_meta keeps each member's visibility
// word, its name as written (an attribute's whole text, 'String name'; a method's name with
// its parameter list as written, 'bar( int x )'; 'foo : string' as name foo) and return_type, with static/abstract
// flags, a stereotype and generic parameters. :::name classes are node classes (cssClass
// statements are not kept), style statements are style_refs { Node: i } with the written
// style text, and namespaces are graph.subgraphs (key, title label, members, children).
// Link and click statements leave no record.
const FRANKEN_VISIBILITY = { Public: '+', Private: '-', Protected: '#', Package: '~', Unmarked: '' }
function frankenClassModel(ir, hooks) {
  if (ir?.diagram_type !== 'Class') return undefined
  const labelText = index => (typeof index === 'number' ? ir.labels?.[index]?.text : undefined)
  const spaces = ir.graph?.subgraphs ?? []
  const nested = spaces.some(space => (space.children ?? []).length || space.parent != null)
  const visibility = word => (word in FRANKEN_VISIBILITY ? FRANKEN_VISIBILITY[word] : hooks.unavailable(`${NAME_FRANKEN} member visibility ${word}`))
  const owner = index => {
    const owners = spaces.filter(space => (space.members ?? []).includes(index))
    return owners.find(space => !(space.children ?? []).some(child => (spaces[child]?.members ?? []).includes(index)))?.key
  }
  const noLinks = `${NAME_FRANKEN}'s class parser keeps no link or click statements`
  const asWritten = `${NAME_FRANKEN} keeps a method's name and parameter list as one written text, and splits an attribute's 'name : type' text without its spacing`
  return {
    classes: () => ir.nodes.map((node, index) => [node.id, {
      label: node.id,
      type: (node.class_meta?.generics ?? []).join(','),
      annotations: node.class_meta?.stereotype ? [String(node.class_meta.stereotype).toLowerCase()] : [],
      // An attribute written 'foo : string' is split into name and return_type: Mermaid's id is
      // the whole text, whose spacing around the colon is not kept.
      members: (node.class_meta?.attributes ?? []).map(item => ({ visibility: visibility(item.visibility), ...(item.return_type == null ? { id: item.name } : {}), ...flags({ isStatic: item.is_static, isAbstract: item.is_abstract }) })),
      methods: (node.class_meta?.methods ?? []).map(item => ({ visibility: visibility(item.visibility), returnType: item.return_type ?? '', ...flags({ isStatic: item.is_static, isAbstract: item.is_abstract }) })),
      styles: (ir.style_refs ?? []).filter(ref => ref.target?.Node === index).flatMap(ref => styleList(hooks, ref.style)),
      cssClasses: ['default', ...(node.classes ?? [])].join(' '),
      parent: owner(index),
    }]),
    namespaces: () => spaces.map(space => ({ id: space.key, label: labelText(space.title) ?? space.key, classIds: (space.members ?? []).filter(index => owner(index) === space.key).map(index => ir.nodes[index]?.id), ...(nested ? {} : { children: new Map(), parent: undefined }) })),
    getAccTitle: ir.meta?.acc_title ?? '',
    getAccDescription: ir.meta?.acc_descr ?? '',
    absent: {
      class: { link: noLinks, linkTarget: noLinks, tooltip: noLinks, haveCallback: noLinks },
      member: { id: asWritten, parameters: asWritten, text: asWritten },
      namespace: {
        notes: `${NAME_FRANKEN} keeps class notes outside its namespaces`,
        explicit: `${NAME_FRANKEN} does not record whether a namespace was declared or implied by a dotted name`,
        ...(nested ? { children: `${NAME_FRANKEN}'s nested namespaces are not mapped to Mermaid's qualified ids`, parent: `${NAME_FRANKEN}'s nested namespaces are not mapped to Mermaid's qualified ids` } : {}),
      },
    },
  }
}
const NAME_FRANKEN = 'Frankenmermaid'
const CLASS_MODELS = {
  'Dicklesworthstone/frankenmermaid': frankenClassModel,
  'orestesgaolin/mermaid': dartClassModel,
  'pub:mermaid_flutter': dartClassModel,
  'dfadler/zombie-mermaid': (raw, hooks) => zombieClassModel(raw, 'zombie-mermaid', hooks),
  'lukilabs/beautiful-mermaid': (raw, hooks) => zombieClassModel(raw, 'beautiful-mermaid', hooks),
  'kais-radwan/ascii-mermaid': (raw, hooks) => zombieClassModel(raw, 'ascii-mermaid', hooks),
  'KlangHaus/vitepress-plugin-diagram': raw => vitepressClassModel(raw),
  'fasouto/termaid': termaidClassModel,
  'emtyty/merslim': raw => merslimClassModel(raw),
  'Yassimba/loom': loomClassModel,
  'xai-org/grok-build': raw => graphClassModel(raw, 'Grok'),
  'spacedock-dev/mermaidtext': raw => graphClassModel(raw, 'MermaidText'),
  'adewale/agentic-mermaid': agenticClassModel,
  'evangwt/xmermaid': raw => xmermaidClassModel(raw),
  '1jehuang/mermaid-rs-renderer': raw => mmdrClassModel(raw),
}
const classSchema = Object.fromEntries(Object.entries(CLASS_MODELS).map(([project, model]) => [project, (raw, hooks) => {
  const read = model(raw, hooks)
  return read ? classesView(read, hooks) : undefined
}]))
classSchema['1jehuang/mermaid-rs-renderer'] = (raw, hooks) => ({ ...classesView(mmdrClassModel(raw), hooks), getRelations: mmdrRelations(raw, hooks) })
classSchema['crafter-station/mermaid'] = crafterClass

// ---------------------------------------------------------------------------------------
// Entity-relationship diagrams.
//
// Mermaid's entity (erDb.addEntity) starts with cssClasses 'default' and appends ' name'
// for each class statement or :::name; style statements push each style onto cssStyles.
// getClasses() maps each classDef name to { id, styles, textStyles }, where a style
// mentioning color is also a text style with fill renamed bgFill (erDb.addClass).
// getSubGraphs() lists subgraph blocks (Mermaid 12). These views add those fields; the
// entity and relationship readings are the same as in ../schema-views.mjs.
function erClasses(defs) {
  return new Map(defs.map(([id, styles]) => [id, { id, styles: [...styles], textStyles: styles.filter(style => /color/.test(style)).map(style => style.replace('fill', 'bgFill')) }]))
}
function erExtra(model, hooks) {
  // Mermaid's entity id is its generated identity ('entity-<name>-<n>'), which its
  // relationships reference as entityA/entityB; the models here identify an entity by its
  // name, which these views' relationships reference.
  const entities = () => model.entities().map(([name, fields]) => [name, { id: name, ...fields }])
  const base = erView({ entities, relationships: model.relationships, absent: model.absent }, hooks)
  const view = { getEntities: base.getEntities, getEntity: base.getEntity, ...(base.getRelationships ? { getRelationships: base.getRelationships } : {}) }
  for (const key of ['getClasses', 'getSubGraphs', 'getAccTitle', 'getAccDescription']) {
    if (model[key]) view[key] = model[key]
    else if (model.absent[key]) view[key] = () => hooks.unsupported(model.absent[key])
  }
  return view
}
const erCss = (assigned, styles) => ({ cssClasses: ['default', ...(assigned ?? []).filter(Boolean)].join(' '), cssStyles: styles ?? [] })
/** What a model that keeps none of Mermaid's ER styling, subgraph or acc fields declares. */
const erNone = name => ({
  entity: { cssClasses: `${name}'s ER model keeps no class assignments`, cssStyles: `${name}'s ER model keeps no entity styles` },
  getClasses: `${name}'s ER model keeps no classDef styles`,
  getSubGraphs: `${name}'s ER model keeps no subgraphs`,
  getAccTitle: `${name}'s ER model keeps no accessibility title`,
  getAccDescription: `${name}'s ER model keeps no accessibility description`,
})
const erAttribute = a => ({ type: a.type, name: a.name, keys: a.keys ?? [], comment: a.comment ?? '' })
const ZOMBIE_CARD = { one: 'ONLY_ONE', 'zero-one': 'ZERO_OR_ONE', many: 'ONE_OR_MORE', 'zero-many': 'ZERO_OR_MORE' }
const MMDR_CARD = { CrowsFootOne: 'ONLY_ONE', CrowsFootZeroOne: 'ZERO_OR_ONE', CrowsFootMany: 'ONE_OR_MORE', CrowsFootZeroMany: 'ZERO_OR_MORE' }
const AGENTIC_CARD = { 'one-only': 'ONLY_ONE', 'zero-or-one': 'ZERO_OR_ONE', 'one-or-many': 'ONE_OR_MORE', 'zero-or-many': 'ZERO_OR_MORE', parent: 'MD_PARENT' }
const ER_MODELS = {
  // mermaid-ascii pkg/er: Entities and Relationships only (accTitle, classDef, class, style
  // and subgraph statements are not kept; subgraphs are rejected).
  'AlexanderGrooff/mermaid-ascii': raw => ({
    entities: () => raw.Entities.map(entity => [entity.Name, { label: entity.Display, alias: entity.Display === entity.Name ? '' : entity.Display, attributes: entity.Attributes.map(a => ({ type: a.Type, name: a.Name, keys: a.Keys ?? [], comment: a.Comment ?? '' })) }]),
    absent: erNone('mermaid-ascii'),
  }),
  // termaid parser/erdiagram.py: class, :::, style, subgraph and acc lines are unrecognized.
  'fasouto/termaid': raw => ({
    entities: () => entriesOf(raw.entities).map(([name, entity]) => [name, { label: name, alias: entity.alias ?? '', attributes: entity.attributes.map(erAttribute) }]),
    absent: erNone('termaid'),
  }),
  // Loom drops classDef, class, style, subgraph and acc statements as unreadable.
  'Yassimba/loom': raw => ({
    entities: () => indexIds(raw).map((id, index) => [id, { label: raw.nodes[index].label, attributes: (raw.nodes[index].sections?.[1] ?? []).map(() => ({})) }]),
    absent: { ...erNone('Loom'), attribute: Object.fromEntries(['type', 'name', 'keys', 'comment'].map(field => [field, 'Loom keeps ER attributes as display rows, not typed fields'])), entity: { ...erNone('Loom').entity, alias: "Loom's ER model keeps no entity alias" } },
  }),
  // mermaid-rs-renderer's ER parser reads class, style, subgraph and acc lines as entity
  // names; node_classes and node_styles stay empty.
  '1jehuang/mermaid-rs-renderer': raw => ({
    entities: () => entriesOf(raw.nodes).map(([name]) => [name, { label: name }]),
    // An end with no decoration is one whose marker the parser did not read as a
    // cardinality ('"1"--' keeps no decoration); it keeps the project's own spelling.
    relationships: () => raw.edges.map(edge => {
      const cardOf = decoration => (decoration == null ? 'mermaid-rs-renderer:no-decoration' : MMDR_CARD[decoration])
      return { entityA: edge.from, entityB: edge.to, roleA: edge.label ?? '', relSpec: { cardA: cardOf(edge.end_decoration), cardB: cardOf(edge.start_decoration), relType: identifying(edge.style === 'Solid' ? true : edge.style === 'Dotted' ? false : undefined) } }
    }),
    absent: { ...erNone('mermaid-rs-renderer'), entity: { ...erNone('mermaid-rs-renderer').entity, attributes: "mermaid-rs-renderer folds ER attributes into the node's display label", alias: "mermaid-rs-renderer's ER model keeps no entity alias" } },
  }),
  // zombie-mermaid keeps classDefs, one class assignment per entity and node styles as
  // maps; subgraph and acc statements are not kept. beautiful-mermaid and ascii-mermaid
  // keep none of the three maps.
  'dfadler/zombie-mermaid': raw => zombieEr(raw, 'zombie-mermaid'),
  'lukilabs/beautiful-mermaid': raw => zombieEr(raw, 'beautiful-mermaid'),
  'kais-radwan/ascii-mermaid': raw => zombieEr(raw, 'ascii-mermaid'),
  // merslim keeps a table schema only.
  'emtyty/merslim': raw => ({
    entities: () => raw.schema.tables.map(table => [table.name, { label: table.name, attributes: table.columns.map(c => ({ type: c.type, name: c.name, keys: [...(c.isPK ? ['PK'] : []), ...(c.isFK ? ['FK'] : []), ...(c.isUnique ? ['UK'] : [])] })) }]),
    absent: { ...erNone('Merslim'), entity: { ...erNone('Merslim').entity, alias: "Merslim's ER table model keeps no alias" }, attribute: { comment: "Merslim's ER column model keeps no comments" } },
  }),
  // mermaid_core 0.3.2: per entity a cssClasses list and cssStyles strings, classDefs as
  // name -> style strings; accTitle/accDescr and subgraphs are not kept.
  'orestesgaolin/mermaid': raw => dartEr(raw),
  'pub:mermaid_flutter': raw => dartEr(raw),
  // agentic-mermaid 0.5.6 er body: an entity keeps its alias as label, one className, a
  // style object, a groupId and its attributes as raw text rows; relations keep left/right
  // cardinality words, dashed and the label; groups are subgraphs (id, label, direction);
  // classDefs and the accessibility title are kept, accDescr is not.
  'adewale/agentic-mermaid': raw => ({
    entities: () => raw.entities.map(entity => [entity.id, { label: entity.id, alias: entity.label ?? '', attributes: entity.attributes.map(() => ({})), ...erCss(entity.className ? [entity.className] : [], styleStrings(entity.style)) }]),
    relationships: () => raw.relations.map(rel => ({ entityA: rel.from, entityB: rel.to, roleA: rel.label ?? '', relSpec: { cardA: AGENTIC_CARD[rel.rightCard], cardB: AGENTIC_CARD[rel.leftCard], relType: identifying(typeof rel.dashed === 'boolean' ? !rel.dashed : undefined) } })),
    getClasses: () => erClasses(entriesOf(raw.classDefs).map(([id, style]) => [id, styleStrings(style)])),
    getSubGraphs: () => agenticErGroups(raw),
    getAccTitle: () => raw.accessibilityTitle ?? '',
    absent: {
      attribute: Object.fromEntries(['type', 'name', 'keys', 'comment'].map(field => [field, 'agentic-mermaid keeps ER attributes as raw text rows, not typed fields'])),
      getAccDescription: "agentic-mermaid's ER model keeps no accessibility description",
    },
  }),
  // Crafter (@crafter/mermaid-renderer 0.0.3) er: entities with typed attributes (name,
  // type, keys, comment), relations with from/to cardinality words and an identifying
  // flag. Aliases, classDef, class, style, subgraph and acc statements are not kept.
  'crafter-station/mermaid': raw => ({
    entities: () => entriesOf(raw.entities).map(([name, entity]) => [name, { label: name, attributes: (entity.attributes ?? []).map(erAttribute) }]),
    relationships: () => (raw.relations ?? []).map(rel => ({ entityA: rel.from, entityB: rel.to, roleA: rel.label ?? '', relSpec: { cardA: ZOMBIE_CARD[rel.toCardinality], cardB: ZOMBIE_CARD[rel.fromCardinality], relType: identifying(rel.identifying) } })),
    absent: { ...erNone('Crafter'), entity: { ...erNone('Crafter').entity, alias: "Crafter's ER model keeps no entity alias" } },
  }),
  // XMermaid 0.4.2 er: accTitle and accDescr are not kept (classDef is rejected).
  'evangwt/xmermaid': () => ({ absent: { getAccTitle: "XMermaid's ER model keeps no accessibility title", getAccDescription: "XMermaid's ER model keeps no accessibility description" } }),
}
// Mermaid adds a subgraph when its block closes (inner blocks first); its nodes are the
// entities placed in it and its child subgraphs. agentic-mermaid records each entity's
// groupId, each group's parentId and the statement order of group-open/close.
function agenticErGroups(raw) {
  const groups = raw.groups ?? []
  const closed = (raw.statements ?? []).filter(item => item.kind === 'group-close').map(item => item.id)
  const order = [...closed.filter(id => groups.some(group => group.id === id)), ...groups.map(group => group.id).filter(id => !closed.includes(id))]
  return order.map(id => groups.find(group => group.id === id)).map(group => ({
    id: group.id,
    title: group.label ?? group.id,
    nodes: [...raw.entities.filter(entity => entity.groupId === group.id).map(entity => entity.id), ...groups.filter(child => child.parentId === group.id).map(child => child.id)],
    dir: group.direction ?? undefined,
    labelType: 'text',
    classes: [],
    cssStyles: [],
  }))
}
function zombieEr(raw, name) {
  const zombie = name === 'zombie-mermaid'
  const get = (map, key) => (map instanceof Map ? map.get(key) : undefined)
  const none = erNone(name)
  return {
    entities: () => raw.entities.map(entity => [entity.id, {
      label: entity.label,
      attributes: entity.attributes.map(erAttribute),
      ...(zombie ? erCss(String(get(raw.classAssignments, entity.id) ?? '').split(/\s+/), styleStrings(get(raw.nodeStyles, entity.id))) : {}),
    }]),
    ...(zombie ? { getClasses: () => erClasses(entriesOf(raw.classDefs).map(([id, style]) => [id, styleStrings(style)])) } : {}),
    absent: { ...none, ...(zombie ? { getClasses: undefined } : {}), entity: { ...(zombie ? {} : none.entity), alias: `${name}'s ER entity model keeps no alias` } },
  }
}
function dartEr(raw) {
  return {
    entities: () => entriesOf(raw.entities).map(([name, entity]) => [name, { label: entity.label, attributes: entity.attributes.map(erAttribute), ...erCss(entity.cssClasses, entity.cssStyles) }]),
    getClasses: () => erClasses(entriesOf(raw.classDefs).map(([id, styles]) => [id, styles ?? []])),
    absent: { entity: { alias: "mermaid_core's ER entity model keeps no alias" }, getSubGraphs: "mermaid_core's ER model keeps no subgraphs", getAccTitle: "mermaid_core's ER model keeps no accessibility title", getAccDescription: "mermaid_core's ER model keeps no accessibility description" },
  }
}
// Frankenmermaid 0.4.0 IR (diagram_type Er): an entity's label slot holds either its alias
// (NAME["alias"]) or the written text of a quoted name ("my entity", whose id becomes
// my_entity), so an entity with a label has no alias that can be told; one without has
// none. Classes are kept as written per class statement or :::name (a comma list stays one
// name); style statements and classDefs are style_refs (target Node index or Class name)
// with their written style text; subgraph and end lines are read as entities.
function frankenEr(ir, hooks) {
  if (ir?.diagram_type !== 'Er') return undefined
  const refs = target => (ir.style_refs ?? []).filter(ref => ref.target && typeof ref.target === 'object' && target in ref.target)
  return {
    entities: () => ir.nodes.map((node, index) => [node.id, {
      label: node.id,
      ...(typeof node.label === 'number' ? { [VERTEX_ABSENT]: { alias: "Frankenmermaid keeps an entity's alias and the text of a quoted entity name in the same label" } } : { alias: '' }),
      attributes: (node.members ?? []).map(m => ({ type: m.data_type, name: m.name, keys: (m.keys ?? []).map(key => String(key).toUpperCase()), comment: m.comment ?? '' })),
      ...erCss(node.classes, refs('Node').filter(ref => ref.target.Node === index).flatMap(ref => styleList(hooks, ref.style))),
    }]),
    getClasses: () => {
      const defs = new Map()
      for (const ref of refs('Class')) defs.set(ref.target.Class, [...(defs.get(ref.target.Class) ?? []), ...styleList(hooks, ref.style)])
      return erClasses([...defs])
    },
    getAccTitle: () => ir.meta?.acc_title ?? '',
    getAccDescription: () => ir.meta?.acc_descr ?? '',
    absent: { getSubGraphs: "Frankenmermaid's ER parser reads no subgraphs: subgraph and end lines become entities" },
  }
}
ER_MODELS['Dicklesworthstone/frankenmermaid'] = frankenEr
const erSchema = Object.fromEntries(Object.entries(ER_MODELS).map(([project, model]) => [project, (raw, hooks) => {
  const read = model(raw, hooks)
  if (!read) return undefined
  if (!read.entities) return Object.fromEntries(Object.entries(read.absent).map(([key, reason]) => [key, () => hooks.unsupported(reason)]))
  return erExtra(read, hooks)
}]))

// ---------------------------------------------------------------------------------------
// Flowcharts.
//
// The vertex, edge and subgraph readings of ../schema-views.mjs stay as they are; the views
// here add what those leave unmapped: getClasses (Mermaid's flowDb.addClass keeps each
// classDef as { id, styles, textStyles }, every written style in order, the ones naming
// color also as text styles with fill renamed bgFill), the accessibility getters, and
// fields of its vertex, edge and subgraph records that a model keeps or does not keep.
// A record from the reviewed view is refined in place: a field it already answers is
// left to it, and only an unanswered field this module declares is added.
const BASE_ONLY = Symbol('the reviewed view without this module')
/** The view ../schema-views.mjs builds for this project, without this module's getters. */
const baseView = (project, family, raw, hooks) => nativeSchemaView(project, family, raw, { ...hooks, [BASE_ONLY]: true })
/** A record that also answers `fields` (values or thunks) and declares `absent`, for keys
 * the record itself does not carry; any other key is the record's own to answer. The
 * record's fields are copied first: a proxy's invariant checks would otherwise consult
 * the record for keys it does not have. */
function refine(item, fields, absent, hooks) {
  const copy = {}
  for (const key of Object.keys(item)) copy[key] = item[key]
  for (const [key, value] of Object.entries(fields)) if (!(key in copy)) Object.defineProperty(copy, key, typeof value === 'function' ? { get: value, enumerable: true, configurable: true } : { value, enumerable: true, configurable: true, writable: true })
  const declared = key => typeof key === 'string' && Object.hasOwn(absent, key)
  return new Proxy(copy, {
    get: (target, key) => (key in target ? target[key] : declared(key) ? hooks.unsupported(absent[key]) : item[key]),
    has: (target, key) => (key in target ? true : declared(key) ? hooks.unsupported(absent[key]) : key in item),
    getOwnPropertyDescriptor: (target, key) => (Object.hasOwn(target, key) ? Object.getOwnPropertyDescriptor(target, key) : declared(key) ? hooks.unsupported(absent[key]) : void Object.getOwnPropertyDescriptor(item, key)),
  })
}
/** Refine the vertex, edge and subgraph records of a reviewed flowchart view. */
function refineFlowchart(base, more, hooks) {
  const view = {}
  if (base?.getVertices && more.vertex) view.getVertices = () => new Map([...base.getVertices()].map(([id, item]) => [id, refine(item, more.vertex.fields?.(id, item) ?? {}, more.vertex.absent ?? {}, hooks)]))
  if (base?.getEdges && more.edge) view.getEdges = () => base.getEdges().map((item, index) => refine(item, more.edge.fields?.(index, item) ?? {}, more.edge.absent ?? {}, hooks))
  if (base?.getSubGraphs && more.subgraph) view.getSubGraphs = () => base.getSubGraphs().map(item => refine(item, more.subgraph.fields?.(item) ?? {}, more.subgraph.absent ?? {}, hooks))
  return view
}
const flowClasses = defs => new Map(defs.map(([id, styles]) => [id, { id, styles: [...styles], textStyles: styles.filter(style => /color/.test(style)).map(style => style.replace('fill', 'bgFill')) }]))
const flowAcc = name => ({ getAccTitle: `${name}'s flowchart model keeps no accessibility title`, getAccDescription: `${name}'s flowchart model keeps no accessibility description` })
const NO_MARKDOWN_TITLE = name => ({ labelType: `${name} keeps a subgraph title's text without recording whether it was written as markdown` })
const FLOW_MODELS = {
  // mermaid-rs-renderer ir.rs: classDefs, node styles and link styles are NodeStyle/EdgeStyle
  // structs of known properties (stroke-width parsed to a number; others dropped), so the
  // written style list is not kept. Subgraphs keep a direction and their classes. Edge
  // ids, linkStyle interpolate, accTitle and accDescr are not kept.
  '1jehuang/mermaid-rs-renderer': (raw, hooks) => ({
    absent: { getClasses: "mermaid-rs-renderer keeps a classDef as a fixed set of typed style properties, not the written style list", ...flowAcc('mermaid-rs-renderer') },
    vertex: { absent: { styles: "mermaid-rs-renderer keeps node styles as a fixed set of typed properties, not the written style list" } },
    edge: { absent: { id: "mermaid-rs-renderer's edge model keeps no edge ids", interpolate: "mermaid-rs-renderer's edge model keeps no curve", style: "mermaid-rs-renderer keeps link styles as a fixed set of typed properties, not the written style list" } },
    subgraph: {
      fields: item => {
        const group = (raw.subgraphs ?? []).find(candidate => candidate.id === item.id)
        // Mermaid keeps a subgraph's direction as written; TopDown is both TB and TD.
        const dir = group?.direction === 'TopDown' ? { dir: () => hooks.unsupported("mermaid-rs-renderer records a subgraph's direction TB and TD as the same TopDown") } : group?.direction ? { dir: directionWord(group.direction) } : {}
        return { ...dir, classes: raw.subgraph_classes?.[item.id] ?? [] }
      },
      absent: { dir: 'mermaid-rs-renderer records no direction for this subgraph', ...NO_MARKDOWN_TITLE('mermaid-rs-renderer') },
    },
  }),
  // mermaid-ascii pkg/graph: classDef properties are kept as a map read back sorted by
  // property name, not in written order; acc lines, linkStyle and direction lines inside a
  // subgraph are read as node names.
  'AlexanderGrooff/mermaid-ascii': () => ({
    absent: { getClasses: "mermaid-ascii keeps a classDef's properties sorted by name, not as the written style list", ...flowAcc('mermaid-ascii') },
    edge: { absent: { id: "mermaid-ascii's edge model keeps no edge ids", interpolate: "mermaid-ascii's edge model keeps no curve", style: "mermaid-ascii's edge model keeps no link styles" } },
    subgraph: { absent: { dir: "mermaid-ascii's subgraph model keeps no direction", ...NO_MARKDOWN_TITLE('mermaid-ascii') } },
  }),
  // figurehead: class_defs, inline node styles and edge styles are typed structs (Hex/Named
  // colours, a dasharray flag), not the written style list; accTitle/accDescr are not kept.
  'Mootikins/figurehead-rs': () => ({
    absent: { getClasses: "figurehead keeps a classDef as a fixed set of typed style properties, not the written style list", ...flowAcc('figurehead') },
    vertex: { absent: { styles: "figurehead keeps a node style as a fixed set of typed properties, not the written style list" } },
    edge: { absent: { interpolate: "figurehead's edge model keeps no curve", style: "figurehead keeps a link style as a fixed set of typed properties, not the written style list", id: "figurehead's edge model keeps no edge ids" } },
    subgraph: { absent: NO_MARKDOWN_TITLE('figurehead') },
  }),
  // termaid graph/model.py: class_defs keep each property in written order; subgraphs keep
  // a direction; edges keep no id or curve (a linkStyle interpolate is read as a style
  // key); accTitle/accDescr lines are read as nodes.
  'fasouto/termaid': raw => ({
    getClasses: () => flowClasses(entriesOf(raw.class_defs).map(([id, style]) => [id, styleStrings(style)])),
    absent: flowAcc('termaid'),
    edge: { absent: { id: "termaid's edge model keeps no edge ids", interpolate: "termaid's edge model keeps no curve", style: "termaid reads a linkStyle's properties without separating its interpolate setting" } },
    subgraph: {
      fields: item => {
        const group = flatSubgraphs(raw.subgraphs).find(candidate => candidate.id === item.id)
        return group?.direction ? { dir: group.direction } : {}
      },
      absent: { dir: 'termaid records no direction for this subgraph', classes: "termaid's subgraph model keeps no classes", ...NO_MARKDOWN_TITLE('termaid') },
    },
  }),
  // Loom keeps classDefs in written property order; accTitle/accDescr are dropped.
  'Yassimba/loom': raw => ({
    getClasses: () => flowClasses(entriesOf(raw.classDefs).map(([id, style]) => [id, styleStrings(style)])),
    absent: flowAcc('Loom'),
    subgraph: { absent: NO_MARKDOWN_TITLE('Loom') },
  }),
  // Grok and MermaidText keep no classDefs; acc lines are read as nodes. An edge keeps a
  // head at each end; Mermaid has no edge type for a start-only or mixed pair (A <-- B,
  // A o--> B), which keeps the project's own spelling.
  'xai-org/grok-build': (raw, hooks) => ({ getEdges: indexEdges(raw, 'Grok', hooks), absent: { getClasses: "Grok's graph model keeps no classDef styles", ...flowAcc('Grok') }, subgraph: { absent: NO_MARKDOWN_TITLE('Grok') } }),
  'spacedock-dev/mermaidtext': (raw, hooks) => ({ getEdges: indexEdges(raw, 'MermaidText', hooks), absent: { getClasses: "MermaidText's graph model keeps no classDef styles", ...flowAcc('MermaidText') }, subgraph: { absent: NO_MARKDOWN_TITLE('MermaidText') } }),
  // vitepress-plugin-mermaid-diagram keeps no classDefs; acc lines are read as nodes.
  'KlangHaus/vitepress-plugin-diagram': () => ({ absent: { getClasses: "vitepress-plugin-mermaid-diagram's flowchart model keeps no classDef styles", ...flowAcc('vitepress-plugin-mermaid-diagram') } }),
  // XMermaid drops accTitle/accDescr.
  'evangwt/xmermaid': () => ({ absent: flowAcc('XMermaid'), subgraph: { absent: NO_MARKDOWN_TITLE('XMermaid') } }),
  // zombie-mermaid, beautiful-mermaid and ascii-mermaid keep classDefs as property maps in
  // written order; accTitle/accDescr lines are read as nodes.
  'dfadler/zombie-mermaid': raw => zombieFlow(raw, 'zombie-mermaid'),
  'lukilabs/beautiful-mermaid': raw => zombieFlow(raw, 'beautiful-mermaid'),
  'kais-radwan/ascii-mermaid': raw => zombieFlow(raw, 'ascii-mermaid'),
  // mermaid_core 0.3.2: classDefs as property maps in written order; no acc fields; a
  // subgraph keeps no classes, and a markdown title is kept without its backticks.
  'orestesgaolin/mermaid': raw => dartFlow(raw),
  'pub:mermaid_flutter': raw => dartFlow(raw),
  // merman (and OpenCode's copy) accepts classDef lines and keeps nothing of them; it
  // rejects accessibility lines.
  'kitlangton/merman': () => ({ absent: { getClasses: 'merman accepts classDef statements and keeps nothing of them', ...flowAcc('merman') } }),
  'anomalyco/opencode': () => ({ absent: { getClasses: 'merman accepts classDef statements and keeps nothing of them', ...flowAcc('merman') } }),
  // merslim keeps no classDef and no accessibility lines.
  'emtyty/merslim': () => ({ absent: { getClasses: "merslim's flowchart parser keeps no classDef statements", ...flowAcc('merslim') } }),
  // Frankenmermaid 0.4.0 IR (diagram_type Flowchart): each classDef name is a style_ref
  // { Class: name } with its written style text (classDef a,b gives one per name); the
  // accessibility title and description are meta fields. A subgraph title written as
  // markdown keeps only its text, the markers stripped.
  'Dicklesworthstone/frankenmermaid': (ir, hooks) =>
    ir?.diagram_type !== 'Flowchart'
      ? undefined
      : {
          getClasses: () => {
            const defs = new Map()
            for (const ref of ir.style_refs ?? []) if (ref.target && typeof ref.target === 'object' && 'Class' in ref.target) defs.set(ref.target.Class, [...(defs.get(ref.target.Class) ?? []), ...styleList(hooks, ref.style)])
            return flowClasses([...defs])
          },
          getAccTitle: () => ir.meta?.acc_title ?? '',
          getAccDescription: () => ir.meta?.acc_descr ?? '',
          subgraph: { absent: { labelType: "Frankenmermaid strips a markdown subgraph title's markers and does not record that it was markdown" } },
        },
}
/** Grok's and MermaidText's edges as ../schema-views.mjs reads them (indexGraph), with a
 * start-only or mixed pair of heads kept in the project's own spelling. */
function indexEdges(graph, name, hooks) {
  const ids = indexIds(graph)
  return flowchartView({
    nodes: () => [],
    edges: () => graph.edges.map(edge => {
      const from = headOf(edge.head_from ?? edge.headFrom), to = headOf(edge.head_to ?? edge.headTo)
      return { start: ids[edge.from], end: ids[edge.to], text: edge.label ?? '', type: edgeType(from, to) ?? (from && to ? `${name}:${from}-${to}` : undefined), stroke: strokeOf(edge.line) }
    }),
    absent: { edge: { length: `${name}'s edge model has no link length`, style: `${name}'s edge model keeps no link styles`, interpolate: `${name}'s edge model keeps no curve` } },
  }, hooks).getEdges
}
function zombieFlow(raw, name) {
  return {
    getClasses: () => flowClasses(entriesOf(raw.classDefs).map(([id, style]) => [id, styleStrings(style)])),
    absent: flowAcc(name),
    subgraph: { absent: NO_MARKDOWN_TITLE(name) },
  }
}
function dartFlow(raw) {
  return {
    getClasses: () => flowClasses(entriesOf(raw.classDefs).map(([id, style]) => [id, styleStrings(style)])),
    absent: flowAcc('mermaid_core'),
    subgraph: { absent: { classes: "mermaid_core's subgraph model keeps no classes", ...NO_MARKDOWN_TITLE('mermaid_core') } },
  }
}
const flatSubgraphs = list => (list ?? []).flatMap(group => [group, ...flatSubgraphs((group.children ?? []).filter(child => typeof child === 'object'))])

// dsh-plugin-mermaid-gb-svg 0.1.5 lib/engine.js parseMermaid: nodes keep a GB/T 1526 symbol
// name (SHAPE_ALIAS/BRACKETS) and whether a shape was written (explicit; a bare node is
// 'process' with explicit false); edges keep only dashed and thick flags (matchLink reads
// no arrowheads, so A --- B, A --> B, A --o B and A --x B are the same edge; ~~~ edges are
// dropped); subgraphs keep id, title and members. style, classDef, class, linkStyle,
// click, direction, accTitle, accDescr and title lines are skipped.
const DSH_SHAPE = { process: 'square', decision: 'diamond', preparation: 'hexagon', subroutine: 'subroutine', storage: 'cylinder', io: 'lean_right', io_rev: 'lean_left', comment: 'odd' }
function dshFlowchart(raw, hooks) {
  const skipped = what => `dsh-plugin-mermaid-gb-svg skips ${what} lines`
  const view = flowchartView({
    nodes: () => entriesOf(raw.nodes).map(([id, node]) => {
      if (!node.explicit) return [id, { text: node.label, type: undefined }]
      if (node.shape === 'terminal') return [id, { text: node.label, [VERTEX_ABSENT]: { type: "dsh-plugin-mermaid-gb-svg records Mermaid's round, stadium, circle and double circle shapes as the same 'terminal' symbol" } }]
      return [id, { text: node.label, type: DSH_SHAPE[node.shape] ?? node.shape }]
    }),
    edges: () => raw.edges.map(edge => ({ start: edge.from, end: edge.to, text: edge.label ?? '', stroke: edge.thick ? 'thick' : edge.dashed ? 'dotted' : 'normal' })),
    subgraphs: () => (raw.subgraphs ?? []).map(group => ({ id: group.id, title: group.title, nodes: group.members ?? [] })),
    direction: directionWord(raw.direction),
    absent: {
      vertex: { styles: skipped('style'), classes: skipped('class'), link: skipped('click'), tooltip: skipped('click') },
      edge: { type: 'dsh-plugin-mermaid-gb-svg reads no arrowheads: A --- B, A --> B, A --o B and A --x B are the same edge', length: "dsh-plugin-mermaid-gb-svg's edge model keeps no link length", id: "dsh-plugin-mermaid-gb-svg's edge model keeps no edge ids", style: skipped('linkStyle'), interpolate: skipped('linkStyle'), classes: "dsh-plugin-mermaid-gb-svg's edge model keeps no classes", animate: "dsh-plugin-mermaid-gb-svg's edge model keeps no animation" },
      subgraph: { dir: skipped('direction'), classes: skipped('class'), labelType: "dsh-plugin-mermaid-gb-svg keeps a subgraph title's text without recording whether it was written as markdown" },
    },
  }, hooks)
  return { ...view, getClasses: () => hooks.unsupported(skipped('classDef')), getAccTitle: () => hooks.unsupported(skipped('accTitle')), getAccDescription: () => hooks.unsupported(skipped('accDescr')) }
}

const flowchartSchema = Object.fromEntries(Object.entries(FLOW_MODELS).map(([project, model]) => [project, (raw, hooks) => {
  if (hooks[BASE_ONLY]) return undefined
  const more = model(raw, hooks)
  if (!more) return undefined
  const view = refineFlowchart(baseView(project, 'flowchart', raw, hooks), more, hooks)
  for (const key of ['getClasses', 'getEdges', 'getAccTitle', 'getAccDescription']) if (more[key]) view[key] = more[key]
  for (const [key, reason] of Object.entries(more.absent ?? {})) if (!view[key]) view[key] = () => hooks.unsupported(reason)
  return view
}]))
flowchartSchema['sandyyst/dsh-plugin-mermaid-gb-svg'] = (raw, hooks) => (hooks[BASE_ONLY] ? undefined : dshFlowchart(raw, hooks))

// ---------------------------------------------------------------------------------------
// Kanban. Mermaid's getSections() lists the section nodes; getData() lists each section
// (isGroup, shape 'kanbanSection', labelType 'markdown') followed by its items (parentId,
// shape 'kanbanItem', ticket, priority, assigned, icon). A section's width and padding and
// an item's rx, ry and cssStyles are its renderer's settings, and level is the source
// indentation, which none of these models keeps.
const KANBAN_NODE_FIELDS = ['id', 'label', 'labelType', 'isGroup', 'shape', 'level', 'look', 'parentId', 'ticket', 'priority', 'assigned', 'icon']
const KANBAN_SECTION_FIELDS = ['id', 'label', 'level', 'width', 'padding', 'isGroup']
const KANBAN_RENDERER_FIELDS = { look: "Mermaid's kanban look is its renderer's configuration", rx: "a kanban item's corner radius is Mermaid's renderer setting", ry: "a kanban item's corner radius is Mermaid's renderer setting", cssStyles: "a kanban item's text alignment style is Mermaid's renderer setting", width: "a kanban section's width is Mermaid's renderer setting", padding: "a kanban section's padding is Mermaid's renderer setting" }
/** sections() returns [{ id?, label, items: [{ id?, label, ticket?, ... }] }]; absent names
 * fields the model does not keep. */
function kanbanBoard(model, hooks) {
  const absent = { ...KANBAN_RENDERER_FIELDS, level: `${model.name} keeps no source indentation level`, ...model.absent }
  // A section's own decorations (::icon, :::classes) and @{ ... } metadata.
  const SECTION_META = ['icon', 'cssClasses', 'ticket', 'priority', 'assigned']
  const sectionAbsent = Object.fromEntries(SECTION_META.filter(key => !(key in (model.sectionMeta ?? {}))).map(key => [key, model.absentSectionMeta ?? `${model.name} keeps no kanban section metadata or decorations`]))
  const sectionRecord = section => record({ ...('id' in section ? { id: section.id } : {}), label: section.label, isGroup: false, ...Object.fromEntries(SECTION_META.filter(key => !sectionAbsent[key]).map(key => [key, section[key] ?? undefined])) }, 'kanban section', [...KANBAN_SECTION_FIELDS, ...SECTION_META], { ...absent, ...sectionAbsent }, hooks)
  const node = fields => record(fields, 'kanban node', KANBAN_NODE_FIELDS, absent, hooks)
  const meta = item => Object.fromEntries(['ticket', 'priority', 'assigned', 'icon'].filter(key => !absent[key]).map(key => [key, item[key] ?? undefined]))
  return {
    getSections: () => model.sections().map(sectionRecord),
    getData: () => ({
      nodes: model.sections().flatMap(section => [
        // A section node has no parent (Mermaid leaves parentId undefined).
        node({ ...('id' in section ? { id: section.id } : {}), parentId: undefined, label: section.label, labelType: 'markdown', isGroup: true, ...(absent.ticket ? {} : { ticket: section.ticket ?? undefined }), shape: 'kanbanSection' }),
        ...section.items.map(item => node({ ...('id' in item ? { id: item.id } : {}), ...('id' in section ? { parentId: section.id } : {}), label: item.label, labelType: 'markdown', isGroup: false, ...meta(item), shape: 'kanbanItem' })),
      ]),
      edges: [],
      other: {},
      get config() { return hooks.unsupported("Mermaid's kanban getData config is its renderer's configuration") },
    }),
  }
}
const KANBAN_MODELS = {
  // mermaid-rs-renderer: sections are subgraphs (id, label, item ids) and items are nodes
  // whose label folds the item's @{ ... } metadata in as display text.
  '1jehuang/mermaid-rs-renderer': raw => ({
    name: 'mermaid-rs-renderer',
    sections: () => (raw.subgraphs ?? []).map(group => ({ id: group.id, label: group.label, items: (group.nodes ?? []).map(id => ({ id, label: raw.nodes?.[id]?.label })) })),
    absent: Object.fromEntries(['ticket', 'priority', 'assigned', 'icon'].map(key => [key, "mermaid-rs-renderer folds a kanban item's metadata into its display label"])),
  }),
  // agentic-mermaid 0.5.6 kanban: columns (id, label) with tasks (id, label), each with its
  // metadata (ticket, priority, assigned, icon) as written, an ::icon decoration and the
  // :::classes decoration as className.
  'adewale/agentic-mermaid': raw => ({
    name: 'agentic-mermaid',
    sections: () => (raw.columns ?? []).map(column => ({ id: column.id, label: column.label, ...(column.metadata ?? {}), icon: column.icon ?? column.metadata?.icon, cssClasses: column.className, items: (column.tasks ?? []).map(task => ({ id: task.id, label: task.label, ...(task.metadata ?? {}), icon: task.icon ?? task.metadata?.icon })) })),
    sectionMeta: { icon: true, cssClasses: true, ticket: true, priority: true, assigned: true },
    absent: {},
  }),
  // termaid parser/kanban.py: columns keep a title and cards a title, with the item's
  // @{ ... } metadata kept as unparsed text; no ids are kept.
  'fasouto/termaid': raw => ({
    name: 'termaid',
    sections: () => (raw.columns ?? []).map(column => ({ label: column.title, items: (column.cards ?? []).map(card => ({ label: card.title })) })),
    absent: { id: "termaid's kanban model keeps no section or item ids", parentId: "termaid's kanban model keeps no section ids", ...Object.fromEntries(['ticket', 'priority', 'assigned', 'icon'].map(key => [key, "termaid keeps a kanban item's metadata as unparsed text"])) },
  }),
  // mermaid_core 0.3.2 kanban: columns keep a title (no id); cards keep id, title, ticket,
  // priority, assigned and icon.
  'orestesgaolin/mermaid': raw => dartKanban(raw),
  'pub:mermaid_flutter': raw => dartKanban(raw),
  // XMermaid 0.4.2 kanban: columns and tasks keep id (generated when none is written),
  // label and ticket; assigned is accepted and dropped, priority and icon are rejected.
  'evangwt/xmermaid': raw => ({
    name: 'XMermaid',
    sections: () => (raw.columns ?? []).map(column => ({ id: column.id, label: column.label, items: (column.tasks ?? []).map(task => ({ id: task.id, label: task.label, ticket: task.ticket })) })),
    absent: { assigned: "XMermaid's kanban task keeps no assignee", priority: "XMermaid's kanban task keeps no priority", icon: "XMermaid's kanban task keeps no icon" },
  }),
}
function dartKanban(raw) {
  return {
    name: 'mermaid_core',
    sections: () => (raw.columns ?? []).map(column => ({ label: column.title, items: (column.cards ?? []).map(card => ({ id: card.id, label: card.title, ticket: card.ticket, priority: card.priority, assigned: card.assigned, icon: card.icon })) })),
    absent: { id: "mermaid_core's kanban column keeps no id", parentId: "mermaid_core's kanban column keeps no id" },
  }
}
const kanbanSchema = Object.fromEntries(Object.entries(KANBAN_MODELS).map(([project, model]) => [project, (raw, hooks) => kanbanBoard(model(raw), hooks)]))

// ---------------------------------------------------------------------------------------
// C4. XMermaid 0.4.2 parse_dsl c4: elements keep the macro that declared them (kind), id,
// label, description and their enclosing boundary (container); boundaries nest and keep
// their macro; relationships keep from, to, label and a bidirectional flag only, so Rel,
// Rel_U/D/L/R and Rel_Back are recorded alike. Sprites, tags and links are not kept (a
// $name="value" attribute is read as positional text). Its parser rejects a fourth Rel
// argument, so a parsed relation had no technology or description (Mermaid's are then
// empty text).
function xmermaidC4(raw, hooks) {
  const reason = "XMermaid's C4 model keeps no sprites, tags or links (a named attribute is read as positional text)"
  const none = { sprite: reason, tags: reason, link: reason }
  const flat = []
  const walk = (group, parent) => {
    const type = C4_BOUNDARY_MACRO[group.kind]
    flat.push({ alias: group.id, label: text(group.label), type: type ? { text: type } : undefined, kind: group.kind, parentBoundary: parent })
    for (const child of group.boundaries ?? []) walk(child, group.id)
  }
  for (const group of raw.boundaries ?? []) walk(group, 'global')
  return {
    type: raw.diagram_kind ? 'C4' + raw.diagram_kind : undefined,
    shapes: () => (raw.elements ?? []).map(item => {
      const type = C4_MACRO[item.kind]
      if (!type) return hooks.unavailable('XMermaid C4 element kind ' + item.kind)
      return { alias: item.id, label: text(item.label), descr: text(item.description), typeC4Shape: { text: type }, parentBoundary: item.container ?? 'global' }
    }),
    boundaries: () => flat.map(({ kind, ...item }) => (item.type ? item : hooks.unavailable('XMermaid C4 boundary kind ' + kind))),
    rels: () => (raw.relationships ?? []).map(item => {
      const rel = { from: item.from, to: item.to, label: text(item.label), techn: text(''), descr: text('') }
      if (item.bidirectional) return { type: 'birel', ...rel }
      return Object.defineProperty(rel, 'type', { enumerable: true, get: () => hooks.unsupported('XMermaid records Rel, Rel_U/D/L/R and Rel_Back alike (only a bidirectional flag is kept)') })
    }),
    absent: { shape: { ...WRAP('XMermaid'), ...none }, boundary: { ...WRAP('XMermaid'), tags: reason, link: reason }, rel: { ...WRAP('XMermaid'), ...none } },
  }
}
// The diagram title: zombie-mermaid, agentic-mermaid, Merslim and mermaid_core keep it as
// title (absent when none is written, where Mermaid's is empty); mermaid-rs-renderer's C4
// model keeps none.
const c4Title = raw => ({ getTitle: () => raw.title ?? '' })
const c4Schema = {
  'evangwt/xmermaid': (raw, hooks) => ({ ...c4View(xmermaidC4(raw, hooks), hooks), ...c4Title(raw) }),
  'dfadler/zombie-mermaid': c4Title,
  'adewale/agentic-mermaid': c4Title,
  'emtyty/merslim': c4Title,
  'orestesgaolin/mermaid': c4Title,
  'pub:mermaid_flutter': c4Title,
  '1jehuang/mermaid-rs-renderer': (_raw, hooks) => ({ getTitle: () => hooks.unsupported("mermaid-rs-renderer's C4 model keeps no title") }),
}

// ---------------------------------------------------------------------------------------
// Gantt. Mermaid's getWeekday() is the `weekday` setting (default sunday), getExcludes()
// the lower-cased tokens of every excludes line, and the accessibility getters the acc
// statements. None of these models keeps the weekday setting (agentic-mermaid keeps the
// line only as raw text of an opaque block; the others drop or reject it). ascii-mermaid
// keeps the excludes tokens as written; mermaid_core keeps them resolved into weekday
// numbers and dates. Acc statements are dropped, or read as task names, except
// agentic-mermaid's accessibility title.
//
// getTasks(): Mermaid schedules each task (startTime and endTime as local Dates, after/
// until and durations resolved) and keeps its tags as active/done/crit/milestone flags.
// mermaid_core keeps resolved start and end times as local DateTimes (gantt_parser.dart),
// handed over as Dates; termaid and Merslim keep them as a wall-clock time, written
// 'YYYY-MM-DD HH:MM:SS' or encoded in UTC ('2014-01-01T00:00:00.000Z', Merslim's
// new Date('2014-01-01')), which is Mermaid's local Date. agentic-mermaid, ascii-mermaid and
// mermaid-rs-renderer keep the start and end as written ('after a', '3d'), not resolved.
const GANTT_TASK_FIELDS = ['id', 'task', 'section', 'startTime', 'endTime', 'active', 'done', 'crit', 'milestone']
function wallClock(value) {
  const match = typeof value === 'string' && /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?Z?$/.exec(value)
  if (!match) return undefined
  const [, year, month, day, hour, minute, second, ms] = match.map(Number)
  return new Date(year, month - 1, day, hour, minute, second, ms || 0)
}
const tagFlags = tags => Object.fromEntries(['active', 'done', 'crit', 'milestone'].map(tag => [tag, (tags ?? []).includes(tag)]))
function ganttTasks(project, raw, hooks) {
  const task = (fields, absent) => record(fields, 'gantt task', GANTT_TASK_FIELDS, absent ?? {}, hooks)
  // A Date is mermaid_core's local DateTime as the bridge hands it; a task the model left
  // without a time keeps that (null).
  const time = value => (value instanceof Date ? new Date(value.getTime()) : value === null ? null : wallClock(value) ?? hooks.unavailable('Unmapped native gantt time ' + value))
  const asWritten = name => ({ startTime: `${name} keeps a task's start as written, not resolved to a date`, endTime: `${name} keeps a task's end as written, not resolved to a date` })
  switch (project) {
    case 'orestesgaolin/mermaid':
    case 'pub:mermaid_flutter':
      return () => (raw.sections ?? []).flatMap(section => section.tasks.map(item => task({ id: item.id, task: item.name, section: section.name, startTime: time(item.start), endTime: time(item.end), active: item.active, done: item.done, crit: item.crit, milestone: item.milestone })))
    case 'fasouto/termaid':
      return () => (raw.sections ?? []).flatMap(section => section.tasks.map(item => task({ id: item.id, task: item.title, section: section.title, startTime: time(item.start), endTime: time(item.end), active: item.is_active, done: item.is_done, crit: item.is_crit, milestone: item.is_milestone })))
    case 'emtyty/merslim':
      // One status per task ('default' when untagged).
      return () => (raw.tasks ?? []).map(item => task({ id: item.id, task: item.label, section: item.section, startTime: time(item.start), endTime: time(item.end), ...tagFlags([item.status]) }))
    case 'adewale/agentic-mermaid':
      return () => (raw.sections ?? []).flatMap(section => section.tasks.map(item => task({ id: item.taskId ?? item.id, task: item.label, section: section.label, ...tagFlags(item.tags) }, asWritten('agentic-mermaid'))))
    case 'kais-radwan/ascii-mermaid':
      return () => (raw.sections ?? []).flatMap(section => section.tasks.map(item => task({ id: item.id, task: item.label, section: section.name, ...tagFlags(item.tags) }, asWritten('ascii-mermaid'))))
    case '1jehuang/mermaid-rs-renderer':
      // One status per task.
      return () => (raw.gantt_tasks ?? []).map(item => task({ id: item.id, task: item.label, section: item.section ?? undefined, ...tagFlags(item.status ? [String(item.status).toLowerCase()] : []) }, asWritten('mermaid-rs-renderer')))
    default:
      return undefined
  }
}
function ganttGetters(name, keeps, raw, hooks, project) {
  const none = what => () => hooks.unsupported(`${name}'s gantt model keeps no ${what}`)
  const tasks = ganttTasks(project, raw, hooks)
  return {
    ...(tasks ? { getTasks: tasks } : {}),
    getWeekday: none('weekday setting'),
    getExcludes: keeps.excludes ? () => [...(raw.excludes ?? [])] : none('excludes tokens as written'),
    getAccTitle: keeps.accTitle ? () => raw.accessibilityTitle ?? '' : none('accessibility title'),
    getAccDescription: none('accessibility description'),
  }
}
const GANTT_NAMES = {
  '1jehuang/mermaid-rs-renderer': 'mermaid-rs-renderer', 'adewale/agentic-mermaid': 'agentic-mermaid', 'crafter-station/mermaid': 'Crafter', 'emtyty/merslim': 'Merslim',
  'fasouto/termaid': 'termaid', 'kais-radwan/ascii-mermaid': 'ascii-mermaid', 'orestesgaolin/mermaid': 'mermaid_core', 'pub:mermaid_flutter': 'mermaid_core',
  'evangwt/xmermaid': 'XMermaid', 'anomalyco/opencode': 'opencode merman',
}
const ganttSchema = Object.fromEntries(Object.entries(GANTT_NAMES).map(([project, name]) => [project, (raw, hooks) => ganttGetters(name, { excludes: project === 'kais-radwan/ascii-mermaid', accTitle: project === 'adewale/agentic-mermaid' }, raw, hooks, project)]))

// ---------------------------------------------------------------------------------------
// Requirement diagrams. Mermaid's requirementDb keeps requirements and elements as Maps
// by name (type, requirementId, text, risk, verifyMethod / type, docRef), each with
// classes ['default', ...assigned] and cssStyles: style statements and the styles of each
// assigned classDef, in statement order (setCssStyle, setClass, defineClass); getClasses()
// maps each classDef to { id, styles, textStyles }.
const REQUIREMENT_FIELDS = ['name', 'type', 'requirementId', 'text', 'risk', 'verifyMethod', 'cssStyles', 'classes']
const ELEMENT_FIELDS = ['name', 'type', 'docRef', 'cssStyles', 'classes']
const REQUIREMENT_TYPE = { requirement: 'Requirement', functionalrequirement: 'Functional Requirement', interfacerequirement: 'Interface Requirement', performancerequirement: 'Performance Requirement', physicalrequirement: 'Physical Requirement', designconstraint: 'Design Constraint' }
const RISK = { low: 'Low', medium: 'Medium', high: 'High' }
const VERIFY = { analysis: 'Analysis', demonstration: 'Demonstration', inspection: 'Inspection', test: 'Test' }
const word = (table, value) => (typeof value === 'string' ? table[value.toLowerCase()] ?? value : value)
const requirementClasses = defs => new Map(defs.map(([id, styles]) => [id, { id, styles: [...styles], textStyles: styles.filter(style => /color/.test(style)).map(style => style.replace('fill', 'bgFill')) }]))
// mermaid_core 0.3.2 requirement: nodes keyed by name with a kind keyword, fields as
// written [key, value] pairs (risk and verify method as their keywords), classes and
// direct styles kept apart; relations keep from, to and the relationship word; classDefs
// keep their properties in written order. Direction and acc statements are not kept.
function dartRequirement(raw, hooks) {
  const defs = new Map(entriesOf(raw.classDefs).map(([id, style]) => [id, styleStrings(style)]))
  const cssStyles = node => {
    const direct = styleStrings(node.styles), classes = node.classes ?? []
    if (direct.length && classes.some(name => defs.get(name)?.length)) return () => hooks.unsupported('mermaid_core keeps a node\'s style statements and class assignments apart, not in the statement order Mermaid applies them')
    return [...direct, ...classes.flatMap(name => defs.get(name) ?? [])]
  }
  const field = (node, key) => (node.fields ?? []).find(([name]) => name === key)?.[1]
  const nodes = kind => entriesOf(raw.nodes).filter(([, node]) => (kind === 'element') === (node.kind === 'element'))
  const make = (fields, expected) => {
    const object = {}
    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === 'function') Object.defineProperty(object, key, { get: value, enumerable: true })
      else object[key] = value
    }
    return record(object, 'requirement node', expected, {}, hooks)
  }
  return {
    getRequirements: () => new Map(nodes('requirement').map(([name, node]) => [name, make({ name, type: word(REQUIREMENT_TYPE, node.kind), requirementId: field(node, 'id') ?? '', text: field(node, 'text') ?? '', risk: word(RISK, field(node, 'risk') ?? ''), verifyMethod: word(VERIFY, field(node, 'verifyMethod') ?? ''), cssStyles: cssStyles(node), classes: ['default', ...(node.classes ?? [])] }, REQUIREMENT_FIELDS)])),
    getElements: () => new Map(nodes('element').map(([name, node]) => [name, make({ name, type: field(node, 'type') ?? '', docRef: field(node, 'docRef') ?? '', cssStyles: cssStyles(node), classes: ['default', ...(node.classes ?? [])] }, ELEMENT_FIELDS)])),
    getRelationships: () => (raw.relations ?? []).map(rel => ({ type: rel.label, src: rel.from, dst: rel.to })),
    getClasses: () => requirementClasses([...defs]),
    getDirection: () => hooks.unsupported("mermaid_core's requirement model keeps no direction"),
    getAccTitle: () => hooks.unsupported("mermaid_core's requirement model keeps no accessibility title"),
    getAccDescription: () => hooks.unsupported("mermaid_core's requirement model keeps no accessibility description"),
  }
}
const requirementSchema = {
  'orestesgaolin/mermaid': dartRequirement,
  'pub:mermaid_flutter': dartRequirement,
  // agentic-mermaid 0.5.6 requirement: requirements, elements, relations and classDefs in
  // Mermaid's own shape and vocabulary (lists, where Mermaid keeps Maps by name); the
  // accessibility title and description and the direction are kept.
  'adewale/agentic-mermaid': (raw, hooks) => ({
    getRequirements: () => new Map((raw.requirements ?? []).map(item => [item.name, record({ ...item }, 'requirement', REQUIREMENT_FIELDS, {}, hooks)])),
    getElements: () => new Map((raw.elements ?? []).map(({ directStyles, ...item }) => [item.name, record({ ...item }, 'element', ELEMENT_FIELDS, {}, hooks)])),
    getRelationships: () => (raw.relations ?? []).map(rel => ({ type: rel.type, src: rel.src, dst: rel.dst })),
    getClasses: () => requirementClasses((raw.classDefs ?? []).map(item => [item.id, item.styles ?? []])),
    getDirection: () => raw.direction ?? 'TB',
    getAccTitle: () => raw.accessibilityTitle ?? '',
    getAccDescription: () => raw.accessibilityDescription ?? '',
  }),
  // mermaid-rs-renderer folds a requirement's or element's type, id, text, risk, verify
  // method and doc ref into its node's display label; classDefs are typed style structs;
  // acc statements are read as nodes.
  '1jehuang/mermaid-rs-renderer': (_raw, hooks) => {
    const folded = () => hooks.unsupported("mermaid-rs-renderer folds a requirement's and an element's fields into one display label")
    return { getRequirements: folded, getElements: folded, getClasses: () => hooks.unsupported('mermaid-rs-renderer keeps a classDef as a fixed set of typed style properties, not the written style list'), getAccTitle: () => hooks.unsupported("mermaid-rs-renderer's requirement model keeps no accessibility title"), getAccDescription: () => hooks.unsupported("mermaid-rs-renderer's requirement model keeps no accessibility description") }
  },
}

// ---------------------------------------------------------------------------------------
// Architecture. Mermaid's architectureDb lists services { id, type 'service', icon,
// iconText, title, in, edges }, junctions { id, type 'junction', in, edges } and groups
// { id, icon, title, in } in the order added, and align directives as layout hints
// { direction 'row' | 'column', members }. getDataStructures() is its renderer's layout
// computation (adjacency list, spatial map, group alignments).
const ARCH_SERVICE_FIELDS = ['id', 'type', 'icon', 'iconText', 'title', 'in', 'edges']
const ARCH_JUNCTION_FIELDS = ['id', 'type', 'in', 'edges']
const ARCH_GROUP_FIELDS = ['id', 'icon', 'title', 'in']
const ARCH_LAYOUT = "Mermaid's architecture getDataStructures() is its renderer's layout computation"
function architectureView(model, hooks) {
  const absent = model.absent ?? {}
  const list = (key, items, fields, label) => (items ? () => items().map(item => record(item, label, fields, absent[key] ?? {}, hooks)) : absent[key + 's'] ? () => hooks.unsupported(absent[key + 's']) : undefined)
  const view = {
    getServices: list('service', model.services, ARCH_SERVICE_FIELDS, 'architecture service'),
    getJunctions: list('junction', model.junctions, ARCH_JUNCTION_FIELDS, 'architecture junction'),
    getGroups: list('group', model.groups, ARCH_GROUP_FIELDS, 'architecture group'),
    getLayoutHints: model.layoutHints ?? (absent.layoutHints ? () => hooks.unsupported(absent.layoutHints) : undefined),
    getDataStructures: () => hooks.unsupported(ARCH_LAYOUT),
  }
  for (const key of ['getDiagramTitle', 'getAccTitle', 'getAccDescription']) view[key] = key in model ? () => model[key] : absent[key] ? () => hooks.unsupported(absent[key]) : undefined
  return Object.fromEntries(Object.entries(view).filter(([, value]) => value))
}
const archAcc = name => ({ getDiagramTitle: `${name}'s architecture model keeps no title`, getAccTitle: `${name}'s architecture model keeps no accessibility title`, getAccDescription: `${name}'s architecture model keeps no accessibility description` })
const NO_EDGE_LISTS = name => ({ edges: `${name} keeps architecture edges as a diagram list, not per service` })
const ARCH_MODELS = {
  // mermaid_core 0.3.2: services (junctions flagged isJunction) with icon, iconText, label
  // and group; groups with icon, label and parent; alignments with a row flag. Title and
  // acc statements are not kept.
  'orestesgaolin/mermaid': raw => dartArchitecture(raw),
  'pub:mermaid_flutter': raw => dartArchitecture(raw),
  // agentic-mermaid 0.5.6: services, junctions and groups with parentId, alignments with an
  // axis; title and acc kept.
  'adewale/agentic-mermaid': raw => ({
    services: () => (raw.services ?? []).map(item => ({ id: item.id, type: 'service', icon: item.icon ?? undefined, title: item.label ?? undefined, in: item.parentId ?? undefined })),
    junctions: () => (raw.junctions ?? []).map(item => ({ id: item.id, type: 'junction', in: item.parentId ?? undefined })),
    groups: () => (raw.groups ?? []).map(item => ({ id: item.id, icon: item.icon ?? undefined, title: item.label ?? undefined, in: item.parentId ?? undefined })),
    layoutHints: () => (raw.alignments ?? []).map(item => ({ direction: item.axis, members: [...item.members] })),
    getDiagramTitle: raw.title ?? '',
    getAccTitle: raw.accessibilityTitle ?? '',
    getAccDescription: raw.accessibilityDescription ?? '',
    absent: { service: { iconText: "agentic-mermaid's architecture service keeps no icon text", ...NO_EDGE_LISTS('agentic-mermaid') }, junction: NO_EDGE_LISTS('agentic-mermaid') },
  }),
  // zombie-mermaid: services, junctions and groups with parent; align directives are
  // dropped and title is rejected.
  'dfadler/zombie-mermaid': raw => ({
    services: () => (raw.services ?? []).map(item => ({ id: item.id, type: 'service', icon: item.icon ?? undefined, title: item.title ?? undefined, in: item.parent ?? undefined })),
    junctions: () => (raw.junctions ?? []).map(item => ({ id: item.id, type: 'junction', in: item.parent ?? undefined })),
    groups: () => (raw.groups ?? []).map(item => ({ id: item.id, icon: item.icon ?? undefined, title: item.title ?? undefined, in: item.parent ?? undefined })),
    absent: { layoutHints: "zombie-mermaid drops architecture align directives", service: { iconText: "zombie-mermaid's architecture service keeps no icon text", ...NO_EDGE_LISTS('zombie-mermaid') }, junction: NO_EDGE_LISTS('zombie-mermaid'), ...archAcc('zombie-mermaid') },
  }),
  // Merslim: services and groups as kinded nodes with parent; junction and align
  // statements are dropped, as are title and acc.
  'emtyty/merslim': raw => ({
    services: () => (raw.nodes ?? []).filter(item => item.kind === 'service').map(item => ({ id: item.id, type: 'service', icon: item.icon ?? undefined, title: item.label ?? undefined, in: item.parent ?? undefined })),
    groups: () => (raw.nodes ?? []).filter(item => item.kind === 'group').map(item => ({ id: item.id, icon: item.icon ?? undefined, title: item.label ?? undefined, in: item.parent ?? undefined })),
    absent: { junctions: 'Merslim drops architecture junctions', layoutHints: 'Merslim drops architecture align directives', service: { iconText: "Merslim's architecture service keeps no icon text", ...NO_EDGE_LISTS('Merslim') }, ...archAcc('Merslim') },
  }),
  // mermaid-rs-renderer: services and junctions are graph nodes (a junction's icon is
  // 'junction'), groups are subgraphs listing their nodes but not their child groups;
  // align, title and acc statements are not kept.
  '1jehuang/mermaid-rs-renderer': raw => {
    const parentOf = id => (raw.subgraphs ?? []).find(group => (group.nodes ?? []).includes(id))?.id
    const nodes = junction => entriesOf(raw.nodes).filter(([, node]) => (node.icon === 'junction') === junction)
    return {
      services: () => nodes(false).map(([id, node]) => ({ id, type: 'service', icon: node.icon ?? undefined, title: node.label, in: parentOf(id) })),
      junctions: () => nodes(true).map(([id]) => ({ id, type: 'junction', in: parentOf(id) })),
      groups: () => (raw.subgraphs ?? []).map(group => ({ id: group.id, icon: group.icon ?? undefined, title: group.label })),
      absent: { layoutHints: 'mermaid-rs-renderer drops architecture align directives', group: { in: "mermaid-rs-renderer's architecture groups do not record their parent group" }, service: { iconText: "mermaid-rs-renderer's architecture service keeps no icon text", ...NO_EDGE_LISTS('mermaid-rs-renderer') }, junction: NO_EDGE_LISTS('mermaid-rs-renderer'), ...archAcc('mermaid-rs-renderer') },
    }
  },
  // termaid parser/architecture.py: services are graph nodes whose label prefixes an icon
  // glyph, groups are nested subgraphs; junction, align, title and acc statements are not
  // kept.
  'fasouto/termaid': raw => {
    const groups = flatSubgraphs(raw.subgraphs)
    const parentOf = id => groups.find(group => (group.node_ids ?? []).includes(id))?.id
    return {
      services: () => entriesOf(raw.nodes).map(([id]) => ({ id, type: 'service', in: parentOf(id) })),
      groups: () => groups.map(group => ({ id: group.id, title: group.label, in: groups.find(parent => (parent.children ?? []).some(child => child.id === group.id))?.id })),
      absent: { junctions: 'termaid drops architecture junctions', layoutHints: 'termaid drops architecture align directives', service: { icon: "termaid folds a service's icon into its display label as a glyph", title: "termaid folds a service's icon into its display label as a glyph", iconText: "termaid's architecture service keeps no icon text", ...NO_EDGE_LISTS('termaid') }, group: { icon: "termaid's architecture group keeps no icon" }, ...archAcc('termaid') },
    }
  },
  // Loom draws services and junctions as graph nodes labelled with icon glyphs and groups
  // as labelled frames; acc statements are dropped.
  'Yassimba/loom': raw => {
    const glyph = "Loom keeps an architecture service or junction as a graph node with a display glyph, not a typed record"
    return {
      groups: () => (raw.groups ?? []).map(group => ({ id: group.id, in: group.parent == null ? undefined : raw.groups[group.parent]?.id })),
      absent: { services: glyph, junctions: glyph, layoutHints: 'Loom keeps no architecture align directives', group: { icon: "Loom folds a group's icon into its display label as a glyph", title: "Loom folds a group's icon into its display label as a glyph" }, ...archAcc('Loom') },
    }
  },
}
function dartArchitecture(raw) {
  return {
    services: () => (raw.services ?? []).filter(item => !item.isJunction).map(item => ({ id: item.id, type: 'service', icon: item.icon ?? undefined, iconText: item.iconText ?? undefined, title: item.label ?? undefined, in: item.group ?? undefined })),
    junctions: () => (raw.services ?? []).filter(item => item.isJunction).map(item => ({ id: item.id, type: 'junction', in: item.group ?? undefined })),
    groups: () => (raw.groups ?? []).map(item => ({ id: item.id, icon: item.icon ?? undefined, title: item.label ?? undefined, in: item.parent ?? undefined })),
    layoutHints: () => (raw.alignments ?? []).map(item => ({ direction: item.row ? 'row' : 'column', members: [...item.members] })),
    absent: { service: NO_EDGE_LISTS('mermaid_core'), junction: NO_EDGE_LISTS('mermaid_core'), ...archAcc('mermaid_core') },
  }
}
const architectureSchema = Object.fromEntries(Object.entries(ARCH_MODELS).map(([project, model]) => [project, (raw, hooks) => architectureView(model(raw), hooks)]))

// ---------------------------------------------------------------------------------------
// Pie, packet and user journey. Each model's title is kept when written on its own line
// (absent otherwise, where Mermaid's getDiagramTitle() is ''); acc statements are kept
// only where noted, and otherwise dropped or read as data rows.
const accNone = (name, family) => ({ getAccTitle: `${name}'s ${family} model keeps no accessibility title`, getAccDescription: `${name}'s ${family} model keeps no accessibility description` })
const unsupportedGetters = (absent, hooks) => Object.fromEntries(Object.entries(absent).map(([key, reason]) => [key, () => hooks.unsupported(reason)]))
// Pie: Mermaid's getSections() is a Map from label to value and getShowData() the
// showData flag.
const pieSlices = slices => new Map((slices ?? []).map(slice => [slice.label, slice.value]))
const PIE_MODELS = {
  '1jehuang/mermaid-rs-renderer': raw => ({ getSections: () => pieSlices(raw.pie_slices), getDiagramTitle: () => raw.pie_title ?? '', getShowData: () => Boolean(raw.pie_show_data), absent: accNone('mermaid-rs-renderer', 'pie') }),
  'Yassimba/loom': raw => ({ absent: accNone('Loom', 'pie') }),
  'evangwt/xmermaid': raw => ({ getShowData: () => Boolean(raw.show_data), absent: accNone('XMermaid', 'pie') }),
  'fasouto/termaid': raw => ({ getShowData: () => Boolean(raw.show_data), absent: accNone('termaid', 'pie') }),
  'orestesgaolin/mermaid': () => ({ absent: accNone('mermaid_core', 'pie') }),
  'pub:mermaid_flutter': () => ({ absent: accNone('mermaid_core', 'pie') }),
  // These keep a title only from a title line of its own (a title on the pie header line
  // is dropped), and drop acc statements.
  'emtyty/merslim': raw => ({ getDiagramTitle: () => raw.title ?? '', absent: accNone('Merslim', 'pie') }),
  'kais-radwan/ascii-mermaid': raw => ({ getDiagramTitle: () => raw.title ?? '', absent: accNone('ascii-mermaid', 'pie') }),
  'crafter-station/mermaid': () => ({ absent: { getDiagramTitle: "Crafter's pie model keeps no title", ...accNone('Crafter', 'pie') } }),
}
// Packet: the models keep each field's start, end and label. Mermaid's getPacket() is its
// split of those fields into rows at the configured bitsPerRow.
const PACKET_ROWS = "Mermaid's getPacket() rows are its split of the fields at the configured bitsPerRow"
const PACKET_MODELS = {
  'adewale/agentic-mermaid': raw => ({ getDiagramTitle: () => raw.title ?? '', getAccTitle: () => raw.accessibilityTitle ?? '', getAccDescription: () => raw.accessibilityDescription ?? '', absent: { getPacket: PACKET_ROWS } }),
  'fasouto/termaid': () => ({ absent: { getPacket: PACKET_ROWS, getDiagramTitle: "termaid's packet model keeps no title", ...accNone('termaid', 'packet') } }),
  'orestesgaolin/mermaid': raw => ({ getDiagramTitle: () => raw.title ?? '', absent: { getPacket: PACKET_ROWS, ...accNone('mermaid_core', 'packet') } }),
  'pub:mermaid_flutter': raw => ({ getDiagramTitle: () => raw.title ?? '', absent: { getPacket: PACKET_ROWS, ...accNone('mermaid_core', 'packet') } }),
  'evangwt/xmermaid': raw => ({ getDiagramTitle: () => raw.title ?? '', absent: { getPacket: PACKET_ROWS, ...accNone('XMermaid', 'packet') } }),
  // mermaid-rs-renderer folds each field's range and label into a node's display label.
  '1jehuang/mermaid-rs-renderer': () => ({ absent: { getPacket: "mermaid-rs-renderer folds a packet field's bit range and label into one display label", getDiagramTitle: "mermaid-rs-renderer's packet model keeps no title", ...accNone('mermaid-rs-renderer', 'packet') } }),
}
// User journey: Mermaid's getTasks() lists { score, people, section, task, type } with
// type repeating the section.
const journeyTasks = (sections, name, text) => () => (sections ?? []).flatMap(section => section.tasks.map(item => ({ score: item.score, people: [...(item.actors ?? [])], section: section[name], task: item[text], type: section[name] })))
const JOURNEY_MODELS = {
  'adewale/agentic-mermaid': raw => ({ getTasks: journeyTasks(raw.sections, 'label', 'text'), getAccTitle: () => raw.accessibilityTitle ?? '', getAccDescription: () => raw.accessibilityDescription ?? '', absent: {} }),
  'emtyty/merslim': raw => ({ getTasks: journeyTasks(raw.sections, 'title', 'label'), absent: accNone('Merslim', 'journey') }),
  'fasouto/termaid': raw => ({ getTasks: journeyTasks(raw.sections, 'title', 'title'), absent: accNone('termaid', 'journey') }),
  'orestesgaolin/mermaid': raw => ({ getTasks: journeyTasks(raw.sections, 'name', 'name'), absent: accNone('mermaid_core', 'journey') }),
  'pub:mermaid_flutter': raw => ({ getTasks: journeyTasks(raw.sections, 'name', 'name'), absent: accNone('mermaid_core', 'journey') }),
  // mermaid-rs-renderer folds each task's actors into its node's display label.
  '1jehuang/mermaid-rs-renderer': () => ({ absent: { getTasks: "mermaid-rs-renderer folds a journey task's actors into its display label", ...accNone('mermaid-rs-renderer', 'journey') } }),
}
const smallSchema = models => Object.fromEntries(Object.entries(models).map(([project, model]) => [project, (raw, hooks) => {
  const { absent, ...getters } = model(raw)
  return { ...unsupportedGetters(absent ?? {}, hooks), ...getters }
}]))
const pieSchema = smallSchema(PIE_MODELS)
const packetSchema = smallSchema(PACKET_MODELS)
const journeySchema = smallSchema(JOURNEY_MODELS)

// ---------------------------------------------------------------------------------------
// Mindmap. Mermaid's getMindmap() is the root node { nodeId, descr, type, children, icon,
// class, level, ... } with type one of its nodeType codes (mindmapDb.ts), which the tests
// read from db.nodeType; a node's width and padding are its renderer's settings and level
// is the source indentation.
const MINDMAP_NODE_TYPE = { DEFAULT: 0, NO_BORDER: 0, ROUNDED_RECT: 1, RECT: 2, CIRCLE: 3, CLOUD: 4, BANG: 5, HEXAGON: 6 }
const MINDMAP_SHAPE = { default: 0, plain: 0, rounded: 1, rect: 2, square: 2, circle: 3, cloud: 4, bang: 5, hexagon: 6 }
const MINDMAP_FIELDS = ['nodeId', 'descr', 'type', 'children', 'icon', 'class', 'level', 'width', 'padding']
function mindmapView(model, hooks) {
  const absent = { width: "a mindmap node's width is Mermaid's renderer setting", padding: "a mindmap node's padding is Mermaid's renderer setting", level: `${model.name} keeps a mindmap's nesting, not the source indentation level`, ...model.absent }
  const node = item => {
    const fields = model.node(item)
    const type = MINDMAP_SHAPE[fields.shape]
    const { shape, ...rest } = fields
    return record({ ...rest, ...(type === undefined ? {} : { type }), children: (item.children ?? []).map(node) }, 'mindmap node', MINDMAP_FIELDS, absent, hooks)
  }
  return { nodeType: MINDMAP_NODE_TYPE, getMindmap: () => (model.root ? node(model.root) : null), getData: () => hooks.unsupported("Mermaid's mindmap getData() is its renderer's layout data") }
}
const MINDMAP_MODELS = {
  // agentic-mermaid 0.5.6 mindmap: nested nodes with the written id, label, a shape word,
  // icon and className.
  'adewale/agentic-mermaid': raw => ({ name: 'agentic-mermaid', root: raw.root, node: item => ({ nodeId: item.id, descr: item.label, shape: item.shape, icon: item.icon ?? undefined, class: item.className ?? undefined }), absent: {} }),
  // mermaid_core 0.3.2 mindmap: nested nodes with label, a shape word ('plain' for a bare
  // node), icon and cssClasses split on whitespace; written node ids are not kept.
  'orestesgaolin/mermaid': raw => dartMindmap(raw),
  'pub:mermaid_flutter': raw => dartMindmap(raw),
  // Merslim: nested nodes with label and a shape word; written ids are replaced by
  // generated ones and :::class decorations are read as nodes.
  'emtyty/merslim': raw => ({ name: 'Merslim', root: raw.root, node: item => ({ descr: item.label, shape: item.shape, icon: item.icon ?? undefined }), absent: { nodeId: 'Merslim replaces written mindmap node ids with generated ones', class: "Merslim's mindmap node keeps no classes" } }),
  // termaid keeps each node's written text unparsed (id, shape and decorations included).
  'fasouto/termaid': raw => ({ name: 'termaid', root: raw.root, node: item => ({ descr: item.label }), absent: Object.fromEntries(['nodeId', 'type', 'icon', 'class'].map(key => [key, "termaid keeps a mindmap node's written text unparsed"])) }),
}
function dartMindmap(raw) {
  return { name: 'mermaid_core', root: raw.root, node: item => ({ descr: item.label, shape: item.shape, icon: item.icon ?? undefined, class: (item.cssClasses ?? []).length ? item.cssClasses.join(' ') : undefined }), absent: { nodeId: "mermaid_core's mindmap node keeps no written id" } }
}
const mindmapSchema = Object.fromEntries(Object.entries(MINDMAP_MODELS).map(([project, model]) => [project, (raw, hooks) => mindmapView(model(raw), hooks)]))

// ---------------------------------------------------------------------------------------
// Block. Mermaid's getBlock(id) is the block with that id (undefined when none). Its
// colorIndex is the palette slot the renderer stamps on a composite; agentic-mermaid keeps
// it on each composite, the other models keep no palette slot. Only the id and colorIndex
// are mapped here.
const BLOCK_FIELDS = ['id', 'label', 'type', 'children', 'colorIndex', 'widthInColumns', 'columns', 'styles']
function blockView(model, hooks) {
  const find = (list, id) => {
    for (const item of list ?? []) {
      if (item.id === id) return item
      const inner = find(item.children, id)
      if (inner) return inner
    }
    return undefined
  }
  return {
    getBlock: id => {
      const item = find(model.blocks(), id)
      return item ? record({ id: item.id, ...model.fields(item) }, 'block', BLOCK_FIELDS, model.absent ?? {}, hooks) : undefined
    },
  }
}
const BLOCK_PALETTE = name => ({ colorIndex: `${name} keeps no palette slot for a composite block (Mermaid's renderer setting)` })
const BLOCK_MODELS = {
  'adewale/agentic-mermaid': raw => ({ blocks: () => [raw.root], fields: item => ({ colorIndex: item.colorIndex ?? undefined }) }),
  'fasouto/termaid': raw => ({ blocks: () => raw.blocks, fields: () => ({}), absent: BLOCK_PALETTE('termaid') }),
  'orestesgaolin/mermaid': raw => ({ blocks: () => raw.root, fields: () => ({}), absent: BLOCK_PALETTE('mermaid_core') }),
  'pub:mermaid_flutter': raw => ({ blocks: () => raw.root, fields: () => ({}), absent: BLOCK_PALETTE('mermaid_core') }),
  // mermaid-rs-renderer lists the top-level blocks only (a composite's children are not kept).
  '1jehuang/mermaid-rs-renderer': raw => ({ blocks: () => raw.block?.nodes ?? [], fields: () => ({}), absent: BLOCK_PALETTE('mermaid-rs-renderer') }),
}
const blockSchema = Object.fromEntries(Object.entries(BLOCK_MODELS).map(([project, model]) => [project, (raw, hooks) => blockView(model(raw), hooks)]))

// agentic-mermaid 0.5.6 (its flowchart graph) and Crafter (@crafter/mermaid-renderer 0.0.3)
// keep beautiful-mermaid's MermaidGraph: a node's label is its id when none was written
// (a bare node and A[A] are the same 'rectangle'), edges keep a line style and arrow
// flags, class assignments (one class per node), node styles and classDefs are maps.
// agentic-mermaid also keeps the end markers (arrow, circle, cross), a link length when it
// is not 1, written edge ids and link styles by edge index; Crafter reads no circle or
// cross ends, no longer links and no edge ids (such edges are dropped). Mermaid has no start-only edge type: such an
// edge keeps its own spelling.
// Mermaid's edge id (flowDb.addSingleLink): the written id unless an earlier edge took it,
// otherwise L_<start>_<end>_<n>, n being 0 for the first link between the two and the
// number of earlier ones plus one after that. agentic-mermaid keeps a written id; Crafter
// drops an edge written with one, so its edges never had one.
function mermaidEdgeId(edges, index) {
  const edge = edges[index], earlier = edges.slice(0, index)
  if (edge.id && !earlier.some((other, at) => mermaidEdgeId(edges, at).id === edge.id)) return { id: edge.id, isUserDefinedId: true }
  const existing = earlier.filter(other => other.source === edge.source && other.target === edge.target).length
  return { id: `L_${edge.source}_${edge.target}_${existing === 0 ? 0 : existing + 1}`, isUserDefinedId: false }
}
const GRAPH_SHAPE = { rectangle: 'square', rounded: 'round', 'lean-r': 'lean_right', 'lean-l': 'lean_left', 'trapezoid-alt': 'inv_trapezoid', asymmetric: 'odd', 'double-circle': 'doublecircle' }
function beautifulGraph(graph, name, keeps, hooks) {
  const get = (map, key) => (map instanceof Map ? map.get(key) : undefined)
  const flat = []
  const walk = group => {
    const children = (group.children ?? []).filter(child => typeof child === 'object')
    for (const child of children) walk(child)
    flat.push({ id: group.id, title: group.label ?? group.id, nodes: [...(group.nodeIds ?? []), ...(group.children ?? []).map(child => (typeof child === 'string' ? child : child.id))], dir: group.direction ?? undefined })
  }
  for (const group of graph.subgraphs ?? []) walk(group)
  const ambiguous = `${name} records a bare node and a rectangle labelled with its own id as the same 'rectangle'`
  const head = (has, marker) => (has ? headOf(keeps.markers ? marker ?? 'arrow' : 'arrow') : 'none')
  const view = flowchartView({
    nodes: () => entriesOf(graph.nodes).map(([id, node]) => {
      const assigned = get(graph.classAssignments, id)
      const shape = GRAPH_SHAPE[node.shape] ?? shapeOf(node.shape)
      // A shape written as @{ shape: X } is Mermaid's vertex type X as written; agentic-mermaid
      // keeps that name as authoredShape (absent for bracket syntax).
      return [id, {
        text: node.label,
        ...(typeof node.authoredShape === 'string' ? { type: node.authoredShape } : node.shape === 'rectangle' && node.label === id ? { [VERTEX_ABSENT]: { type: ambiguous } } : shape ? { type: shape } : {}),
        classes: assigned ? [assigned] : [],
        styles: styleStrings(get(graph.nodeStyles, id)),
      }]
    }),
    edges: () => graph.edges.map((edge, index) => {
      const start = head(edge.hasArrowStart, edge.startMarker), end = head(edge.hasArrowEnd, edge.endMarker)
      const type = edgeType(start, end) ?? (end === 'none' && start !== 'none' ? `${name}:start-only-${start}` : undefined)
      return {
        start: edge.source, end: edge.target, text: edge.label ?? '', type, stroke: strokeOf(edge.style),
        ...mermaidEdgeId(graph.edges, index),
        ...(keeps.length ? { length: edge.length ?? 1 } : {}),
        ...(graph.linkStyles instanceof Map ? { style: styleStrings(get(graph.linkStyles, index)).length ? styleStrings(get(graph.linkStyles, index)) : undefined } : {}),
      }
    }),
    subgraphs: () => flat,
    direction: directionWord(graph.direction),
    absent: {
      vertex: { link: `${name}'s graph keeps no click links`, tooltip: `${name}'s graph keeps no tooltips` },
      edge: { ...(keeps.length ? {} : { length: `${name}'s edge model keeps no link length` }), ...(graph.linkStyles instanceof Map ? {} : { style: `${name}'s graph keeps no link styles` }), interpolate: `${name}'s edge model keeps no curve`, animate: `${name}'s edge model keeps no animation` },
      subgraph: { classes: `${name}'s subgraph model keeps no classes`, labelType: `${name} keeps a subgraph title's text without recording whether it was written as markdown` },
    },
  }, hooks)
  return { ...view, getClasses: () => flowClasses(entriesOf(graph.classDefs).map(([id, style]) => [id, styleStrings(style)])) }
}
flowchartSchema['adewale/agentic-mermaid'] = (raw, hooks) => {
  if (hooks[BASE_ONLY] || !raw.graph) return undefined
  return { ...beautifulGraph(raw.graph, 'agentic-mermaid', { markers: true, length: true }, hooks), getAccTitle: () => raw.accessibilityTitle ?? '', getAccDescription: () => hooks.unsupported("agentic-mermaid's flowchart model keeps no accessibility description") }
}
flowchartSchema['crafter-station/mermaid'] = (raw, hooks) => {
  if (hooks[BASE_ONLY]) return undefined
  return { ...beautifulGraph(raw, 'Crafter', { markers: false, length: false }, hooks), ...unsupportedGetters(flowAcc('Crafter'), hooks) }
}

export default {
  schema: {
    class: classSchema,

    block: blockSchema,
    mindmap: mindmapSchema,
    pie: pieSchema,
    packet: packetSchema,
    journey: journeySchema,
    architecture: architectureSchema,
    requirement: requirementSchema,
    gantt: ganttSchema,
    c4: c4Schema,
    kanban: kanbanSchema,
    flowchart: flowchartSchema,
    er: erSchema,
  },
  ast: {},
}

// Mermaid's ClassMember computation, for the port views in ./ports.mjs (used inside functions).
export { classMember }
