# obsidianmd/pele 1.9.0: failures

78 raw failed observations. These include parser rejections and output admission failures; they are not all fidelity defects. Each retained input and oracle caveat remains visible.

[Back to the league table](../README.md)

## flowchart

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-accept-swimlane-as-a-graph-keyword

Node API, SVG. PeleError: No diagram type detected for the given text.

Pinned Mermaid rejected this source. This is a retained legacy/invalid-input outcome, excluded from the secondary positive authored-label admission score.

Oracle caveat: corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-accept-swimlane-as-a-graph-keyword: pinned Mermaid rejected source (No diagram type detected matching given configuration for text: swimlane LR;A-->B;)

```mermaid
swimlane LR;A-->B;
```

Expected labels: none declared

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-keep-node-label-text-if-already-defined-when-a-style-is-applied

Node API, SVG. PeleError: Parse error on line 1: graph TD;A(( ));B((Test));C;style A background:ﬂ°fff¶ßstyle D border:1px solid red -----------------------------------------------^ Expecting 'SEMI', 'NEWLINE', 'EOF', got 'UNICODE_TEXT'

Pinned Mermaid rejected this source. This is a retained legacy/invalid-input outcome, excluded from the secondary positive authored-label admission score.

Oracle caveat: corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-keep-node-label-text-if-already-defined-when-a-style-is-applied: pinned Mermaid rejected source (Parse error on line 1:)

```mermaid
graph TD;A(( ));B((Test));C;style A background:#fff;style D border:1px solid red;
```

Expected labels: none declared

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-accept-swimlane-as-a-graph-keyword

browser API, SVG. PeleError: No diagram type detected for the given text.

Pinned Mermaid rejected this source. This is a retained legacy/invalid-input outcome, excluded from the secondary positive authored-label admission score.

Oracle caveat: corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-accept-swimlane-as-a-graph-keyword: pinned Mermaid rejected source (No diagram type detected matching given configuration for text: swimlane LR;A-->B;)

```mermaid
swimlane LR;A-->B;
```

Expected labels: none declared

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-keep-node-label-text-if-already-defined-when-a-style-is-applied

browser API, SVG. PeleError: Parse error on line 1: graph TD;A(( ));B((Test));C;style A background:ﬂ°fff¶ßstyle D border:1px solid red -----------------------------------------------^ Expecting 'SEMI', 'NEWLINE', 'EOF', got 'UNICODE_TEXT'

Pinned Mermaid rejected this source. This is a retained legacy/invalid-input outcome, excluded from the secondary positive authored-label admission score.

Oracle caveat: corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-keep-node-label-text-if-already-defined-when-a-style-is-applied: pinned Mermaid rejected source (Parse error on line 1:)

```mermaid
graph TD;A(( ));B((Test));C;style A background:#fff;style D border:1px solid red;
```

Expected labels: none declared

## journey

### corpus:mermaid-upstream-suite-bench:journey-upstream-should-handle-an-accessibility-title-accdescr

Node API, SVG. Error: Missing authored label: Order from website

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
journey
    accTitle: The title
    section Order from website
```

Expected labels: `Order from website`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:journey-upstream-should-handle-an-accessibility-title-accdescr

browser API, SVG. Missing authored label: Order from website

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
journey
    accTitle: The title
    section Order from website
```

Expected labels: `Order from website`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

## kanban

### editor:kanban

Node API, SVG. PeleError: Parse error on line 5:     kanban[Kanban family]@{ assigned: "Alex", ticket: "AM-409" } ----^ Expecting 'SPACELINE', 'NL', 'EOF', 'ICON', 'CLASS', 'NODE_DSTART', 'NODE_ID', got 'KANBAN'

Pinned Mermaid rejected this source. This is a retained legacy/invalid-input outcome, excluded from the secondary positive authored-label admission score.

Oracle caveat: editor:kanban: pinned Mermaid rejected source (Parse error on line 5:)

```mermaid
kanban
  todo[To do]
    packet[Packet family]@{ assigned: "Maya", priority: "High" }
  doing[In progress]
    kanban[Kanban family]@{ assigned: "Alex", ticket: "AM-409" }
  done[Done]
    research[Community research]
```

Expected labels: none declared

### editor:kanban

browser API, SVG. PeleError: Parse error on line 5:     kanban[Kanban family]@{ assigned: "Alex", ticket: "AM-409" } ----^ Expecting 'SPACELINE', 'NL', 'EOF', 'ICON', 'CLASS', 'NODE_DSTART', 'NODE_ID', got 'KANBAN'

Pinned Mermaid rejected this source. This is a retained legacy/invalid-input outcome, excluded from the secondary positive authored-label admission score.

Oracle caveat: editor:kanban: pinned Mermaid rejected source (Parse error on line 5:)

```mermaid
kanban
  todo[To do]
    packet[Packet family]@{ assigned: "Maya", priority: "High" }
  doing[In progress]
    kanban[Kanban family]@{ assigned: "Alex", ticket: "AM-409" }
  done[Done]
    research[Community research]
```

Expected labels: none declared

## mindmap

### portfolio:mindmap:46

Node API, SVG. PeleError: There can be only one root. No parent could be found for ("accDescr: Official shapes, formatted labels, local icons, and accessible metadata")

Pinned Mermaid rejected this source. This is a retained legacy/invalid-input outcome, excluded from the secondary positive authored-label admission score.

Oracle caveat: portfolio:mindmap:46: pinned Mermaid rejected source (There can be only one root. No parent could be found for ("accDescr: Official shapes, formatted labels, local icons, and accessible metadata"))

```mermaid
mindmap
  accTitle: Documentation research map
  accDescr: Official shapes, formatted labels, local icons, and accessible metadata
  root((Research map))
    sources[Sources]
      ::icon(fa fa-book)
      :::reference important
      docs["`**Official docs** & issue reports`"]
      repos{{Repositories}}
        Mermaid
        Mermaid ASCII
        Beautiful Mermaid
    findings(Findings)
      syntax))Syntax parity((
      safety)Offline safety(
      gaps{{Named divergences}}
    evidence["`Unicode evidence: naïve café, 東京, مرحبا`"]
```

Expected labels: none declared

### portfolio:mindmap:47

Node API, SVG. PeleError: There can be only one root. No parent could be found for ("accDescr: A broad operational map with more than eleven second-level nodes")

Pinned Mermaid rejected this source. This is a retained legacy/invalid-input outcome, excluded from the secondary positive authored-label admission score.

Oracle caveat: portfolio:mindmap:47: pinned Mermaid rejected source (There can be only one root. No parent could be found for ("accDescr: A broad operational map with more than eleven second-level nodes"))

```mermaid
mindmap
  accTitle: Incident response command map
  accDescr: A broad operational map with more than eleven second-level nodes
  root((Production incident))
    Detection
      Alerts
      Customer reports
    Triage
      Severity
      Scope
    Containment
      Feature flags
      Traffic shift
    Investigation
      Logs
      Traces
    Communications
      Status page
      Stakeholders
    Recovery
      Rollback
      Data repair
    Validation
      Synthetic checks
      Error budget
    Follow-up
      Timeline
      Action items
    Security
      Credentials
      Audit trail
    Vendors
      Cloud provider
      Payment processor
    Legal
      Notification duties
      Evidence hold
    Support
      Response macros
      Escalations
    Analytics
      Impact estimate
      Cohort analysis
```

Expected labels: none declared

### portfolio:mindmap:46

browser API, SVG. PeleError: There can be only one root. No parent could be found for ("accDescr: Official shapes, formatted labels, local icons, and accessible metadata")

Pinned Mermaid rejected this source. This is a retained legacy/invalid-input outcome, excluded from the secondary positive authored-label admission score.

Oracle caveat: portfolio:mindmap:46: pinned Mermaid rejected source (There can be only one root. No parent could be found for ("accDescr: Official shapes, formatted labels, local icons, and accessible metadata"))

```mermaid
mindmap
  accTitle: Documentation research map
  accDescr: Official shapes, formatted labels, local icons, and accessible metadata
  root((Research map))
    sources[Sources]
      ::icon(fa fa-book)
      :::reference important
      docs["`**Official docs** & issue reports`"]
      repos{{Repositories}}
        Mermaid
        Mermaid ASCII
        Beautiful Mermaid
    findings(Findings)
      syntax))Syntax parity((
      safety)Offline safety(
      gaps{{Named divergences}}
    evidence["`Unicode evidence: naïve café, 東京, مرحبا`"]
```

Expected labels: none declared

### portfolio:mindmap:47

browser API, SVG. PeleError: There can be only one root. No parent could be found for ("accDescr: A broad operational map with more than eleven second-level nodes")

Pinned Mermaid rejected this source. This is a retained legacy/invalid-input outcome, excluded from the secondary positive authored-label admission score.

Oracle caveat: portfolio:mindmap:47: pinned Mermaid rejected source (There can be only one root. No parent could be found for ("accDescr: A broad operational map with more than eleven second-level nodes"))

```mermaid
mindmap
  accTitle: Incident response command map
  accDescr: A broad operational map with more than eleven second-level nodes
  root((Production incident))
    Detection
      Alerts
      Customer reports
    Triage
      Severity
      Scope
    Containment
      Feature flags
      Traffic shift
    Investigation
      Logs
      Traces
    Communications
      Status page
      Stakeholders
    Recovery
      Rollback
      Data repair
    Validation
      Synthetic checks
      Error budget
    Follow-up
      Timeline
      Action items
    Security
      Credentials
      Audit trail
    Vendors
      Cloud provider
      Payment processor
    Legal
      Notification duties
      Evidence hold
    Support
      Response macros
      Escalations
    Analytics
      Impact estimate
      Cohort analysis
```

Expected labels: none declared

## quadrant

### corpus:mermaid-upstream-suite-bench:quadrant-upstream-should-be-able-to-handle-constructor-as-a-classname

Node API, SVG. PeleError: style named fill is not supported.

Pinned Mermaid rejected this source. This is a retained legacy/invalid-input outcome, excluded from the secondary positive authored-label admission score.

Oracle caveat: corpus:mermaid-upstream-suite-bench:quadrant-upstream-should-be-able-to-handle-constructor-as-a-classname: pinned Mermaid rejected source (style named fill is not supported.)

```mermaid
quadrantChart
    classDef constructor fill:#ff0000
    Microsoft:::constructor: [0.75, 0.75]
```

Expected labels: none declared

### corpus:mermaid-upstream-suite-bench:quadrant-upstream-should-be-able-to-handle-constructor-as-a-classname

browser API, SVG. PeleError: style named fill is not supported.

Pinned Mermaid rejected this source. This is a retained legacy/invalid-input outcome, excluded from the secondary positive authored-label admission score.

Oracle caveat: corpus:mermaid-upstream-suite-bench:quadrant-upstream-should-be-able-to-handle-constructor-as-a-classname: pinned Mermaid rejected source (style named fill is not supported.)

```mermaid
quadrantChart
    classDef constructor fill:#ff0000
    Microsoft:::constructor: [0.75, 0.75]
```

Expected labels: none declared

## sequence

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-not-hang-when-as-is-used-without-a-space-before-the-alias-text

Node API, SVG. PeleError: Parse error on line 2:           participant X_AutoPublishable asAAAAAAAAAAAAA:AAAAAAAAAAAAA ----------------------^ Expecting 'ACTOR', got 'INVALID'

Pinned Mermaid rejected this source. This is a retained legacy/invalid-input outcome, excluded from the secondary positive authored-label admission score.

Oracle caveat: corpus:mermaid-upstream-suite-bench:sequence-upstream-should-not-hang-when-as-is-used-without-a-space-before-the-alias-text: pinned Mermaid rejected source (Parse error on line 2:)

```mermaid
sequenceDiagram
          participant X_AutoPublishable asAAAAAAAAAAAAA:AAAAAAAAAAAAA
```

Expected labels: none declared

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-not-hang-when-as-is-used-without-a-space-before-the-alias-text

browser API, SVG. PeleError: Parse error on line 2:           participant X_AutoPublishable asAAAAAAAAAAAAA:AAAAAAAAAAAAA ----------------------^ Expecting 'ACTOR', got 'INVALID'

Pinned Mermaid rejected this source. This is a retained legacy/invalid-input outcome, excluded from the secondary positive authored-label admission score.

Oracle caveat: corpus:mermaid-upstream-suite-bench:sequence-upstream-should-not-hang-when-as-is-used-without-a-space-before-the-alias-text: pinned Mermaid rejected source (Parse error on line 2:)

