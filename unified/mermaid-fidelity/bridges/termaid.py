"""fasouto/termaid: call termaid's own public per-family parser and print its model.

termaid's parsers never raise on invalid input; whatever model they return is
the observation. A family termaid has no parser for is answered by its public
termaid.parse(), which auto-detects a state diagram or else reads the source as a
flowchart (termaid/__init__.py parse; its renderer draws every other header the
same way): the kind it chose is the native observation. See ../bridges.ts for the
reply protocol."""
import dataclasses, enum, importlib, json, os, sys

PARSERS = {
    'flowchart': ('flowchart', 'parse_flowchart'), 'state': ('statediagram', 'parse_state_diagram'),
    'sequence': ('sequence', 'parse_sequence_diagram'), 'class': ('classdiagram', 'parse_class_diagram'),
    'er': ('erdiagram', 'parse_er_diagram'), 'gantt': ('gantt', 'parse_gantt'), 'pie': ('piechart', 'parse_pie_chart'),
    'gitgraph': ('gitgraph', 'parse_git_graph'), 'mindmap': ('mindmap', 'parse_mindmap'), 'timeline': ('timeline', 'parse_timeline'),
    'journey': ('journey', 'parse_journey'), 'kanban': ('kanban', 'parse_kanban'), 'quadrant': ('quadrant', 'parse_quadrant'),
    'xychart': ('xychart', 'parse_xychart'), 'packet': ('packet', 'parse_packet'), 'treemap': ('treemap', 'parse_treemap'),
    'block': ('blockdiagram', 'parse_block_diagram'), 'architecture': ('architecture', 'parse_architecture'),
}

def plain(value, seen):
    if isinstance(value, enum.Enum):
        return value.name
    if dataclasses.is_dataclass(value) and not isinstance(value, type):
        if id(value) in seen:
            return None  # back-references such as Subgraph.parent
        seen = seen | {id(value)}
        return {f.name: plain(getattr(value, f.name), seen) for f in dataclasses.fields(value) if f.name != 'parent'}
    if isinstance(value, dict):
        return {str(k): plain(v, seen) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [plain(v, seen) for v in value]
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return str(value)

def detected_kind(source):
    """The diagram kind termaid.parse() dispatched the source to, observed by wrapping
    the two parsers it calls (it parses nothing itself)."""
    termaid = importlib.import_module('termaid')
    seen = []
    originals = {name: getattr(termaid, name) for name in ('parse_flowchart', 'parse_state_diagram')}
    def watch(kind, parse):
        return lambda *args, **kwargs: (seen.append(kind), parse(*args, **kwargs))[1]
    termaid.parse_flowchart = watch('flowchart', originals['parse_flowchart'])
    termaid.parse_state_diagram = watch('state', originals['parse_state_diagram'])
    try:
        termaid.parse(source)
    finally:
        for name, parse in originals.items():
            setattr(termaid, name, parse)
    return seen[0] if len(seen) == 1 else None

def handle(request):
    family = request['family']
    if family not in PARSERS and family != '<shared>':
        try:
            kind = detected_kind(request['source'])
        except Exception as error:
            return {'adapterGap': 'termaid.parse raised (it is documented never to): ' + repr(error)}
        if kind is None:
            return {'adapterGap': 'termaid.parse did not dispatch to exactly one of its parsers'}
        return {'unsupported': 'termaid parsed this source as ' + kind + ', not ' + family, 'native': True}
    if family not in PARSERS:
        return {'unsupported': 'termaid has no ' + family + ' parser'}
    module, name = PARSERS[family]
    try:
        parse = getattr(importlib.import_module('termaid.parser.' + module), name)
    except Exception as error:
        return {'adapterGap': 'termaid parser import failed: ' + repr(error)}
    try:
        model = parse(request['source'])
    except Exception as error:
        return {'adapterGap': 'termaid parser raised (it is documented never to): ' + repr(error)}
    return {'value': plain(model, frozenset())}

# One request on stdin, or with TRIDENT_BRIDGE_SERVE=1 one per line, each reply
# marked so library output on stdout cannot be mistaken for it (see common.mjs).
if os.environ.get('TRIDENT_BRIDGE_SERVE') == '1':
    for line in iter(sys.stdin.readline, ""):
        if line.strip():
            job = json.loads(line)
            sys.stdout.write('\x01TRIDENT\x01' + json.dumps(dict(handle(job), requestId=job.get('requestId'))) + '\n')
            sys.stdout.flush()
else:
    print(json.dumps(handle(json.loads(sys.stdin.read()))))