```mermaid
sequenceDiagram
          participant X_AutoPublishable asAAAAAAAAAAAAA:AAAAAAAAAAAAA
```

Expected labels: none declared

## state

### corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-arrow-directions-definitions

Node API, SVG. PeleError: Parse error on line 3:     //     [*] -up-> First ---------------^ Expecting '$end', 'NL', 'ID', 'HIDE_EMPTY', 'scale', 'COMPOSIT_STATE', 'STATE_DESCR', 'FORK', 'JOIN', 'CHOICE', 'CONCURRENT', 'note', 'acc_title', 'acc_descr', 'acc_descr_multiline_value', 'CLICK', 'classDef', 'style', 'class', 'direction_tb', 'direction_bt', 'direction_rl', 'direction_lr', 'EDGE_STATE', got 'INVALID'

Pinned Mermaid rejected this source. This is a retained legacy/invalid-input outcome, excluded from the secondary positive authored-label admission score.

Oracle caveat: corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-arrow-directions-definitions: pinned Mermaid rejected source (Parse error on line 3:)

```mermaid
stateDiagram-v2

    //     [*] -up-> First
    //     First -right-> Second
    //     Second --> Third
    //     Third -left-> Last
    //
```

Expected labels: none declared

### corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-arrow-directions-definitions-2

Node API, SVG. PeleError: Parse error on line 3:     //     [*] -up-> First ---------------^ Expecting '$end', 'NL', 'ID', 'HIDE_EMPTY', 'scale', 'COMPOSIT_STATE', 'STATE_DESCR', 'FORK', 'JOIN', 'CHOICE', 'CONCURRENT', 'note', 'acc_title', 'acc_descr', 'acc_descr_multiline_value', 'CLICK', 'classDef', 'style', 'class', 'direction_tb', 'direction_bt', 'direction_rl', 'direction_lr', 'EDGE_STATE', got 'INVALID'

Pinned Mermaid rejected this source. This is a retained legacy/invalid-input outcome, excluded from the secondary positive authored-label admission score.

Oracle caveat: corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-arrow-directions-definitions-2: pinned Mermaid rejected source (Parse error on line 3:)

```mermaid
stateDiagram

    //     [*] -up-> First
    //     First -right-> Second
    //     Second --> Third
    //     Third -left-> Last
    //
```

Expected labels: none declared

### corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-arrow-directions-definitions

browser API, SVG. PeleError: Parse error on line 3:     //     [*] -up-> First ---------------^ Expecting '$end', 'NL', 'ID', 'HIDE_EMPTY', 'scale', 'COMPOSIT_STATE', 'STATE_DESCR', 'FORK', 'JOIN', 'CHOICE', 'CONCURRENT', 'note', 'acc_title', 'acc_descr', 'acc_descr_multiline_value', 'CLICK', 'classDef', 'style', 'class', 'direction_tb', 'direction_bt', 'direction_rl', 'direction_lr', 'EDGE_STATE', got 'INVALID'

Pinned Mermaid rejected this source. This is a retained legacy/invalid-input outcome, excluded from the secondary positive authored-label admission score.

Oracle caveat: corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-arrow-directions-definitions: pinned Mermaid rejected source (Parse error on line 3:)

```mermaid
stateDiagram-v2

    //     [*] -up-> First
    //     First -right-> Second
    //     Second --> Third
    //     Third -left-> Last
    //
```

Expected labels: none declared

### corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-arrow-directions-definitions-2

browser API, SVG. PeleError: Parse error on line 3:     //     [*] -up-> First ---------------^ Expecting '$end', 'NL', 'ID', 'HIDE_EMPTY', 'scale', 'COMPOSIT_STATE', 'STATE_DESCR', 'FORK', 'JOIN', 'CHOICE', 'CONCURRENT', 'note', 'acc_title', 'acc_descr', 'acc_descr_multiline_value', 'CLICK', 'classDef', 'style', 'class', 'direction_tb', 'direction_bt', 'direction_rl', 'direction_lr', 'EDGE_STATE', got 'INVALID'

Pinned Mermaid rejected this source. This is a retained legacy/invalid-input outcome, excluded from the secondary positive authored-label admission score.

Oracle caveat: corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-arrow-directions-definitions-2: pinned Mermaid rejected source (Parse error on line 3:)

```mermaid
stateDiagram

    //     [*] -up-> First
    //     First -right-> Second
    //     Second --> Third
    //     Third -left-> Last
    //
```

Expected labels: none declared

## treemap

### scaling:treemap:20-groups-240-leaves

Node API, SVG. Error: Missing authored label: Investment 0.0; Missing authored label: Investment 0.1; Missing authored label: Investment 0.2; Missing authored label: Investment 0.3; Missing authored label: Investment 0.4; Missing authored label: Investment 0.5; Missing authored label: Investment 0.6; Missing authored label: Investment 0.7; Missing authored label: Investment 0.8; Missing authored label: Investment 0.9; Missing authored label: Investment 0.10; Missing authored label: Investment 0.11; Missing authored label: Investment 1.0; Missing authored label: Investment 1.1; Missing authored label: Investment 1.2; Missing authored label: Investment 1.3; Missing authored label: Investment 1.4; Missing authored label: Investment 1.5; Missing authored label: Investment 1.6; Missing authored label: Investment 1.7; Missing authored label: Investment 1.8; Missing authored label: Investment 1.9; Missing authored label: Investment 1.10; Missing authored label: Investment 1.11; Missing authored label: Investment 2.0; Missing authored label: Investment 2.1; Missing authored label: Investment 2.2; Missing authored label: Investment 2.3; Missing authored label: Investment 2.4; Missing authored label: Investment 2.5; Missing authored label: Investment 2.6; Missing authored label: Investment 2.7; Missing authored label: Investment 2.8; Missing authored label: Investment 2.9; Missing authored label: Investment 2.10; Missing authored label: Investment 2.11; Missing authored label: Investment 3.0; Missing authored label: Investment 3.1; Missing authored label: Investment 3.2; Missing authored label: Investment 3.3; Missing authored label: Investment 3.4; Missing authored label: Investment 3.5; Missing authored label: Investment 3.6; Missing authored label: Investment 3.7; Missing authored label: Investment 3.8; Missing authored label: Investment 3.9; Missing authored label: Investment 3.10; Missing authored label: Investment 3.11; Missing authored label: Investment 4.0; Missing authored label: Investment 4.1; Missing authored label: Investment 4.2; Missing authored label: Investment 4.3; Missing authored label: Investment 4.4; Missing authored label: Investment 4.5; Missing authored label: Investment 4.6; Missing authored label: Investment 4.7; Missing authored label: Investment 4.8; Missing authored label: Investment 4.9; Missing authored label: Investment 4.10; Missing authored label: Investment 4.11; Missing authored label: Investment 5.0; Missing authored label: Investment 5.1; Missing authored label: Investment 5.2; Missing authored label: Investment 5.3; Missing authored label: Investment 5.4; Missing authored label: Investment 5.5; Missing authored label: Investment 5.6; Missing authored label: Investment 5.7; Missing authored label: Investment 5.8; Missing authored label: Investment 5.9; Missing authored label: Investment 5.10; Missing authored label: Investment 5.11; Missing authored label: Investment 6.0; Missing authored label: Investment 6.1; Missing authored label: Investment 6.2; Missing authored label: Investment 6.3; Missing authored label: Investment 6.4; Missing authored label: Investment 6.5; Missing authored label: Investment 6.6; Missing authored label: Investment 6.7; Missing authored label: Investment 6.8; Missing authored label: Investment 6.9; Missing authored label: Investment 6.10; Missing authored label: Investment 6.11; Missing authored label: Investment 7.0; Missing authored label: Investment 7.1; Missing authored label: Investment 7.2; Missing authored label: Investment 7.3; Missing authored label: Investment 7.4; Missing authored label: Investment 7.5; Missing authored label: Investment 7.6; Missing authored label: Investment 7.7; Missing authored label: Investment 7.8; Missing authored label: Investment 7.9; Missing authored label: Investment 7.10; Missing authored label: Investment 7.11; Missing authored label: Investment 8.0; Missing authored label: Investment 8.1; Missing authored label: Investment 8.2; Missing authored label: Investment 8.3; Missing authored label: Investment 8.4; Missing authored label: Investment 8.5; Missing authored label: Investment 8.6; Missing authored label: Investment 8.7; Missing authored label: Investment 8.8; Missing authored label: Investment 8.9; Missing authored label: Investment 8.10; Missing authored label: Investment 8.11; Missing authored label: Investment 9.0; Missing authored label: Investment 9.1; Missing authored label: Investment 9.2; Missing authored label: Investment 9.3; Missing authored label: Investment 9.4; Missing authored label: Investment 9.5; Missing authored label: Investment 9.6; Missing authored label: Investment 9.7; Missing authored label: Investment 9.8; Missing authored label: Investment 9.9; Missing authored label: Investment 9.10; Missing authored label: Investment 9.11; Missing authored label: Investment 10.0; Missing authored label: Investment 10.1; Missing authored label: Investment 10.2; Missing authored label: Investment 10.3; Missing authored label: Investment 10.4; Missing authored label: Investment 10.5; Missing authored label: Investment 10.6; Missing authored label: Investment 10.7; Missing authored label: Investment 10.8; Missing authored label: Investment 10.9; Missing authored label: Investment 10.10; Missing authored label: Investment 10.11; Missing authored label: Investment 11.0; Missing authored label: Investment 11.1; Missing authored label: Investment 11.2; Missing authored label: Investment 11.3; Missing authored label: Investment 11.4; Missing authored label: Investment 11.5; Missing authored label: Investment 11.6; Missing authored label: Investment 11.7; Missing authored label: Investment 11.8; Missing authored label: Investment 11.9; Missing authored label: Investment 11.10; Missing authored label: Investment 11.11; Missing authored label: Investment 12.0; Missing authored label: Investment 12.1; Missing authored label: Investment 12.2; Missing authored label: Investment 12.3; Missing authored label: Investment 12.4; Missing authored label: Investment 12.5; Missing authored label: Investment 12.6; Missing authored label: Investment 12.7; Missing authored label: Investment 12.8; Missing authored label: Investment 12.9; Missing authored label: Investment 12.10; Missing authored label: Investment 12.11; Missing authored label: Investment 13.0; Missing authored label: Investment 13.1; Missing authored label: Investment 13.2; Missing authored label: Investment 13.3; Missing authored label: Investment 13.4; Missing authored label: Investment 13.5; Missing authored label: Investment 13.6; Missing authored label: Investment 13.7; Missing authored label: Investment 13.8; Missing authored label: Investment 13.9; Missing authored label: Investment 13.10; Missing authored label: Investment 13.11; Missing authored label: Investment 14.0; Missing authored label: Investment 14.1; Missing authored label: Investment 14.2; Missing authored label: Investment 14.3; Missing authored label: Investment 14.4; Missing authored label: Investment 14.5; Missing authored label: Investment 14.6; Missing authored label: Investment 14.7; Missing authored label: Investment 14.8; Missing authored label: Investment 14.9; Missing authored label: Investment 14.10; Missing authored label: Investment 14.11; Missing authored label: Investment 15.0; Missing authored label: Investment 15.1; Missing authored label: Investment 15.2; Missing authored label: Investment 15.3; Missing authored label: Investment 15.4; Missing authored label: Investment 15.5; Missing authored label: Investment 15.6; Missing authored label: Investment 15.7; Missing authored label: Investment 15.8; Missing authored label: Investment 15.9; Missing authored label: Investment 15.10; Missing authored label: Investment 15.11; Missing authored label: Investment 16.0; Missing authored label: Investment 16.1; Missing authored label: Investment 16.2; Missing authored label: Investment 16.3; Missing authored label: Investment 16.4; Missing authored label: Investment 16.5; Missing authored label: Investment 16.6; Missing authored label: Investment 16.7; Missing authored label: Investment 16.8; Missing authored label: Investment 16.9; Missing authored label: Investment 16.10; Missing authored label: Investment 16.11; Missing authored label: Investment 17.0; Missing authored label: Investment 17.1; Missing authored label: Investment 17.2; Missing authored label: Investment 17.3; Missing authored label: Investment 17.4; Missing authored label: Investment 17.5; Missing authored label: Investment 17.6; Missing authored label: Investment 17.7; Missing authored label: Investment 17.8; Missing authored label: Investment 17.9; Missing authored label: Investment 17.10; Missing authored label: Investment 17.11; Missing authored label: Investment 18.0; Missing authored label: Investment 18.1; Missing authored label: Investment 18.2; Missing authored label: Investment 18.3; Missing authored label: Investment 18.4; Missing authored label: Investment 18.5; Missing authored label: Investment 18.6; Missing authored label: Investment 18.7; Missing authored label: Investment 18.8; Missing authored label: Investment 18.9; Missing authored label: Investment 18.10; Missing authored label: Investment 18.11; Missing authored label: Investment 19.0; Missing authored label: Investment 19.1; Missing authored label: Investment 19.2; Missing authored label: Investment 19.3; Missing authored label: Investment 19.4; Missing authored label: Investment 19.5; Missing authored label: Investment 19.6; Missing authored label: Investment 19.7; Missing authored label: Investment 19.8; Missing authored label: Investment 19.9; Missing authored label: Investment 19.10; Missing authored label: Investment 19.11

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
treemap
title Product allocation
"Group 0"
  "Investment 0.0": 10
  "Investment 0.1": 20
  "Investment 0.2": 30
  "Investment 0.3": 40
  "Investment 0.4": 50
  "Investment 0.5": 60
  "Investment 0.6": 70
  "Investment 0.7": 80
  "Investment 0.8": 90
  "Investment 0.9": 100
  "Investment 0.10": 110
  "Investment 0.11": 120
"Group 1"
  "Investment 1.0": 10
  "Investment 1.1": 20
  "Investment 1.2": 30
  "Investment 1.3": 40
  "Investment 1.4": 50
  "Investment 1.5": 60
  "Investment 1.6": 70
  "Investment 1.7": 80
  "Investment 1.8": 90
  "Investment 1.9": 100
  "Investment 1.10": 110
  "Investment 1.11": 120
"Group 2"
  "Investment 2.0": 10
  "Investment 2.1": 20
  "Investment 2.2": 30
  "Investment 2.3": 40
  "Investment 2.4": 50
  "Investment 2.5": 60
  "Investment 2.6": 70
  "Investment 2.7": 80
  "Investment 2.8": 90
  "Investment 2.9": 100
  "Investment 2.10": 110
  "Investment 2.11": 120
"Group 3"
  "Investment 3.0": 10
  "Investment 3.1": 20
  "Investment 3.2": 30
  "Investment 3.3": 40
  "Investment 3.4": 50
  "Investment 3.5": 60
  "Investment 3.6": 70
  "Investment 3.7": 80
  "Investment 3.8": 90
  "Investment 3.9": 100
  "Investment 3.10": 110
  "Investment 3.11": 120
"Group 4"
  "Investment 4.0": 10
  "Investment 4.1": 20
  "Investment 4.2": 30
  "Investment 4.3": 40
  "Investment 4.4": 50
  "Investment 4.5": 60
  "Investment 4.6": 70
  "Investment 4.7": 80
  "Investment 4.8": 90
  "Investment 4.9": 100
  "Investment 4.10": 110
  "Investment 4.11": 120
"Group 5"
  "Investment 5.0": 10
  "Investment 5.1": 20
  "Investment 5.2": 30
  "Investment 5.3": 40
  "Investment 5.4": 50
  "Investment 5.5": 60
  "Investment 5.6": 70
  "Investment 5.7": 80
  "Investment 5.8": 90
  "Investment 5.9": 100
  "Investment 5.10": 110
  "Investment 5.11": 120
"Group 6"
  "Investment 6.0": 10
  "Investment 6.1": 20
  "Investment 6.2": 30
  "Investment 6.3": 40
  "Investment 6.4": 50
  "Investment 6.5": 60
  "Investment 6.6": 70
  "Investment 6.7": 80
  "Investment 6.8": 90
  "Investment 6.9": 100
  "Investment 6.10": 110
  "Investment 6.11": 120
"Group 7"
  "Investment 7.0": 10
  "Investment 7.1": 20
  "Investment 7.2": 30
  "Investment 7.3": 40
  "Investment 7.4": 50
  "Investment 7.5": 60
  "Investment 7.6": 70
  "Investment 7.7": 80
  "Investment 7.8": 90
  "Investment 7.9": 100
  "Investment 7.10": 110
  "Investment 7.11": 120
"Group 8"
  "Investment 8.0": 10
  "Investment 8.1": 20
  "Investment 8.2": 30
  "Investment 8.3": 40
  "Investment 8.4": 50
  "Investment 8.5": 60
  "Investment 8.6": 70
  "Investment 8.7": 80
  "Investment 8.8": 90
  "Investment 8.9": 100
  "Investment 8.10": 110
  "Investment 8.11": 120
"Group 9"
  "Investment 9.0": 10
  "Investment 9.1": 20
  "Investment 9.2": 30
  "Investment 9.3": 40
  "Investment 9.4": 50
  "Investment 9.5": 60
  "Investment 9.6": 70
  "Investment 9.7": 80
  "Investment 9.8": 90
  "Investment 9.9": 100
  "Investment 9.10": 110
  "Investment 9.11": 120
"Group 10"
  "Investment 10.0": 10
  "Investment 10.1": 20
  "Investment 10.2": 30
  "Investment 10.3": 40
  "Investment 10.4": 50
  "Investment 10.5": 60
  "Investment 10.6": 70
  "Investment 10.7": 80
  "Investment 10.8": 90
  "Investment 10.9": 100
  "Investment 10.10": 110
  "Investment 10.11": 120
"Group 11"
  "Investment 11.0": 10
  "Investment 11.1": 20
  "Investment 11.2": 30
  "Investment 11.3": 40
  "Investment 11.4": 50
  "Investment 11.5": 60
  "Investment 11.6": 70
  "Investment 11.7": 80
  "Investment 11.8": 90
  "Investment 11.9": 100
  "Investment 11.10": 110
  "Investment 11.11": 120
"Group 12"
  "Investment 12.0": 10
  "Investment 12.1": 20
  "Investment 12.2": 30
  "Investment 12.3": 40
  "Investment 12.4": 50
  "Investment 12.5": 60
  "Investment 12.6": 70
  "Investment 12.7": 80
  "Investment 12.8": 90
  "Investment 12.9": 100
  "Investment 12.10": 110
  "Investment 12.11": 120
"Group 13"
  "Investment 13.0": 10
  "Investment 13.1": 20
  "Investment 13.2": 30
  "Investment 13.3": 40
  "Investment 13.4": 50
  "Investment 13.5": 60
  "Investment 13.6": 70
  "Investment 13.7": 80
  "Investment 13.8": 90
  "Investment 13.9": 100
  "Investment 13.10": 110
  "Investment 13.11": 120
"Group 14"
  "Investment 14.0": 10
  "Investment 14.1": 20
  "Investment 14.2": 30
  "Investment 14.3": 40
  "Investment 14.4": 50
  "Investment 14.5": 60
  "Investment 14.6": 70
  "Investment 14.7": 80
  "Investment 14.8": 90
  "Investment 14.9": 100
  "Investment 14.10": 110
  "Investment 14.11": 120
"Group 15"
  "Investment 15.0": 10
  "Investment 15.1": 20
  "Investment 15.2": 30
  "Investment 15.3": 40
  "Investment 15.4": 50
  "Investment 15.5": 60
  "Investment 15.6": 70
  "Investment 15.7": 80
  "Investment 15.8": 90
  "Investment 15.9": 100
  "Investment 15.10": 110
  "Investment 15.11": 120
"Group 16"
  "Investment 16.0": 10
  "Investment 16.1": 20
  "Investment 16.2": 30
  "Investment 16.3": 40
  "Investment 16.4": 50
  "Investment 16.5": 60
  "Investment 16.6": 70
  "Investment 16.7": 80
  "Investment 16.8": 90
  "Investment 16.9": 100
  "Investment 16.10": 110
  "Investment 16.11": 120
"Group 17"
  "Investment 17.0": 10
  "Investment 17.1": 20
  "Investment 17.2": 30
  "Investment 17.3": 40
  "Investment 17.4": 50
  "Investment 17.5": 60
  "Investment 17.6": 70
  "Investment 17.7": 80
  "Investment 17.8": 90
  "Investment 17.9": 100
  "Investment 17.10": 110
  "Investment 17.11": 120
"Group 18"
  "Investment 18.0": 10
  "Investment 18.1": 20
  "Investment 18.2": 30
  "Investment 18.3": 40
  "Investment 18.4": 50
  "Investment 18.5": 60
  "Investment 18.6": 70
  "Investment 18.7": 80
  "Investment 18.8": 90
  "Investment 18.9": 100
  "Investment 18.10": 110
  "Investment 18.11": 120
"Group 19"
  "Investment 19.0": 10
  "Investment 19.1": 20
  "Investment 19.2": 30
  "Investment 19.3": 40
  "Investment 19.4": 50
  "Investment 19.5": 60
  "Investment 19.6": 70
  "Investment 19.7": 80
  "Investment 19.8": 90
  "Investment 19.9": 100
  "Investment 19.10": 110
  "Investment 19.11": 120
```

Expected labels: `Product allocation`, `Group 0`, `Investment 0.0`, `Investment 0.1`, `Investment 0.2`, `Investment 0.3`, `Investment 0.4`, `Investment 0.5`, `Investment 0.6`, `Investment 0.7`, `Investment 0.8`, `Investment 0.9`, `Investment 0.10`, `Investment 0.11`, `Group 1`, `Investment 1.0`, `Investment 1.1`, `Investment 1.2`, `Investment 1.3`, `Investment 1.4`, `Investment 1.5`, `Investment 1.6`, `Investment 1.7`, `Investment 1.8`, `Investment 1.9`, `Investment 1.10`, `Investment 1.11`, `Group 2`, `Investment 2.0`, `Investment 2.1`, `Investment 2.2`, `Investment 2.3`, `Investment 2.4`, `Investment 2.5`, `Investment 2.6`, `Investment 2.7`, `Investment 2.8`, `Investment 2.9`, `Investment 2.10`, `Investment 2.11`, `Group 3`, `Investment 3.0`, `Investment 3.1`, `Investment 3.2`, `Investment 3.3`, `Investment 3.4`, `Investment 3.5`, `Investment 3.6`, `Investment 3.7`, `Investment 3.8`, `Investment 3.9`, `Investment 3.10`, `Investment 3.11`, `Group 4`, `Investment 4.0`, `Investment 4.1`, `Investment 4.2`, `Investment 4.3`, `Investment 4.4`, `Investment 4.5`, `Investment 4.6`, `Investment 4.7`, `Investment 4.8`, `Investment 4.9`, `Investment 4.10`, `Investment 4.11`, `Group 5`, `Investment 5.0`, `Investment 5.1`, `Investment 5.2`, `Investment 5.3`, `Investment 5.4`, `Investment 5.5`, `Investment 5.6`, `Investment 5.7`, `Investment 5.8`, `Investment 5.9`, `Investment 5.10`, `Investment 5.11`, `Group 6`, `Investment 6.0`, `Investment 6.1`, `Investment 6.2`, `Investment 6.3`, `Investment 6.4`, `Investment 6.5`, `Investment 6.6`, `Investment 6.7`, `Investment 6.8`, `Investment 6.9`, `Investment 6.10`, `Investment 6.11`, `Group 7`, `Investment 7.0`, `Investment 7.1`, `Investment 7.2`, `Investment 7.3`, `Investment 7.4`, `Investment 7.5`, `Investment 7.6`, `Investment 7.7`, `Investment 7.8`, `Investment 7.9`, `Investment 7.10`, `Investment 7.11`, `Group 8`, `Investment 8.0`, `Investment 8.1`, `Investment 8.2`, `Investment 8.3`, `Investment 8.4`, `Investment 8.5`, `Investment 8.6`, `Investment 8.7`, `Investment 8.8`, `Investment 8.9`, `Investment 8.10`, `Investment 8.11`, `Group 9`, `Investment 9.0`, `Investment 9.1`, `Investment 9.2`, `Investment 9.3`, `Investment 9.4`, `Investment 9.5`, `Investment 9.6`, `Investment 9.7`, `Investment 9.8`, `Investment 9.9`, `Investment 9.10`, `Investment 9.11`, `Group 10`, `Investment 10.0`, `Investment 10.1`, `Investment 10.2`, `Investment 10.3`, `Investment 10.4`, `Investment 10.5`, `Investment 10.6`, `Investment 10.7`, `Investment 10.8`, `Investment 10.9`, `Investment 10.10`, `Investment 10.11`, `Group 11`, `Investment 11.0`, `Investment 11.1`, `Investment 11.2`, `Investment 11.3`, `Investment 11.4`, `Investment 11.5`, `Investment 11.6`, `Investment 11.7`, `Investment 11.8`, `Investment 11.9`, `Investment 11.10`, `Investment 11.11`, `Group 12`, `Investment 12.0`, `Investment 12.1`, `Investment 12.2`, `Investment 12.3`, `Investment 12.4`, `Investment 12.5`, `Investment 12.6`, `Investment 12.7`, `Investment 12.8`, `Investment 12.9`, `Investment 12.10`, `Investment 12.11`, `Group 13`, `Investment 13.0`, `Investment 13.1`, `Investment 13.2`, `Investment 13.3`, `Investment 13.4`, `Investment 13.5`, `Investment 13.6`, `Investment 13.7`, `Investment 13.8`, `Investment 13.9`, `Investment 13.10`, `Investment 13.11`, `Group 14`, `Investment 14.0`, `Investment 14.1`, `Investment 14.2`, `Investment 14.3`, `Investment 14.4`, `Investment 14.5`, `Investment 14.6`, `Investment 14.7`, `Investment 14.8`, `Investment 14.9`, `Investment 14.10`, `Investment 14.11`, `Group 15`, `Investment 15.0`, `Investment 15.1`, `Investment 15.2`, `Investment 15.3`, `Investment 15.4`, `Investment 15.5`, `Investment 15.6`, `Investment 15.7`, `Investment 15.8`, `Investment 15.9`, `Investment 15.10`, `Investment 15.11`, `Group 16`, `Investment 16.0`, `Investment 16.1`, `Investment 16.2`, `Investment 16.3`, `Investment 16.4`, `Investment 16.5`, `Investment 16.6`, `Investment 16.7`, `Investment 16.8`, `Investment 16.9`, `Investment 16.10`, `Investment 16.11`, `Group 17`, `Investment 17.0`, `Investment 17.1`, `Investment 17.2`, `Investment 17.3`, `Investment 17.4`, `Investment 17.5`, `Investment 17.6`, `Investment 17.7`, `Investment 17.8`, `Investment 17.9`, `Investment 17.10`, `Investment 17.11`, `Group 18`, `Investment 18.0`, `Investment 18.1`, `Investment 18.2`, `Investment 18.3`, `Investment 18.4`, `Investment 18.5`, `Investment 18.6`, `Investment 18.7`, `Investment 18.8`, `Investment 18.9`, `Investment 18.10`, `Investment 18.11`, `Group 19`, `Investment 19.0`, `Investment 19.1`, `Investment 19.2`, `Investment 19.3`, `Investment 19.4`, `Investment 19.5`, `Investment 19.6`, `Investment 19.7`, `Investment 19.8`, `Investment 19.9`, `Investment 19.10`, `Investment 19.11`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-treemap-bench:treemap-e2e-15-should-apply-multiple-classdef-properties-simultaneously

Node API, SVG. Error: Missing authored label: Office Supplies

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  treemap-beta "Budget" with two sections (Critical, Normal), each styled
  via a classDef that combines fill, text color, stroke color, and
  stroke-width simultaneously, verifying multiple classDef properties can
  be applied together to a single node.
---
treemap-beta
  "Budget"
    "Critical":::critical
      "Server Costs": 50000
      "Salaries": 80000
    "Normal":::normal
      "Office Supplies": 5000
      "Marketing": 15000

  classDef critical fill:#e74c3c,color:#fff,stroke:#c0392b,stroke-width:3px;
  classDef normal fill:#3498db,color:#fff,stroke:#2980b9,stroke-width:1px;

```

Expected labels: `Budget`, `Critical`, `Server Costs`, `Salaries`, `Normal`, `Office Supplies`, `Marketing`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-treemap-bench:treemap-e2e-8e-should-handle-simple-thousands-separator

Node API, SVG. Error: Missing authored label: New Signups

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  treemap-beta "User Counts" with four large integer leaf values (tens of
  thousands to over a million) and no explicit valueFormat config,
  verifying the default number formatting applies a thousands separator to
  large plain integers.
---
treemap-beta
  "User Counts"
    "Active Users": 1250345
    "New Signups": 45789
    "Churned": 12350
    "Converted": 78975

```

Expected labels: `User Counts`, `Active Users`, `New Signups`, `Churned`, `Converted`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-treemap-bench:treemap-e2e-8g-should-handle-scientific-notation-format

Node API, SVG. Error: Missing authored label: Value 1; Missing authored label: Value 2

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  treemap-beta "Scientific Values" with three leaves spanning very
  different magnitudes (about 1.2 million, a tiny fraction near 0.00001,
  and one billion) with no explicit valueFormat, verifying default
  formatting handles extreme value ranges, including scientific-notation-
  scale numbers, without configuration.
---
treemap-beta
  "Scientific Values"
    "Value 1": 1234567
    "Value 2": 0.0000123
    "Value 3": 1000000000

```

Expected labels: `Scientific Values`, `Value 1`, `Value 2`, `Value 3`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-treemap-bench:treemap-e2e-19-should-render-labels-in-complex-treemap-with-many-nested-blocks

Node API, SVG. Error: Missing authored label: packages/app/src/routes (353); Missing authored label: packages/app/tests (277); Missing authored label: packages/app/tests/e2e (245); Missing authored label: packages/app/tests/common (48); Missing authored label: packages/llm-prompts (29); Missing authored label: packages/emails (26); Missing authored label: packages/app/tests/api (23); Missing authored label: packages/emails/src (18); Missing authored label: packages/emails/src/emails (17); Missing authored label: packages/app/static (15); Missing authored label: packages/llm-prompts/diagram-chat (15); Missing authored label: packages/app/prisma (11); Missing authored label: packages/app/prisma/migrations (11); Missing authored label: packages/llm-prompts/shared (9); Missing authored label: packages/app/static/icons (8); Missing authored label: packages/emails/src/components (8); Missing authored label: packages/app-observability (8); Missing authored label: packages/mermaid-pre-render-server (8); Missing authored label: packages/app/tests/mobile (6); Missing authored label: packages/llm-prompts/diagram-chat/tests (6); Missing authored label: packages/eslint-plugin (6); Missing authored label: packages/eslint-plugin/src (5); Missing authored label: packages/eslint-plugin/src/rules (5); Missing authored label: packages/app/static/img (4); Missing authored label: packages/llm-prompts/tests (4); Missing authored label: packages/llm-prompts/common (3); Missing authored label: packages/mermaid-pre-render-server/tests (3); Missing authored label: packages/mermaid-pre-render-server/tests/e2e (3); Missing authored label: packages/app/tests/seed (2); Missing authored label: packages/llm-prompts/shared/patches (2); Missing authored label: packages/mermaid-pre-render-server/src (2); Missing authored label: packages/app/scripts (1); Missing authored label: packages/llm-prompts/regenerate-diagram (1); Missing authored label: packages/llm-prompts/repair-diagram (1); Missing authored label: packages/app-buildship (1); Missing authored label: packages/app-buildship/src (1); Missing authored label: packages/app-buildship/src/cleanupAssets (1); Missing authored label: packages/icons (1)

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Large, real-world-style treemap-beta with three top-level, emoji-labeled
  sections (High/Medium/Low activity) containing dozens of nested leaf
  nodes representing package and file paths, each with numeric values and
  leaf-level classDef color classes. Exercises label rendering and layout
  for a complex, many-leaf treemap.
---
treemap-beta
  "🔴 High Activity (Top 50%)":::redContainer
    "packages/app (1115)": 15:::redleaf
    "packages/app/src (844)": 12:::redleaf
    "packages/app/src/lib (707)": 11:::redleaf
    "packages/app/src/routes (353)": 7:::redleaf
    "packages/app/tests (277)": 6:::redleaf
    "packages/app/tests/e2e (245)": 6:::redleaf
    "packages/app/tests/common (48)": 4:::redleaf
    "packages/llm-prompts (29)": 3:::redleaf
    "packages/emails (26)": 3:::redleaf
    "packages/app/tests/api (23)": 3:::redleaf
    "packages/emails/src (18)": 3:::redleaf
    "packages/emails/src/emails (17)": 3:::redleaf
    "packages/app/static (15)": 3:::redleaf
    "packages/llm-prompts/diagram-chat (15)": 3:::redleaf
    "packages/app/prisma (11)": 3:::redleaf
    "packages/app/prisma/migrations (11)": 3:::redleaf
    "packages/llm-prompts/shared (9)": 3:::redleaf
    "packages/app/static/icons (8)": 3:::redleaf
    "packages/emails/src/components (8)": 3:::redleaf
    "packages/app-observability (8)": 3:::redleaf
    "packages/mermaid-pre-render-server (8)": 3:::redleaf
  "🟠 Medium Activity (35%)":::orangeContainer
    "packages/app/tests/mobile (6)": 3:::orangeleaf
    "packages/llm-prompts/diagram-chat/tests (6)": 3:::orangeleaf
    "packages/eslint-plugin (6)": 3:::orangeleaf
    "packages/eslint-plugin/src (5)": 3:::orangeleaf
    "packages/eslint-plugin/src/rules (5)": 3:::orangeleaf
    "packages/app/static/img (4)": 3:::orangeleaf
    "packages/llm-prompts/tests (4)": 3:::orangeleaf
    "packages/llm-prompts/common (3)": 3:::orangeleaf
    "packages/mermaid-pre-render-server/tests (3)": 3:::orangeleaf
    "packages/mermaid-pre-render-server/tests/e2e (3)": 3:::orangeleaf
    "packages/app/tests/seed (2)": 3:::orangeleaf
    "packages/llm-prompts/shared/patches (2)": 3:::orangeleaf
    "packages/mermaid-pre-render-server/src (2)": 3:::orangeleaf
    "packages/app/scripts (1)": 3:::orangeleaf
  "🟡 Low Activity (15%)":::yellowContainer
    "packages/llm-prompts/regenerate-diagram (1)": 3:::yellowleaf
    "packages/llm-prompts/repair-diagram (1)": 3:::yellowleaf
    "packages/app-buildship (1)": 3:::yellowleaf
    "packages/app-buildship/src (1)": 3:::yellowleaf
    "packages/app-buildship/src/cleanupAssets (1)": 3:::yellowleaf
    "packages/icons (1)": 3:::yellowleaf

  classDef root fill:#F5BA71
  classDef redContainer fill:#F54927
  classDef orangeContainer fill:#DE8118
  classDef yellowContainer fill:#F5E514

  classDef redleaf fill:#F54927,stroke:none,color:#FFFFFF
  classDef orangeleaf fill:#DE8118,stroke:none,color:#FFFFFF
  classDef yellowleaf fill:#F5E514,stroke:none,color:#333333

```

Expected labels: `🔴 High Activity (Top 50%)`, `packages/app (1115)`, `packages/app/src (844)`, `packages/app/src/lib (707)`, `packages/app/src/routes (353)`, `packages/app/tests (277)`, `packages/app/tests/e2e (245)`, `packages/app/tests/common (48)`, `packages/llm-prompts (29)`, `packages/emails (26)`, `packages/app/tests/api (23)`, `packages/emails/src (18)`, `packages/emails/src/emails (17)`, `packages/app/static (15)`, `packages/llm-prompts/diagram-chat (15)`, `packages/app/prisma (11)`, `packages/app/prisma/migrations (11)`, `packages/llm-prompts/shared (9)`, `packages/app/static/icons (8)`, `packages/emails/src/components (8)`, `packages/app-observability (8)`, `packages/mermaid-pre-render-server (8)`, `🟠 Medium Activity (35%)`, `packages/app/tests/mobile (6)`, `packages/llm-prompts/diagram-chat/tests (6)`, `packages/eslint-plugin (6)`, `packages/eslint-plugin/src (5)`, `packages/eslint-plugin/src/rules (5)`, `packages/app/static/img (4)`, `packages/llm-prompts/tests (4)`, `packages/llm-prompts/common (3)`, `packages/mermaid-pre-render-server/tests (3)`, `packages/mermaid-pre-render-server/tests/e2e (3)`, `packages/app/tests/seed (2)`, `packages/llm-prompts/shared/patches (2)`, `packages/mermaid-pre-render-server/src (2)`, `packages/app/scripts (1)`, `🟡 Low Activity (15%)`, `packages/llm-prompts/regenerate-diagram (1)`, `packages/llm-prompts/repair-diagram (1)`, `packages/app-buildship (1)`, `packages/app-buildship/src (1)`, `packages/app-buildship/src/cleanupAssets (1)`, `packages/icons (1)`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### scaling:treemap:20-groups-240-leaves

browser API, SVG. Missing authored label: Investment 0.0; Missing authored label: Investment 0.1; Missing authored label: Investment 0.2; Missing authored label: Investment 0.3; Missing authored label: Investment 0.4; Missing authored label: Investment 0.5; Missing authored label: Investment 0.6; Missing authored label: Investment 0.7; Missing authored label: Investment 0.8; Missing authored label: Investment 0.9; Missing authored label: Investment 0.10; Missing authored label: Investment 0.11; Missing authored label: Investment 1.0; Missing authored label: Investment 1.1; Missing authored label: Investment 1.2; Missing authored label: Investment 1.3; Missing authored label: Investment 1.4; Missing authored label: Investment 1.5; Missing authored label: Investment 1.6; Missing authored label: Investment 1.7; Missing authored label: Investment 1.8; Missing authored label: Investment 1.9; Missing authored label: Investment 1.10; Missing authored label: Investment 1.11; Missing authored label: Investment 2.0; Missing authored label: Investment 2.1; Missing authored label: Investment 2.2; Missing authored label: Investment 2.3; Missing authored label: Investment 2.4; Missing authored label: Investment 2.5; Missing authored label: Investment 2.6; Missing authored label: Investment 2.7; Missing authored label: Investment 2.8; Missing authored label: Investment 2.9; Missing authored label: Investment 2.10; Missing authored label: Investment 2.11; Missing authored label: Investment 3.0; Missing authored label: Investment 3.1; Missing authored label: Investment 3.2; Missing authored label: Investment 3.3; Missing authored label: Investment 3.4; Missing authored label: Investment 3.5; Missing authored label: Investment 3.6; Missing authored label: Investment 3.7; Missing authored label: Investment 3.8; Missing authored label: Investment 3.9; Missing authored label: Investment 3.10; Missing authored label: Investment 3.11; Missing authored label: Investment 4.0; Missing authored label: Investment 4.1; Missing authored label: Investment 4.2; Missing authored label: Investment 4.3; Missing authored label: Investment 4.4; Missing authored label: Investment 4.5; Missing authored label: Investment 4.6; Missing authored label: Investment 4.7; Missing authored label: Investment 4.8; Missing authored label: Investment 4.9; Missing authored label: Investment 4.10; Missing authored label: Investment 4.11; Missing authored label: Investment 5.0; Missing authored label: Investment 5.1; Missing authored label: Investment 5.2; Missing authored label: Investment 5.3; Missing authored label: Investment 5.4; Missing authored label: Investment 5.5; Missing authored label: Investment 5.6; Missing authored label: Investment 5.7; Missing authored label: Investment 5.8; Missing authored label: Investment 5.9; Missing authored label: Investment 5.10; Missing authored label: Investment 5.11; Missing authored label: Investment 6.0; Missing authored label: Investment 6.1; Missing authored label: Investment 6.2; Missing authored label: Investment 6.3; Missing authored label: Investment 6.4; Missing authored label: Investment 6.5; Missing authored label: Investment 6.6; Missing authored label: Investment 6.7; Missing authored label: Investment 6.8; Missing authored label: Investment 6.9; Missing authored label: Investment 6.10; Missing authored label: Investment 6.11; Missing authored label: Investment 7.0; Missing authored label: Investment 7.1; Missing authored label: Investment 7.2; Missing authored label: Investment 7.3; Missing authored label: Investment 7.4; Missing authored label: Investment 7.5; Missing authored label: Investment 7.6; Missing authored label: Investment 7.7; Missing authored label: Investment 7.8; Missing authored label: Investment 7.9; Missing authored label: Investment 7.10; Missing authored label: Investment 7.11; Missing authored label: Investment 8.0; Missing authored label: Investment 8.1; Missing authored label: Investment 8.2; Missing authored label: Investment 8.3; Missing authored label: Investment 8.4; Missing authored label: Investment 8.5; Missing authored label: Investment 8.6; Missing authored label: Investment 8.7; Missing authored label: Investment 8.8; Missing authored label: Investment 8.9; Missing authored label: Investment 8.10; Missing authored label: Investment 8.11; Missing authored label: Investment 9.0; Missing authored label: Investment 9.1; Missing authored label: Investment 9.2; Missing authored label: Investment 9.3; Missing authored label: Investment 9.4; Missing authored label: Investment 9.5; Missing authored label: Investment 9.6; Missing authored label: Investment 9.7; Missing authored label: Investment 9.8; Missing authored label: Investment 9.9; Missing authored label: Investment 9.10; Missing authored label: Investment 9.11; Missing authored label: Investment 10.0; Missing authored label: Investment 10.1; Missing authored label: Investment 10.2; Missing authored label: Investment 10.3; Missing authored label: Investment 10.4; Missing authored label: Investment 10.5; Missing authored label: Investment 10.6; Missing authored label: Investment 10.7; Missing authored label: Investment 10.8; Missing authored label: Investment 10.9; Missing authored label: Investment 10.10; Missing authored label: Investment 10.11; Missing authored label: Investment 11.0; Missing authored label: Investment 11.1; Missing authored label: Investment 11.2; Missing authored label: Investment 11.3; Missing authored label: Investment 11.4; Missing authored label: Investment 11.5; Missing authored label: Investment 11.6; Missing authored label: Investment 11.7; Missing authored label: Investment 11.8; Missing authored label: Investment 11.9; Missing authored label: Investment 11.10; Missing authored label: Investment 11.11; Missing authored label: Investment 12.0; Missing authored label: Investment 12.1; Missing authored label: Investment 12.2; Missing authored label: Investment 12.3; Missing authored label: Investment 12.4; Missing authored label: Investment 12.5; Missing authored label: Investment 12.6; Missing authored label: Investment 12.7; Missing authored label: Investment 12.8; Missing authored label: Investment 12.9; Missing authored label: Investment 12.10; Missing authored label: Investment 12.11; Missing authored label: Investment 13.0; Missing authored label: Investment 13.1; Missing authored label: Investment 13.2; Missing authored label: Investment 13.3; Missing authored label: Investment 13.4; Missing authored label: Investment 13.5; Missing authored label: Investment 13.6; Missing authored label: Investment 13.7; Missing authored label: Investment 13.8; Missing authored label: Investment 13.9; Missing authored label: Investment 13.10; Missing authored label: Investment 13.11; Missing authored label: Investment 14.0; Missing authored label: Investment 14.1; Missing authored label: Investment 14.2; Missing authored label: Investment 14.3; Missing authored label: Investment 14.4; Missing authored label: Investment 14.5; Missing authored label: Investment 14.6; Missing authored label: Investment 14.7; Missing authored label: Investment 14.8; Missing authored label: Investment 14.9; Missing authored label: Investment 14.10; Missing authored label: Investment 14.11; Missing authored label: Investment 15.0; Missing authored label: Investment 15.1; Missing authored label: Investment 15.2; Missing authored label: Investment 15.3; Missing authored label: Investment 15.4; Missing authored label: Investment 15.5; Missing authored label: Investment 15.6; Missing authored label: Investment 15.7; Missing authored label: Investment 15.8; Missing authored label: Investment 15.9; Missing authored label: Investment 15.10; Missing authored label: Investment 15.11; Missing authored label: Investment 16.0; Missing authored label: Investment 16.1; Missing authored label: Investment 16.2; Missing authored label: Investment 16.3; Missing authored label: Investment 16.4; Missing authored label: Investment 16.5; Missing authored label: Investment 16.6; Missing authored label: Investment 16.7; Missing authored label: Investment 16.8; Missing authored label: Investment 16.9; Missing authored label: Investment 16.10; Missing authored label: Investment 16.11; Missing authored label: Investment 17.0; Missing authored label: Investment 17.1; Missing authored label: Investment 17.2; Missing authored label: Investment 17.3; Missing authored label: Investment 17.4; Missing authored label: Investment 17.5; Missing authored label: Investment 17.6; Missing authored label: Investment 17.7; Missing authored label: Investment 17.8; Missing authored label: Investment 17.9; Missing authored label: Investment 17.10; Missing authored label: Investment 17.11; Missing authored label: Investment 18.0; Missing authored label: Investment 18.1; Missing authored label: Investment 18.2; Missing authored label: Investment 18.3; Missing authored label: Investment 18.4; Missing authored label: Investment 18.5; Missing authored label: Investment 18.6; Missing authored label: Investment 18.7; Missing authored label: Investment 18.8; Missing authored label: Investment 18.9; Missing authored label: Investment 18.10; Missing authored label: Investment 18.11; Missing authored label: Investment 19.0; Missing authored label: Investment 19.1; Missing authored label: Investment 19.2; Missing authored label: Investment 19.3; Missing authored label: Investment 19.4; Missing authored label: Investment 19.5; Missing authored label: Investment 19.6; Missing authored label: Investment 19.7; Missing authored label: Investment 19.8; Missing authored label: Investment 19.9; Missing authored label: Investment 19.10; Missing authored label: Investment 19.11

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
treemap
title Product allocation
"Group 0"
  "Investment 0.0": 10
  "Investment 0.1": 20
  "Investment 0.2": 30
  "Investment 0.3": 40
  "Investment 0.4": 50
  "Investment 0.5": 60
  "Investment 0.6": 70
  "Investment 0.7": 80
  "Investment 0.8": 90
  "Investment 0.9": 100
  "Investment 0.10": 110
  "Investment 0.11": 120
"Group 1"
  "Investment 1.0": 10
  "Investment 1.1": 20
  "Investment 1.2": 30
  "Investment 1.3": 40
  "Investment 1.4": 50
  "Investment 1.5": 60
  "Investment 1.6": 70
  "Investment 1.7": 80
  "Investment 1.8": 90
  "Investment 1.9": 100
  "Investment 1.10": 110
  "Investment 1.11": 120
"Group 2"
  "Investment 2.0": 10
  "Investment 2.1": 20
  "Investment 2.2": 30
  "Investment 2.3": 40
  "Investment 2.4": 50
  "Investment 2.5": 60
  "Investment 2.6": 70
  "Investment 2.7": 80
  "Investment 2.8": 90
  "Investment 2.9": 100
  "Investment 2.10": 110
  "Investment 2.11": 120
"Group 3"
  "Investment 3.0": 10
  "Investment 3.1": 20
  "Investment 3.2": 30
  "Investment 3.3": 40
  "Investment 3.4": 50
  "Investment 3.5": 60
  "Investment 3.6": 70
  "Investment 3.7": 80
  "Investment 3.8": 90
  "Investment 3.9": 100
  "Investment 3.10": 110
  "Investment 3.11": 120
"Group 4"
  "Investment 4.0": 10
  "Investment 4.1": 20
  "Investment 4.2": 30
  "Investment 4.3": 40
  "Investment 4.4": 50
  "Investment 4.5": 60
  "Investment 4.6": 70
  "Investment 4.7": 80
  "Investment 4.8": 90
  "Investment 4.9": 100
  "Investment 4.10": 110
  "Investment 4.11": 120
"Group 5"
  "Investment 5.0": 10
  "Investment 5.1": 20
  "Investment 5.2": 30
  "Investment 5.3": 40
  "Investment 5.4": 50
  "Investment 5.5": 60
  "Investment 5.6": 70
  "Investment 5.7": 80
  "Investment 5.8": 90
  "Investment 5.9": 100
  "Investment 5.10": 110
  "Investment 5.11": 120
"Group 6"
  "Investment 6.0": 10
  "Investment 6.1": 20
  "Investment 6.2": 30
  "Investment 6.3": 40
  "Investment 6.4": 50
  "Investment 6.5": 60
  "Investment 6.6": 70
  "Investment 6.7": 80
  "Investment 6.8": 90
  "Investment 6.9": 100
  "Investment 6.10": 110
  "Investment 6.11": 120
"Group 7"
  "Investment 7.0": 10
  "Investment 7.1": 20
  "Investment 7.2": 30
  "Investment 7.3": 40
  "Investment 7.4": 50
  "Investment 7.5": 60
  "Investment 7.6": 70
  "Investment 7.7": 80
  "Investment 7.8": 90
  "Investment 7.9": 100
  "Investment 7.10": 110
  "Investment 7.11": 120
"Group 8"
  "Investment 8.0": 10
  "Investment 8.1": 20
  "Investment 8.2": 30
  "Investment 8.3": 40
  "Investment 8.4": 50
  "Investment 8.5": 60
  "Investment 8.6": 70
  "Investment 8.7": 80
  "Investment 8.8": 90
  "Investment 8.9": 100
  "Investment 8.10": 110
  "Investment 8.11": 120
"Group 9"
  "Investment 9.0": 10
  "Investment 9.1": 20
  "Investment 9.2": 30
  "Investment 9.3": 40
  "Investment 9.4": 50
  "Investment 9.5": 60
  "Investment 9.6": 70
  "Investment 9.7": 80
  "Investment 9.8": 90
  "Investment 9.9": 100
  "Investment 9.10": 110
  "Investment 9.11": 120
"Group 10"
  "Investment 10.0": 10
  "Investment 10.1": 20
  "Investment 10.2": 30
  "Investment 10.3": 40
  "Investment 10.4": 50
  "Investment 10.5": 60
  "Investment 10.6": 70
  "Investment 10.7": 80
  "Investment 10.8": 90
  "Investment 10.9": 100
  "Investment 10.10": 110
  "Investment 10.11": 120
"Group 11"
  "Investment 11.0": 10
  "Investment 11.1": 20
  "Investment 11.2": 30
  "Investment 11.3": 40
  "Investment 11.4": 50
  "Investment 11.5": 60
  "Investment 11.6": 70
  "Investment 11.7": 80
  "Investment 11.8": 90
  "Investment 11.9": 100
  "Investment 11.10": 110
  "Investment 11.11": 120
"Group 12"
  "Investment 12.0": 10
  "Investment 12.1": 20
  "Investment 12.2": 30
  "Investment 12.3": 40
  "Investment 12.4": 50
  "Investment 12.5": 60
  "Investment 12.6": 70
  "Investment 12.7": 80
  "Investment 12.8": 90
  "Investment 12.9": 100
  "Investment 12.10": 110
  "Investment 12.11": 120
"Group 13"
  "Investment 13.0": 10
  "Investment 13.1": 20
  "Investment 13.2": 30
  "Investment 13.3": 40
  "Investment 13.4": 50
  "Investment 13.5": 60
  "Investment 13.6": 70
  "Investment 13.7": 80
  "Investment 13.8": 90
  "Investment 13.9": 100
  "Investment 13.10": 110
  "Investment 13.11": 120
"Group 14"
  "Investment 14.0": 10
  "Investment 14.1": 20
  "Investment 14.2": 30
  "Investment 14.3": 40
  "Investment 14.4": 50
  "Investment 14.5": 60
  "Investment 14.6": 70
  "Investment 14.7": 80
  "Investment 14.8": 90
  "Investment 14.9": 100
  "Investment 14.10": 110
  "Investment 14.11": 120
"Group 15"
  "Investment 15.0": 10
  "Investment 15.1": 20
  "Investment 15.2": 30
  "Investment 15.3": 40
  "Investment 15.4": 50
  "Investment 15.5": 60
  "Investment 15.6": 70
  "Investment 15.7": 80
  "Investment 15.8": 90
  "Investment 15.9": 100
  "Investment 15.10": 110
  "Investment 15.11": 120
"Group 16"
  "Investment 16.0": 10
  "Investment 16.1": 20
  "Investment 16.2": 30
  "Investment 16.3": 40
  "Investment 16.4": 50
  "Investment 16.5": 60
  "Investment 16.6": 70
  "Investment 16.7": 80
  "Investment 16.8": 90
  "Investment 16.9": 100
  "Investment 16.10": 110
  "Investment 16.11": 120
"Group 17"
  "Investment 17.0": 10
  "Investment 17.1": 20
  "Investment 17.2": 30
  "Investment 17.3": 40
  "Investment 17.4": 50
  "Investment 17.5": 60
  "Investment 17.6": 70
  "Investment 17.7": 80
  "Investment 17.8": 90
  "Investment 17.9": 100
  "Investment 17.10": 110
  "Investment 17.11": 120
"Group 18"
  "Investment 18.0": 10
  "Investment 18.1": 20
  "Investment 18.2": 30
  "Investment 18.3": 40
  "Investment 18.4": 50
  "Investment 18.5": 60
  "Investment 18.6": 70
  "Investment 18.7": 80
  "Investment 18.8": 90
  "Investment 18.9": 100
  "Investment 18.10": 110
  "Investment 18.11": 120
"Group 19"
  "Investment 19.0": 10
  "Investment 19.1": 20
  "Investment 19.2": 30
  "Investment 19.3": 40
  "Investment 19.4": 50
  "Investment 19.5": 60
  "Investment 19.6": 70
  "Investment 19.7": 80
  "Investment 19.8": 90
  "Investment 19.9": 100
  "Investment 19.10": 110
  "Investment 19.11": 120
```

Expected labels: `Product allocation`, `Group 0`, `Investment 0.0`, `Investment 0.1`, `Investment 0.2`, `Investment 0.3`, `Investment 0.4`, `Investment 0.5`, `Investment 0.6`, `Investment 0.7`, `Investment 0.8`, `Investment 0.9`, `Investment 0.10`, `Investment 0.11`, `Group 1`, `Investment 1.0`, `Investment 1.1`, `Investment 1.2`, `Investment 1.3`, `Investment 1.4`, `Investment 1.5`, `Investment 1.6`, `Investment 1.7`, `Investment 1.8`, `Investment 1.9`, `Investment 1.10`, `Investment 1.11`, `Group 2`, `Investment 2.0`, `Investment 2.1`, `Investment 2.2`, `Investment 2.3`, `Investment 2.4`, `Investment 2.5`, `Investment 2.6`, `Investment 2.7`, `Investment 2.8`, `Investment 2.9`, `Investment 2.10`, `Investment 2.11`, `Group 3`, `Investment 3.0`, `Investment 3.1`, `Investment 3.2`, `Investment 3.3`, `Investment 3.4`, `Investment 3.5`, `Investment 3.6`, `Investment 3.7`, `Investment 3.8`, `Investment 3.9`, `Investment 3.10`, `Investment 3.11`, `Group 4`, `Investment 4.0`, `Investment 4.1`, `Investment 4.2`, `Investment 4.3`, `Investment 4.4`, `Investment 4.5`, `Investment 4.6`, `Investment 4.7`, `Investment 4.8`, `Investment 4.9`, `Investment 4.10`, `Investment 4.11`, `Group 5`, `Investment 5.0`, `Investment 5.1`, `Investment 5.2`, `Investment 5.3`, `Investment 5.4`, `Investment 5.5`, `Investment 5.6`, `Investment 5.7`, `Investment 5.8`, `Investment 5.9`, `Investment 5.10`, `Investment 5.11`, `Group 6`, `Investment 6.0`, `Investment 6.1`, `Investment 6.2`, `Investment 6.3`, `Investment 6.4`, `Investment 6.5`, `Investment 6.6`, `Investment 6.7`, `Investment 6.8`, `Investment 6.9`, `Investment 6.10`, `Investment 6.11`, `Group 7`, `Investment 7.0`, `Investment 7.1`, `Investment 7.2`, `Investment 7.3`, `Investment 7.4`, `Investment 7.5`, `Investment 7.6`, `Investment 7.7`, `Investment 7.8`, `Investment 7.9`, `Investment 7.10`, `Investment 7.11`, `Group 8`, `Investment 8.0`, `Investment 8.1`, `Investment 8.2`, `Investment 8.3`, `Investment 8.4`, `Investment 8.5`, `Investment 8.6`, `Investment 8.7`, `Investment 8.8`, `Investment 8.9`, `Investment 8.10`, `Investment 8.11`, `Group 9`, `Investment 9.0`, `Investment 9.1`, `Investment 9.2`, `Investment 9.3`, `Investment 9.4`, `Investment 9.5`, `Investment 9.6`, `Investment 9.7`, `Investment 9.8`, `Investment 9.9`, `Investment 9.10`, `Investment 9.11`, `Group 10`, `Investment 10.0`, `Investment 10.1`, `Investment 10.2`, `Investment 10.3`, `Investment 10.4`, `Investment 10.5`, `Investment 10.6`, `Investment 10.7`, `Investment 10.8`, `Investment 10.9`, `Investment 10.10`, `Investment 10.11`, `Group 11`, `Investment 11.0`, `Investment 11.1`, `Investment 11.2`, `Investment 11.3`, `Investment 11.4`, `Investment 11.5`, `Investment 11.6`, `Investment 11.7`, `Investment 11.8`, `Investment 11.9`, `Investment 11.10`, `Investment 11.11`, `Group 12`, `Investment 12.0`, `Investment 12.1`, `Investment 12.2`, `Investment 12.3`, `Investment 12.4`, `Investment 12.5`, `Investment 12.6`, `Investment 12.7`, `Investment 12.8`, `Investment 12.9`, `Investment 12.10`, `Investment 12.11`, `Group 13`, `Investment 13.0`, `Investment 13.1`, `Investment 13.2`, `Investment 13.3`, `Investment 13.4`, `Investment 13.5`, `Investment 13.6`, `Investment 13.7`, `Investment 13.8`, `Investment 13.9`, `Investment 13.10`, `Investment 13.11`, `Group 14`, `Investment 14.0`, `Investment 14.1`, `Investment 14.2`, `Investment 14.3`, `Investment 14.4`, `Investment 14.5`, `Investment 14.6`, `Investment 14.7`, `Investment 14.8`, `Investment 14.9`, `Investment 14.10`, `Investment 14.11`, `Group 15`, `Investment 15.0`, `Investment 15.1`, `Investment 15.2`, `Investment 15.3`, `Investment 15.4`, `Investment 15.5`, `Investment 15.6`, `Investment 15.7`, `Investment 15.8`, `Investment 15.9`, `Investment 15.10`, `Investment 15.11`, `Group 16`, `Investment 16.0`, `Investment 16.1`, `Investment 16.2`, `Investment 16.3`, `Investment 16.4`, `Investment 16.5`, `Investment 16.6`, `Investment 16.7`, `Investment 16.8`, `Investment 16.9`, `Investment 16.10`, `Investment 16.11`, `Group 17`, `Investment 17.0`, `Investment 17.1`, `Investment 17.2`, `Investment 17.3`, `Investment 17.4`, `Investment 17.5`, `Investment 17.6`, `Investment 17.7`, `Investment 17.8`, `Investment 17.9`, `Investment 17.10`, `Investment 17.11`, `Group 18`, `Investment 18.0`, `Investment 18.1`, `Investment 18.2`, `Investment 18.3`, `Investment 18.4`, `Investment 18.5`, `Investment 18.6`, `Investment 18.7`, `Investment 18.8`, `Investment 18.9`, `Investment 18.10`, `Investment 18.11`, `Group 19`, `Investment 19.0`, `Investment 19.1`, `Investment 19.2`, `Investment 19.3`, `Investment 19.4`, `Investment 19.5`, `Investment 19.6`, `Investment 19.7`, `Investment 19.8`, `Investment 19.9`, `Investment 19.10`, `Investment 19.11`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-treemap-bench:treemap-e2e-15-should-apply-multiple-classdef-properties-simultaneously

browser API, SVG. Missing authored label: Office Supplies

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  treemap-beta "Budget" with two sections (Critical, Normal), each styled
  via a classDef that combines fill, text color, stroke color, and
  stroke-width simultaneously, verifying multiple classDef properties can
  be applied together to a single node.
---
treemap-beta
  "Budget"
    "Critical":::critical
      "Server Costs": 50000
      "Salaries": 80000
    "Normal":::normal
      "Office Supplies": 5000
      "Marketing": 15000

  classDef critical fill:#e74c3c,color:#fff,stroke:#c0392b,stroke-width:3px;
  classDef normal fill:#3498db,color:#fff,stroke:#2980b9,stroke-width:1px;

```

Expected labels: `Budget`, `Critical`, `Server Costs`, `Salaries`, `Normal`, `Office Supplies`, `Marketing`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-treemap-bench:treemap-e2e-8e-should-handle-simple-thousands-separator

browser API, SVG. Missing authored label: New Signups

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  treemap-beta "User Counts" with four large integer leaf values (tens of
  thousands to over a million) and no explicit valueFormat config,
  verifying the default number formatting applies a thousands separator to
  large plain integers.
---
treemap-beta
  "User Counts"
    "Active Users": 1250345
    "New Signups": 45789
    "Churned": 12350
    "Converted": 78975

```

Expected labels: `User Counts`, `Active Users`, `New Signups`, `Churned`, `Converted`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-treemap-bench:treemap-e2e-8g-should-handle-scientific-notation-format

browser API, SVG. Missing authored label: Value 1; Missing authored label: Value 2

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  treemap-beta "Scientific Values" with three leaves spanning very
  different magnitudes (about 1.2 million, a tiny fraction near 0.00001,
  and one billion) with no explicit valueFormat, verifying default
  formatting handles extreme value ranges, including scientific-notation-
  scale numbers, without configuration.
---
treemap-beta
  "Scientific Values"
    "Value 1": 1234567
    "Value 2": 0.0000123
    "Value 3": 1000000000

```

Expected labels: `Scientific Values`, `Value 1`, `Value 2`, `Value 3`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-treemap-bench:treemap-e2e-19-should-render-labels-in-complex-treemap-with-many-nested-blocks

browser API, SVG. Missing authored label: packages/app/src/routes (353); Missing authored label: packages/app/tests (277); Missing authored label: packages/app/tests/e2e (245); Missing authored label: packages/app/tests/common (48); Missing authored label: packages/llm-prompts (29); Missing authored label: packages/emails (26); Missing authored label: packages/app/tests/api (23); Missing authored label: packages/emails/src (18); Missing authored label: packages/emails/src/emails (17); Missing authored label: packages/app/static (15); Missing authored label: packages/llm-prompts/diagram-chat (15); Missing authored label: packages/app/prisma (11); Missing authored label: packages/app/prisma/migrations (11); Missing authored label: packages/llm-prompts/shared (9); Missing authored label: packages/app/static/icons (8); Missing authored label: packages/emails/src/components (8); Missing authored label: packages/app-observability (8); Missing authored label: packages/mermaid-pre-render-server (8); Missing authored label: packages/app/tests/mobile (6); Missing authored label: packages/llm-prompts/diagram-chat/tests (6); Missing authored label: packages/eslint-plugin (6); Missing authored label: packages/eslint-plugin/src (5); Missing authored label: packages/eslint-plugin/src/rules (5); Missing authored label: packages/app/static/img (4); Missing authored label: packages/llm-prompts/tests (4); Missing authored label: packages/llm-prompts/common (3); Missing authored label: packages/mermaid-pre-render-server/tests (3); Missing authored label: packages/mermaid-pre-render-server/tests/e2e (3); Missing authored label: packages/app/tests/seed (2); Missing authored label: packages/llm-prompts/shared/patches (2); Missing authored label: packages/mermaid-pre-render-server/src (2); Missing authored label: packages/app/scripts (1); Missing authored label: packages/llm-prompts/regenerate-diagram (1); Missing authored label: packages/llm-prompts/repair-diagram (1); Missing authored label: packages/app-buildship (1); Missing authored label: packages/app-buildship/src (1); Missing authored label: packages/app-buildship/src/cleanupAssets (1); Missing authored label: packages/icons (1)

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Large, real-world-style treemap-beta with three top-level, emoji-labeled
  sections (High/Medium/Low activity) containing dozens of nested leaf
  nodes representing package and file paths, each with numeric values and
  leaf-level classDef color classes. Exercises label rendering and layout
  for a complex, many-leaf treemap.
---
treemap-beta
  "🔴 High Activity (Top 50%)":::redContainer
    "packages/app (1115)": 15:::redleaf
    "packages/app/src (844)": 12:::redleaf
    "packages/app/src/lib (707)": 11:::redleaf
    "packages/app/src/routes (353)": 7:::redleaf
    "packages/app/tests (277)": 6:::redleaf
    "packages/app/tests/e2e (245)": 6:::redleaf
    "packages/app/tests/common (48)": 4:::redleaf
    "packages/llm-prompts (29)": 3:::redleaf
    "packages/emails (26)": 3:::redleaf
    "packages/app/tests/api (23)": 3:::redleaf
    "packages/emails/src (18)": 3:::redleaf
    "packages/emails/src/emails (17)": 3:::redleaf
    "packages/app/static (15)": 3:::redleaf
    "packages/llm-prompts/diagram-chat (15)": 3:::redleaf
    "packages/app/prisma (11)": 3:::redleaf
    "packages/app/prisma/migrations (11)": 3:::redleaf
    "packages/llm-prompts/shared (9)": 3:::redleaf
    "packages/app/static/icons (8)": 3:::redleaf
    "packages/emails/src/components (8)": 3:::redleaf
    "packages/app-observability (8)": 3:::redleaf
    "packages/mermaid-pre-render-server (8)": 3:::redleaf
  "🟠 Medium Activity (35%)":::orangeContainer
    "packages/app/tests/mobile (6)": 3:::orangeleaf
    "packages/llm-prompts/diagram-chat/tests (6)": 3:::orangeleaf
    "packages/eslint-plugin (6)": 3:::orangeleaf
    "packages/eslint-plugin/src (5)": 3:::orangeleaf
    "packages/eslint-plugin/src/rules (5)": 3:::orangeleaf
    "packages/app/static/img (4)": 3:::orangeleaf
    "packages/llm-prompts/tests (4)": 3:::orangeleaf
    "packages/llm-prompts/common (3)": 3:::orangeleaf
    "packages/mermaid-pre-render-server/tests (3)": 3:::orangeleaf
    "packages/mermaid-pre-render-server/tests/e2e (3)": 3:::orangeleaf
    "packages/app/tests/seed (2)": 3:::orangeleaf
    "packages/llm-prompts/shared/patches (2)": 3:::orangeleaf
    "packages/mermaid-pre-render-server/src (2)": 3:::orangeleaf
    "packages/app/scripts (1)": 3:::orangeleaf
  "🟡 Low Activity (15%)":::yellowContainer
    "packages/llm-prompts/regenerate-diagram (1)": 3:::yellowleaf
    "packages/llm-prompts/repair-diagram (1)": 3:::yellowleaf
    "packages/app-buildship (1)": 3:::yellowleaf
    "packages/app-buildship/src (1)": 3:::yellowleaf
    "packages/app-buildship/src/cleanupAssets (1)": 3:::yellowleaf
    "packages/icons (1)": 3:::yellowleaf

  classDef root fill:#F5BA71
  classDef redContainer fill:#F54927
  classDef orangeContainer fill:#DE8118
  classDef yellowContainer fill:#F5E514

  classDef redleaf fill:#F54927,stroke:none,color:#FFFFFF
  classDef orangeleaf fill:#DE8118,stroke:none,color:#FFFFFF
  classDef yellowleaf fill:#F5E514,stroke:none,color:#333333

```

Expected labels: `🔴 High Activity (Top 50%)`, `packages/app (1115)`, `packages/app/src (844)`, `packages/app/src/lib (707)`, `packages/app/src/routes (353)`, `packages/app/tests (277)`, `packages/app/tests/e2e (245)`, `packages/app/tests/common (48)`, `packages/llm-prompts (29)`, `packages/emails (26)`, `packages/app/tests/api (23)`, `packages/emails/src (18)`, `packages/emails/src/emails (17)`, `packages/app/static (15)`, `packages/llm-prompts/diagram-chat (15)`, `packages/app/prisma (11)`, `packages/app/prisma/migrations (11)`, `packages/llm-prompts/shared (9)`, `packages/app/static/icons (8)`, `packages/emails/src/components (8)`, `packages/app-observability (8)`, `packages/mermaid-pre-render-server (8)`, `🟠 Medium Activity (35%)`, `packages/app/tests/mobile (6)`, `packages/llm-prompts/diagram-chat/tests (6)`, `packages/eslint-plugin (6)`, `packages/eslint-plugin/src (5)`, `packages/eslint-plugin/src/rules (5)`, `packages/app/static/img (4)`, `packages/llm-prompts/tests (4)`, `packages/llm-prompts/common (3)`, `packages/mermaid-pre-render-server/tests (3)`, `packages/mermaid-pre-render-server/tests/e2e (3)`, `packages/app/tests/seed (2)`, `packages/llm-prompts/shared/patches (2)`, `packages/mermaid-pre-render-server/src (2)`, `packages/app/scripts (1)`, `🟡 Low Activity (15%)`, `packages/llm-prompts/regenerate-diagram (1)`, `packages/llm-prompts/repair-diagram (1)`, `packages/app-buildship (1)`, `packages/app-buildship/src (1)`, `packages/app-buildship/src/cleanupAssets (1)`, `packages/icons (1)`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

## venn

### docs:venn:2

Node API, SVG. Error: Missing authored label: "Team overlap"

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
venn-beta
  title "Team overlap"
  set Frontend
  set Backend
  union Frontend,Backend["APIs"]

```

Expected labels: `"Team overlap"`, `Frontend`, `Backend`, `APIs`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:venn:2

browser API, SVG. Missing authored label: "Team overlap"

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
venn-beta
  title "Team overlap"
  set Frontend
  set Backend
  union Frontend,Backend["APIs"]

```

Expected labels: `"Team overlap"`, `Frontend`, `Backend`, `APIs`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

## xychart

### scaling:xychart:12-series-80-points

Node API, SVG. Error: Missing authored label: Day 1; Missing authored label: Day 2; Missing authored label: Day 3; Missing authored label: Day 4; Missing authored label: Day 5; Missing authored label: Day 6; Missing authored label: Day 7; Missing authored label: Day 9; Missing authored label: Day 10; Missing authored label: Day 11; Missing authored label: Day 12; Missing authored label: Day 13; Missing authored label: Day 14; Missing authored label: Day 15; Missing authored label: Day 17; Missing authored label: Day 18; Missing authored label: Day 19; Missing authored label: Day 20; Missing authored label: Day 21; Missing authored label: Day 22; Missing authored label: Day 23; Missing authored label: Day 25; Missing authored label: Day 26; Missing authored label: Day 27; Missing authored label: Day 28; Missing authored label: Day 29; Missing authored label: Day 30; Missing authored label: Day 31; Missing authored label: Day 33; Missing authored label: Day 34; Missing authored label: Day 35; Missing authored label: Day 36; Missing authored label: Day 37; Missing authored label: Day 38; Missing authored label: Day 39; Missing authored label: Day 41; Missing authored label: Day 42; Missing authored label: Day 43; Missing authored label: Day 44; Missing authored label: Day 45; Missing authored label: Day 46; Missing authored label: Day 47; Missing authored label: Day 49; Missing authored label: Day 50; Missing authored label: Day 51; Missing authored label: Day 52; Missing authored label: Day 53; Missing authored label: Day 54; Missing authored label: Day 55; Missing authored label: Day 57; Missing authored label: Day 58; Missing authored label: Day 59; Missing authored label: Day 60; Missing authored label: Day 61; Missing authored label: Day 62; Missing authored label: Day 63; Missing authored label: Day 65; Missing authored label: Day 66; Missing authored label: Day 67; Missing authored label: Day 68; Missing authored label: Day 69; Missing authored label: Day 70; Missing authored label: Day 71; Missing authored label: Day 73; Missing authored label: Day 74; Missing authored label: Day 75; Missing authored label: Day 76; Missing authored label: Day 77; Missing authored label: Day 78; Missing authored label: Day 79

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart-beta
  title "Load over time"
  x-axis ["Day 0", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7", "Day 8", "Day 9", "Day 10", "Day 11", "Day 12", "Day 13", "Day 14", "Day 15", "Day 16", "Day 17", "Day 18", "Day 19", "Day 20", "Day 21", "Day 22", "Day 23", "Day 24", "Day 25", "Day 26", "Day 27", "Day 28", "Day 29", "Day 30", "Day 31", "Day 32", "Day 33", "Day 34", "Day 35", "Day 36", "Day 37", "Day 38", "Day 39", "Day 40", "Day 41", "Day 42", "Day 43", "Day 44", "Day 45", "Day 46", "Day 47", "Day 48", "Day 49", "Day 50", "Day 51", "Day 52", "Day 53", "Day 54", "Day 55", "Day 56", "Day 57", "Day 58", "Day 59", "Day 60", "Day 61", "Day 62", "Day 63", "Day 64", "Day 65", "Day 66", "Day 67", "Day 68", "Day 69", "Day 70", "Day 71", "Day 72", "Day 73", "Day 74", "Day 75", "Day 76", "Day 77", "Day 78", "Day 79"]
  y-axis "Load" 0 --> 100
  line [10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83]
  line [13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86]
  line [16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89]
  line [19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12]
  line [22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15]
  line [25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18]
  line [28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21]
  line [31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24]
  line [34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27]
  line [37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30]
  line [40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33]
  line [43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36]
```

Expected labels: `Load over time`, `Day 0`, `Day 1`, `Day 2`, `Day 3`, `Day 4`, `Day 5`, `Day 6`, `Day 7`, `Day 8`, `Day 9`, `Day 10`, `Day 11`, `Day 12`, `Day 13`, `Day 14`, `Day 15`, `Day 16`, `Day 17`, `Day 18`, `Day 19`, `Day 20`, `Day 21`, `Day 22`, `Day 23`, `Day 24`, `Day 25`, `Day 26`, `Day 27`, `Day 28`, `Day 29`, `Day 30`, `Day 31`, `Day 32`, `Day 33`, `Day 34`, `Day 35`, `Day 36`, `Day 37`, `Day 38`, `Day 39`, `Day 40`, `Day 41`, `Day 42`, `Day 43`, `Day 44`, `Day 45`, `Day 46`, `Day 47`, `Day 48`, `Day 49`, `Day 50`, `Day 51`, `Day 52`, `Day 53`, `Day 54`, `Day 55`, `Day 56`, `Day 57`, `Day 58`, `Day 59`, `Day 60`, `Day 61`, `Day 62`, `Day 63`, `Day 64`, `Day 65`, `Day 66`, `Day 67`, `Day 68`, `Day 69`, `Day 70`, `Day 71`, `Day 72`, `Day 73`, `Day 74`, `Day 75`, `Day 76`, `Day 77`, `Day 78`, `Day 79`, `Load`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-both-axis-at-once

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
```

Expected labels: `xAxisName`, `yAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-title-of-the-chart-within

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
 title "This is a title"
```

Expected labels: `This is a title`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-title-of-the-chart-without

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
 title oneLinertitle
```

Expected labels: `oneLinertitle`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName
```

Expected labels: `xAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-complete-variant-1

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
 x-axis "this is x axis" [category1, "category 2", category3]
```

Expected labels: `this is x axis`, `category1`, `category 2`, `category3`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-complete-variant-2

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    [  "cat1  with space"  ,   cat2 , cat3]
```

Expected labels: `xAxisName`, `cat1 with space`, `cat2`, `cat3`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-complete-variant-3

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    [  "cat1  with space"  ,   cat2 asdf , cat3]
```

Expected labels: `xAxisName`, `cat1 with space`, `cat2asdf`, `cat3`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-and-category-data

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    [  "cat1"  ,   cat2a  ]
```

Expected labels: `xAxisName`, `cat1`, `cat2a`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-and-range-data

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    45.5   -->   33
```

Expected labels: `xAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-and-range-data-with-only-decimal-part

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    45.5   -->   .34
```

Expected labels: `xAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-with

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
    x-axis "xAxisName has space"
```

Expected labels: `xAxisName has space`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-with-with-spaces

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
   x-axis    "  xAxisName has space   "
```

Expected labels: `xAxisName has space`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-without

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis        xAxisName
```

Expected labels: `xAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-without-axis-name-and-category-data

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis    [  "cat1"  ,   cat2a  ]
```

Expected labels: `cat1`, `cat2a`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-without-axis-name-and-range-data

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

No nonempty authored-label expectation was recorded; a passing render can establish format admission only.

Oracle caveat: corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-without-axis-name-and-range-data: pinned Mermaid returned no nonempty authored label expectations

```mermaid
xychart 
x-axis   45.5   -->   1.34
```

Expected labels: none declared

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
y-axis yAxisName
```

Expected labels: `yAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
    y-axis "yAxisName has space"
```

Expected labels: `yAxisName has space`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with-and-spaces

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
   y-axis    "  yAxisName has space   "
```

Expected labels: `yAxisName has space`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with-range-data

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
y-axis yAxisName    45.5   -->   33
```

Expected labels: `yAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with-range-data-with-only-decimal-part

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
y-axis yAxisName    45.5   -->   .33
```

Expected labels: `yAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with-spaces

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
y-axis        yAxisName
```

Expected labels: `yAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-without-axis-name-with-range-data

Node API, SVG. PeleError: No Plot to render, please provide a plot with some data

No nonempty authored-label expectation was recorded; a passing render can establish format admission only.

Oracle caveat: corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-without-axis-name-with-range-data: pinned Mermaid returned no nonempty authored label expectations

```mermaid
xychart 
y-axis    45.5   -->   33
```

Expected labels: none declared

### scaling:xychart:12-series-80-points

browser API, SVG. Missing authored label: Day 1; Missing authored label: Day 2; Missing authored label: Day 3; Missing authored label: Day 4; Missing authored label: Day 5; Missing authored label: Day 6; Missing authored label: Day 7; Missing authored label: Day 9; Missing authored label: Day 10; Missing authored label: Day 11; Missing authored label: Day 12; Missing authored label: Day 13; Missing authored label: Day 14; Missing authored label: Day 15; Missing authored label: Day 17; Missing authored label: Day 18; Missing authored label: Day 19; Missing authored label: Day 20; Missing authored label: Day 21; Missing authored label: Day 22; Missing authored label: Day 23; Missing authored label: Day 25; Missing authored label: Day 26; Missing authored label: Day 27; Missing authored label: Day 28; Missing authored label: Day 29; Missing authored label: Day 30; Missing authored label: Day 31; Missing authored label: Day 33; Missing authored label: Day 34; Missing authored label: Day 35; Missing authored label: Day 36; Missing authored label: Day 37; Missing authored label: Day 38; Missing authored label: Day 39; Missing authored label: Day 41; Missing authored label: Day 42; Missing authored label: Day 43; Missing authored label: Day 44; Missing authored label: Day 45; Missing authored label: Day 46; Missing authored label: Day 47; Missing authored label: Day 49; Missing authored label: Day 50; Missing authored label: Day 51; Missing authored label: Day 52; Missing authored label: Day 53; Missing authored label: Day 54; Missing authored label: Day 55; Missing authored label: Day 57; Missing authored label: Day 58; Missing authored label: Day 59; Missing authored label: Day 60; Missing authored label: Day 61; Missing authored label: Day 62; Missing authored label: Day 63; Missing authored label: Day 65; Missing authored label: Day 66; Missing authored label: Day 67; Missing authored label: Day 68; Missing authored label: Day 69; Missing authored label: Day 70; Missing authored label: Day 71; Missing authored label: Day 73; Missing authored label: Day 74; Missing authored label: Day 75; Missing authored label: Day 76; Missing authored label: Day 77; Missing authored label: Day 78; Missing authored label: Day 79

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart-beta
  title "Load over time"
  x-axis ["Day 0", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7", "Day 8", "Day 9", "Day 10", "Day 11", "Day 12", "Day 13", "Day 14", "Day 15", "Day 16", "Day 17", "Day 18", "Day 19", "Day 20", "Day 21", "Day 22", "Day 23", "Day 24", "Day 25", "Day 26", "Day 27", "Day 28", "Day 29", "Day 30", "Day 31", "Day 32", "Day 33", "Day 34", "Day 35", "Day 36", "Day 37", "Day 38", "Day 39", "Day 40", "Day 41", "Day 42", "Day 43", "Day 44", "Day 45", "Day 46", "Day 47", "Day 48", "Day 49", "Day 50", "Day 51", "Day 52", "Day 53", "Day 54", "Day 55", "Day 56", "Day 57", "Day 58", "Day 59", "Day 60", "Day 61", "Day 62", "Day 63", "Day 64", "Day 65", "Day 66", "Day 67", "Day 68", "Day 69", "Day 70", "Day 71", "Day 72", "Day 73", "Day 74", "Day 75", "Day 76", "Day 77", "Day 78", "Day 79"]
  y-axis "Load" 0 --> 100
  line [10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83]
  line [13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86]
  line [16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89]
  line [19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12]
  line [22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15]
  line [25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18]
  line [28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21]
  line [31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24]
  line [34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27]
  line [37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30]
  line [40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36, 43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33]
  line [43, 50, 57, 64, 71, 78, 85, 12, 19, 26, 33, 40, 47, 54, 61, 68, 75, 82, 89, 16, 23, 30, 37, 44, 51, 58, 65, 72, 79, 86, 13, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 10, 17, 24, 31, 38, 45, 52, 59, 66, 73, 80, 87, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 11, 18, 25, 32, 39, 46, 53, 60, 67, 74, 81, 88, 15, 22, 29, 36]
```

Expected labels: `Load over time`, `Day 0`, `Day 1`, `Day 2`, `Day 3`, `Day 4`, `Day 5`, `Day 6`, `Day 7`, `Day 8`, `Day 9`, `Day 10`, `Day 11`, `Day 12`, `Day 13`, `Day 14`, `Day 15`, `Day 16`, `Day 17`, `Day 18`, `Day 19`, `Day 20`, `Day 21`, `Day 22`, `Day 23`, `Day 24`, `Day 25`, `Day 26`, `Day 27`, `Day 28`, `Day 29`, `Day 30`, `Day 31`, `Day 32`, `Day 33`, `Day 34`, `Day 35`, `Day 36`, `Day 37`, `Day 38`, `Day 39`, `Day 40`, `Day 41`, `Day 42`, `Day 43`, `Day 44`, `Day 45`, `Day 46`, `Day 47`, `Day 48`, `Day 49`, `Day 50`, `Day 51`, `Day 52`, `Day 53`, `Day 54`, `Day 55`, `Day 56`, `Day 57`, `Day 58`, `Day 59`, `Day 60`, `Day 61`, `Day 62`, `Day 63`, `Day 64`, `Day 65`, `Day 66`, `Day 67`, `Day 68`, `Day 69`, `Day 70`, `Day 71`, `Day 72`, `Day 73`, `Day 74`, `Day 75`, `Day 76`, `Day 77`, `Day 78`, `Day 79`, `Load`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-both-axis-at-once

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
```

Expected labels: `xAxisName`, `yAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-title-of-the-chart-within

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
 title "This is a title"
```

Expected labels: `This is a title`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-title-of-the-chart-without

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
 title oneLinertitle
```

Expected labels: `oneLinertitle`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName
```

Expected labels: `xAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-complete-variant-1

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
 x-axis "this is x axis" [category1, "category 2", category3]
```

Expected labels: `this is x axis`, `category1`, `category 2`, `category3`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-complete-variant-2

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    [  "cat1  with space"  ,   cat2 , cat3]
```

Expected labels: `xAxisName`, `cat1 with space`, `cat2`, `cat3`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-complete-variant-3

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    [  "cat1  with space"  ,   cat2 asdf , cat3]
```

Expected labels: `xAxisName`, `cat1 with space`, `cat2asdf`, `cat3`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-and-category-data

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    [  "cat1"  ,   cat2a  ]
```

Expected labels: `xAxisName`, `cat1`, `cat2a`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-and-range-data

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    45.5   -->   33
```

Expected labels: `xAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-and-range-data-with-only-decimal-part

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    45.5   -->   .34
```

Expected labels: `xAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-with

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
    x-axis "xAxisName has space"
```

Expected labels: `xAxisName has space`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-with-with-spaces

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
   x-axis    "  xAxisName has space   "
```

Expected labels: `xAxisName has space`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-without

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis        xAxisName
```

Expected labels: `xAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-without-axis-name-and-category-data

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis    [  "cat1"  ,   cat2a  ]
```

Expected labels: `cat1`, `cat2a`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-without-axis-name-and-range-data

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

No nonempty authored-label expectation was recorded; a passing render can establish format admission only.

Oracle caveat: corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-without-axis-name-and-range-data: pinned Mermaid returned no nonempty authored label expectations

```mermaid
xychart 
x-axis   45.5   -->   1.34
```

Expected labels: none declared

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
y-axis yAxisName
```

Expected labels: `yAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
    y-axis "yAxisName has space"
```

Expected labels: `yAxisName has space`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with-and-spaces

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
   y-axis    "  yAxisName has space   "
```

Expected labels: `yAxisName has space`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with-range-data

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
y-axis yAxisName    45.5   -->   33
```

Expected labels: `yAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with-range-data-with-only-decimal-part

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
y-axis yAxisName    45.5   -->   .33
```

Expected labels: `yAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with-spaces

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
y-axis        yAxisName
```

Expected labels: `yAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-without-axis-name-with-range-data

browser API, SVG. PeleError: No Plot to render, please provide a plot with some data

No nonempty authored-label expectation was recorded; a passing render can establish format admission only.

Oracle caveat: corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-without-axis-name-with-range-data: pinned Mermaid returned no nonempty authored label expectations

```mermaid
xychart 
y-axis    45.5   -->   33
```

Expected labels: none declared

