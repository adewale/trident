# Dicklesworthstone/frankenmermaid 0.4.0: failures

523 raw failed observations. These include parser rejections and output admission failures; they are not all fidelity defects. Each retained input and oracle caveat remains visible.

[Back to the league table](../README.md)

## agentflow

### docs:agentflow:0

Node API, SVG. Error: Missing authored label: Gather changes; Missing authored label: Analyse diff

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  flow reviewer["Review Agent"]
    changes["Gather changes"]@{ shape: input }
    analyse["Analyse diff"]@{ shape: task }
    lint["run_linter"]@{ shape: tool }
    ok["Clean?"]@{ shape: decision }

    changes --> analyse --> lint --> ok
  end

```

Expected labels: `Review Agent`, `Gather changes`, `Analyse diff`, `run_linter`, `Clean?`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:agentflow:1

Node API, SVG. Error: Missing authored label: Release brief; Missing authored label: Draft the notes; Missing authored label: Tone of voice; Missing authored label: Check the claims

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  brief["Release brief"]@{ shape: input }
  flow writer["Drafting Agent"]
    draft["Draft the notes"]@{ shape: task }
    lookup["changelog_search"]@{ shape: tool }
    guide["Tone of voice"]@{ shape: refdoc }
    draft --> lookup
    draft -.- guide
  end
  flow reviewer["Review Agent"]
    check["Check the claims"]@{ shape: task }
    ok["Accurate?"]@{ shape: decision }
    check --> ok
  end
  publish["Publish"]@{ shape: action }
  brief --> writer
  writer --> reviewer
  ok --> publish

```

Expected labels: `Review Agent`, `Drafting Agent`, `Release brief`, `Draft the notes`, `changelog_search`, `Tone of voice`, `Check the claims`, `Accurate?`, `Publish`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:agentflow:2

Node API, SVG. Error: Missing authored label: Release brief; Missing authored label: Draft the notes; Missing authored label: Tone of voice; Missing authored label: Check the claims

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  theme: default
  look: classic
  layout: dagre
---
agentflow-beta TB
  brief["Release brief"]@{ shape: input }
  flow writer["Drafting Agent"]
    draft["Draft the notes"]@{ shape: task }
    lookup["changelog_search"]@{ shape: tool }
    guide["Tone of voice"]@{ shape: refdoc }
    draft --> lookup
    draft -.- guide
  end
  flow reviewer["Review Agent"]
    check["Check the claims"]@{ shape: task }
    ok["Accurate?"]@{ shape: decision }
    check --> ok
  end
  publish["Publish"]@{ shape: action }
  brief --> writer
  writer --> reviewer
  ok --> publish

```

Expected labels: `Review Agent`, `Drafting Agent`, `Release brief`, `Draft the notes`, `changelog_search`, `Tone of voice`, `Check the claims`, `Accurate?`, `Publish`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:agentflow:3

Node API, SVG. Error: Missing authored label: Draft copy; Missing authored label: Style guide

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta LR
  brief["Brief"]@{ shape: input }
  draft["Draft copy"]@{ shape: task }
  spellcheck["spell_check"]@{ shape: tool }
  guide["Style guide"]@{ shape: refdoc }
  publish["Publish"]@{ shape: action }

  brief --> draft --> spellcheck --> publish
  draft -.- guide

```

Expected labels: `Brief`, `Draft copy`, `spell_check`, `Style guide`, `Publish`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:agentflow:4

Node API, SVG. Error: Missing authored label: Tests pass?; Missing authored label: Ship it; Missing authored label: Fix the build; Missing authored label: Build logs

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  check["Tests pass?"]@{ shape: decision }
  ship["Ship it"]@{ shape: action }
  fix["Fix the build"]@{ shape: task }
  logs["Build logs"]@{ shape: refdoc }

  check -- yes --> ship
  check -- no --> fix
  fix --x check
  fix -.- logs

```

Expected labels: `Tests pass?`, `Ship it`, `Fix the build`, `Build logs`, `yes`, `no`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:agentflow:5

Node API, SVG. Error: Missing authored label: Gather sources; Missing authored label: Compose draft

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  flow team["Content Team"]
    flow researcher["Researcher"]
      gather["Gather sources"]@{ shape: task }
    end

    flow writer["Writer"]
      compose["Compose draft"]@{ shape: task }
    end

    researcher --> writer
  end

```

Expected labels: `Content Team`, `Writer`, `Researcher`, `Gather sources`, `Compose draft`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:agentflow:6

Node API, SVG. Error: Missing authored label: Shared corpus; Missing authored label: Build index

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  global
    corpus["Shared corpus"]@{ shape: refdoc }
  end

  flow summariser["Summariser"]
    summarise["Summarise"]@{ shape: task }
    summarise -.- corpus
  end

  flow indexer["Indexer"]
    index["Build index"]@{ shape: task }
    index -.- corpus
  end

```

Expected labels: `Indexer`, `Summariser`, `Shared corpus`, `Summarise`, `Build index`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:agentflow:7

Node API, SVG. Error: Missing authored label: Receive request

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  flow intake["Intake"]
    receive["Receive request"]@{ shape: input }
  end

  flow processing["Processing"]
    validate["Validate"]@{ shape: task }
    enrich["Enrich"]@{ shape: task }
    validate --> enrich
  end
  processing@{ view: "collapsed" }

  flow output["Output"]
    publish["Publish"]@{ shape: action }
  end

  receive --> validate
  enrich --> publish

```

Expected labels: `Output`, `Processing`, `Intake`, `Receive request`, `Publish`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:agentflow:8

Node API, SVG. Error: Missing authored label: Issue title

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta LR
  connector github["GitHub API"]
  github@{ protocol: "http", endpoint: "https://api.github.com" }

  title["Issue title"]@{ shape: input }
  create["create_issue"]@{ shape: tool, connectorRef: "github.create_issue" }

  title --> create

```

Expected labels: `GitHub API`, `Issue title`, `create_issue`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:agentflow:9

Node API, SVG. Error: Missing authored label: Nordic Brand Guide

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  connector llm["LLM API"]
  llm@{ protocol: "http", endpoint: "https://api.example.com/chat" }

  flow coffee_team["Coffee Team"]
    city["city"]@{ shape: input, value: "Stockholm" }

    flow researcher["Researcher"]
      research["research_location"]@{ shape: tool, params: "city :: String", returns: "Report" }
      write["write_copy"]@{ shape: tool, connectorRef: "llm.chat", returns: "CoffeeCopy" }
      city --> research --> write
    end
    researcher@{ instruction: "Research the city and draft English coffee copy citing sources." }

    flow designer["Designer"]
      render["generate_html"]@{ shape: tool, connectorRef: "llm.chat", returns: "String" }
      brand["Nordic Brand Guide"]@{ shape: refdoc }
      render -.- brand
    end

    researcher --> designer
  end

```

Expected labels: `Coffee Team`, `Designer`, `Researcher`, `LLM API`, `city`, `research_location`, `write_copy`, `generate_html`, `Nordic Brand Guide`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:agentflow:0

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Gather changes, Analyse diff

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  flow reviewer["Review Agent"]
    changes["Gather changes"]@{ shape: input }
    analyse["Analyse diff"]@{ shape: task }
    lint["run_linter"]@{ shape: tool }
    ok["Clean?"]@{ shape: decision }

    changes --> analyse --> lint --> ok
  end

```

Expected labels: `Review Agent`, `Gather changes`, `Analyse diff`, `run_linter`, `Clean?`

### docs:agentflow:1

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Release brief, Draft the notes, Tone of voice, Check the claims

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  brief["Release brief"]@{ shape: input }
  flow writer["Drafting Agent"]
    draft["Draft the notes"]@{ shape: task }
    lookup["changelog_search"]@{ shape: tool }
    guide["Tone of voice"]@{ shape: refdoc }
    draft --> lookup
    draft -.- guide
  end
  flow reviewer["Review Agent"]
    check["Check the claims"]@{ shape: task }
    ok["Accurate?"]@{ shape: decision }
    check --> ok
  end
  publish["Publish"]@{ shape: action }
  brief --> writer
  writer --> reviewer
  ok --> publish

```

Expected labels: `Review Agent`, `Drafting Agent`, `Release brief`, `Draft the notes`, `changelog_search`, `Tone of voice`, `Check the claims`, `Accurate?`, `Publish`

### docs:agentflow:2

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Release brief, Draft the notes, Tone of voice, Check the claims

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  theme: default
  look: classic
  layout: dagre
---
agentflow-beta TB
  brief["Release brief"]@{ shape: input }
  flow writer["Drafting Agent"]
    draft["Draft the notes"]@{ shape: task }
    lookup["changelog_search"]@{ shape: tool }
    guide["Tone of voice"]@{ shape: refdoc }
    draft --> lookup
    draft -.- guide
  end
  flow reviewer["Review Agent"]
    check["Check the claims"]@{ shape: task }
    ok["Accurate?"]@{ shape: decision }
    check --> ok
  end
  publish["Publish"]@{ shape: action }
  brief --> writer
  writer --> reviewer
  ok --> publish

```

Expected labels: `Review Agent`, `Drafting Agent`, `Release brief`, `Draft the notes`, `changelog_search`, `Tone of voice`, `Check the claims`, `Accurate?`, `Publish`

### docs:agentflow:3

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Draft copy, Style guide

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta LR
  brief["Brief"]@{ shape: input }
  draft["Draft copy"]@{ shape: task }
  spellcheck["spell_check"]@{ shape: tool }
  guide["Style guide"]@{ shape: refdoc }
  publish["Publish"]@{ shape: action }

  brief --> draft --> spellcheck --> publish
  draft -.- guide

```

Expected labels: `Brief`, `Draft copy`, `spell_check`, `Style guide`, `Publish`

### docs:agentflow:4

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Tests pass?, Ship it, Fix the build, Build logs

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  check["Tests pass?"]@{ shape: decision }
  ship["Ship it"]@{ shape: action }
  fix["Fix the build"]@{ shape: task }
  logs["Build logs"]@{ shape: refdoc }

  check -- yes --> ship
  check -- no --> fix
  fix --x check
  fix -.- logs

```

Expected labels: `Tests pass?`, `Ship it`, `Fix the build`, `Build logs`, `yes`, `no`

### docs:agentflow:5

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Gather sources, Compose draft

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  flow team["Content Team"]
    flow researcher["Researcher"]
      gather["Gather sources"]@{ shape: task }
    end

    flow writer["Writer"]
      compose["Compose draft"]@{ shape: task }
    end

    researcher --> writer
  end

```

Expected labels: `Content Team`, `Writer`, `Researcher`, `Gather sources`, `Compose draft`

### docs:agentflow:6

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Shared corpus, Build index

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  global
    corpus["Shared corpus"]@{ shape: refdoc }
  end

  flow summariser["Summariser"]
    summarise["Summarise"]@{ shape: task }
    summarise -.- corpus
  end

  flow indexer["Indexer"]
    index["Build index"]@{ shape: task }
    index -.- corpus
  end

```

Expected labels: `Indexer`, `Summariser`, `Shared corpus`, `Summarise`, `Build index`

### docs:agentflow:7

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Receive request

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  flow intake["Intake"]
    receive["Receive request"]@{ shape: input }
  end

  flow processing["Processing"]
    validate["Validate"]@{ shape: task }
    enrich["Enrich"]@{ shape: task }
    validate --> enrich
  end
  processing@{ view: "collapsed" }

  flow output["Output"]
    publish["Publish"]@{ shape: action }
  end

  receive --> validate
  enrich --> publish

```

Expected labels: `Output`, `Processing`, `Intake`, `Receive request`, `Publish`

### docs:agentflow:8

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Issue title

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta LR
  connector github["GitHub API"]
  github@{ protocol: "http", endpoint: "https://api.github.com" }

  title["Issue title"]@{ shape: input }
  create["create_issue"]@{ shape: tool, connectorRef: "github.create_issue" }

  title --> create

```

Expected labels: `GitHub API`, `Issue title`, `create_issue`

### docs:agentflow:9

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Nordic Brand Guide

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  connector llm["LLM API"]
  llm@{ protocol: "http", endpoint: "https://api.example.com/chat" }

  flow coffee_team["Coffee Team"]
    city["city"]@{ shape: input, value: "Stockholm" }

    flow researcher["Researcher"]
      research["research_location"]@{ shape: tool, params: "city :: String", returns: "Report" }
      write["write_copy"]@{ shape: tool, connectorRef: "llm.chat", returns: "CoffeeCopy" }
      city --> research --> write
    end
    researcher@{ instruction: "Research the city and draft English coffee copy citing sources." }

    flow designer["Designer"]
      render["generate_html"]@{ shape: tool, connectorRef: "llm.chat", returns: "String" }
      brand["Nordic Brand Guide"]@{ shape: refdoc }
      render -.- brand
    end

    researcher --> designer
  end

```

Expected labels: `Coffee Team`, `Designer`, `Researcher`, `LLM API`, `city`, `research_location`, `write_copy`, `generate_html`, `Nordic Brand Guide`

### docs:agentflow:0

browser API, SVG. Missing authored label: Gather changes; Missing authored label: Analyse diff

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  flow reviewer["Review Agent"]
    changes["Gather changes"]@{ shape: input }
    analyse["Analyse diff"]@{ shape: task }
    lint["run_linter"]@{ shape: tool }
    ok["Clean?"]@{ shape: decision }

    changes --> analyse --> lint --> ok
  end

```

Expected labels: `Review Agent`, `Gather changes`, `Analyse diff`, `run_linter`, `Clean?`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:agentflow:1

browser API, SVG. Missing authored label: Release brief; Missing authored label: Draft the notes; Missing authored label: Tone of voice; Missing authored label: Check the claims

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  brief["Release brief"]@{ shape: input }
  flow writer["Drafting Agent"]
    draft["Draft the notes"]@{ shape: task }
    lookup["changelog_search"]@{ shape: tool }
    guide["Tone of voice"]@{ shape: refdoc }
    draft --> lookup
    draft -.- guide
  end
  flow reviewer["Review Agent"]
    check["Check the claims"]@{ shape: task }
    ok["Accurate?"]@{ shape: decision }
    check --> ok
  end
  publish["Publish"]@{ shape: action }
  brief --> writer
  writer --> reviewer
  ok --> publish

```

Expected labels: `Review Agent`, `Drafting Agent`, `Release brief`, `Draft the notes`, `changelog_search`, `Tone of voice`, `Check the claims`, `Accurate?`, `Publish`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:agentflow:2

browser API, SVG. Missing authored label: Release brief; Missing authored label: Draft the notes; Missing authored label: Tone of voice; Missing authored label: Check the claims

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  theme: default
  look: classic
  layout: dagre
---
agentflow-beta TB
  brief["Release brief"]@{ shape: input }
  flow writer["Drafting Agent"]
    draft["Draft the notes"]@{ shape: task }
    lookup["changelog_search"]@{ shape: tool }
    guide["Tone of voice"]@{ shape: refdoc }
    draft --> lookup
    draft -.- guide
  end
  flow reviewer["Review Agent"]
    check["Check the claims"]@{ shape: task }
    ok["Accurate?"]@{ shape: decision }
    check --> ok
  end
  publish["Publish"]@{ shape: action }
  brief --> writer
  writer --> reviewer
  ok --> publish

```

Expected labels: `Review Agent`, `Drafting Agent`, `Release brief`, `Draft the notes`, `changelog_search`, `Tone of voice`, `Check the claims`, `Accurate?`, `Publish`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:agentflow:3

browser API, SVG. Missing authored label: Draft copy; Missing authored label: Style guide

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta LR
  brief["Brief"]@{ shape: input }
  draft["Draft copy"]@{ shape: task }
  spellcheck["spell_check"]@{ shape: tool }
  guide["Style guide"]@{ shape: refdoc }
  publish["Publish"]@{ shape: action }

  brief --> draft --> spellcheck --> publish
  draft -.- guide

```

Expected labels: `Brief`, `Draft copy`, `spell_check`, `Style guide`, `Publish`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:agentflow:4

browser API, SVG. Missing authored label: Tests pass?; Missing authored label: Ship it; Missing authored label: Fix the build; Missing authored label: Build logs

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  check["Tests pass?"]@{ shape: decision }
  ship["Ship it"]@{ shape: action }
  fix["Fix the build"]@{ shape: task }
  logs["Build logs"]@{ shape: refdoc }

  check -- yes --> ship
  check -- no --> fix
  fix --x check
  fix -.- logs

```

Expected labels: `Tests pass?`, `Ship it`, `Fix the build`, `Build logs`, `yes`, `no`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:agentflow:5

browser API, SVG. Missing authored label: Gather sources; Missing authored label: Compose draft

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  flow team["Content Team"]
    flow researcher["Researcher"]
      gather["Gather sources"]@{ shape: task }
    end

    flow writer["Writer"]
      compose["Compose draft"]@{ shape: task }
    end

    researcher --> writer
  end

```

Expected labels: `Content Team`, `Writer`, `Researcher`, `Gather sources`, `Compose draft`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:agentflow:6

browser API, SVG. Missing authored label: Shared corpus; Missing authored label: Build index

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  global
    corpus["Shared corpus"]@{ shape: refdoc }
  end

  flow summariser["Summariser"]
    summarise["Summarise"]@{ shape: task }
    summarise -.- corpus
  end

  flow indexer["Indexer"]
    index["Build index"]@{ shape: task }
    index -.- corpus
  end

```

Expected labels: `Indexer`, `Summariser`, `Shared corpus`, `Summarise`, `Build index`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:agentflow:7

browser API, SVG. Missing authored label: Receive request

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  flow intake["Intake"]
    receive["Receive request"]@{ shape: input }
  end

  flow processing["Processing"]
    validate["Validate"]@{ shape: task }
    enrich["Enrich"]@{ shape: task }
    validate --> enrich
  end
  processing@{ view: "collapsed" }

  flow output["Output"]
    publish["Publish"]@{ shape: action }
  end

  receive --> validate
  enrich --> publish

```

Expected labels: `Output`, `Processing`, `Intake`, `Receive request`, `Publish`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:agentflow:8

browser API, SVG. Missing authored label: Issue title

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta LR
  connector github["GitHub API"]
  github@{ protocol: "http", endpoint: "https://api.github.com" }

  title["Issue title"]@{ shape: input }
  create["create_issue"]@{ shape: tool, connectorRef: "github.create_issue" }

  title --> create

```

Expected labels: `GitHub API`, `Issue title`, `create_issue`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:agentflow:9

browser API, SVG. Missing authored label: Nordic Brand Guide

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
agentflow-beta TB
  connector llm["LLM API"]
  llm@{ protocol: "http", endpoint: "https://api.example.com/chat" }

  flow coffee_team["Coffee Team"]
    city["city"]@{ shape: input, value: "Stockholm" }

    flow researcher["Researcher"]
      research["research_location"]@{ shape: tool, params: "city :: String", returns: "Report" }
      write["write_copy"]@{ shape: tool, connectorRef: "llm.chat", returns: "CoffeeCopy" }
      city --> research --> write
    end
    researcher@{ instruction: "Research the city and draft English coffee copy citing sources." }

    flow designer["Designer"]
      render["generate_html"]@{ shape: tool, connectorRef: "llm.chat", returns: "String" }
      brand["Nordic Brand Guide"]@{ shape: refdoc }
      render -.- brand
    end

    researcher --> designer
  end

```

Expected labels: `Coffee Team`, `Designer`, `Researcher`, `LLM API`, `city`, `research_location`, `write_copy`, `generate_html`, `Nordic Brand Guide`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

## architecture

### registry:architecture

Node API, SVG. Error: Missing authored label: reads

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
architecture-beta
  group backend(cloud)[Backend]
  service api(server)[API] in backend
  service db(database)[Database] in backend
  service cache(disk)[Cache] in backend
  api:R --> L:db
  api:B -[reads]-> T:cache
```

Expected labels: `API`, `Database`, `Cache`, `Backend`, `reads`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:architecture-upstream-should-handle-title-on-another-line

Node API, SVG. Error: Missing authored label: Simple Architecture Diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
architecture-beta
            title Simple Architecture Diagram
```

Expected labels: `Simple Architecture Diagram`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:architecture-upstream-should-parse-a-complex-deeply-nested-diagram-with-randomize-defaulting-to-false

Node API, SVG. Error: Missing authored label: Subscription A; Missing authored label: Subscription B

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
architecture-beta
    group sub1(cloud)[Subscription A]
    group vnet1(cloud)[VNet A] in sub1
    service vm1(server)[VM] in vnet1

    group sub2(cloud)[Subscription B]
    group shared(cloud)[Shared] in sub2
    service reg(database)[Registry] in shared

    group env(cloud)[Environment] in sub2
    group vnet(cloud)[VNet] in env
    group snet1(cloud)[App Subnet] in vnet
    service nsg(server)[NSG] in snet1
    service asp(server)[App Plan] in snet1
    service web(server)[Web App] in snet1

    group snet2(cloud)[PE Subnet] in vnet
    service pe1(server)[PE Blob] in snet2
    service pe2(server)[PE Bus] in snet2

    service storage(disk)[Storage] in env
    service container(disk)[Container] in env
    service bus(server)[Service Bus] in env
    service dns(server)[DNS Zone] in env

    service client(internet)[Client]

    reg:B --> T:web
    nsg:R --> L:asp
    asp:R --> L:web
    web:R --> L:pe1
    pe1:R --> L:storage
    storage:B --> T:container
    web:B --> T:pe2
    pe2:R --> L:bus
    vm1:R --> L:pe2
```

Expected labels: `VM`, `Registry`, `NSG`, `App Plan`, `Web App`, `PE Blob`, `PE Bus`, `Storage`, `Container`, `Service Bus`, `DNS Zone`, `Client`, `Subscription A`, `VNet A`, `Subscription B`, `Shared`, `Environment`, `VNet`, `App Subnet`, `PE Subnet`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### authored:architecture-text-icon

Node API, SVG. Error: Missing authored label: A

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
architecture-beta
service a "txt" [A]
```

Expected labels: `A`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### authored:architecture-inline-title

Node API, SVG. Error: Missing authored label: Hello

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
architecture-beta title Hello
service a(server)[A]
```

Expected labels: `Hello`, `A`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### registry:architecture

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): reads

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
architecture-beta
  group backend(cloud)[Backend]
  service api(server)[API] in backend
  service db(database)[Database] in backend
  service cache(disk)[Cache] in backend
  api:R --> L:db
  api:B -[reads]-> T:cache
```

Expected labels: `API`, `Database`, `Cache`, `Backend`, `reads`

### corpus:mermaid-upstream-suite-bench:architecture-upstream-should-handle-title-on-another-line

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Simple Architecture Diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
architecture-beta
            title Simple Architecture Diagram
```

Expected labels: `Simple Architecture Diagram`

### authored:architecture-text-icon

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): A

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
architecture-beta
service a "txt" [A]
```

Expected labels: `A`

### authored:architecture-inline-title

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Hello

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
architecture-beta title Hello
service a(server)[A]
```

Expected labels: `Hello`, `A`

### registry:architecture

browser API, SVG. Missing authored label: reads

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
architecture-beta
  group backend(cloud)[Backend]
  service api(server)[API] in backend
  service db(database)[Database] in backend
  service cache(disk)[Cache] in backend
  api:R --> L:db
  api:B -[reads]-> T:cache
```

Expected labels: `API`, `Database`, `Cache`, `Backend`, `reads`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:architecture-upstream-should-handle-title-on-another-line

browser API, SVG. Missing authored label: Simple Architecture Diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
architecture-beta
            title Simple Architecture Diagram
```

Expected labels: `Simple Architecture Diagram`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:architecture-upstream-should-parse-a-complex-deeply-nested-diagram-with-randomize-defaulting-to-false

browser API, SVG. Missing authored label: Subscription A; Missing authored label: Subscription B

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
architecture-beta
    group sub1(cloud)[Subscription A]
    group vnet1(cloud)[VNet A] in sub1
    service vm1(server)[VM] in vnet1

    group sub2(cloud)[Subscription B]
    group shared(cloud)[Shared] in sub2
    service reg(database)[Registry] in shared

    group env(cloud)[Environment] in sub2
    group vnet(cloud)[VNet] in env
    group snet1(cloud)[App Subnet] in vnet
    service nsg(server)[NSG] in snet1
    service asp(server)[App Plan] in snet1
    service web(server)[Web App] in snet1

    group snet2(cloud)[PE Subnet] in vnet
    service pe1(server)[PE Blob] in snet2
    service pe2(server)[PE Bus] in snet2

    service storage(disk)[Storage] in env
    service container(disk)[Container] in env
    service bus(server)[Service Bus] in env
    service dns(server)[DNS Zone] in env

    service client(internet)[Client]

    reg:B --> T:web
    nsg:R --> L:asp
    asp:R --> L:web
    web:R --> L:pe1
    pe1:R --> L:storage
    storage:B --> T:container
    web:B --> T:pe2
    pe2:R --> L:bus
    vm1:R --> L:pe2
```

Expected labels: `VM`, `Registry`, `NSG`, `App Plan`, `Web App`, `PE Blob`, `PE Bus`, `Storage`, `Container`, `Service Bus`, `DNS Zone`, `Client`, `Subscription A`, `VNet A`, `Subscription B`, `Shared`, `Environment`, `VNet`, `App Subnet`, `PE Subnet`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### authored:architecture-text-icon

browser API, SVG. Missing authored label: A

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
architecture-beta
service a "txt" [A]
```

Expected labels: `A`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### authored:architecture-inline-title

browser API, SVG. Missing authored label: Hello

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
architecture-beta title Hello
service a(server)[A]
```

Expected labels: `Hello`, `A`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

## block

### corpus:mermaid-block-bench:block-docs-2

Node API, SVG. Error: Visible output echoes Mermaid source instead of an admitted diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
block
  a b c

```

Expected labels: `a`, `b`, `c`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-block-bench:block-docs-2

browser API, SVG. Visible SVG source-echo fallback is not diagram ink

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
block
  a b c

```

Expected labels: `a`, `b`, `c`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

## c4

### portfolio:c4:8

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Customer request and storage

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
C4Container
  title Customer request and storage
  Person(customer, "Customer", "Uses the application")
  System_Boundary(platform, "Application platform") {
    Container(api, "API", "TypeScript", "Validates requests")
    ContainerDb(db, "Store", "SQL", "Persists accepted requests")
  }
  Rel(customer, api, "Submits request", "HTTPS")
  Rel(api, db, "Reads", "SQL")
  Rel(api, db, "Writes", "SQL")
```

Expected labels: `Customer request and storage`, `Customer`, `Uses the application`, `API`, `TypeScript`, `Validates requests`, `Store`, `SQL`, `Persists accepted requests`, `Application platform`, `Submits request`, `HTTPS`, `Writes`

### portfolio:c4:9

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Shop context

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
C4Context
  title Shop context
  Person(customer, "Customer", "Places orders")
  System(shop, "Shop", "Processes orders")
  System_Ext(payments, "Payments", "Authorizes purchases")
  Rel(customer, shop, "Orders", "HTTPS")
  Rel(shop, payments, "Authorizes", "HTTPS")
  Rel(shop, payments, "Checks status", "HTTPS")
```

Expected labels: `Shop context`, `Customer`, `Places orders`, `Shop`, `Processes orders`, `Payments`, `Authorizes purchases`, `Orders`, `HTTPS`, `Checks status`

## class

### corpus:mermaid-upstream-suite-bench:class-upstream-should-handle-an-empty-class-body-with

Node API, SVG. Error: Missing authored label: EmptyClass

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
classDiagram
class EmptyClass {}
```

Expected labels: `EmptyClass`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:class-upstream-should-handle-namespace

Node API, SVG. Error: Missing authored label: Namespace1; Missing authored label: Namespace2

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
classDiagram
namespace Namespace1 { class Class1 }
namespace Namespace2 { class Class1
}
namespace Namespace3 {
class Class1 {
int : test
string : foo
test()
foo()
}
}
namespace Namespace4 {
class Class1 {
int : test
string : foo
test()
foo()
}
class Class2 {
int : test
string : foo
test()
foo()
}
}
```

Expected labels: `Namespace1`, `Namespace2`, `Namespace3`, `Namespace4`, `Class1`, `Class2`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:class-upstream-defaults-to-hierarchical-rendering-when-hierarchicalnamespaces-is-unset

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): A, B

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
classDiagram
        namespace A.B {
          class Foo
        }
```

Expected labels: `A`, `B`, `Foo`

### corpus:mermaid-upstream-suite-bench:class-upstream-emits-only-explicit-namespaces-from-getdata-in-compact-mode

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Engineering, Backend

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
classDiagram
          namespace Company.Engineering.Backend {
            class Developer {
              +writeCode()
            }
          }
          namespace Company {
            class CEO {
              +makeDecisions()
            }
          }
```

Expected labels: `Company`, `Engineering`, `Backend`, `Developer`, `CEO`

### corpus:mermaid-upstream-suite-bench:class-upstream-moves-classes-inside-implicit-namespaces-to-the-nearest-explicit-ancestor-in-compact-mode

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Engineering, Backend

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
classDiagram
          namespace Company.Engineering.Backend {
            class Developer
          }
          namespace Company {
            class CEO
          }
```

Expected labels: `Company`, `Engineering`, `Backend`, `Developer`, `CEO`

### corpus:mermaid-upstream-suite-bench:class-upstream-should-handle-an-empty-class-body-with

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): EmptyClass

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
classDiagram
class EmptyClass {}
```

Expected labels: `EmptyClass`

### corpus:mermaid-upstream-suite-bench:class-upstream-should-handle-classes-within-namespaces

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Company, Project, Module

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
classDiagram
        namespace Company.Project {
          class User {
            +login(username: String, password: String)
            +logout()
          }
        }
        namespace Company.Project.Module {
          class Admin {
            +addUser(user: User)
            +removeUser(user: User)
          }
        }
```

Expected labels: `Company`, `Project`, `Module`, `User`, `Admin`

### corpus:mermaid-upstream-suite-bench:class-upstream-should-handle-fully-qualified-class-names-in-relationships

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Company, Project, Module

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
classDiagram
        namespace Company.Project.Module {
          class User
          class Admin
        }
          Admin --> User : manages
```

Expected labels: `Company`, `Project`, `Module`, `User`, `Admin`, `manages`

### corpus:mermaid-upstream-suite-bench:class-upstream-should-handle-generic-classes-within-namespaces

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Company, Project, Module

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
classDiagram
    namespace Company.Project.Module {
        class GenericClass~T~ {
            +addItem(item: T)
            +getItem() T
        }
    }
```

Expected labels: `Company`, `Project`, `Module`, `GenericClass`

### corpus:mermaid-upstream-suite-bench:class-upstream-should-handle-namespace

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Namespace1, Namespace2

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
classDiagram
namespace Namespace1 { class Class1 }
namespace Namespace2 { class Class1
}
namespace Namespace3 {
class Class1 {
int : test
string : foo
test()
foo()
}
}
namespace Namespace4 {
class Class1 {
int : test
string : foo
test()
foo()
}
class Class2 {
int : test
string : foo
test()
foo()
}
}
```

Expected labels: `Namespace1`, `Namespace2`, `Namespace3`, `Namespace4`, `Class1`, `Class2`

### corpus:mermaid-upstream-suite-bench:class-upstream-should-handle-nested-namespaces-and-relationships

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Company, Project, Module, SubModule

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
classDiagram
        namespace Company.Project.Module.SubModule {
          class Report {
            +generatePDF(data: List)
            +generateCSV(data: List)
          }
        }
        namespace Company.Project.Module {
          class Admin {
            +generateReport()
          }
        }
        Admin --> Report : generates
```

Expected labels: `Company`, `Project`, `Module`, `SubModule`, `Report`, `Admin`, `generates`

### corpus:mermaid-upstream-suite-bench:class-upstream-should-support-custom-labels-on-namespaces

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Authentication Service

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
classDiagram
        namespace Auth["Authentication Service"] {
          class UserService {
            +login()
          }
        }
```

Expected labels: `Authentication Service`, `UserService`

### corpus:mermaid-upstream-suite-bench:class-upstream-should-handle-an-empty-class-body-with

browser API, SVG. Missing authored label: EmptyClass

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
classDiagram
class EmptyClass {}
```

Expected labels: `EmptyClass`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:class-upstream-should-handle-namespace

browser API, SVG. Missing authored label: Namespace1; Missing authored label: Namespace2

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
classDiagram
namespace Namespace1 { class Class1 }
namespace Namespace2 { class Class1
}
namespace Namespace3 {
class Class1 {
int : test
string : foo
test()
foo()
}
}
namespace Namespace4 {
class Class1 {
int : test
string : foo
test()
foo()
}
class Class2 {
int : test
string : foo
test()
foo()
}
}
```

Expected labels: `Namespace1`, `Namespace2`, `Namespace3`, `Namespace4`, `Class1`, `Class2`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

## cynefin

### docs:cynefin:0

Node API, SVG. Error: Missing authored label: Incident Response

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
cynefin-beta
  title Incident Response

  complex
    "Investigate root cause"
    "Run chaos experiment"

  complicated
    "Analyze performance data"
    "Expert review needed"

  clear
    "Restart service"
    "Apply known fix"

  chaotic
    "Page on-call immediately"

  confusion
    "Unknown failure mode"

```

Expected labels: `Incident Response`, `Page on-call immediately`, `Restart service`, `Apply known fix`, `Investigate root cause`, `Run chaos experiment`, `Analyze performance data`, `Expert review needed`, `Unknown failure mode`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:cynefin:1

Node API, SVG. Error: Missing authored label: Crisis management; Missing authored label: Standard pricing; Missing authored label: Market research; Missing authored label: Competitive analysis

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
cynefin-beta
  title Strategy Categorization

  complex
    "Market research"

  complicated
    "Competitive analysis"

  clear
    "Standard pricing"

  chaotic
    "Crisis management"

  complex --> complicated : "Pattern identified"
  complicated --> clear : "Best practice codified"
  clear --> chaotic : "Complacency"
  chaotic --> complex : "Stabilized"

```

Expected labels: `Strategy Categorization`, `Crisis management`, `Standard pricing`, `Market research`, `Competitive analysis`, `Pattern identified`, `Best practice codified`, `Complacency`, `Stabilized`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:cynefin:2

Node API, SVG. Error: Missing authored label: Cynefin Framework

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
cynefin-beta
  title Cynefin Framework

  complex
  complicated
  clear
  chaotic

```

Expected labels: `Cynefin Framework`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:cynefin:0

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Incident Response

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
cynefin-beta
  title Incident Response

  complex
    "Investigate root cause"
    "Run chaos experiment"

  complicated
    "Analyze performance data"
    "Expert review needed"

  clear
    "Restart service"
    "Apply known fix"

  chaotic
    "Page on-call immediately"

  confusion
    "Unknown failure mode"

```

Expected labels: `Incident Response`, `Page on-call immediately`, `Restart service`, `Apply known fix`, `Investigate root cause`, `Run chaos experiment`, `Analyze performance data`, `Expert review needed`, `Unknown failure mode`

### docs:cynefin:1

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Strategy Categorization, Crisis management, Standard pricing, Market research, Competitive analysis

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
cynefin-beta
  title Strategy Categorization

  complex
    "Market research"

  complicated
    "Competitive analysis"

  clear
    "Standard pricing"

  chaotic
    "Crisis management"

  complex --> complicated : "Pattern identified"
  complicated --> clear : "Best practice codified"
  clear --> chaotic : "Complacency"
  chaotic --> complex : "Stabilized"

```

Expected labels: `Strategy Categorization`, `Crisis management`, `Standard pricing`, `Market research`, `Competitive analysis`, `Pattern identified`, `Best practice codified`, `Complacency`, `Stabilized`

### docs:cynefin:2

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Cynefin Framework

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
cynefin-beta
  title Cynefin Framework

  complex
  complicated
  clear
  chaotic

```

Expected labels: `Cynefin Framework`

### docs:cynefin:0

browser API, SVG. Missing authored label: Incident Response

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
cynefin-beta
  title Incident Response

  complex
    "Investigate root cause"
    "Run chaos experiment"

  complicated
    "Analyze performance data"
    "Expert review needed"

  clear
    "Restart service"
    "Apply known fix"

  chaotic
    "Page on-call immediately"

  confusion
    "Unknown failure mode"

```

Expected labels: `Incident Response`, `Page on-call immediately`, `Restart service`, `Apply known fix`, `Investigate root cause`, `Run chaos experiment`, `Analyze performance data`, `Expert review needed`, `Unknown failure mode`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:cynefin:1

browser API, SVG. Missing authored label: Crisis management; Missing authored label: Standard pricing; Missing authored label: Market research; Missing authored label: Competitive analysis

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
cynefin-beta
  title Strategy Categorization

  complex
    "Market research"

  complicated
    "Competitive analysis"

  clear
    "Standard pricing"

  chaotic
    "Crisis management"

  complex --> complicated : "Pattern identified"
  complicated --> clear : "Best practice codified"
  clear --> chaotic : "Complacency"
  chaotic --> complex : "Stabilized"

```

Expected labels: `Strategy Categorization`, `Crisis management`, `Standard pricing`, `Market research`, `Competitive analysis`, `Pattern identified`, `Best practice codified`, `Complacency`, `Stabilized`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### docs:cynefin:2

browser API, SVG. Missing authored label: Cynefin Framework

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
cynefin-beta
  title Cynefin Framework

  complex
  complicated
  clear
  chaotic

```

Expected labels: `Cynefin Framework`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

## er

### corpus:mermaid-upstream-suite-bench:er-upstream-should-correctly-parse-direction-rl-inside-a-subgraph

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): WithRL

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
erDiagram subgraph WithRL
direction RL
A
B
end
```

Expected labels: `WithRL`, `A`, `B`

### corpus:mermaid-upstream-suite-bench:er-upstream-should-handle-empty-lines-inside-subgraph

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Group

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
erDiagram
subgraph Group

A

B

end
```

Expected labels: `Group`, `A`, `B`

### corpus:mermaid-upstream-suite-bench:er-upstream-should-handle-empty-subgraph

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): empty

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
erDiagram
subgraph empty
end
```

Expected labels: `empty`

### corpus:mermaid-upstream-suite-bench:er-upstream-should-handle-relationship-between-subgraph-entity-and-external-entity

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Group

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
erDiagram
subgraph Group
A
end
A }|--|| B : "relates to"
```

Expected labels: `Group`, `A`, `B`, `relates to`

### corpus:mermaid-upstream-suite-bench:er-upstream-should-handle-special-characters-in-subgraph-title

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Group 1.5

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
erDiagram
subgraph "Group 1.5"
A
end
```

Expected labels: `Group 1.5`, `A`

### corpus:mermaid-upstream-suite-bench:er-upstream-should-ignore-redundant-whitespace-around-end

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Group

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
erDiagram
subgraph Group
A
end
```

Expected labels: `Group`, `A`

### corpus:mermaid-upstream-suite-bench:er-upstream-should-include-both-endpoints-of-a-relationship-inside-a-subgraph

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Group

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
erDiagram
subgraph Group
A }|--|| B : "relates to"
end
```

Expected labels: `Group`, `A`, `B`, `relates to`

### corpus:mermaid-upstream-suite-bench:er-upstream-title

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Group

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
erDiagram
subgraph Group
A
B
end
```

Expected labels: `Group`, `A`, `B`

### corpus:mermaid-upstream-suite-bench:er-upstream-title-2

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Some Title

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
erDiagram
subgraph "Some Title"
A
B
end
```

Expected labels: `Some Title`, `A`, `B`

## eventmodeling

### docs:eventmodeling:5

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): External, Cart

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
eventmodeling

tf 01 ui CartUI
tf 02 cmd AddItem
tf 03 evt ItemAdded

rf 04 evt External.InventoryChanged
tf 05 pcr InventoryProcessor
tf 06 cmd ChangeInventory
tf 07 evt Cart.InventoryChanged

```

Expected labels: `CartUI`, `AddItem`, `ItemAdded`, `InventoryChanged`, `External`, `InventoryProcessor`, `ChangeInventory`, `Cart`

### docs:eventmodeling:6

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): External, Cart

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
eventmodeling

timeframe 01 ui CartUI
timeframe 02 command AddItem
timeframe 03 event ItemAdded

resetframe 04 event External.InventoryChanged
timeframe 05 processor InventoryProcessor
timeframe 06 command ChangeInventory
timeframe 07 event Cart.InventoryChanged

```

Expected labels: `CartUI`, `AddItem`, `ItemAdded`, `InventoryChanged`, `External`, `InventoryProcessor`, `ChangeInventory`, `Cart`

### docs:eventmodeling:11

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): External, Cart

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
eventmodeling

tf 03 evt External.InventoryChanged
tf 02 pcr InventoryProcessor
tf 04 cmd ChangeInventory
tf 05 evt Cart.InventoryChanged

```

Expected labels: `InventoryChanged`, `External`, `InventoryProcessor`, `ChangeInventory`, `Cart`

### docs:eventmodeling:12

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Inventory, External

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
eventmodeling

rf 01 evt Inventory.InventoryChanged
rf 02 evt External.InventoryChanged

```

Expected labels: `InventoryChanged`, `Inventory`, `External`

## flowchart

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-be-possible-to-use-syntax-to-add-labels-on-multi-nodes

Node API, SVG. Error: Missing authored label: label for n2; Missing authored label: label for n4; Missing authored label: label for n5

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
flowchart TB
       n2["label for n2"] &   n4@{ label: "label for n4"}   & n5@{ label: "label for n5"}
```

Expected labels: `label for n2`, `label for n4`, `label for n5`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-a-nodes-and-edges-a-space-between-link-and-node-and-each-line-ending-without

Node API, SVG. Error: Missing authored label: e

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD
A --> B
 style e red
```

Expected labels: `A`, `B`, `e`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-basic-shape-data-statements-with

Node API, SVG. Error: Missing authored label: D

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
flowchart TB
      D@{ shape: rounded } & E
```

Expected labels: `D`, `E`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-dotted-text-on-lines-td3

Node API, SVG. Error: Missing authored label: test text with ==

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A-. test text with == .->B;
```

Expected labels: `A`, `B`, `test text with ==`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-nested-subgraphs-1

Node API, SVG. Error: Missing authored label: B

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
flowchart TB
    subgraph A
      direction RL
      b-->B
      a
    end
    a-->c
    subgraph B
      direction LR
      c
    end
```

Expected labels: `B`, `A`, `b`, `a`, `c`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-nested-subgraphs-1-2

Node API, SVG. Error: Missing authored label: B

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
flowchart TB
    subgraph A
    b-->B
    a
    end
    a-->c
    subgraph B
      c
    end
```

Expected labels: `B`, `A`, `b`, `a`, `c`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-normal-text-on-lines

Node API, SVG. Error: Missing authored label: test text with ==

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A-- test text with == -->B;
```

Expected labels: `A`, `B`, `test text with ==`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-subgraphs-in-old-style-that-was-broken

Node API, SVG. Error: Missing authored label: old style that is broken

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A-->B;subgraph old style that is broken;c-->d;end;
```

Expected labels: `old style that is broken`, `A`, `B`, `c`, `d`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-v-in-node-ids-only-v

Node API, SVG. Error: Missing authored label: A

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A--xv(my text);
```

Expected labels: `A`, `my text`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-v-in-node-ids-v-at-end

Node API, SVG. Error: Missing authored label: A

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A--xcsv(my text);
```

Expected labels: `A`, `my text`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-v-in-node-ids-v-at-start

Node API, SVG. Error: Missing authored label: A

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A--xva(my text);
```

Expected labels: `A`, `my text`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-v-in-node-ids-v-in-middle

Node API, SVG. Error: Missing authored label: A

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A--xava(my text);
```

Expected labels: `A`, `my text`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-not-disturb-adding-multiple-nodes-after-each-other

Node API, SVG. Error: Missing authored label: Hello

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
flowchart TB
      A[hello]
      B@{
        shape: circle
        other: "clock"
     }
      C[Hello]@{
        shape: circle
        other: "clock"
     }
```

Expected labels: `hello`, `B`, `Hello`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-warn-when-style-targets-a-non-existent-node

Node API, SVG. Error: Missing authored label: A

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;
AA-->BB;
style A fill:#f00;
```

Expected labels: `AA`, `BB`, `A`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-markdown-formatting-in-nodes-and-labels

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): The cat in **the** hat, The *bat* in the chat

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
flowchart
A["`The cat in **the** hat`"]-- "`The *bat* in the chat`" -->B["The dog in the hog"] -- "The rat in the mat" -->C;
```

Expected labels: `The cat in **the** hat`, `The dog in the hog`, `C`, `The *bat* in the chat`, `The rat in the mat`

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-markdown-formatting-in-subgraphs

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): **Two**, The **cat** in the hat, The **dog** in the hog, 1o **ipa**

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
flowchart LR
subgraph "One"
  a("`The **cat**
  in the hat`") -- "1o" --> b{{"`The **dog** in the hog`"}}
end
subgraph "`**Two**`"
  c("`The **cat**
  in the hat`") -- "`1o **ipa**`" --> d("The dog in the hog")
end
```

Expected labels: `**Two**`, `One`, `The **cat** in the hat`, `The **dog** in the hog`, `The dog in the hog`, `1o`, `1o **ipa**`

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-be-possible-to-use-in-strings

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): This is a string with @

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
flowchart TB
      A@{
        label: "This is a string with @"
        other: "clock"
     }
```

Expected labels: `This is a string with @`

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-be-possible-to-use-in-strings-2

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): This is a string with}

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
flowchart TB
      A@{
        label: "This is a string with}"
        other: "clock"
     }
```

Expected labels: `This is a string with}`

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-be-possible-to-use-syntax-to-add-labels-on-multi-nodes

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): label for n2, label for n4, label for n5

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
flowchart TB
       n2["label for n2"] &   n4@{ label: "label for n4"}   & n5@{ label: "label for n5"}
```

Expected labels: `label for n2`, `label for n4`, `label for n5`

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-a-nodes-and-edges-a-space-between-link-and-node-and-each-line-ending-without

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): e

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD
A --> B
 style e red
```

Expected labels: `A`, `B`, `e`

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-basic-shape-data-statements-with

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): E

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
flowchart TB
      D@{ shape: rounded } & E
```

Expected labels: `D`, `E`

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-dotted-text-on-lines-td3

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): test text with ==

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A-. test text with == .->B;
```

Expected labels: `A`, `B`, `test text with ==`

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-normal-text-on-lines

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): test text with ==

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A-- test text with == -->B;
```

Expected labels: `A`, `B`, `test text with ==`

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-subgraphs-in-old-style-that-was-broken

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): old style that is broken

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A-->B;subgraph old style that is broken;c-->d;end;
```

Expected labels: `old style that is broken`, `A`, `B`, `c`, `d`

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-text-in-ellipse-vertices

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): this is an ellipse

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD
A(-this is an ellipse-)-->B
```

Expected labels: `this is an ellipse`, `B`

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-v-in-node-ids-only-v

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): A

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A--xv(my text);
```

Expected labels: `A`, `my text`

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-v-in-node-ids-v-at-end

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): A

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A--xcsv(my text);
```

Expected labels: `A`, `my text`

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-v-in-node-ids-v-at-start

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): A

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A--xva(my text);
```

Expected labels: `A`, `my text`

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-v-in-node-ids-v-in-middle

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): A

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A--xava(my text);
```

Expected labels: `A`, `my text`

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-not-disturb-adding-multiple-nodes-after-each-other

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Hello

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
flowchart TB
      A[hello]
      B@{
        shape: circle
        other: "clock"
     }
      C[Hello]@{
        shape: circle
        other: "clock"
     }
```

Expected labels: `hello`, `B`, `Hello`

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-use-handle-bracket-end-character-inside-the-shape-data

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): This is }

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
flowchart TB
      A@{
        label: "This is }"
        other: "clock"
     }
```

Expected labels: `This is }`

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-warn-when-style-targets-a-non-existent-node

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): A

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;
AA-->BB;
style A fill:#f00;
```

Expected labels: `AA`, `BB`, `A`

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-be-possible-to-use-syntax-to-add-labels-on-multi-nodes

browser API, SVG. Missing authored label: label for n2; Missing authored label: label for n4; Missing authored label: label for n5

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
flowchart TB
       n2["label for n2"] &   n4@{ label: "label for n4"}   & n5@{ label: "label for n5"}
```

Expected labels: `label for n2`, `label for n4`, `label for n5`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-a-nodes-and-edges-a-space-between-link-and-node-and-each-line-ending-without

browser API, SVG. Missing authored label: e

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD
A --> B
 style e red
```

Expected labels: `A`, `B`, `e`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-basic-shape-data-statements-with

browser API, SVG. Missing authored label: D

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
flowchart TB
      D@{ shape: rounded } & E
```

Expected labels: `D`, `E`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-dotted-text-on-lines-td3

browser API, SVG. Missing authored label: test text with ==

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A-. test text with == .->B;
```

Expected labels: `A`, `B`, `test text with ==`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-nested-subgraphs-1

browser API, SVG. Missing authored label: B

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
flowchart TB
    subgraph A
      direction RL
      b-->B
      a
    end
    a-->c
    subgraph B
      direction LR
      c
    end
```

Expected labels: `B`, `A`, `b`, `a`, `c`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-nested-subgraphs-1-2

browser API, SVG. Missing authored label: B

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
flowchart TB
    subgraph A
    b-->B
    a
    end
    a-->c
    subgraph B
      c
    end
```

Expected labels: `B`, `A`, `b`, `a`, `c`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-normal-text-on-lines

browser API, SVG. Missing authored label: test text with ==

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A-- test text with == -->B;
```

Expected labels: `A`, `B`, `test text with ==`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-subgraphs-in-old-style-that-was-broken

browser API, SVG. Missing authored label: old style that is broken

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A-->B;subgraph old style that is broken;c-->d;end;
```

Expected labels: `old style that is broken`, `A`, `B`, `c`, `d`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-v-in-node-ids-only-v

browser API, SVG. Missing authored label: A

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A--xv(my text);
```

Expected labels: `A`, `my text`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-v-in-node-ids-v-at-end

browser API, SVG. Missing authored label: A

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A--xcsv(my text);
```

Expected labels: `A`, `my text`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-v-in-node-ids-v-at-start

browser API, SVG. Missing authored label: A

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A--xva(my text);
```

Expected labels: `A`, `my text`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-handle-v-in-node-ids-v-in-middle

browser API, SVG. Missing authored label: A

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;A--xava(my text);
```

Expected labels: `A`, `my text`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-not-disturb-adding-multiple-nodes-after-each-other

browser API, SVG. Missing authored label: Hello

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
flowchart TB
      A[hello]
      B@{
        shape: circle
        other: "clock"
     }
      C[Hello]@{
        shape: circle
        other: "clock"
     }
```

Expected labels: `hello`, `B`, `Hello`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-upstream-suite-bench:flowchart-upstream-should-warn-when-style-targets-a-non-existent-node

browser API, SVG. Missing authored label: A

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
graph TD;
AA-->BB;
style A fill:#f00;
```

Expected labels: `AA`, `BB`, `A`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

## gantt

### scaling:gantt:150-tasks

Node API, SVG. Error: Missing authored label: Phase 0; Missing authored label: Phase 1; Missing authored label: Phase 2; Missing authored label: Phase 3; Missing authored label: Phase 4; Missing authored label: Phase 5; Missing authored label: Phase 6; Missing authored label: Phase 7; Missing authored label: Phase 8; Missing authored label: Phase 9

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
gantt
  dateFormat YYYY-MM-DD
  section Phase 0
  Task 0 :t0, 2024-01-01, 3d
  Task 1 :t1, after t0, 2d
  Task 2 :t2, after t1, 3d
  Task 3 :t3, after t2, 4d
  Task 4 :t4, after t3, 1d
  Task 5 :t5, after t4, 2d
  Task 6 :t6, after t5, 3d
  Task 7 :t7, after t6, 4d
  Task 8 :t8, after t7, 1d
  Task 9 :t9, after t8, 2d
  Task 10 :t10, after t9, 3d
  Task 11 :t11, after t10, 4d
  Task 12 :t12, after t11, 1d
  Task 13 :t13, after t12, 2d
  Task 14 :t14, after t13, 3d
  section Phase 1
  Task 15 :t15, after t14, 4d
  Task 16 :t16, after t15, 1d
  Task 17 :t17, after t16, 2d
  Task 18 :t18, after t17, 3d
  Task 19 :t19, after t18, 4d
  Task 20 :t20, after t19, 1d
  Task 21 :t21, after t20, 2d
  Task 22 :t22, after t21, 3d
  Task 23 :t23, after t22, 4d
  Task 24 :t24, after t23, 1d
  Task 25 :t25, after t24, 2d
  Task 26 :t26, after t25, 3d
  Task 27 :t27, after t26, 4d
  Task 28 :t28, after t27, 1d
  Task 29 :t29, after t28, 2d
  section Phase 2
  Task 30 :t30, after t29, 3d
  Task 31 :t31, after t30, 4d
  Task 32 :t32, after t31, 1d
  Task 33 :t33, after t32, 2d
  Task 34 :t34, after t33, 3d
  Task 35 :t35, after t34, 4d
  Task 36 :t36, after t35, 1d
  Task 37 :t37, after t36, 2d
  Task 38 :t38, after t37, 3d
  Task 39 :t39, after t38, 4d
  Task 40 :t40, after t39, 1d
  Task 41 :t41, after t40, 2d
  Task 42 :t42, after t41, 3d
  Task 43 :t43, after t42, 4d
  Task 44 :t44, after t43, 1d
  section Phase 3
  Task 45 :t45, after t44, 2d
  Task 46 :t46, after t45, 3d
  Task 47 :t47, after t46, 4d
  Task 48 :t48, after t47, 1d
  Task 49 :t49, after t48, 2d
  Task 50 :t50, after t49, 3d
  Task 51 :t51, after t50, 4d
  Task 52 :t52, after t51, 1d
  Task 53 :t53, after t52, 2d
  Task 54 :t54, after t53, 3d
  Task 55 :t55, after t54, 4d
  Task 56 :t56, after t55, 1d
  Task 57 :t57, after t56, 2d
  Task 58 :t58, after t57, 3d
  Task 59 :t59, after t58, 4d
  section Phase 4
  Task 60 :t60, after t59, 1d
  Task 61 :t61, after t60, 2d
  Task 62 :t62, after t61, 3d
  Task 63 :t63, after t62, 4d
  Task 64 :t64, after t63, 1d
  Task 65 :t65, after t64, 2d
  Task 66 :t66, after t65, 3d
  Task 67 :t67, after t66, 4d
  Task 68 :t68, after t67, 1d
  Task 69 :t69, after t68, 2d
  Task 70 :t70, after t69, 3d
  Task 71 :t71, after t70, 4d
  Task 72 :t72, after t71, 1d
  Task 73 :t73, after t72, 2d
  Task 74 :t74, after t73, 3d
  section Phase 5
  Task 75 :t75, after t74, 4d
  Task 76 :t76, after t75, 1d
  Task 77 :t77, after t76, 2d
  Task 78 :t78, after t77, 3d
  Task 79 :t79, after t78, 4d
  Task 80 :t80, after t79, 1d
  Task 81 :t81, after t80, 2d
  Task 82 :t82, after t81, 3d
  Task 83 :t83, after t82, 4d
  Task 84 :t84, after t83, 1d
  Task 85 :t85, after t84, 2d
  Task 86 :t86, after t85, 3d
  Task 87 :t87, after t86, 4d
  Task 88 :t88, after t87, 1d
  Task 89 :t89, after t88, 2d
  section Phase 6
  Task 90 :t90, after t89, 3d
  Task 91 :t91, after t90, 4d
  Task 92 :t92, after t91, 1d
  Task 93 :t93, after t92, 2d
  Task 94 :t94, after t93, 3d
  Task 95 :t95, after t94, 4d
  Task 96 :t96, after t95, 1d
  Task 97 :t97, after t96, 2d
  Task 98 :t98, after t97, 3d
  Task 99 :t99, after t98, 4d
  Task 100 :t100, after t99, 1d
  Task 101 :t101, after t100, 2d
  Task 102 :t102, after t101, 3d
  Task 103 :t103, after t102, 4d
  Task 104 :t104, after t103, 1d
  section Phase 7
  Task 105 :t105, after t104, 2d
  Task 106 :t106, after t105, 3d
  Task 107 :t107, after t106, 4d
  Task 108 :t108, after t107, 1d
  Task 109 :t109, after t108, 2d
  Task 110 :t110, after t109, 3d
  Task 111 :t111, after t110, 4d
  Task 112 :t112, after t111, 1d
  Task 113 :t113, after t112, 2d
  Task 114 :t114, after t113, 3d
  Task 115 :t115, after t114, 4d
  Task 116 :t116, after t115, 1d
  Task 117 :t117, after t116, 2d
  Task 118 :t118, after t117, 3d
  Task 119 :t119, after t118, 4d
  section Phase 8
  Task 120 :t120, after t119, 1d
  Task 121 :t121, after t120, 2d
  Task 122 :t122, after t121, 3d
  Task 123 :t123, after t122, 4d
  Task 124 :t124, after t123, 1d
  Task 125 :t125, after t124, 2d
  Task 126 :t126, after t125, 3d
  Task 127 :t127, after t126, 4d
  Task 128 :t128, after t127, 1d
  Task 129 :t129, after t128, 2d
  Task 130 :t130, after t129, 3d
  Task 131 :t131, after t130, 4d
  Task 132 :t132, after t131, 1d
  Task 133 :t133, after t132, 2d
  Task 134 :t134, after t133, 3d
  section Phase 9
  Task 135 :t135, after t134, 4d
  Task 136 :t136, after t135, 1d
  Task 137 :t137, after t136, 2d
  Task 138 :t138, after t137, 3d
  Task 139 :t139, after t138, 4d
  Task 140 :t140, after t139, 1d
  Task 141 :t141, after t140, 2d
  Task 142 :t142, after t141, 3d
  Task 143 :t143, after t142, 4d
  Task 144 :t144, after t143, 1d
  Task 145 :t145, after t144, 2d
  Task 146 :t146, after t145, 3d
  Task 147 :t147, after t146, 4d
  Task 148 :t148, after t147, 1d
  Task 149 :t149, after t148, 2d
```

Expected labels: `Phase 0`, `Phase 1`, `Phase 2`, `Phase 3`, `Phase 4`, `Phase 5`, `Phase 6`, `Phase 7`, `Phase 8`, `Phase 9`, `Task 0`, `Task 1`, `Task 2`, `Task 3`, `Task 4`, `Task 5`, `Task 6`, `Task 7`, `Task 8`, `Task 9`, `Task 10`, `Task 11`, `Task 12`, `Task 13`, `Task 14`, `Task 15`, `Task 16`, `Task 17`, `Task 18`, `Task 19`, `Task 20`, `Task 21`, `Task 22`, `Task 23`, `Task 24`, `Task 25`, `Task 26`, `Task 27`, `Task 28`, `Task 29`, `Task 30`, `Task 31`, `Task 32`, `Task 33`, `Task 34`, `Task 35`, `Task 36`, `Task 37`, `Task 38`, `Task 39`, `Task 40`, `Task 41`, `Task 42`, `Task 43`, `Task 44`, `Task 45`, `Task 46`, `Task 47`, `Task 48`, `Task 49`, `Task 50`, `Task 51`, `Task 52`, `Task 53`, `Task 54`, `Task 55`, `Task 56`, `Task 57`, `Task 58`, `Task 59`, `Task 60`, `Task 61`, `Task 62`, `Task 63`, `Task 64`, `Task 65`, `Task 66`, `Task 67`, `Task 68`, `Task 69`, `Task 70`, `Task 71`, `Task 72`, `Task 73`, `Task 74`, `Task 75`, `Task 76`, `Task 77`, `Task 78`, `Task 79`, `Task 80`, `Task 81`, `Task 82`, `Task 83`, `Task 84`, `Task 85`, `Task 86`, `Task 87`, `Task 88`, `Task 89`, `Task 90`, `Task 91`, `Task 92`, `Task 93`, `Task 94`, `Task 95`, `Task 96`, `Task 97`, `Task 98`, `Task 99`, `Task 100`, `Task 101`, `Task 102`, `Task 103`, `Task 104`, `Task 105`, `Task 106`, `Task 107`, `Task 108`, `Task 109`, `Task 110`, `Task 111`, `Task 112`, `Task 113`, `Task 114`, `Task 115`, `Task 116`, `Task 117`, `Task 118`, `Task 119`, `Task 120`, `Task 121`, `Task 122`, `Task 123`, `Task 124`, `Task 125`, `Task 126`, `Task 127`, `Task 128`, `Task 129`, `Task 130`, `Task 131`, `Task 132`, `Task 133`, `Task 134`, `Task 135`, `Task 136`, `Task 137`, `Task 138`, `Task 139`, `Task 140`, `Task 141`, `Task 142`, `Task 143`, `Task 144`, `Task 145`, `Task 146`, `Task 147`, `Task 148`, `Task 149`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-gantt-bench:ps-section-multiline-br

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Line1 Line2 Line3</br />Line4 Line5

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
gantt
dateFormat yyyy-mm-dd
title Adding gantt diagram functionality to mermaid
excludes weekdays 2019-02-01
section Line1<br>Line2<br/>Line3</br />Line4<br	/>Line5
```

Expected labels: `Adding gantt diagram functionality to mermaid`, `Line1 Line2 Line3</br />Line4 Line5`

### scaling:gantt:150-tasks

browser API, SVG. Missing authored label: Phase 0; Missing authored label: Phase 1; Missing authored label: Phase 2; Missing authored label: Phase 3; Missing authored label: Phase 4; Missing authored label: Phase 5; Missing authored label: Phase 6; Missing authored label: Phase 7; Missing authored label: Phase 8; Missing authored label: Phase 9

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
gantt
  dateFormat YYYY-MM-DD
  section Phase 0
  Task 0 :t0, 2024-01-01, 3d
  Task 1 :t1, after t0, 2d
  Task 2 :t2, after t1, 3d
  Task 3 :t3, after t2, 4d
  Task 4 :t4, after t3, 1d
  Task 5 :t5, after t4, 2d
  Task 6 :t6, after t5, 3d
  Task 7 :t7, after t6, 4d
  Task 8 :t8, after t7, 1d
  Task 9 :t9, after t8, 2d
  Task 10 :t10, after t9, 3d
  Task 11 :t11, after t10, 4d
  Task 12 :t12, after t11, 1d
  Task 13 :t13, after t12, 2d
  Task 14 :t14, after t13, 3d
  section Phase 1
  Task 15 :t15, after t14, 4d
  Task 16 :t16, after t15, 1d
  Task 17 :t17, after t16, 2d
  Task 18 :t18, after t17, 3d
  Task 19 :t19, after t18, 4d
  Task 20 :t20, after t19, 1d
  Task 21 :t21, after t20, 2d
  Task 22 :t22, after t21, 3d
  Task 23 :t23, after t22, 4d
  Task 24 :t24, after t23, 1d
  Task 25 :t25, after t24, 2d
  Task 26 :t26, after t25, 3d
  Task 27 :t27, after t26, 4d
  Task 28 :t28, after t27, 1d
  Task 29 :t29, after t28, 2d
  section Phase 2
  Task 30 :t30, after t29, 3d
  Task 31 :t31, after t30, 4d
  Task 32 :t32, after t31, 1d
  Task 33 :t33, after t32, 2d
  Task 34 :t34, after t33, 3d
  Task 35 :t35, after t34, 4d
  Task 36 :t36, after t35, 1d
  Task 37 :t37, after t36, 2d
  Task 38 :t38, after t37, 3d
  Task 39 :t39, after t38, 4d
  Task 40 :t40, after t39, 1d
  Task 41 :t41, after t40, 2d
  Task 42 :t42, after t41, 3d
  Task 43 :t43, after t42, 4d
  Task 44 :t44, after t43, 1d
  section Phase 3
  Task 45 :t45, after t44, 2d
  Task 46 :t46, after t45, 3d
  Task 47 :t47, after t46, 4d
  Task 48 :t48, after t47, 1d
  Task 49 :t49, after t48, 2d
  Task 50 :t50, after t49, 3d
  Task 51 :t51, after t50, 4d
  Task 52 :t52, after t51, 1d
  Task 53 :t53, after t52, 2d
  Task 54 :t54, after t53, 3d
  Task 55 :t55, after t54, 4d
  Task 56 :t56, after t55, 1d
  Task 57 :t57, after t56, 2d
  Task 58 :t58, after t57, 3d
  Task 59 :t59, after t58, 4d
  section Phase 4
  Task 60 :t60, after t59, 1d
  Task 61 :t61, after t60, 2d
  Task 62 :t62, after t61, 3d
  Task 63 :t63, after t62, 4d
  Task 64 :t64, after t63, 1d
  Task 65 :t65, after t64, 2d
  Task 66 :t66, after t65, 3d
  Task 67 :t67, after t66, 4d
  Task 68 :t68, after t67, 1d
  Task 69 :t69, after t68, 2d
  Task 70 :t70, after t69, 3d
  Task 71 :t71, after t70, 4d
  Task 72 :t72, after t71, 1d
  Task 73 :t73, after t72, 2d
  Task 74 :t74, after t73, 3d
  section Phase 5
  Task 75 :t75, after t74, 4d
  Task 76 :t76, after t75, 1d
  Task 77 :t77, after t76, 2d
  Task 78 :t78, after t77, 3d
  Task 79 :t79, after t78, 4d
  Task 80 :t80, after t79, 1d
  Task 81 :t81, after t80, 2d
  Task 82 :t82, after t81, 3d
  Task 83 :t83, after t82, 4d
  Task 84 :t84, after t83, 1d
  Task 85 :t85, after t84, 2d
  Task 86 :t86, after t85, 3d
  Task 87 :t87, after t86, 4d
  Task 88 :t88, after t87, 1d
  Task 89 :t89, after t88, 2d
  section Phase 6
  Task 90 :t90, after t89, 3d
  Task 91 :t91, after t90, 4d
  Task 92 :t92, after t91, 1d
  Task 93 :t93, after t92, 2d
  Task 94 :t94, after t93, 3d
  Task 95 :t95, after t94, 4d
  Task 96 :t96, after t95, 1d
  Task 97 :t97, after t96, 2d
  Task 98 :t98, after t97, 3d
  Task 99 :t99, after t98, 4d
  Task 100 :t100, after t99, 1d
  Task 101 :t101, after t100, 2d
  Task 102 :t102, after t101, 3d
  Task 103 :t103, after t102, 4d
  Task 104 :t104, after t103, 1d
  section Phase 7
  Task 105 :t105, after t104, 2d
  Task 106 :t106, after t105, 3d
  Task 107 :t107, after t106, 4d
  Task 108 :t108, after t107, 1d
  Task 109 :t109, after t108, 2d
  Task 110 :t110, after t109, 3d
  Task 111 :t111, after t110, 4d
  Task 112 :t112, after t111, 1d
  Task 113 :t113, after t112, 2d
  Task 114 :t114, after t113, 3d
  Task 115 :t115, after t114, 4d
  Task 116 :t116, after t115, 1d
  Task 117 :t117, after t116, 2d
  Task 118 :t118, after t117, 3d
  Task 119 :t119, after t118, 4d
  section Phase 8
  Task 120 :t120, after t119, 1d
  Task 121 :t121, after t120, 2d
  Task 122 :t122, after t121, 3d
  Task 123 :t123, after t122, 4d
  Task 124 :t124, after t123, 1d
  Task 125 :t125, after t124, 2d
  Task 126 :t126, after t125, 3d
  Task 127 :t127, after t126, 4d
  Task 128 :t128, after t127, 1d
  Task 129 :t129, after t128, 2d
  Task 130 :t130, after t129, 3d
  Task 131 :t131, after t130, 4d
  Task 132 :t132, after t131, 1d
  Task 133 :t133, after t132, 2d
  Task 134 :t134, after t133, 3d
  section Phase 9
  Task 135 :t135, after t134, 4d
  Task 136 :t136, after t135, 1d
  Task 137 :t137, after t136, 2d
  Task 138 :t138, after t137, 3d
  Task 139 :t139, after t138, 4d
  Task 140 :t140, after t139, 1d
  Task 141 :t141, after t140, 2d
  Task 142 :t142, after t141, 3d
  Task 143 :t143, after t142, 4d
  Task 144 :t144, after t143, 1d
  Task 145 :t145, after t144, 2d
  Task 146 :t146, after t145, 3d
  Task 147 :t147, after t146, 4d
  Task 148 :t148, after t147, 1d
  Task 149 :t149, after t148, 2d
```

Expected labels: `Phase 0`, `Phase 1`, `Phase 2`, `Phase 3`, `Phase 4`, `Phase 5`, `Phase 6`, `Phase 7`, `Phase 8`, `Phase 9`, `Task 0`, `Task 1`, `Task 2`, `Task 3`, `Task 4`, `Task 5`, `Task 6`, `Task 7`, `Task 8`, `Task 9`, `Task 10`, `Task 11`, `Task 12`, `Task 13`, `Task 14`, `Task 15`, `Task 16`, `Task 17`, `Task 18`, `Task 19`, `Task 20`, `Task 21`, `Task 22`, `Task 23`, `Task 24`, `Task 25`, `Task 26`, `Task 27`, `Task 28`, `Task 29`, `Task 30`, `Task 31`, `Task 32`, `Task 33`, `Task 34`, `Task 35`, `Task 36`, `Task 37`, `Task 38`, `Task 39`, `Task 40`, `Task 41`, `Task 42`, `Task 43`, `Task 44`, `Task 45`, `Task 46`, `Task 47`, `Task 48`, `Task 49`, `Task 50`, `Task 51`, `Task 52`, `Task 53`, `Task 54`, `Task 55`, `Task 56`, `Task 57`, `Task 58`, `Task 59`, `Task 60`, `Task 61`, `Task 62`, `Task 63`, `Task 64`, `Task 65`, `Task 66`, `Task 67`, `Task 68`, `Task 69`, `Task 70`, `Task 71`, `Task 72`, `Task 73`, `Task 74`, `Task 75`, `Task 76`, `Task 77`, `Task 78`, `Task 79`, `Task 80`, `Task 81`, `Task 82`, `Task 83`, `Task 84`, `Task 85`, `Task 86`, `Task 87`, `Task 88`, `Task 89`, `Task 90`, `Task 91`, `Task 92`, `Task 93`, `Task 94`, `Task 95`, `Task 96`, `Task 97`, `Task 98`, `Task 99`, `Task 100`, `Task 101`, `Task 102`, `Task 103`, `Task 104`, `Task 105`, `Task 106`, `Task 107`, `Task 108`, `Task 109`, `Task 110`, `Task 111`, `Task 112`, `Task 113`, `Task 114`, `Task 115`, `Task 116`, `Task 117`, `Task 118`, `Task 119`, `Task 120`, `Task 121`, `Task 122`, `Task 123`, `Task 124`, `Task 125`, `Task 126`, `Task 127`, `Task 128`, `Task 129`, `Task 130`, `Task 131`, `Task 132`, `Task 133`, `Task 134`, `Task 135`, `Task 136`, `Task 137`, `Task 138`, `Task 139`, `Task 140`, `Task 141`, `Task 142`, `Task 143`, `Task 144`, `Task 145`, `Task 146`, `Task 147`, `Task 148`, `Task 149`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

## gitgraph

### editor:gitgraph

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): v1.0.0, beta, rc.1, v2.0.0, backport

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
title: Release train with backport
config:
  gitGraph:
    mainBranchName: main
    mainBranchOrder: 0
    showBranches: true
    showCommitLabel: true
    rotateCommitLabel: true
---
gitGraph LR:
  accTitle: Release history with feature merge and backport
  accDescr: Develop and release branches diverge, main merges develop, and release cherry-picks the merge
  commit id:"ROOT" tag:"v1.0.0" msg:"Foundation"
  branch develop order:2
  commit id:"API" type:HIGHLIGHT tag:"beta" msg:"Build API"
  branch release order:3
  commit id:"RC" type:REVERSE tag:"rc.1" msg:"Cut release candidate"
  checkout develop
  commit id:"UI" msg:"Finish interface"
  checkout main
  commit id:"HOTFIX" type:REVERSE msg:"Patch production"
  merge develop id:"MERGE" tag:"v2.0.0" type:HIGHLIGHT
  checkout release
  cherry-pick id:"MERGE" parent:"UI" tag:"backport"
  commit id:"PATCH" msg:"Verify release"
```

Expected labels: `main`, `develop`, `release`, `ROOT`, `v1.0.0`, `API`, `beta`, `RC`, `rc.1`, `UI`, `HOTFIX`, `MERGE`, `v2.0.0`, `backport`, `PATCH`

### portfolio:gitgraph:30

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): v1.0.0, login-integrated, v2.0.0-rc.1, v1.0.1, v2.0.0

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
title: Gitflow release and emergency hotfix
config:
  gitGraph:
    mainBranchName: main
    showBranches: true
    showCommitLabel: true
---
gitGraph LR:
  accTitle: Gitflow release history
  accDescr: Develop, feature, release, and hotfix branches merge into main
  commit id:"v1" tag:"v1.0.0" msg:"Production baseline"
  branch develop order:2
  commit id:"develop-base" msg:"Open next cycle"
  branch feature/login order:3
  commit id:"login-api" msg:"Add login API"
  commit id:"login-ui" type:HIGHLIGHT msg:"Finish login UI"
  checkout develop
  merge feature/login id:"merge-login" tag:"login-integrated"
  branch release/2.0 order:4
  commit id:"rc" type:REVERSE tag:"v2.0.0-rc.1" msg:"Release candidate"
  checkout main
  branch hotfix/security order:1
  commit id:"security-fix" type:HIGHLIGHT msg:"Patch production"
  checkout main
  merge hotfix/security id:"hotfix-merge" tag:"v1.0.1"
  merge release/2.0 id:"release-merge" tag:"v2.0.0"
```

Expected labels: `main`, `hotfix/security`, `develop`, `feature/login`, `release/2.0`, `v1`, `v1.0.0`, `develop-base`, `login-api`, `login-ui`, `merge-login`, `login-integrated`, `rc`, `v2.0.0-rc.1`, `security-fix`, `hotfix-merge`, `v1.0.1`, `release-merge`, `v2.0.0`

### portfolio:gitgraph:31

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): release-2026.07-long-term-support, observability-preview-candidate, release-2026.08-observability-general-availability

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
title: Long release labels in top-to-bottom history
config:
  gitGraph:
    rotateCommitLabel: false
  themeVariables:
    commitLabelFontSize: 18
---
gitGraph TB:
  accTitle: Top to bottom release history with long labels
  commit id:"foundation" tag:"release-2026.07-long-term-support" msg:"Establish a stable production foundation"
  branch feature/observability order:2
  commit id:"telemetry" tag:"observability-preview-candidate" msg:"Add traces, logs, metrics, and structured events"
  checkout main
  commit id:"policy" type:REVERSE msg:"Document compatibility and rollback policy"
  merge feature/observability id:"observability-merge" type:HIGHLIGHT tag:"release-2026.08-observability-general-availability"
```

Expected labels: `main`, `feature/observability`, `foundation`, `release-2026.07-long-term-support`, `telemetry`, `observability-preview-candidate`, `policy`, `observability-merge`, `release-2026.08-observability-general-availability`

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

### registry:journey

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Checkout

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
journey
  title Checkout
  section Browse
    Find product: 4: Shopper
  section Buy
    Pay: 3: Shopper
```

Expected labels: `Checkout`, `Browse`, `Buy`, `Find product`, `Shopper`, `Pay`

### editor:journey

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Editor adoption

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
journey
  title Editor adoption
  section Try
    Open editor: 5: User
    Load example: 4: User, Developer
  section Share
    Copy URL: 5: User
    Export SVG: 4: Developer
```

Expected labels: `Editor adoption`, `Try`, `Share`, `Open editor`, `User`, `Load example`, `Developer`, `Copy URL`, `Export SVG`

### portfolio:journey:36

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): My working day

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me
```

Expected labels: `My working day`, `Go to work`, `Go home`, `Make tea`, `Me`, `Go upstairs`, `Do work`, `Cat`, `Go downstairs`, `Sit down`

### portfolio:journey:37

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): My working day

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
journey
  title My working day
  section Go to work
    Make tea: 5: Me
    Go upstairs: 3: Me
    Do work: 1: Me, Cat
  section Go home
    Go downstairs: 5: Me
    Sit down: 5: Me
```

Expected labels: `My working day`, `Go to work`, `Go home`, `Make tea`, `Me`, `Go upstairs`, `Do work`, `Cat`, `Go downstairs`, `Sit down`

### portfolio:journey:38

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Checkout

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
journey
  title Checkout
  section Browse
    Find item: 4: Customer
  section Pay
    Enter payment: 3: Customer
```

Expected labels: `Checkout`, `Browse`, `Pay`, `Find item`, `Customer`, `Enter payment`

### scaling:journey:120-tasks

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Product delivery

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
journey
  title Product delivery
  section Stage 0
    Task 0: 1: Alice, Bob
    Task 1: 2: Alice, Bob
    Task 2: 3: Alice, Bob
    Task 3: 4: Alice, Bob
    Task 4: 5: Alice, Bob
    Task 5: 1: Alice, Bob
    Task 6: 2: Alice, Bob
    Task 7: 3: Alice, Bob
    Task 8: 4: Alice, Bob
    Task 9: 5: Alice, Bob
    Task 10: 1: Alice, Bob
    Task 11: 2: Alice, Bob
  section Stage 1
    Task 12: 3: Alice, Bob
    Task 13: 4: Alice, Bob
    Task 14: 5: Alice, Bob
    Task 15: 1: Alice, Bob
    Task 16: 2: Alice, Bob
    Task 17: 3: Alice, Bob
    Task 18: 4: Alice, Bob
    Task 19: 5: Alice, Bob
    Task 20: 1: Alice, Bob
    Task 21: 2: Alice, Bob
    Task 22: 3: Alice, Bob
    Task 23: 4: Alice, Bob
  section Stage 2
    Task 24: 5: Alice, Bob
    Task 25: 1: Alice, Bob
    Task 26: 2: Alice, Bob
    Task 27: 3: Alice, Bob
    Task 28: 4: Alice, Bob
    Task 29: 5: Alice, Bob
    Task 30: 1: Alice, Bob
    Task 31: 2: Alice, Bob
    Task 32: 3: Alice, Bob
    Task 33: 4: Alice, Bob
    Task 34: 5: Alice, Bob
    Task 35: 1: Alice, Bob
  section Stage 3
    Task 36: 2: Alice, Bob
    Task 37: 3: Alice, Bob
    Task 38: 4: Alice, Bob
    Task 39: 5: Alice, Bob
    Task 40: 1: Alice, Bob
    Task 41: 2: Alice, Bob
    Task 42: 3: Alice, Bob
    Task 43: 4: Alice, Bob
    Task 44: 5: Alice, Bob
    Task 45: 1: Alice, Bob
    Task 46: 2: Alice, Bob
    Task 47: 3: Alice, Bob
  section Stage 4
    Task 48: 4: Alice, Bob
    Task 49: 5: Alice, Bob
    Task 50: 1: Alice, Bob
    Task 51: 2: Alice, Bob
    Task 52: 3: Alice, Bob
    Task 53: 4: Alice, Bob
    Task 54: 5: Alice, Bob
    Task 55: 1: Alice, Bob
    Task 56: 2: Alice, Bob
    Task 57: 3: Alice, Bob
    Task 58: 4: Alice, Bob
    Task 59: 5: Alice, Bob
  section Stage 5
    Task 60: 1: Alice, Bob
    Task 61: 2: Alice, Bob
    Task 62: 3: Alice, Bob
    Task 63: 4: Alice, Bob
    Task 64: 5: Alice, Bob
    Task 65: 1: Alice, Bob
    Task 66: 2: Alice, Bob
    Task 67: 3: Alice, Bob
    Task 68: 4: Alice, Bob
    Task 69: 5: Alice, Bob
    Task 70: 1: Alice, Bob
    Task 71: 2: Alice, Bob
  section Stage 6
    Task 72: 3: Alice, Bob
    Task 73: 4: Alice, Bob
    Task 74: 5: Alice, Bob
    Task 75: 1: Alice, Bob
    Task 76: 2: Alice, Bob
    Task 77: 3: Alice, Bob
    Task 78: 4: Alice, Bob
    Task 79: 5: Alice, Bob
    Task 80: 1: Alice, Bob
    Task 81: 2: Alice, Bob
    Task 82: 3: Alice, Bob
    Task 83: 4: Alice, Bob
  section Stage 7
    Task 84: 5: Alice, Bob
    Task 85: 1: Alice, Bob
    Task 86: 2: Alice, Bob
    Task 87: 3: Alice, Bob
    Task 88: 4: Alice, Bob
    Task 89: 5: Alice, Bob
    Task 90: 1: Alice, Bob
    Task 91: 2: Alice, Bob
    Task 92: 3: Alice, Bob
    Task 93: 4: Alice, Bob
    Task 94: 5: Alice, Bob
    Task 95: 1: Alice, Bob
  section Stage 8
    Task 96: 2: Alice, Bob
    Task 97: 3: Alice, Bob
    Task 98: 4: Alice, Bob
    Task 99: 5: Alice, Bob
    Task 100: 1: Alice, Bob
    Task 101: 2: Alice, Bob
    Task 102: 3: Alice, Bob
    Task 103: 4: Alice, Bob
    Task 104: 5: Alice, Bob
    Task 105: 1: Alice, Bob
    Task 106: 2: Alice, Bob
    Task 107: 3: Alice, Bob
  section Stage 9
    Task 108: 4: Alice, Bob
    Task 109: 5: Alice, Bob
    Task 110: 1: Alice, Bob
    Task 111: 2: Alice, Bob
    Task 112: 3: Alice, Bob
    Task 113: 4: Alice, Bob
    Task 114: 5: Alice, Bob
    Task 115: 1: Alice, Bob
    Task 116: 2: Alice, Bob
    Task 117: 3: Alice, Bob
    Task 118: 4: Alice, Bob
    Task 119: 5: Alice, Bob
```

Expected labels: `Product delivery`, `Stage 0`, `Stage 1`, `Stage 2`, `Stage 3`, `Stage 4`, `Stage 5`, `Stage 6`, `Stage 7`, `Stage 8`, `Stage 9`, `Task 0`, `Alice`, `Bob`, `Task 1`, `Task 2`, `Task 3`, `Task 4`, `Task 5`, `Task 6`, `Task 7`, `Task 8`, `Task 9`, `Task 10`, `Task 11`, `Task 12`, `Task 13`, `Task 14`, `Task 15`, `Task 16`, `Task 17`, `Task 18`, `Task 19`, `Task 20`, `Task 21`, `Task 22`, `Task 23`, `Task 24`, `Task 25`, `Task 26`, `Task 27`, `Task 28`, `Task 29`, `Task 30`, `Task 31`, `Task 32`, `Task 33`, `Task 34`, `Task 35`, `Task 36`, `Task 37`, `Task 38`, `Task 39`, `Task 40`, `Task 41`, `Task 42`, `Task 43`, `Task 44`, `Task 45`, `Task 46`, `Task 47`, `Task 48`, `Task 49`, `Task 50`, `Task 51`, `Task 52`, `Task 53`, `Task 54`, `Task 55`, `Task 56`, `Task 57`, `Task 58`, `Task 59`, `Task 60`, `Task 61`, `Task 62`, `Task 63`, `Task 64`, `Task 65`, `Task 66`, `Task 67`, `Task 68`, `Task 69`, `Task 70`, `Task 71`, `Task 72`, `Task 73`, `Task 74`, `Task 75`, `Task 76`, `Task 77`, `Task 78`, `Task 79`, `Task 80`, `Task 81`, `Task 82`, `Task 83`, `Task 84`, `Task 85`, `Task 86`, `Task 87`, `Task 88`, `Task 89`, `Task 90`, `Task 91`, `Task 92`, `Task 93`, `Task 94`, `Task 95`, `Task 96`, `Task 97`, `Task 98`, `Task 99`, `Task 100`, `Task 101`, `Task 102`, `Task 103`, `Task 104`, `Task 105`, `Task 106`, `Task 107`, `Task 108`, `Task 109`, `Task 110`, `Task 111`, `Task 112`, `Task 113`, `Task 114`, `Task 115`, `Task 116`, `Task 117`, `Task 118`, `Task 119`

### corpus:mermaid-upstream-suite-bench:journey-upstream-should-handle-a-title-definition

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Adding journey diagram functionality to mermaid

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
journey
title Adding journey diagram functionality to mermaid
```

Expected labels: `Adding journey diagram functionality to mermaid`

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

### corpus:mermaid-kanban-bench:kanban-spec-1

Node API, SVG. Error: Missing authored label: root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
    root
```

Expected labels: `root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-3

Node API, SVG. Error: Missing authored label: root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
    (root)
```

Expected labels: `root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-5

Node API, SVG. Error: Missing authored label: section1; Missing authored label: section2

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
    section1
    section2
```

Expected labels: `section1`, `section2`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-7

Node API, SVG. Error: Missing authored label: The root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
    root[The root]
      
```

Expected labels: `The root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-10

Node API, SVG. Error: Missing authored label: The root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
    root[The root]
    ::icon(bomb)
    
```

Expected labels: `The root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-11

Node API, SVG. Error: Missing authored label: The root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
    root[The root]
    :::m-4 p-8
    
```

Expected labels: `The root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-12

Node API, SVG. Error: Missing authored label: The root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
    root[The root]
    :::m-4 p-8
    ::icon(bomb)
    
```

Expected labels: `The root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-13

Node API, SVG. Error: Missing authored label: The root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
    root[The root]
    ::icon(bomb)
    :::m-4 p-8
    
```

Expected labels: `The root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-14

Node API, SVG. Error: Missing authored label: String containing []

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
    root["String containing []"]

```

Expected labels: `String containing []`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-23

Node API, SVG. Error: Missing authored label: root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
        root@{ priority: high }
    
```

Expected labels: `root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-24

Node API, SVG. Error: Missing authored label: root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
        root@{ assigned: knsv }
    
```

Expected labels: `root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-25

Node API, SVG. Error: Missing authored label: root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
        root@{ icon: star }
    
```

Expected labels: `root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-28

Node API, SVG. Error: Missing authored label: root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
        root@{ icon: star, assigned: knsv }
    
```

Expected labels: `root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-29

Node API, SVG. Error: Missing authored label: fix things

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
        root@{ icon: star, label: 'fix things' }
    
```

Expected labels: `fix things`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-30

Node API, SVG. Error: Missing authored label: root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
        root@{ ticket: MC-1234 }
    
```

Expected labels: `root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-1

Node API, SVG. Error: Missing authored label: In progress; Missing authored label: Very High; Missing authored label: High; Missing authored label: Default priority; Missing authored label: Low; Missing authored label: Very Low

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Exercises every supported kanban `priority` metadata value (Very High,
  High, Low, Very Low) side by side with a default/unset-priority item,
  verifying each priority tier's distinct visual indicator renders
  correctly.
---
kanban
  id2[In progress]
  vh[Very High]@{ priority: 'Very High' }
  h[High]@{ priority: 'High' }
  m[Default priority]
  l[Low]@{ priority: 'Low' }
  vl[Very Low]@{ priority: 'Very Low' }

```

Expected labels: `In progress`, `Very High`, `High`, `Default priority`, `Low`, `Very Low`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-2

Node API, SVG. Error: Missing authored label: Todo; Missing authored label: Create Documentation; Missing authored label: Create Blog about the new diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Baseline kanban fixture with three items (Todo, Create Documentation,
  Create Blog about the new diagram) at the same indentation level. Since
  the kanban grammar treats same-indent siblings as new sections rather
  than child cards, all three render as separate top-level columns.
---
kanban
  id1[Todo]
  docs[Create Documentation]
  docs[Create Blog about the new diagram]

```

Expected labels: `Todo`, `Create Documentation`, `Create Blog about the new diagram`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-3

Node API, SVG. Error: Missing authored label: Todo; Missing authored label: Create Documentation; Missing authored label: Create Blog about the new diagram; Missing authored label: In progress; Missing authored label: Create renderer so that it works in all cases. We also add some extra text here for testing purposes. And some more just for the extra flare.; Missing authored label: Design grammar; Missing authored label: Ready for deploy; Missing authored label: Ready for test; Missing authored label: Done; Missing authored label: define getData; Missing authored label: Title of diagram is more than 100 chars when user duplicates diagram with 100 char; Missing authored label: Update DB function; Missing authored label: Create parsing tests; Missing authored label: last item; Missing authored label: Can't reproduce

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Large "kitchen sink" kanban fixture combining many items in one diagram:
  a long wrapping text label, and the assigned/ticket/priority metadata
  keys (@{...}) in various combinations across several items. Since every
  line shares the same indentation, each of the 15 items becomes its own
  top-level column rather than a card nested under a section, so this is
  really a stress test of many adjacent columns and metadata combinations
  side by side.
---
kanban
  id1[Todo]
  docs[Create Documentation]
  docs[Create Blog about the new diagram]
  id7[In progress]
  id6[Create renderer so that it works in all cases. We also add some extra text here for testing purposes. And some more just for the extra flare.]
  id8[Design grammar]@{ assigned: 'knsv' }
  id9[Ready for deploy]
  id10[Ready for test]
  id11[Done]
  id5[define getData]
  id2[Title of diagram is more than 100 chars when user duplicates diagram with 100 char]@{ ticket: MC-2036, priority: 'Very High'}
  id3[Update DB function]@{ ticket: MC-2037, assigned: knsv, priority: 'High' }
  id4[Create parsing tests]@{ ticket: MC-2038, assigned: 'K.Sveidqvist', priority: 'High' }
  id66[last item]@{ priority: 'Very Low', assigned: 'knsv' }
  id12[Can't reproduce]

```

Expected labels: `Todo`, `Create Documentation`, `Create Blog about the new diagram`, `In progress`, `Create renderer so that it works in all cases. We also add some extra text here for testing purposes. And some more just for the extra flare.`, `Design grammar`, `Ready for deploy`, `Ready for test`, `Done`, `define getData`, `Title of diagram is more than 100 chars when user duplicates diagram with 100 char`, `Update DB function`, `Create parsing tests`, `last item`, `Can't reproduce`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-4

Node API, SVG. Error: Missing authored label: Todo; Missing authored label: Create Documentation; Missing authored label: id2; Missing authored label: Create Blog about the new diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Four items at the same indent level, including a bare id-only entry
  (id2, no [label]) that falls back to its id as the label. Since none are
  indented deeper than the first, each becomes its own top-level kanban
  section, exercising both the flat multi-section layout and an
  unlabeled node id.
---
kanban
  id1[Todo]
  docs[Create Documentation]
  id2
  docs[Create Blog about the new diagram]

```

Expected labels: `Todo`, `Create Documentation`, `id2`, `Create Blog about the new diagram`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-5

Node API, SVG. Error: Missing authored label: Todo; Missing authored label: Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Two-section kanban board where the second section's title is a single
  line over 100 characters, verifying the section-title wrapping and
  height logic for long text.
---
kanban
  id1[Todo]
  id2[Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping]

```

Expected labels: `Todo`, `Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-6

Node API, SVG. Error: Missing authored label: Todo; Missing authored label: One line; Missing authored label: Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Three-section kanban board where the long (>100 char) wrapping title is
  the last section, checking that a wrapping section header at the end of
  the board doesn't clip or misalign the layout. Sibling variant of the
  "-at-the-top" and "-in-the-middle" fixtures testing the same wrap-height
  logic at a different list position.
---
kanban
  id1[Todo]
  id2[One line]
  id3[Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping]

```

Expected labels: `Todo`, `One line`, `Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-7

Node API, SVG. Error: Missing authored label: Todo; Missing authored label: Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping; Missing authored label: One line

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Three-section kanban board with the long (>100 char) wrapping title
  placed second, immediately after Todo, near the top of the list rather
  than at the end or middle. Sibling variant of the "-at-the-end" and
  "-in-the-middle" fixtures testing wrap-height calculation at a
  different list position.
---
kanban
  id1[Todo]
  id2[Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping]
  id3[One line]

```

Expected labels: `Todo`, `Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping`, `One line`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-8

Node API, SVG. Error: Missing authored label: Todo; Missing authored label: Create Documentation; Missing authored label: In progress; Missing authored label: Create Blog about the new diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Kanban fixture exercising the `assigned` metadata key
  (@{ assigned: 'knsv' }) on one item, alongside three plain unassigned
  items, verifying assignee rendering.
---
kanban
  id1[Todo]
  docs[Create Documentation]
  id2[In progress]
  docs[Create Blog about the new diagram]@{ assigned: 'knsv' }

```

Expected labels: `Todo`, `Create Documentation`, `In progress`, `Create Blog about the new diagram`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-9

Node API, SVG. Error: Missing authored label: Todo; Missing authored label: One line; Missing authored label: Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Four-section kanban board with the long (>100 char) wrapping title
  placed third, in the middle of the list and flanked by short one-line
  sections on both sides. Sibling variant of the "-at-the-end" and
  "-at-the-top" fixtures testing wrap-height calculation mid-list.
---
kanban
  id1[Todo]
  id2[One line]
  id3[Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping]
  id4[One line]

```

Expected labels: `Todo`, `One line`, `Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-10

Node API, SVG. Error: Missing authored label: Todo; Missing authored label: Create Documentation; Missing authored label: In progress; Missing authored label: Create Blog about the new diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Kanban fixture exercising the `ticket` metadata key
  (@{ ticket: MC-2037 }) on one item to verify the ticket-reference badge
  renders. No `ticketBaseUrl` config is set here, so it renders without a
  hyperlink.
---
kanban
  id1[Todo]
  docs[Create Documentation]
  id2[In progress]
  docs[Create Blog about the new diagram]@{ ticket: MC-2037 }

```

Expected labels: `Todo`, `Create Documentation`, `In progress`, `Create Blog about the new diagram`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-11

Node API, SVG. Error: Missing authored label: In progress; Missing authored label: Create Blog about the new diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Single kanban item combining all three metadata keys at once - priority
  ('Very Low'), ticket (MC-2037), and assigned ('knsv') - verifying they
  render together correctly on one card rather than each metadata kind
  being tested in isolation.
---
kanban
  id2[In progress]
  docs[Create Blog about the new diagram]@{ priority: 'Very Low', ticket: MC-2037, assigned: 'knsv' }

```

Expected labels: `In progress`, `Create Blog about the new diagram`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-docs-3

Node API, SVG. Error: Missing authored label: Weird flickering in Firefox

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  kanban:
    ticketBaseUrl: 'https://mermaidchart.atlassian.net/browse/#TICKET#'
---
kanban
  Todo
    [Create Documentation]
    docs[Create Blog about the new diagram]
  [In progress]
    id6[Create renderer so that it works in all cases. We also add some extra text here for testing purposes. And some more just for the extra flare.]
  id9[Ready for deploy]
    id8[Design grammar]@{ assigned: 'knsv' }
  id10[Ready for test]
    id4[Create parsing tests]@{ ticket: MC-2038, assigned: 'K.Sveidqvist', priority: 'High' }
    id66[last item]@{ priority: 'Very Low', assigned: 'knsv' }
  id11[Done]
    id5[define getData]
    id2[Title of diagram is more than 100 chars when user duplicates diagram with 100 char]@{ ticket: MC-2036, priority: 'Very High'}
    id3[Update DB function]@{ ticket: MC-2037, assigned: knsv, priority: 'High' }

  id12[Can't reproduce]
    id3[Weird flickering in Firefox]

```

Expected labels: `Todo`, `Create Documentation`, `Create Blog about the new diagram`, `In progress`, `Create renderer so that it works in all cases. We also add some extra text here for testing purposes. And some more just for the extra flare.`, `Ready for deploy`, `Design grammar`, `Ready for test`, `Create parsing tests`, `last item`, `Done`, `define getData`, `Title of diagram is more than 100 chars when user duplicates diagram with 100 char`, `Update DB function`, `Can't reproduce`, `Weird flickering in Firefox`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-3

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
    (root)
```

Expected labels: `root`

### corpus:mermaid-kanban-bench:kanban-spec-8

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): child1

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
    root
      theId(child1)
```

Expected labels: `root`, `child1`

### corpus:mermaid-kanban-bench:kanban-spec-9

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): child1

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
root
      theId(child1)
```

Expected labels: `root`, `child1`

### corpus:mermaid-kanban-bench:kanban-spec-16

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Root, Child, a

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
  root(Root)
    Child(Child)
    :::hot
      a(a)
      b[New Stuff]
```

Expected labels: `Root`, `Child`, `a`, `New Stuff`

### corpus:mermaid-kanban-bench:kanban-spec-17

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Root, Child, a

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
  root(Root)
    Child(Child)
      a(a)

      b[New Stuff]
```

Expected labels: `Root`, `Child`, `a`, `New Stuff`

### corpus:mermaid-kanban-bench:kanban-spec-18

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Root, Child, a

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
  root(Root)
    Child(Child)
      a(a)

      %% This is a comment
      b[New Stuff]
```

Expected labels: `Root`, `Child`, `a`, `New Stuff`

### corpus:mermaid-kanban-bench:kanban-spec-19

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Root, Child, a

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
  root(Root)
    Child(Child)
      a(a) %% This is a comment
      b[New Stuff]
```

Expected labels: `Root`, `Child`, `a`, `New Stuff`

### corpus:mermaid-kanban-bench:kanban-spec-27

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
        root@{
          icon: star
          assigned: knsv
        }
    
```

Expected labels: `root`

### corpus:mermaid-kanban-bench:kanban-spec-29

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): fix things

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
        root@{ icon: star, label: 'fix things' }
    
```

Expected labels: `fix things`

### corpus:mermaid-kanban-bench:kanban-render-2

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Create Blog about the new diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Baseline kanban fixture with three items (Todo, Create Documentation,
  Create Blog about the new diagram) at the same indentation level. Since
  the kanban grammar treats same-indent siblings as new sections rather
  than child cards, all three render as separate top-level columns.
---
kanban
  id1[Todo]
  docs[Create Documentation]
  docs[Create Blog about the new diagram]

```

Expected labels: `Todo`, `Create Documentation`, `Create Blog about the new diagram`

### corpus:mermaid-kanban-bench:kanban-render-3

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Create Blog about the new diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Large "kitchen sink" kanban fixture combining many items in one diagram:
  a long wrapping text label, and the assigned/ticket/priority metadata
  keys (@{...}) in various combinations across several items. Since every
  line shares the same indentation, each of the 15 items becomes its own
  top-level column rather than a card nested under a section, so this is
  really a stress test of many adjacent columns and metadata combinations
  side by side.
---
kanban
  id1[Todo]
  docs[Create Documentation]
  docs[Create Blog about the new diagram]
  id7[In progress]
  id6[Create renderer so that it works in all cases. We also add some extra text here for testing purposes. And some more just for the extra flare.]
  id8[Design grammar]@{ assigned: 'knsv' }
  id9[Ready for deploy]
  id10[Ready for test]
  id11[Done]
  id5[define getData]
  id2[Title of diagram is more than 100 chars when user duplicates diagram with 100 char]@{ ticket: MC-2036, priority: 'Very High'}
  id3[Update DB function]@{ ticket: MC-2037, assigned: knsv, priority: 'High' }
  id4[Create parsing tests]@{ ticket: MC-2038, assigned: 'K.Sveidqvist', priority: 'High' }
  id66[last item]@{ priority: 'Very Low', assigned: 'knsv' }
  id12[Can't reproduce]

```

Expected labels: `Todo`, `Create Documentation`, `Create Blog about the new diagram`, `In progress`, `Create renderer so that it works in all cases. We also add some extra text here for testing purposes. And some more just for the extra flare.`, `Design grammar`, `Ready for deploy`, `Ready for test`, `Done`, `define getData`, `Title of diagram is more than 100 chars when user duplicates diagram with 100 char`, `Update DB function`, `Create parsing tests`, `last item`, `Can't reproduce`

### corpus:mermaid-kanban-bench:kanban-render-4

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Create Blog about the new diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Four items at the same indent level, including a bare id-only entry
  (id2, no [label]) that falls back to its id as the label. Since none are
  indented deeper than the first, each becomes its own top-level kanban
  section, exercising both the flat multi-section layout and an
  unlabeled node id.
---
kanban
  id1[Todo]
  docs[Create Documentation]
  id2
  docs[Create Blog about the new diagram]

```

Expected labels: `Todo`, `Create Documentation`, `id2`, `Create Blog about the new diagram`

### corpus:mermaid-kanban-bench:kanban-render-8

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Create Blog about the new diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Kanban fixture exercising the `assigned` metadata key
  (@{ assigned: 'knsv' }) on one item, alongside three plain unassigned
  items, verifying assignee rendering.
---
kanban
  id1[Todo]
  docs[Create Documentation]
  id2[In progress]
  docs[Create Blog about the new diagram]@{ assigned: 'knsv' }

```

Expected labels: `Todo`, `Create Documentation`, `In progress`, `Create Blog about the new diagram`

### corpus:mermaid-kanban-bench:kanban-render-10

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Create Blog about the new diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Kanban fixture exercising the `ticket` metadata key
  (@{ ticket: MC-2037 }) on one item to verify the ticket-reference badge
  renders. No `ticketBaseUrl` config is set here, so it renders without a
  hyperlink.
---
kanban
  id1[Todo]
  docs[Create Documentation]
  id2[In progress]
  docs[Create Blog about the new diagram]@{ ticket: MC-2037 }

```

Expected labels: `Todo`, `Create Documentation`, `In progress`, `Create Blog about the new diagram`

### corpus:mermaid-kanban-bench:kanban-docs-3

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Weird flickering in Firefox

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  kanban:
    ticketBaseUrl: 'https://mermaidchart.atlassian.net/browse/#TICKET#'
---
kanban
  Todo
    [Create Documentation]
    docs[Create Blog about the new diagram]
  [In progress]
    id6[Create renderer so that it works in all cases. We also add some extra text here for testing purposes. And some more just for the extra flare.]
  id9[Ready for deploy]
    id8[Design grammar]@{ assigned: 'knsv' }
  id10[Ready for test]
    id4[Create parsing tests]@{ ticket: MC-2038, assigned: 'K.Sveidqvist', priority: 'High' }
    id66[last item]@{ priority: 'Very Low', assigned: 'knsv' }
  id11[Done]
    id5[define getData]
    id2[Title of diagram is more than 100 chars when user duplicates diagram with 100 char]@{ ticket: MC-2036, priority: 'Very High'}
    id3[Update DB function]@{ ticket: MC-2037, assigned: knsv, priority: 'High' }

  id12[Can't reproduce]
    id3[Weird flickering in Firefox]

```

Expected labels: `Todo`, `Create Documentation`, `Create Blog about the new diagram`, `In progress`, `Create renderer so that it works in all cases. We also add some extra text here for testing purposes. And some more just for the extra flare.`, `Ready for deploy`, `Design grammar`, `Ready for test`, `Create parsing tests`, `last item`, `Done`, `define getData`, `Title of diagram is more than 100 chars when user duplicates diagram with 100 char`, `Update DB function`, `Can't reproduce`, `Weird flickering in Firefox`

### corpus:mermaid-kanban-bench:kanban-spec-1

browser API, SVG. Missing authored label: root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
    root
```

Expected labels: `root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-3

browser API, SVG. Missing authored label: root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
    (root)
```

Expected labels: `root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-5

browser API, SVG. Missing authored label: section1; Missing authored label: section2

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
    section1
    section2
```

Expected labels: `section1`, `section2`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-7

browser API, SVG. Missing authored label: The root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
    root[The root]
      
```

Expected labels: `The root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-10

browser API, SVG. Missing authored label: The root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
    root[The root]
    ::icon(bomb)
    
```

Expected labels: `The root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-11

browser API, SVG. Missing authored label: The root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
    root[The root]
    :::m-4 p-8
    
```

Expected labels: `The root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-12

browser API, SVG. Missing authored label: The root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
    root[The root]
    :::m-4 p-8
    ::icon(bomb)
    
```

Expected labels: `The root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-13

browser API, SVG. Missing authored label: The root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
    root[The root]
    ::icon(bomb)
    :::m-4 p-8
    
```

Expected labels: `The root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-14

browser API, SVG. Missing authored label: String containing []

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
    root["String containing []"]

```

Expected labels: `String containing []`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-23

browser API, SVG. Missing authored label: root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
        root@{ priority: high }
    
```

Expected labels: `root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-24

browser API, SVG. Missing authored label: root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
        root@{ assigned: knsv }
    
```

Expected labels: `root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-25

browser API, SVG. Missing authored label: root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
        root@{ icon: star }
    
```

Expected labels: `root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-28

browser API, SVG. Missing authored label: root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
        root@{ icon: star, assigned: knsv }
    
```

Expected labels: `root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-29

browser API, SVG. Missing authored label: fix things

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
        root@{ icon: star, label: 'fix things' }
    
```

Expected labels: `fix things`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-spec-30

browser API, SVG. Missing authored label: root

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
kanban
        root@{ ticket: MC-1234 }
    
```

Expected labels: `root`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-1

browser API, SVG. Missing authored label: In progress; Missing authored label: Very High; Missing authored label: High; Missing authored label: Default priority; Missing authored label: Low; Missing authored label: Very Low

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Exercises every supported kanban `priority` metadata value (Very High,
  High, Low, Very Low) side by side with a default/unset-priority item,
  verifying each priority tier's distinct visual indicator renders
  correctly.
---
kanban
  id2[In progress]
  vh[Very High]@{ priority: 'Very High' }
  h[High]@{ priority: 'High' }
  m[Default priority]
  l[Low]@{ priority: 'Low' }
  vl[Very Low]@{ priority: 'Very Low' }

```

Expected labels: `In progress`, `Very High`, `High`, `Default priority`, `Low`, `Very Low`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-2

browser API, SVG. Missing authored label: Todo; Missing authored label: Create Documentation; Missing authored label: Create Blog about the new diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Baseline kanban fixture with three items (Todo, Create Documentation,
  Create Blog about the new diagram) at the same indentation level. Since
  the kanban grammar treats same-indent siblings as new sections rather
  than child cards, all three render as separate top-level columns.
---
kanban
  id1[Todo]
  docs[Create Documentation]
  docs[Create Blog about the new diagram]

```

Expected labels: `Todo`, `Create Documentation`, `Create Blog about the new diagram`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-3

browser API, SVG. Missing authored label: Todo; Missing authored label: Create Documentation; Missing authored label: Create Blog about the new diagram; Missing authored label: In progress; Missing authored label: Create renderer so that it works in all cases. We also add some extra text here for testing purposes. And some more just for the extra flare.; Missing authored label: Design grammar; Missing authored label: Ready for deploy; Missing authored label: Ready for test; Missing authored label: Done; Missing authored label: define getData; Missing authored label: Title of diagram is more than 100 chars when user duplicates diagram with 100 char; Missing authored label: Update DB function; Missing authored label: Create parsing tests; Missing authored label: last item; Missing authored label: Can't reproduce

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Large "kitchen sink" kanban fixture combining many items in one diagram:
  a long wrapping text label, and the assigned/ticket/priority metadata
  keys (@{...}) in various combinations across several items. Since every
  line shares the same indentation, each of the 15 items becomes its own
  top-level column rather than a card nested under a section, so this is
  really a stress test of many adjacent columns and metadata combinations
  side by side.
---
kanban
  id1[Todo]
  docs[Create Documentation]
  docs[Create Blog about the new diagram]
  id7[In progress]
  id6[Create renderer so that it works in all cases. We also add some extra text here for testing purposes. And some more just for the extra flare.]
  id8[Design grammar]@{ assigned: 'knsv' }
  id9[Ready for deploy]
  id10[Ready for test]
  id11[Done]
  id5[define getData]
  id2[Title of diagram is more than 100 chars when user duplicates diagram with 100 char]@{ ticket: MC-2036, priority: 'Very High'}
  id3[Update DB function]@{ ticket: MC-2037, assigned: knsv, priority: 'High' }
  id4[Create parsing tests]@{ ticket: MC-2038, assigned: 'K.Sveidqvist', priority: 'High' }
  id66[last item]@{ priority: 'Very Low', assigned: 'knsv' }
  id12[Can't reproduce]

```

Expected labels: `Todo`, `Create Documentation`, `Create Blog about the new diagram`, `In progress`, `Create renderer so that it works in all cases. We also add some extra text here for testing purposes. And some more just for the extra flare.`, `Design grammar`, `Ready for deploy`, `Ready for test`, `Done`, `define getData`, `Title of diagram is more than 100 chars when user duplicates diagram with 100 char`, `Update DB function`, `Create parsing tests`, `last item`, `Can't reproduce`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-4

browser API, SVG. Missing authored label: Todo; Missing authored label: Create Documentation; Missing authored label: id2; Missing authored label: Create Blog about the new diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Four items at the same indent level, including a bare id-only entry
  (id2, no [label]) that falls back to its id as the label. Since none are
  indented deeper than the first, each becomes its own top-level kanban
  section, exercising both the flat multi-section layout and an
  unlabeled node id.
---
kanban
  id1[Todo]
  docs[Create Documentation]
  id2
  docs[Create Blog about the new diagram]

```

Expected labels: `Todo`, `Create Documentation`, `id2`, `Create Blog about the new diagram`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-5

browser API, SVG. Missing authored label: Todo; Missing authored label: Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Two-section kanban board where the second section's title is a single
  line over 100 characters, verifying the section-title wrapping and
  height logic for long text.
---
kanban
  id1[Todo]
  id2[Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping]

```

Expected labels: `Todo`, `Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-6

browser API, SVG. Missing authored label: Todo; Missing authored label: One line; Missing authored label: Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Three-section kanban board where the long (>100 char) wrapping title is
  the last section, checking that a wrapping section header at the end of
  the board doesn't clip or misalign the layout. Sibling variant of the
  "-at-the-top" and "-in-the-middle" fixtures testing the same wrap-height
  logic at a different list position.
---
kanban
  id1[Todo]
  id2[One line]
  id3[Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping]

```

Expected labels: `Todo`, `One line`, `Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-7

browser API, SVG. Missing authored label: Todo; Missing authored label: Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping; Missing authored label: One line

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Three-section kanban board with the long (>100 char) wrapping title
  placed second, immediately after Todo, near the top of the list rather
  than at the end or middle. Sibling variant of the "-at-the-end" and
  "-in-the-middle" fixtures testing wrap-height calculation at a
  different list position.
---
kanban
  id1[Todo]
  id2[Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping]
  id3[One line]

```

Expected labels: `Todo`, `Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping`, `One line`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-8

browser API, SVG. Missing authored label: Todo; Missing authored label: Create Documentation; Missing authored label: In progress; Missing authored label: Create Blog about the new diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Kanban fixture exercising the `assigned` metadata key
  (@{ assigned: 'knsv' }) on one item, alongside three plain unassigned
  items, verifying assignee rendering.
---
kanban
  id1[Todo]
  docs[Create Documentation]
  id2[In progress]
  docs[Create Blog about the new diagram]@{ assigned: 'knsv' }

```

Expected labels: `Todo`, `Create Documentation`, `In progress`, `Create Blog about the new diagram`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-9

browser API, SVG. Missing authored label: Todo; Missing authored label: One line; Missing authored label: Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Four-section kanban board with the long (>100 char) wrapping title
  placed third, in the middle of the list and flanked by short one-line
  sections on both sides. Sibling variant of the "-at-the-end" and
  "-at-the-top" fixtures testing wrap-height calculation mid-list.
---
kanban
  id1[Todo]
  id2[One line]
  id3[Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping]
  id4[One line]

```

Expected labels: `Todo`, `One line`, `Title of diagram is more than 100 chars when user duplicates diagram with 100 char, wrapping`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-10

browser API, SVG. Missing authored label: Todo; Missing authored label: Create Documentation; Missing authored label: In progress; Missing authored label: Create Blog about the new diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Kanban fixture exercising the `ticket` metadata key
  (@{ ticket: MC-2037 }) on one item to verify the ticket-reference badge
  renders. No `ticketBaseUrl` config is set here, so it renders without a
  hyperlink.
---
kanban
  id1[Todo]
  docs[Create Documentation]
  id2[In progress]
  docs[Create Blog about the new diagram]@{ ticket: MC-2037 }

```

Expected labels: `Todo`, `Create Documentation`, `In progress`, `Create Blog about the new diagram`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-render-11

browser API, SVG. Missing authored label: In progress; Missing authored label: Create Blog about the new diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Single kanban item combining all three metadata keys at once - priority
  ('Very Low'), ticket (MC-2037), and assigned ('knsv') - verifying they
  render together correctly on one card rather than each metadata kind
  being tested in isolation.
---
kanban
  id2[In progress]
  docs[Create Blog about the new diagram]@{ priority: 'Very Low', ticket: MC-2037, assigned: 'knsv' }

```

Expected labels: `In progress`, `Create Blog about the new diagram`

Rendered output is retained in the local owning evidence and omitted from this compact snapshot.

### corpus:mermaid-kanban-bench:kanban-docs-3

browser API, SVG. Missing authored label: Weird flickering in Firefox

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  kanban:
    ticketBaseUrl: 'https://mermaidchart.atlassian.net/browse/#TICKET#'
---
kanban
  Todo
    [Create Documentation]
    docs[Create Blog about the new diagram]
  [In progress]
    id6[Create renderer so that it works in all cases. We also add some extra text here for testing purposes. And some more just for the extra flare.]
  id9[Ready for deploy]
    id8[Design grammar]@{ assigned: 'knsv' }
  id10[Ready for test]
    id4[Create parsing tests]@{ ticket: MC-2038, assigned: 'K.Sveidqvist', priority: 'High' }
    id66[last item]@{ priority: 'Very Low', assigned: 'knsv' }
  id11[Done]
    id5[define getData]
    id2[Title of diagram is more than 100 chars when user duplicates diagram with 100 char]@{ ticket: MC-2036, priority: 'Very High'}
    id3[Update DB function]@{ ticket: MC-2037, assigned: knsv, priority: 'High' }

  id12[Can't reproduce]
    id3[Weird flickering in Firefox]

```

Expected labels: `Todo`, `Create Documentation`, `Create Blog about the new diagram`, `In progress`, `Create renderer so that it works in all cases. We also add some extra text here for testing purposes. And some more just for the extra flare.`, `Ready for deploy`, `Design grammar`, `Ready for test`, `Create parsing tests`, `last item`, `Done`, `define getData`, `Title of diagram is more than 100 chars when user duplicates diagram with 100 char`, `Update DB function`, `Can't reproduce`, `Weird flickering in Firefox`

Tool output (13587 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

## mindmap

### editor:mindmap

Node API, SVG. Error: Missing authored label: **Evidence** across interviews, benchmarks, and Unicode naïve café

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
mindmap
  root((Agent-native release))
    discovery[Discovery]
      ::icon(fa fa-book)
      :::urgent large
      evidence["`**Evidence** across
interviews, benchmarks, and Unicode naïve café`"]
      constraints{{Constraints}}
        Security
        Determinism
    delivery(Delivery)
      beta))Beta signal((
      launch)Launch cloud(
      quality[Quality gates]
        Parser round-trip
        SVG identity
        Terminal width
    Ecosystem
      Mermaid parity
      Terminal tools
```

Expected labels: `Agent-native release`, `Discovery`, `**Evidence** across interviews, benchmarks, and Unicode naïve café`, `Constraints`, `Security`, `Determinism`, `Delivery`, `Beta signal`, `Launch cloud`, `Quality gates`, `Parser round-trip`, `SVG identity`, `Terminal width`, `Ecosystem`, `Mermaid parity`, `Terminal tools`

Tool output (20318 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### editor:mindmap

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): **Evidence** across interviews, benchmarks, and Unicode naïve café

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
mindmap
  root((Agent-native release))
    discovery[Discovery]
      ::icon(fa fa-book)
      :::urgent large
      evidence["`**Evidence** across
interviews, benchmarks, and Unicode naïve café`"]
      constraints{{Constraints}}
        Security
        Determinism
    delivery(Delivery)
      beta))Beta signal((
      launch)Launch cloud(
      quality[Quality gates]
        Parser round-trip
        SVG identity
        Terminal width
    Ecosystem
      Mermaid parity
      Terminal tools
```

Expected labels: `Agent-native release`, `Discovery`, `**Evidence** across interviews, benchmarks, and Unicode naïve café`, `Constraints`, `Security`, `Determinism`, `Delivery`, `Beta signal`, `Launch cloud`, `Quality gates`, `Parser round-trip`, `SVG identity`, `Terminal width`, `Ecosystem`, `Mermaid parity`, `Terminal tools`

### editor:mindmap

browser API, SVG. Missing authored label: **Evidence** across interviews, benchmarks, and Unicode naïve café

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
mindmap
  root((Agent-native release))
    discovery[Discovery]
      ::icon(fa fa-book)
      :::urgent large
      evidence["`**Evidence** across
interviews, benchmarks, and Unicode naïve café`"]
      constraints{{Constraints}}
        Security
        Determinism
    delivery(Delivery)
      beta))Beta signal((
      launch)Launch cloud(
      quality[Quality gates]
        Parser round-trip
        SVG identity
        Terminal width
    Ecosystem
      Mermaid parity
      Terminal tools
```

Expected labels: `Agent-native release`, `Discovery`, `**Evidence** across interviews, benchmarks, and Unicode naïve café`, `Constraints`, `Security`, `Determinism`, `Delivery`, `Beta signal`, `Launch cloud`, `Quality gates`, `Parser round-trip`, `SVG identity`, `Terminal width`, `Ecosystem`, `Mermaid parity`, `Terminal tools`

Tool output (20318 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

## packet

### editor:packet

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): UDP datagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
packet
title UDP datagram
+16: "Source port"
+16: "Destination port"
+16: "Length"
+16: "Checksum"
+32: "Payload"
```

Expected labels: `UDP datagram`, `Source port`, `Destination port`, `Length`, `Checksum`, `Payload`

### scaling:packet:240-fields

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Protocol fields

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  packet:
    bitWidth: 80
---
packet
  title Protocol fields
+1: "Field 0"
+2: "Field 1"
+3: "Field 2"
+4: "Field 3"
+5: "Field 4"
+6: "Field 5"
+7: "Field 6"
+8: "Field 7"
+9: "Field 8"
+10: "Field 9"
+11: "Field 10"
+12: "Field 11"
+13: "Field 12"
+14: "Field 13"
+15: "Field 14"
+16: "Field 15"
+17: "Field 16"
+18: "Field 17"
+19: "Field 18"
+20: "Field 19"
+21: "Field 20"
+22: "Field 21"
+23: "Field 22"
+24: "Field 23"
+1: "Field 24"
+2: "Field 25"
+3: "Field 26"
+4: "Field 27"
+5: "Field 28"
+6: "Field 29"
+7: "Field 30"
+8: "Field 31"
+9: "Field 32"
+10: "Field 33"
+11: "Field 34"
+12: "Field 35"
+13: "Field 36"
+14: "Field 37"
+15: "Field 38"
+16: "Field 39"
+17: "Field 40"
+18: "Field 41"
+19: "Field 42"
+20: "Field 43"
+21: "Field 44"
+22: "Field 45"
+23: "Field 46"
+24: "Field 47"
+1: "Field 48"
+2: "Field 49"
+3: "Field 50"
+4: "Field 51"
+5: "Field 52"
+6: "Field 53"
+7: "Field 54"
+8: "Field 55"
+9: "Field 56"
+10: "Field 57"
+11: "Field 58"
+12: "Field 59"
+13: "Field 60"
+14: "Field 61"
+15: "Field 62"
+16: "Field 63"
+17: "Field 64"
+18: "Field 65"
+19: "Field 66"
+20: "Field 67"
+21: "Field 68"
+22: "Field 69"
+23: "Field 70"
+24: "Field 71"
+1: "Field 72"
+2: "Field 73"
+3: "Field 74"
+4: "Field 75"
+5: "Field 76"
+6: "Field 77"
+7: "Field 78"
+8: "Field 79"
+9: "Field 80"
+10: "Field 81"
+11: "Field 82"
+12: "Field 83"
+13: "Field 84"
+14: "Field 85"
+15: "Field 86"
+16: "Field 87"
+17: "Field 88"
+18: "Field 89"
+19: "Field 90"
+20: "Field 91"
+21: "Field 92"
+22: "Field 93"
+23: "Field 94"
+24: "Field 95"
+1: "Field 96"
+2: "Field 97"
+3: "Field 98"
+4: "Field 99"
+5: "Field 100"
+6: "Field 101"
+7: "Field 102"
+8: "Field 103"
+9: "Field 104"
+10: "Field 105"
+11: "Field 106"
+12: "Field 107"
+13: "Field 108"
+14: "Field 109"
+15: "Field 110"
+16: "Field 111"
+17: "Field 112"
+18: "Field 113"
+19: "Field 114"
+20: "Field 115"
+21: "Field 116"
+22: "Field 117"
+23: "Field 118"
+24: "Field 119"
+1: "Field 120"
+2: "Field 121"
+3: "Field 122"
+4: "Field 123"
+5: "Field 124"
+6: "Field 125"
+7: "Field 126"
+8: "Field 127"
+9: "Field 128"
+10: "Field 129"
+11: "Field 130"
+12: "Field 131"
+13: "Field 132"
+14: "Field 133"
+15: "Field 134"
+16: "Field 135"
+17: "Field 136"
+18: "Field 137"
+19: "Field 138"
+20: "Field 139"
+21: "Field 140"
+22: "Field 141"
+23: "Field 142"
+24: "Field 143"
+1: "Field 144"
+2: "Field 145"
+3: "Field 146"
+4: "Field 147"
+5: "Field 148"
+6: "Field 149"
+7: "Field 150"
+8: "Field 151"
+9: "Field 152"
+10: "Field 153"
+11: "Field 154"
+12: "Field 155"
+13: "Field 156"
+14: "Field 157"
+15: "Field 158"
+16: "Field 159"
+17: "Field 160"
+18: "Field 161"
+19: "Field 162"
+20: "Field 163"
+21: "Field 164"
+22: "Field 165"
+23: "Field 166"
+24: "Field 167"
+1: "Field 168"
+2: "Field 169"
+3: "Field 170"
+4: "Field 171"
+5: "Field 172"
+6: "Field 173"
+7: "Field 174"
+8: "Field 175"
+9: "Field 176"
+10: "Field 177"
+11: "Field 178"
+12: "Field 179"
+13: "Field 180"
+14: "Field 181"
+15: "Field 182"
+16: "Field 183"
+17: "Field 184"
+18: "Field 185"
+19: "Field 186"
+20: "Field 187"
+21: "Field 188"
+22: "Field 189"
+23: "Field 190"
+24: "Field 191"
+1: "Field 192"
+2: "Field 193"
+3: "Field 194"
+4: "Field 195"
+5: "Field 196"
+6: "Field 197"
+7: "Field 198"
+8: "Field 199"
+9: "Field 200"
+10: "Field 201"
+11: "Field 202"
+12: "Field 203"
+13: "Field 204"
+14: "Field 205"
+15: "Field 206"
+16: "Field 207"
+17: "Field 208"
+18: "Field 209"
+19: "Field 210"
+20: "Field 211"
+21: "Field 212"
+22: "Field 213"
+23: "Field 214"
+24: "Field 215"
+1: "Field 216"
+2: "Field 217"
+3: "Field 218"
+4: "Field 219"
+5: "Field 220"
+6: "Field 221"
+7: "Field 222"
+8: "Field 223"
+9: "Field 224"
+10: "Field 225"
+11: "Field 226"
+12: "Field 227"
+13: "Field 228"
+14: "Field 229"
+15: "Field 230"
+16: "Field 231"
+17: "Field 232"
+18: "Field 233"
+19: "Field 234"
+20: "Field 235"
+21: "Field 236"
+22: "Field 237"
+23: "Field 238"
+24: "Field 239"
```

Expected labels: `Field 0`, `Field 1`, `Field 2`, `Field 3`, `Field 4`, `Field 5`, `Field 6`, `Field 7`, `Field 8`, `Field 9`, `Field 10`, `Field 11`, `Field 12`, `Field 13`, `Field 14`, `Field 15`, `Field 16`, `Field 17`, `Field 18`, `Field 19`, `Field 20`, `Field 21`, `Field 22`, `Field 23`, `Field 24`, `Field 25`, `Field 26`, `Field 27`, `Field 28`, `Field 29`, `Field 30`, `Field 31`, `Field 32`, `Field 33`, `Field 34`, `Field 35`, `Field 36`, `Field 37`, `Field 38`, `Field 39`, `Field 40`, `Field 41`, `Field 42`, `Field 43`, `Field 44`, `Field 45`, `Field 46`, `Field 47`, `Field 48`, `Field 49`, `Field 50`, `Field 51`, `Field 52`, `Field 53`, `Field 54`, `Field 55`, `Field 56`, `Field 57`, `Field 58`, `Field 59`, `Field 60`, `Field 61`, `Field 62`, `Field 63`, `Field 64`, `Field 65`, `Field 66`, `Field 67`, `Field 68`, `Field 69`, `Field 70`, `Field 71`, `Field 72`, `Field 73`, `Field 74`, `Field 75`, `Field 76`, `Field 77`, `Field 78`, `Field 79`, `Field 80`, `Field 81`, `Field 82`, `Field 83`, `Field 84`, `Field 85`, `Field 86`, `Field 87`, `Field 88`, `Field 89`, `Field 90`, `Field 91`, `Field 92`, `Field 93`, `Field 94`, `Field 95`, `Field 96`, `Field 97`, `Field 98`, `Field 99`, `Field 100`, `Field 101`, `Field 102`, `Field 103`, `Field 104`, `Field 105`, `Field 106`, `Field 107`, `Field 108`, `Field 109`, `Field 110`, `Field 111`, `Field 112`, `Field 113`, `Field 114`, `Field 115`, `Field 116`, `Field 117`, `Field 118`, `Field 119`, `Field 120`, `Field 121`, `Field 122`, `Field 123`, `Field 124`, `Field 125`, `Field 126`, `Field 127`, `Field 128`, `Field 129`, `Field 130`, `Field 131`, `Field 132`, `Field 133`, `Field 134`, `Field 135`, `Field 136`, `Field 137`, `Field 138`, `Field 139`, `Field 140`, `Field 141`, `Field 142`, `Field 143`, `Field 144`, `Field 145`, `Field 146`, `Field 147`, `Field 148`, `Field 149`, `Field 150`, `Field 151`, `Field 152`, `Field 153`, `Field 154`, `Field 155`, `Field 156`, `Field 157`, `Field 158`, `Field 159`, `Field 160`, `Field 161`, `Field 162`, `Field 163`, `Field 164`, `Field 165`, `Field 166`, `Field 167`, `Field 168`, `Field 169`, `Field 170`, `Field 171`, `Field 172`, `Field 173`, `Field 174`, `Field 175`, `Field 176`, `Field 177`, `Field 178`, `Field 179`, `Field 180`, `Field 181`, `Field 182`, `Field 183`, `Field 184`, `Field 185`, `Field 186`, `Field 187`, `Field 188`, `Field 189`, `Field 190`, `Field 191`, `Field 192`, `Field 193`, `Field 194`, `Field 195`, `Field 196`, `Field 197`, `Field 198`, `Field 199`, `Field 200`, `Field 201`, `Field 202`, `Field 203`, `Field 204`, `Field 205`, `Field 206`, `Field 207`, `Field 208`, `Field 209`, `Field 210`, `Field 211`, `Field 212`, `Field 213`, `Field 214`, `Field 215`, `Field 216`, `Field 217`, `Field 218`, `Field 219`, `Field 220`, `Field 221`, `Field 222`, `Field 223`, `Field 224`, `Field 225`, `Field 226`, `Field 227`, `Field 228`, `Field 229`, `Field 230`, `Field 231`, `Field 232`, `Field 233`, `Field 234`, `Field 235`, `Field 236`, `Field 237`, `Field 238`, `Field 239`, `Protocol fields`

### corpus:mermaid-packet-bench:packet-spec-3

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Packet diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
packet
    title Packet diagram
    accTitle: Packet accTitle
    accDescr: Packet accDescription
    0-10: "test"
    
```

Expected labels: `Packet diagram`, `test`

### corpus:mermaid-packet-bench:packet-render-4

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Hello world

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Minimal packet diagram using the `packet-beta` diagram keyword (the
  original/aliased name) instead of `packet`, with a title and a single
  11-bit ranged field, verifying the beta-named alias still parses and
  renders.
---
packet-beta
  title Hello world
  0-10: "hello"

```

Expected labels: `Hello world`, `hello`

### corpus:mermaid-packet-bench:packet-render-6

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Hello world

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
description: >-
  Baseline packet diagram smoke test using the `packet` keyword, with a
  title and a single 11-bit ranged field.
---
packet
  title Hello world
  0-10: "hello"

```

Expected labels: `Hello world`, `hello`

### corpus:mermaid-packet-bench:packet-docs-2

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): UDP Packet

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
packet
title UDP Packet
+16: "Source Port"
+16: "Destination Port"
32-47: "Length"
48-63: "Checksum"
64-95: "Data (variable length)"

```

Expected labels: `UDP Packet`, `Source Port`, `Destination Port`, `Length`, `Checksum`, `Data (variable length)`

## quadrant

### corpus:mermaid-upstream-suite-bench:quadrant-upstream-should-be-able-to-parse-chinese-text-in-y-axis

Node API, SVG. Error: Missing authored label: 低参与度; Missing authored label: 高参与度

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
quadrantChart
y-axis 低参与度 --> 高参与度
```

Expected labels: `低参与度`, `高参与度`

Tool output (4599 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:quadrant-upstream-should-be-able-to-parse-yaxis-text

Node API, SVG. Error: Missing authored label: urgent; Missing authored label: not urgent

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
quadrantChart
y-axis urgent --> not urgent
```

Expected labels: `urgent`, `not urgent`

Tool output (4599 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### portfolio:quadrant:57

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Important ❤

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  quadrantChart:
    chartWidth: 400
    chartHeight: 400
  themeVariables:
    quadrant1TextFill: "ff0000"
---
quadrantChart
  x-axis Urgent --> Not Urgent
  y-axis Not Important --> "Important ❤"
  quadrant-1 Plan
  quadrant-2 Do
  quadrant-3 Delegate
  quadrant-4 Delete
```

Expected labels: `Urgent`, `Not Urgent`, `Not Important`, `Important ❤`, `Plan`, `Do`, `Delegate`, `Delete`

### corpus:mermaid-upstream-suite-bench:quadrant-upstream-should-be-able-to-parse-chinese-text-in-y-axis

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): 低参与度, 高参与度

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
quadrantChart
y-axis 低参与度 --> 高参与度
```

Expected labels: `低参与度`, `高参与度`

### corpus:mermaid-upstream-suite-bench:quadrant-upstream-should-be-able-to-parse-the-whole-chart

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Completeness of Vision ❤, x-axis-2, y-axis-2

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
quadrantChart
      title Analytics and Business Intelligence Platforms
      x-axis "Completeness of Vision ❤" --> "x-axis-2"
      y-axis Ability to Execute --> "y-axis-2"
      quadrant-1 Leaders
      quadrant-2 Challengers
      quadrant-3 Niche
      quadrant-4 Visionaries
      Microsoft: [0.75, 0.75]
      Salesforce: [0.55, 0.60]
      IBM: [0.51, 0.40]
      Incorta: [0.20, 0.30]
```

Expected labels: `Analytics and Business Intelligence Platforms`, `Completeness of Vision ❤`, `x-axis-2`, `Ability to Execute`, `y-axis-2`, `Leaders`, `Challengers`, `Niche`, `Visionaries`, `Incorta`, `IBM`, `Salesforce`, `Microsoft`

### corpus:mermaid-upstream-suite-bench:quadrant-upstream-should-be-able-to-parse-the-whole-chart-with-point-styling-with-all-params-or-some-params

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Completeness of Vision ❤, x-axis-2, y-axis-2

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
quadrantChart
      title Analytics and Business Intelligence Platforms
      x-axis "Completeness of Vision ❤" --> "x-axis-2"
      y-axis Ability to Execute --> "y-axis-2"
      quadrant-1 Leaders
      quadrant-2 Challengers
      quadrant-3 Niche
      quadrant-4 Visionaries
      Microsoft: [0.75, 0.75] radius: 10
      Salesforce: [0.55, 0.60] radius: 10, color: #ff0000
      IBM: [0.51, 0.40] radius: 10, color: #ff0000, stroke-color: #ff00ff
      Incorta: [0.20, 0.30] radius: 10 ,color: #ff0000 ,stroke-color: #ff00ff ,stroke-width: 10px
```

Expected labels: `Analytics and Business Intelligence Platforms`, `Completeness of Vision ❤`, `x-axis-2`, `Ability to Execute`, `y-axis-2`, `Leaders`, `Challengers`, `Niche`, `Visionaries`, `Incorta`, `IBM`, `Salesforce`, `Microsoft`

### corpus:mermaid-upstream-suite-bench:quadrant-upstream-should-be-able-to-parse-the-whole-chart-with-point-styling-with-params-in-a-random-order-c

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Completeness of Vision ❤, x-axis-2, y-axis-2

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
quadrantChart
      title Analytics and Business Intelligence Platforms
      x-axis "Completeness of Vision ❤" --> "x-axis-2"
      y-axis Ability to Execute --> "y-axis-2"
      quadrant-1 Leaders
      quadrant-2 Challengers
      quadrant-3 Niche
      quadrant-4 Visionaries
      Microsoft: [0.75, 0.75] stroke-color: #ff00ff ,stroke-width: 10px, color: #ff0000, radius: 10
      Salesforce:::class1: [0.55, 0.60] radius: 10, color: #ff0000
      IBM: [0.51, 0.40] stroke-color: #ff00ff ,stroke-width: 10px
      Incorta: [0.20, 0.30] stroke-width: 10px
```

Expected labels: `Analytics and Business Intelligence Platforms`, `Completeness of Vision ❤`, `x-axis-2`, `Ability to Execute`, `y-axis-2`, `Leaders`, `Challengers`, `Niche`, `Visionaries`, `Incorta`, `IBM`, `Salesforce`, `Microsoft`

### corpus:mermaid-upstream-suite-bench:quadrant-upstream-should-be-able-to-parse-yaxis-text

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): urgent, not urgent

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
quadrantChart
y-axis urgent --> not urgent
```

Expected labels: `urgent`, `not urgent`

### corpus:mermaid-upstream-suite-bench:quadrant-upstream-should-be-able-to-parse-chinese-text-in-y-axis

browser API, SVG. Missing authored label: 低参与度; Missing authored label: 高参与度

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
quadrantChart
y-axis 低参与度 --> 高参与度
```

Expected labels: `低参与度`, `高参与度`

Tool output (4599 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:quadrant-upstream-should-be-able-to-parse-yaxis-text

browser API, SVG. Missing authored label: urgent; Missing authored label: not urgent

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
quadrantChart
y-axis urgent --> not urgent
```

Expected labels: `urgent`, `not urgent`

Tool output (4599 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

## radar

### registry:radar

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Skills

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
radar-beta
  title Skills
  axis speed["Speed"], power["Power"], range["Range"]
  curve now["Current"]{4, 3, 5}
  curve goal["Target"]{5, 5, 4}
  max 5
```

Expected labels: `Skills`, `Speed`, `Power`, `Range`, `Current`, `Target`

### editor:radar

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Model comparison

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
radar-beta
  title Model comparison
  axis speed["Speed"], accuracy["Accuracy"], cost["Cost"]
  axis latency["Latency"], context["Context"], safety["Safety"]
  curve a["Model A"]{4, 5, 3, 4, 4, 5}
  curve b["Model B"]{5, 3, 4, 3, 5, 3}
  graticule polygon
  max 5
```

Expected labels: `Model comparison`, `Speed`, `Accuracy`, `Cost`, `Latency`, `Context`, `Safety`, `Model A`, `Model B`

### portfolio:radar:60

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Team skills

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
radar-beta
  title Team skills
  axis design["Design"], code["Code"], comms["Comms"]
  axis ops["Ops"], data["Data"], test["Testing"]
  curve alice["Alice"]{4, 5, 3, 2, 4, 5}
  curve bob["Bob"]{3, 4, 5, 4, 3, 2}
  max 5
```

Expected labels: `Team skills`, `Design`, `Code`, `Comms`, `Ops`, `Data`, `Testing`, `Alice`, `Bob`

### portfolio:radar:61

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Model comparison

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
radar-beta
  title Model comparison
  axis speed["Speed"], accuracy["Accuracy"], cost["Cost"]
  curve a["Model A"]{4, 5, 3}
  max 5
```

Expected labels: `Model comparison`, `Speed`, `Accuracy`, `Cost`, `Model A`

### portfolio:radar:63

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Restaurant Comparison

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
radar-beta
  title Restaurant Comparison
  axis food["Food Quality"], service["Service"], price["Price"], ambiance["Ambiance"]
  curve a["Restaurant A"]{4, 3, 2, 4}
  curve b["Restaurant B"]{3, 4, 3, 3}
  graticule polygon
  max 5
```

Expected labels: `Restaurant Comparison`, `Food Quality`, `Service`, `Price`, `Ambiance`, `Restaurant A`, `Restaurant B`

### scaling:radar:12-series-24-axes

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): "Capability profile"

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
radar-beta
  title "Capability profile"
  axis a0["Axis 0"]
  axis a1["Axis 1"]
  axis a2["Axis 2"]
  axis a3["Axis 3"]
  axis a4["Axis 4"]
  axis a5["Axis 5"]
  axis a6["Axis 6"]
  axis a7["Axis 7"]
  axis a8["Axis 8"]
  axis a9["Axis 9"]
  axis a10["Axis 10"]
  axis a11["Axis 11"]
  axis a12["Axis 12"]
  axis a13["Axis 13"]
  axis a14["Axis 14"]
  axis a15["Axis 15"]
  axis a16["Axis 16"]
  axis a17["Axis 17"]
  axis a18["Axis 18"]
  axis a19["Axis 19"]
  axis a20["Axis 20"]
  axis a21["Axis 21"]
  axis a22["Axis 22"]
  axis a23["Axis 23"]
  curve c0["Series 0"]{1, 4, 7, 1, 4, 7, 1, 4, 7, 1, 4, 7, 1, 4, 7, 1, 4, 7, 1, 4, 7, 1, 4, 7}
  curve c1["Series 1"]{8, 2, 5, 8, 2, 5, 8, 2, 5, 8, 2, 5, 8, 2, 5, 8, 2, 5, 8, 2, 5, 8, 2, 5}
  curve c2["Series 2"]{6, 9, 3, 6, 9, 3, 6, 9, 3, 6, 9, 3, 6, 9, 3, 6, 9, 3, 6, 9, 3, 6, 9, 3}
  curve c3["Series 3"]{4, 7, 1, 4, 7, 1, 4, 7, 1, 4, 7, 1, 4, 7, 1, 4, 7, 1, 4, 7, 1, 4, 7, 1}
  curve c4["Series 4"]{2, 5, 8, 2, 5, 8, 2, 5, 8, 2, 5, 8, 2, 5, 8, 2, 5, 8, 2, 5, 8, 2, 5, 8}
  curve c5["Series 5"]{9, 3, 6, 9, 3, 6, 9, 3, 6, 9, 3, 6, 9, 3, 6, 9, 3, 6, 9, 3, 6, 9, 3, 6}
  curve c6["Series 6"]{7, 1, 4, 7, 1, 4, 7, 1, 4, 7, 1, 4, 7, 1, 4, 7, 1, 4, 7, 1, 4, 7, 1, 4}
  curve c7["Series 7"]{5, 8, 2, 5, 8, 2, 5, 8, 2, 5, 8, 2, 5, 8, 2, 5, 8, 2, 5, 8, 2, 5, 8, 2}
  curve c8["Series 8"]{3, 6, 9, 3, 6, 9, 3, 6, 9, 3, 6, 9, 3, 6, 9, 3, 6, 9, 3, 6, 9, 3, 6, 9}
  curve c9["Series 9"]{1, 4, 7, 1, 4, 7, 1, 4, 7, 1, 4, 7, 1, 4, 7, 1, 4, 7, 1, 4, 7, 1, 4, 7}
  curve c10["Series 10"]{8, 2, 5, 8, 2, 5, 8, 2, 5, 8, 2, 5, 8, 2, 5, 8, 2, 5, 8, 2, 5, 8, 2, 5}
  curve c11["Series 11"]{6, 9, 3, 6, 9, 3, 6, 9, 3, 6, 9, 3, 6, 9, 3, 6, 9, 3, 6, 9, 3, 6, 9, 3}
  max 10
```

Expected labels: `"Capability profile"`, `Axis 0`, `Axis 1`, `Axis 2`, `Axis 3`, `Axis 4`, `Axis 5`, `Axis 6`, `Axis 7`, `Axis 8`, `Axis 9`, `Axis 10`, `Axis 11`, `Axis 12`, `Axis 13`, `Axis 14`, `Axis 15`, `Axis 16`, `Axis 17`, `Axis 18`, `Axis 19`, `Axis 20`, `Axis 21`, `Axis 22`, `Axis 23`, `Series 0`, `Series 1`, `Series 2`, `Series 3`, `Series 4`, `Series 5`, `Series 6`, `Series 7`, `Series 8`, `Series 9`, `Series 10`, `Series 11`

### corpus:mermaid-upstream-suite-bench:radar-upstream-should-draw-a-complex-radar-diagram

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Radar diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
radar-beta
        title Radar diagram
        accTitle: Radar accTitle
        accDescr: Radar accDescription
        axis A["Axis A"], B["Axis B"] ,C["Axis C"]
        curve mycurve["My Curve"]{1,2,3}
        curve mycurve2["My Curve 2"]{ C: 1, A: 2, B: 3 }
        graticule polygon
```

Expected labels: `Radar diagram`, `Axis A`, `Axis B`, `Axis C`, `My Curve`, `My Curve 2`

### corpus:mermaid-upstream-suite-bench:radar-upstream-should-handle-diagram-with-data-and-title

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Radar diagram

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
radar-beta
    title Radar diagram
    accTitle: Radar accTitle
    accDescr: Radar accDescription
    axis A["Axis A"], B["Axis B"] ,C["Axis C"]
    curve mycurve["My Curve"]{1,2,3}
```

Expected labels: `Radar diagram`, `Axis A`, `Axis B`, `Axis C`, `My Curve`

## railroad

### docs:railroad:5

Node API, SVG. Error: Missing authored label: identifier

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-ebnf-beta
title "Identifier with Repetition"

identifier = letter ( letter | digit | "_" )* ;
letter = "a" | "b" | "c" | "d" | "e" ;
digit = "0" | "1" | "2" ;

```

Expected labels: `identifier`, `letter`, `digit`, `_`, `a`, `b`, `c`, `d`, `e`, `0`, `1`, `2`

Tool output (6994 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:railroad:6

Node API, SVG. Error: Missing authored label: expression

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-ebnf-beta
expression = term ( ( "+" | "-" ) term )* ;
term = "number" ;

```

Expected labels: `expression`, `term`, `+`, `-`, `number`

Tool output (6616 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:railroad:7

Node API, SVG. Error: Missing authored label: expression; Missing authored label: term; Missing authored label: +; Missing authored label: -; Missing authored label: factor; Missing authored label: *; Missing authored label: /; Missing authored label: number; Missing authored label: (; Missing authored label: ); Missing authored label: digit; Missing authored label: 0; Missing authored label: 1; Missing authored label: 2; Missing authored label: 3; Missing authored label: 4; Missing authored label: 5; Missing authored label: 6; Missing authored label: 7; Missing authored label: 8; Missing authored label: 9

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-ebnf-beta
title "Arithmetic Expression Grammar"

expression = term ( ( "+" | "-" ) term )* ;
term = factor ( ( "*" | "/" ) factor )* ;
factor = number | "(" expression ")" ;
number = digit+ ;
digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;

```

Expected labels: `expression`, `term`, `+`, `-`, `factor`, `*`, `/`, `number`, `(`, `)`, `digit`, `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`

Tool output (4743 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:railroad:8

Node API, SVG. Error: Missing authored label: {; Missing authored label: ,; Missing authored label: }; Missing authored label: [; Missing authored label: ]

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-ebnf-beta
title "JSON Grammar"

json = element ;
element = object | array | string | number | "true" | "false" | "null" ;
object = "{" [ member ( "," member )* ] "}" ;
array = "[" [ element ( "," element )* ] "]" ;
member = string ":" element ;

```

Expected labels: `json`, `element`, `object`, `array`, `string`, `number`, `true`, `false`, `null`, `{`, `member`, `,`, `}`, `[`, `]`, `:`

Tool output (7252 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:railroad:10

Node API, SVG. Error: Missing authored label: phone; Missing authored label: +; Missing authored label: subscriber

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-abnf-beta
title "Phone Number"

phone = [ "+" country-code ] subscriber ;
country-code = 1*DIGIT ;
subscriber = 1*( DIGIT / "-" / " " ) ;

```

Expected labels: `phone`, `+`, `country-code`, `subscriber`, `DIGIT`, `-`

Tool output (6629 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:railroad:11

Node API, SVG. Error: Missing authored label: Expression; Missing authored label: Term; Missing authored label: +; Missing authored label: -; Missing authored label: Factor; Missing authored label: *; Missing authored label: /; Missing authored label: Number; Missing authored label: (; Missing authored label: ); Missing authored label: Digit; Missing authored label: 0; Missing authored label: 1; Missing authored label: 2; Missing authored label: 3; Missing authored label: 4; Missing authored label: 5; Missing authored label: 6; Missing authored label: 7; Missing authored label: 8; Missing authored label: 9

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-peg-beta
title "Calculator Grammar"

Expression <- Term (("+" / "-") Term)* ;
Term <- Factor (("*" / "/") Factor)* ;
Factor <- Number / "(" Expression ")" ;
Number <- Digit+ ;
Digit <- "0" / "1" / "2" / "3" / "4" / "5" / "6" / "7" / "8" / "9" ;

```

Expected labels: `Expression`, `Term`, `+`, `-`, `Factor`, `*`, `/`, `Number`, `(`, `)`, `Digit`, `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`

Tool output (4732 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:railroad:13

Node API, SVG. Error: Missing authored label: expression; Missing authored label: term; Missing authored label: +; Missing authored label: -; Missing authored label: factor; Missing authored label: *; Missing authored label: /; Missing authored label: number; Missing authored label: (; Missing authored label: ); Missing authored label: digit; Missing authored label: 0; Missing authored label: 1; Missing authored label: 2; Missing authored label: 3; Missing authored label: 4; Missing authored label: 5; Missing authored label: 6; Missing authored label: 7; Missing authored label: 8; Missing authored label: 9

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-beta
title Expression Grammar

expression = sequence(
    nonterminal("term"),
    zeroOrMore(sequence(
        choice(terminal("+"), terminal("-")),
        nonterminal("term")
    ))
) ;
term = sequence(
    nonterminal("factor"),
    zeroOrMore(sequence(
        choice(terminal("*"), terminal("/")),
        nonterminal("factor")
    ))
) ;
factor = choice(
    nonterminal("number"),
    sequence(terminal("("), nonterminal("expression"), terminal(")"))
) ;
number = oneOrMore(nonterminal("digit")) ;
digit = choice(terminal("0"), terminal("1"), terminal("2"), terminal("3"), terminal("4"), terminal("5"), terminal("6"), terminal("7"), terminal("8"), terminal("9")) ;

```

Expected labels: `expression`, `term`, `+`, `-`, `factor`, `*`, `/`, `number`, `(`, `)`, `digit`, `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`

Tool output (4730 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:railroad:0

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): 0, 1, 2, 3, 4, 5, 6, 7

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-ebnf-beta
title "Digit Definition"

digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;

```

Expected labels: `digit`, `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`

### docs:railroad:1

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): a, b, c

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-ebnf-beta
letter = "a" | "b" | "c" ;
identifier = letter ;

```

Expected labels: `letter`, `a`, `b`, `c`, `identifier`

### docs:railroad:2

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Hello, World

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-ebnf-beta
greeting = "Hello" " " "World" ;

```

Expected labels: `greeting`, `Hello`, `World`

### docs:railroad:3

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): +, -

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-ebnf-beta
sign = "+" | "-" ;

```

Expected labels: `sign`, `+`, `-`

### docs:railroad:4

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): +, -, 0, 1, 2, 3, 4, 5

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-ebnf-beta
title "Optional Sign"

sign = "+" | "-" ;
number = sign? digit+ ;
digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;

```

Expected labels: `sign`, `+`, `-`, `number`, `digit`, `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`

### docs:railroad:5

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): _, a, b, c, d, e, 0, 1

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-ebnf-beta
title "Identifier with Repetition"

identifier = letter ( letter | digit | "_" )* ;
letter = "a" | "b" | "c" | "d" | "e" ;
digit = "0" | "1" | "2" ;

```

Expected labels: `identifier`, `letter`, `digit`, `_`, `a`, `b`, `c`, `d`, `e`, `0`, `1`, `2`

### docs:railroad:6

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): +, -, number

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-ebnf-beta
expression = term ( ( "+" | "-" ) term )* ;
term = "number" ;

```

Expected labels: `expression`, `term`, `+`, `-`, `number`

### docs:railroad:7

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): expression, term, +, -, factor, *, /, number

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-ebnf-beta
title "Arithmetic Expression Grammar"

expression = term ( ( "+" | "-" ) term )* ;
term = factor ( ( "*" | "/" ) factor )* ;
factor = number | "(" expression ")" ;
number = digit+ ;
digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;

```

Expected labels: `expression`, `term`, `+`, `-`, `factor`, `*`, `/`, `number`, `(`, `)`, `digit`, `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`

### docs:railroad:8

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): object, array, string, number, true, false, null, {

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-ebnf-beta
title "JSON Grammar"

json = element ;
element = object | array | string | number | "true" | "false" | "null" ;
object = "{" [ member ( "," member )* ] "}" ;
array = "[" [ element ( "," element )* ] "]" ;
member = string ":" element ;

```

Expected labels: `json`, `element`, `object`, `array`, `string`, `number`, `true`, `false`, `null`, `{`, `member`, `,`, `}`, `[`, `]`, `:`

### docs:railroad:9

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): @, ALPHA, DIGIT, ., -

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-abnf-beta
title "Email Address"

address = local-part "@" domain ;
local-part = 1*( ALPHA / DIGIT / "." / "-" ) ;
domain = label *( "." label ) ;
label = 1*( ALPHA / DIGIT / "-" ) ;

```

Expected labels: `address`, `local-part`, `@`, `domain`, `ALPHA`, `DIGIT`, `.`, `-`, `label`

### docs:railroad:10

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): phone, +, DIGIT, -

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-abnf-beta
title "Phone Number"

phone = [ "+" country-code ] subscriber ;
country-code = 1*DIGIT ;
subscriber = 1*( DIGIT / "-" / " " ) ;

```

Expected labels: `phone`, `+`, `country-code`, `subscriber`, `DIGIT`, `-`

### docs:railroad:11

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Expression, Term, +, -, Factor, *, /, Number

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-peg-beta
title "Calculator Grammar"

Expression <- Term (("+" / "-") Term)* ;
Term <- Factor (("*" / "/") Factor)* ;
Factor <- Number / "(" Expression ")" ;
Number <- Digit+ ;
Digit <- "0" / "1" / "2" / "3" / "4" / "5" / "6" / "7" / "8" / "9" ;

```

Expected labels: `Expression`, `Term`, `+`, `-`, `Factor`, `*`, `/`, `Number`, `(`, `)`, `Digit`, `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`

### docs:railroad:12

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): if, else, while, a, b, c, _

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-peg-beta
title "Identifiers (keywords excluded)"

Identifier <- !Keyword Letter Letter* ;
Keyword <- "if" / "else" / "while" ;
Letter <- "a" / "b" / "c" / "_" ;

```

Expected labels: `Identifier`, `Letter`, `Keyword`, `if`, `else`, `while`, `a`, `b`, `c`, `_`

### docs:railroad:13

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): expression, term, +, -, factor, *, /, number

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-beta
title Expression Grammar

expression = sequence(
    nonterminal("term"),
    zeroOrMore(sequence(
        choice(terminal("+"), terminal("-")),
        nonterminal("term")
    ))
) ;
term = sequence(
    nonterminal("factor"),
    zeroOrMore(sequence(
        choice(terminal("*"), terminal("/")),
        nonterminal("factor")
    ))
) ;
factor = choice(
    nonterminal("number"),
    sequence(terminal("("), nonterminal("expression"), terminal(")"))
) ;
number = oneOrMore(nonterminal("digit")) ;
digit = choice(terminal("0"), terminal("1"), terminal("2"), terminal("3"), terminal("4"), terminal("5"), terminal("6"), terminal("7"), terminal("8"), terminal("9")) ;

```

Expected labels: `expression`, `term`, `+`, `-`, `factor`, `*`, `/`, `number`, `(`, `)`, `digit`, `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`

### docs:railroad:5

browser API, SVG. Missing authored label: identifier

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-ebnf-beta
title "Identifier with Repetition"

identifier = letter ( letter | digit | "_" )* ;
letter = "a" | "b" | "c" | "d" | "e" ;
digit = "0" | "1" | "2" ;

```

Expected labels: `identifier`, `letter`, `digit`, `_`, `a`, `b`, `c`, `d`, `e`, `0`, `1`, `2`

Tool output (6994 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:railroad:6

browser API, SVG. Missing authored label: expression

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-ebnf-beta
expression = term ( ( "+" | "-" ) term )* ;
term = "number" ;

```

Expected labels: `expression`, `term`, `+`, `-`, `number`

Tool output (6616 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:railroad:7

browser API, SVG. Missing authored label: expression; Missing authored label: term; Missing authored label: +; Missing authored label: -; Missing authored label: factor; Missing authored label: *; Missing authored label: /; Missing authored label: number; Missing authored label: (; Missing authored label: ); Missing authored label: digit; Missing authored label: 0; Missing authored label: 1; Missing authored label: 2; Missing authored label: 3; Missing authored label: 4; Missing authored label: 5; Missing authored label: 6; Missing authored label: 7; Missing authored label: 8; Missing authored label: 9

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-ebnf-beta
title "Arithmetic Expression Grammar"

expression = term ( ( "+" | "-" ) term )* ;
term = factor ( ( "*" | "/" ) factor )* ;
factor = number | "(" expression ")" ;
number = digit+ ;
digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;

```

Expected labels: `expression`, `term`, `+`, `-`, `factor`, `*`, `/`, `number`, `(`, `)`, `digit`, `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`

Tool output (4743 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:railroad:8

browser API, SVG. Missing authored label: {; Missing authored label: ,; Missing authored label: }; Missing authored label: [; Missing authored label: ]

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-ebnf-beta
title "JSON Grammar"

json = element ;
element = object | array | string | number | "true" | "false" | "null" ;
object = "{" [ member ( "," member )* ] "}" ;
array = "[" [ element ( "," element )* ] "]" ;
member = string ":" element ;

```

Expected labels: `json`, `element`, `object`, `array`, `string`, `number`, `true`, `false`, `null`, `{`, `member`, `,`, `}`, `[`, `]`, `:`

Tool output (7252 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:railroad:10

browser API, SVG. Missing authored label: phone; Missing authored label: +; Missing authored label: subscriber

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-abnf-beta
title "Phone Number"

phone = [ "+" country-code ] subscriber ;
country-code = 1*DIGIT ;
subscriber = 1*( DIGIT / "-" / " " ) ;

```

Expected labels: `phone`, `+`, `country-code`, `subscriber`, `DIGIT`, `-`

Tool output (6629 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:railroad:11

browser API, SVG. Missing authored label: Expression; Missing authored label: Term; Missing authored label: +; Missing authored label: -; Missing authored label: Factor; Missing authored label: *; Missing authored label: /; Missing authored label: Number; Missing authored label: (; Missing authored label: ); Missing authored label: Digit; Missing authored label: 0; Missing authored label: 1; Missing authored label: 2; Missing authored label: 3; Missing authored label: 4; Missing authored label: 5; Missing authored label: 6; Missing authored label: 7; Missing authored label: 8; Missing authored label: 9

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-peg-beta
title "Calculator Grammar"

Expression <- Term (("+" / "-") Term)* ;
Term <- Factor (("*" / "/") Factor)* ;
Factor <- Number / "(" Expression ")" ;
Number <- Digit+ ;
Digit <- "0" / "1" / "2" / "3" / "4" / "5" / "6" / "7" / "8" / "9" ;

```

Expected labels: `Expression`, `Term`, `+`, `-`, `Factor`, `*`, `/`, `Number`, `(`, `)`, `Digit`, `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`

Tool output (4732 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:railroad:13

browser API, SVG. Missing authored label: expression; Missing authored label: term; Missing authored label: +; Missing authored label: -; Missing authored label: factor; Missing authored label: *; Missing authored label: /; Missing authored label: number; Missing authored label: (; Missing authored label: ); Missing authored label: digit; Missing authored label: 0; Missing authored label: 1; Missing authored label: 2; Missing authored label: 3; Missing authored label: 4; Missing authored label: 5; Missing authored label: 6; Missing authored label: 7; Missing authored label: 8; Missing authored label: 9

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
railroad-beta
title Expression Grammar

expression = sequence(
    nonterminal("term"),
    zeroOrMore(sequence(
        choice(terminal("+"), terminal("-")),
        nonterminal("term")
    ))
) ;
term = sequence(
    nonterminal("factor"),
    zeroOrMore(sequence(
        choice(terminal("*"), terminal("/")),
        nonterminal("factor")
    ))
) ;
factor = choice(
    nonterminal("number"),
    sequence(terminal("("), nonterminal("expression"), terminal(")"))
) ;
number = oneOrMore(nonterminal("digit")) ;
digit = choice(terminal("0"), terminal("1"), terminal("2"), terminal("3"), terminal("4"), terminal("5"), terminal("6"), terminal("7"), terminal("8"), terminal("9")) ;

```

Expected labels: `expression`, `term`, `+`, `-`, `factor`, `*`, `/`, `number`, `(`, `)`, `digit`, `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`

Tool output (4730 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

## requirement

### corpus:mermaid-requirement-bench:requirement-docs-5

Node API, SVG. Error: Missing authored label: copies

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
    requirementDiagram

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    functionalRequirement test_req2 {
    id: 1.1
    text: the second test text.
    risk: low
    verifymethod: inspection
    }

    performanceRequirement test_req3 {
    id: 1.2
    text: the third test text.
    risk: medium
    verifymethod: demonstration
    }

    interfaceRequirement test_req4 {
    id: 1.2.1
    text: the fourth test text.
    risk: medium
    verifymethod: analysis
    }

    physicalRequirement test_req5 {
    id: 1.2.2
    text: the fifth test text.
    risk: medium
    verifymethod: analysis
    }

    designConstraint test_req6 {
    id: 1.2.3
    text: the sixth test text.
    risk: medium
    verifymethod: analysis
    }

    element test_entity {
    type: simulation
    }

    element test_entity2 {
    type: word doc
    docRef: reqs/test_entity
    }

    element test_entity3 {
    type: "test suite"
    docRef: github.com/all_the_tests
    }


    test_entity - satisfies -> test_req2
    test_req - traces -> test_req2
    test_req - contains -> test_req3
    test_req3 - contains -> test_req4
    test_req4 - derives -> test_req5
    test_req5 - refines -> test_req6
    test_entity3 - verifies -> test_req5
    test_req <- copies - test_entity2

```

Expected labels: `test_req`, `the test text.`, `test_req2`, `the second test text.`, `test_req3`, `the third test text.`, `test_req4`, `the fourth test text.`, `test_req5`, `the fifth test text.`, `test_req6`, `the sixth test text.`, `test_entity`, `test_entity2`, `test_entity3`, `satisfies`, `traces`, `contains`, `derives`, `refines`, `verifies`, `copies`

Tool output (22371 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### registry:requirement

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): verifies

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
requirementDiagram
  requirement fast {
    id: 1
    text: Respond within 100ms
    risk: high
    verifymethod: test
  }
  element benchmark {
    type: "test"
  }
  benchmark - verifies -> fast
```

Expected labels: `fast`, `Respond within 100ms`, `benchmark`, `verifies`

### editor:requirement

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): contains, verifies

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
requirementDiagram
  direction LR
  requirement reliable {
    id: R1
    text: Requests retain authored meaning
    risk: high
    verifymethod: test
  }
  functionalRequirement edits {
    id: R2
    text: Typed edits preserve all relationships
    risk: medium
    verifymethod: inspection
  }
  element suite {
    type: conformance suite
  }
  reliable - contains -> edits
  suite - verifies -> edits
```

Expected labels: `edits`, `Typed edits preserve all relationships`, `reliable`, `Requests retain authored meaning`, `suite`, `contains`, `verifies`

### portfolio:requirement:65

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): verifies, traces

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
requirementDiagram
  requirement reliable {
    id: R1
    text: Preserve authored meaning
    risk: high
    verifymethod: test
  }
  element suite {
    type: conformance suite
  }
  suite - verifies -> reliable
  suite - traces -> reliable
```

Expected labels: `reliable`, `Preserve authored meaning`, `suite`, `verifies`, `traces`

### portfolio:requirement:66

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): contains, derives, refines, traces, copies, satisfies, verifies

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
title: Gateway acceptance evidence
---
requirementDiagram
  direction TB
  requirement delivery {
    id: "G-1"
    text: Deliver accepted events
    risk: high
    verifymethod: test
  }
  performanceRequirement latency {
    id: "G-2"
    text: Publish within 200 ms
    risk: medium
    verifymethod: analysis
  }
  functionalRequirement replay {
    id: "G-3"
    text: Reject duplicate events
    risk: high
    verifymethod: test
  }
  interfaceRequirement contract {
    id: "G-4"
    text: Keep wire compatibility
    risk: medium
    verifymethod: inspection
  }
  interfaceRequirement legacy {
    id: "G-0"
    text: Version 1 framing
    risk: low
    verifymethod: inspection
  }
  element gateway {
    type: gateway service
    docref: release v2
  }
  element replay_suite {
    type: "test suite"
    docref: replay tests
  }
  element latency_bench {
    type: benchmark
    docref: p95 under load
  }
  delivery - contains -> replay
  replay - derives -> delivery
  latency - refines -> delivery
  contract - traces -> delivery
  contract - copies -> legacy
  gateway - satisfies -> delivery
  replay_suite - verifies -> replay
  latency_bench - verifies -> latency
```

Expected labels: `contract`, `Keep wire compatibility`, `delivery`, `Deliver accepted events`, `latency`, `Publish within 200 ms`, `legacy`, `Version 1 framing`, `replay`, `Reject duplicate events`, `gateway`, `latency_bench`, `replay_suite`, `contains`, `derives`, `refines`, `traces`, `copies`, `satisfies`, `verifies`

### scaling:requirement:100-requirements-99-relations

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): traces

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
requirementDiagram
  requirement r0 {
    id: R0
    text: "Requirement 0"
    risk: medium
    verifymethod: test
  }
  requirement r1 {
    id: R1
    text: "Requirement 1"
    risk: medium
    verifymethod: test
  }
  r0 - traces -> r1
  requirement r2 {
    id: R2
    text: "Requirement 2"
    risk: medium
    verifymethod: test
  }
  r1 - traces -> r2
  requirement r3 {
    id: R3
    text: "Requirement 3"
    risk: medium
    verifymethod: test
  }
  r2 - traces -> r3
  requirement r4 {
    id: R4
    text: "Requirement 4"
    risk: medium
    verifymethod: test
  }
  r3 - traces -> r4
  requirement r5 {
    id: R5
    text: "Requirement 5"
    risk: medium
    verifymethod: test
  }
  r4 - traces -> r5
  requirement r6 {
    id: R6
    text: "Requirement 6"
    risk: medium
    verifymethod: test
  }
  r5 - traces -> r6
  requirement r7 {
    id: R7
    text: "Requirement 7"
    risk: medium
    verifymethod: test
  }
  r6 - traces -> r7
  requirement r8 {
    id: R8
    text: "Requirement 8"
    risk: medium
    verifymethod: test
  }
  r7 - traces -> r8
  requirement r9 {
    id: R9
    text: "Requirement 9"
    risk: medium
    verifymethod: test
  }
  r8 - traces -> r9
  requirement r10 {
    id: R10
    text: "Requirement 10"
    risk: medium
    verifymethod: test
  }
  r9 - traces -> r10
  requirement r11 {
    id: R11
    text: "Requirement 11"
    risk: medium
    verifymethod: test
  }
  r10 - traces -> r11
  requirement r12 {
    id: R12
    text: "Requirement 12"
    risk: medium
    verifymethod: test
  }
  r11 - traces -> r12
  requirement r13 {
    id: R13
    text: "Requirement 13"
    risk: medium
    verifymethod: test
  }
  r12 - traces -> r13
  requirement r14 {
    id: R14
    text: "Requirement 14"
    risk: medium
    verifymethod: test
  }
  r13 - traces -> r14
  requirement r15 {
    id: R15
    text: "Requirement 15"
    risk: medium
    verifymethod: test
  }
  r14 - traces -> r15
  requirement r16 {
    id: R16
    text: "Requirement 16"
    risk: medium
    verifymethod: test
  }
  r15 - traces -> r16
  requirement r17 {
    id: R17
    text: "Requirement 17"
    risk: medium
    verifymethod: test
  }
  r16 - traces -> r17
  requirement r18 {
    id: R18
    text: "Requirement 18"
    risk: medium
    verifymethod: test
  }
  r17 - traces -> r18
  requirement r19 {
    id: R19
    text: "Requirement 19"
    risk: medium
    verifymethod: test
  }
  r18 - traces -> r19
  requirement r20 {
    id: R20
    text: "Requirement 20"
    risk: medium
    verifymethod: test
  }
  r19 - traces -> r20
  requirement r21 {
    id: R21
    text: "Requirement 21"
    risk: medium
    verifymethod: test
  }
  r20 - traces -> r21
  requirement r22 {
    id: R22
    text: "Requirement 22"
    risk: medium
    verifymethod: test
  }
  r21 - traces -> r22
  requirement r23 {
    id: R23
    text: "Requirement 23"
    risk: medium
    verifymethod: test
  }
  r22 - traces -> r23
  requirement r24 {
    id: R24
    text: "Requirement 24"
    risk: medium
    verifymethod: test
  }
  r23 - traces -> r24
  requirement r25 {
    id: R25
    text: "Requirement 25"
    risk: medium
    verifymethod: test
  }
  r24 - traces -> r25
  requirement r26 {
    id: R26
    text: "Requirement 26"
    risk: medium
    verifymethod: test
  }
  r25 - traces -> r26
  requirement r27 {
    id: R27
    text: "Requirement 27"
    risk: medium
    verifymethod: test
  }
  r26 - traces -> r27
  requirement r28 {
    id: R28
    text: "Requirement 28"
    risk: medium
    verifymethod: test
  }
  r27 - traces -> r28
  requirement r29 {
    id: R29
    text: "Requirement 29"
    risk: medium
    verifymethod: test
  }
  r28 - traces -> r29
  requirement r30 {
    id: R30
    text: "Requirement 30"
    risk: medium
    verifymethod: test
  }
  r29 - traces -> r30
  requirement r31 {
    id: R31
    text: "Requirement 31"
    risk: medium
    verifymethod: test
  }
  r30 - traces -> r31
  requirement r32 {
    id: R32
    text: "Requirement 32"
    risk: medium
    verifymethod: test
  }
  r31 - traces -> r32
  requirement r33 {
    id: R33
    text: "Requirement 33"
    risk: medium
    verifymethod: test
  }
  r32 - traces -> r33
  requirement r34 {
    id: R34
    text: "Requirement 34"
    risk: medium
    verifymethod: test
  }
  r33 - traces -> r34
  requirement r35 {
    id: R35
    text: "Requirement 35"
    risk: medium
    verifymethod: test
  }
  r34 - traces -> r35
  requirement r36 {
    id: R36
    text: "Requirement 36"
    risk: medium
    verifymethod: test
  }
  r35 - traces -> r36
  requirement r37 {
    id: R37
    text: "Requirement 37"
    risk: medium
    verifymethod: test
  }
  r36 - traces -> r37
  requirement r38 {
    id: R38
    text: "Requirement 38"
    risk: medium
    verifymethod: test
  }
  r37 - traces -> r38
  requirement r39 {
    id: R39
    text: "Requirement 39"
    risk: medium
    verifymethod: test
  }
  r38 - traces -> r39
  requirement r40 {
    id: R40
    text: "Requirement 40"
    risk: medium
    verifymethod: test
  }
  r39 - traces -> r40
  requirement r41 {
    id: R41
    text: "Requirement 41"
    risk: medium
    verifymethod: test
  }
  r40 - traces -> r41
  requirement r42 {
    id: R42
    text: "Requirement 42"
    risk: medium
    verifymethod: test
  }
  r41 - traces -> r42
  requirement r43 {
    id: R43
    text: "Requirement 43"
    risk: medium
    verifymethod: test
  }
  r42 - traces -> r43
  requirement r44 {
    id: R44
    text: "Requirement 44"
    risk: medium
    verifymethod: test
  }
  r43 - traces -> r44
  requirement r45 {
    id: R45
    text: "Requirement 45"
    risk: medium
    verifymethod: test
  }
  r44 - traces -> r45
  requirement r46 {
    id: R46
    text: "Requirement 46"
    risk: medium
    verifymethod: test
  }
  r45 - traces -> r46
  requirement r47 {
    id: R47
    text: "Requirement 47"
    risk: medium
    verifymethod: test
  }
  r46 - traces -> r47
  requirement r48 {
    id: R48
    text: "Requirement 48"
    risk: medium
    verifymethod: test
  }
  r47 - traces -> r48
  requirement r49 {
    id: R49
    text: "Requirement 49"
    risk: medium
    verifymethod: test
  }
  r48 - traces -> r49
  requirement r50 {
    id: R50
    text: "Requirement 50"
    risk: medium
    verifymethod: test
  }
  r49 - traces -> r50
  requirement r51 {
    id: R51
    text: "Requirement 51"
    risk: medium
    verifymethod: test
  }
  r50 - traces -> r51
  requirement r52 {
    id: R52
    text: "Requirement 52"
    risk: medium
    verifymethod: test
  }
  r51 - traces -> r52
  requirement r53 {
    id: R53
    text: "Requirement 53"
    risk: medium
    verifymethod: test
  }
  r52 - traces -> r53
  requirement r54 {
    id: R54
    text: "Requirement 54"
    risk: medium
    verifymethod: test
  }
  r53 - traces -> r54
  requirement r55 {
    id: R55
    text: "Requirement 55"
    risk: medium
    verifymethod: test
  }
  r54 - traces -> r55
  requirement r56 {
    id: R56
    text: "Requirement 56"
    risk: medium
    verifymethod: test
  }
  r55 - traces -> r56
  requirement r57 {
    id: R57
    text: "Requirement 57"
    risk: medium
    verifymethod: test
  }
  r56 - traces -> r57
  requirement r58 {
    id: R58
    text: "Requirement 58"
    risk: medium
    verifymethod: test
  }
  r57 - traces -> r58
  requirement r59 {
    id: R59
    text: "Requirement 59"
    risk: medium
    verifymethod: test
  }
  r58 - traces -> r59
  requirement r60 {
    id: R60
    text: "Requirement 60"
    risk: medium
    verifymethod: test
  }
  r59 - traces -> r60
  requirement r61 {
    id: R61
    text: "Requirement 61"
    risk: medium
    verifymethod: test
  }
  r60 - traces -> r61
  requirement r62 {
    id: R62
    text: "Requirement 62"
    risk: medium
    verifymethod: test
  }
  r61 - traces -> r62
  requirement r63 {
    id: R63
    text: "Requirement 63"
    risk: medium
    verifymethod: test
  }
  r62 - traces -> r63
  requirement r64 {
    id: R64
    text: "Requirement 64"
    risk: medium
    verifymethod: test
  }
  r63 - traces -> r64
  requirement r65 {
    id: R65
    text: "Requirement 65"
    risk: medium
    verifymethod: test
  }
  r64 - traces -> r65
  requirement r66 {
    id: R66
    text: "Requirement 66"
    risk: medium
    verifymethod: test
  }
  r65 - traces -> r66
  requirement r67 {
    id: R67
    text: "Requirement 67"
    risk: medium
    verifymethod: test
  }
  r66 - traces -> r67
  requirement r68 {
    id: R68
    text: "Requirement 68"
    risk: medium
    verifymethod: test
  }
  r67 - traces -> r68
  requirement r69 {
    id: R69
    text: "Requirement 69"
    risk: medium
    verifymethod: test
  }
  r68 - traces -> r69
  requirement r70 {
    id: R70
    text: "Requirement 70"
    risk: medium
    verifymethod: test
  }
  r69 - traces -> r70
  requirement r71 {
    id: R71
    text: "Requirement 71"
    risk: medium
    verifymethod: test
  }
  r70 - traces -> r71
  requirement r72 {
    id: R72
    text: "Requirement 72"
    risk: medium
    verifymethod: test
  }
  r71 - traces -> r72
  requirement r73 {
    id: R73
    text: "Requirement 73"
    risk: medium
    verifymethod: test
  }
  r72 - traces -> r73
  requirement r74 {
    id: R74
    text: "Requirement 74"
    risk: medium
    verifymethod: test
  }
  r73 - traces -> r74
  requirement r75 {
    id: R75
    text: "Requirement 75"
    risk: medium
    verifymethod: test
  }
  r74 - traces -> r75
  requirement r76 {
    id: R76
    text: "Requirement 76"
    risk: medium
    verifymethod: test
  }
  r75 - traces -> r76
  requirement r77 {
    id: R77
    text: "Requirement 77"
    risk: medium
    verifymethod: test
  }
  r76 - traces -> r77
  requirement r78 {
    id: R78
    text: "Requirement 78"
    risk: medium
    verifymethod: test
  }
  r77 - traces -> r78
  requirement r79 {
    id: R79
    text: "Requirement 79"
    risk: medium
    verifymethod: test
  }
  r78 - traces -> r79
  requirement r80 {
    id: R80
    text: "Requirement 80"
    risk: medium
    verifymethod: test
  }
  r79 - traces -> r80
  requirement r81 {
    id: R81
    text: "Requirement 81"
    risk: medium
    verifymethod: test
  }
  r80 - traces -> r81
  requirement r82 {
    id: R82
    text: "Requirement 82"
    risk: medium
    verifymethod: test
  }
  r81 - traces -> r82
  requirement r83 {
    id: R83
    text: "Requirement 83"
    risk: medium
    verifymethod: test
  }
  r82 - traces -> r83
  requirement r84 {
    id: R84
    text: "Requirement 84"
    risk: medium
    verifymethod: test
  }
  r83 - traces -> r84
  requirement r85 {
    id: R85
    text: "Requirement 85"
    risk: medium
    verifymethod: test
  }
  r84 - traces -> r85
  requirement r86 {
    id: R86
    text: "Requirement 86"
    risk: medium
    verifymethod: test
  }
  r85 - traces -> r86
  requirement r87 {
    id: R87
    text: "Requirement 87"
    risk: medium
    verifymethod: test
  }
  r86 - traces -> r87
  requirement r88 {
    id: R88
    text: "Requirement 88"
    risk: medium
    verifymethod: test
  }
  r87 - traces -> r88
  requirement r89 {
    id: R89
    text: "Requirement 89"
    risk: medium
    verifymethod: test
  }
  r88 - traces -> r89
  requirement r90 {
    id: R90
    text: "Requirement 90"
    risk: medium
    verifymethod: test
  }
  r89 - traces -> r90
  requirement r91 {
    id: R91
    text: "Requirement 91"
    risk: medium
    verifymethod: test
  }
  r90 - traces -> r91
  requirement r92 {
    id: R92
    text: "Requirement 92"
    risk: medium
    verifymethod: test
  }
  r91 - traces -> r92
  requirement r93 {
    id: R93
    text: "Requirement 93"
    risk: medium
    verifymethod: test
  }
  r92 - traces -> r93
  requirement r94 {
    id: R94
    text: "Requirement 94"
    risk: medium
    verifymethod: test
  }
  r93 - traces -> r94
  requirement r95 {
    id: R95
    text: "Requirement 95"
    risk: medium
    verifymethod: test
  }
  r94 - traces -> r95
  requirement r96 {
    id: R96
    text: "Requirement 96"
    risk: medium
    verifymethod: test
  }
  r95 - traces -> r96
  requirement r97 {
    id: R97
    text: "Requirement 97"
    risk: medium
    verifymethod: test
  }
  r96 - traces -> r97
  requirement r98 {
    id: R98
    text: "Requirement 98"
    risk: medium
    verifymethod: test
  }
  r97 - traces -> r98
  requirement r99 {
    id: R99
    text: "Requirement 99"
    risk: medium
    verifymethod: test
  }
  r98 - traces -> r99
```

Expected labels: `r0`, `Requirement 0`, `r1`, `Requirement 1`, `r10`, `Requirement 10`, `r11`, `Requirement 11`, `r12`, `Requirement 12`, `r13`, `Requirement 13`, `r14`, `Requirement 14`, `r15`, `Requirement 15`, `r16`, `Requirement 16`, `r17`, `Requirement 17`, `r18`, `Requirement 18`, `r19`, `Requirement 19`, `r2`, `Requirement 2`, `r20`, `Requirement 20`, `r21`, `Requirement 21`, `r22`, `Requirement 22`, `r23`, `Requirement 23`, `r24`, `Requirement 24`, `r25`, `Requirement 25`, `r26`, `Requirement 26`, `r27`, `Requirement 27`, `r28`, `Requirement 28`, `r29`, `Requirement 29`, `r3`, `Requirement 3`, `r30`, `Requirement 30`, `r31`, `Requirement 31`, `r32`, `Requirement 32`, `r33`, `Requirement 33`, `r34`, `Requirement 34`, `r35`, `Requirement 35`, `r36`, `Requirement 36`, `r37`, `Requirement 37`, `r38`, `Requirement 38`, `r39`, `Requirement 39`, `r4`, `Requirement 4`, `r40`, `Requirement 40`, `r41`, `Requirement 41`, `r42`, `Requirement 42`, `r43`, `Requirement 43`, `r44`, `Requirement 44`, `r45`, `Requirement 45`, `r46`, `Requirement 46`, `r47`, `Requirement 47`, `r48`, `Requirement 48`, `r49`, `Requirement 49`, `r5`, `Requirement 5`, `r50`, `Requirement 50`, `r51`, `Requirement 51`, `r52`, `Requirement 52`, `r53`, `Requirement 53`, `r54`, `Requirement 54`, `r55`, `Requirement 55`, `r56`, `Requirement 56`, `r57`, `Requirement 57`, `r58`, `Requirement 58`, `r59`, `Requirement 59`, `r6`, `Requirement 6`, `r60`, `Requirement 60`, `r61`, `Requirement 61`, `r62`, `Requirement 62`, `r63`, `Requirement 63`, `r64`, `Requirement 64`, `r65`, `Requirement 65`, `r66`, `Requirement 66`, `r67`, `Requirement 67`, `r68`, `Requirement 68`, `r69`, `Requirement 69`, `r7`, `Requirement 7`, `r70`, `Requirement 70`, `r71`, `Requirement 71`, `r72`, `Requirement 72`, `r73`, `Requirement 73`, `r74`, `Requirement 74`, `r75`, `Requirement 75`, `r76`, `Requirement 76`, `r77`, `Requirement 77`, `r78`, `Requirement 78`, `r79`, `Requirement 79`, `r8`, `Requirement 8`, `r80`, `Requirement 80`, `r81`, `Requirement 81`, `r82`, `Requirement 82`, `r83`, `Requirement 83`, `r84`, `Requirement 84`, `r85`, `Requirement 85`, `r86`, `Requirement 86`, `r87`, `Requirement 87`, `r88`, `Requirement 88`, `r89`, `Requirement 89`, `r9`, `Requirement 9`, `r90`, `Requirement 90`, `r91`, `Requirement 91`, `r92`, `Requirement 92`, `r93`, `Requirement 93`, `r94`, `Requirement 94`, `r95`, `Requirement 95`, `r96`, `Requirement 96`, `r97`, `Requirement 97`, `r98`, `Requirement 98`, `r99`, `Requirement 99`, `traces`

### corpus:mermaid-requirement-bench:requirement-docs-1

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): satisfies

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
    requirementDiagram

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    element test_entity {
    type: simulation
    }

    test_entity - satisfies -> test_req

```

Expected labels: `test_req`, `the test text.`, `test_entity`, `satisfies`

### corpus:mermaid-requirement-bench:requirement-docs-2

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): contains, satisfies

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
requirementDiagram
  requirement checkout_req {
    id: 1
    text: Orders must be payable online.
    risk: high
    verifymethod: test
  }
  functionalRequirement payment_req {
    id: 1.1
    text: Card payments must be authorised.
    risk: high
    verifymethod: test
  }
  element checkout_service {
    type: service
  }
  checkout_req - contains -> payment_req
  checkout_service - satisfies -> payment_req

```

Expected labels: `checkout_req`, `Orders must be payable online.`, `payment_req`, `Card payments must be authorised.`, `checkout_service`, `contains`, `satisfies`

### corpus:mermaid-requirement-bench:requirement-docs-3

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): contains, satisfies

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  theme: default
  look: classic
  layout: dagre
---
requirementDiagram
  requirement checkout_req {
    id: 1
    text: Orders must be payable online.
    risk: high
    verifymethod: test
  }
  functionalRequirement payment_req {
    id: 1.1
    text: Card payments must be authorised.
    risk: high
    verifymethod: test
  }
  element checkout_service {
    type: service
  }
  checkout_req - contains -> payment_req
  checkout_service - satisfies -> payment_req

```

Expected labels: `checkout_req`, `Orders must be payable online.`, `payment_req`, `Card payments must be authorised.`, `checkout_service`, `contains`, `satisfies`

### corpus:mermaid-requirement-bench:requirement-docs-5

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): satisfies, traces, contains, derives, refines, verifies, copies

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
    requirementDiagram

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    functionalRequirement test_req2 {
    id: 1.1
    text: the second test text.
    risk: low
    verifymethod: inspection
    }

    performanceRequirement test_req3 {
    id: 1.2
    text: the third test text.
    risk: medium
    verifymethod: demonstration
    }

    interfaceRequirement test_req4 {
    id: 1.2.1
    text: the fourth test text.
    risk: medium
    verifymethod: analysis
    }

    physicalRequirement test_req5 {
    id: 1.2.2
    text: the fifth test text.
    risk: medium
    verifymethod: analysis
    }

    designConstraint test_req6 {
    id: 1.2.3
    text: the sixth test text.
    risk: medium
    verifymethod: analysis
    }

    element test_entity {
    type: simulation
    }

    element test_entity2 {
    type: word doc
    docRef: reqs/test_entity
    }

    element test_entity3 {
    type: "test suite"
    docRef: github.com/all_the_tests
    }


    test_entity - satisfies -> test_req2
    test_req - traces -> test_req2
    test_req - contains -> test_req3
    test_req3 - contains -> test_req4
    test_req4 - derives -> test_req5
    test_req5 - refines -> test_req6
    test_entity3 - verifies -> test_req5
    test_req <- copies - test_entity2

```

Expected labels: `test_req`, `the test text.`, `test_req2`, `the second test text.`, `test_req3`, `the third test text.`, `test_req4`, `the fourth test text.`, `test_req5`, `the fifth test text.`, `test_req6`, `the sixth test text.`, `test_entity`, `test_entity2`, `test_entity3`, `satisfies`, `traces`, `contains`, `derives`, `refines`, `verifies`, `copies`

### corpus:mermaid-requirement-bench:requirement-docs-6

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): satisfies

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
requirementDiagram

direction LR

requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
}

element test_entity {
    type: simulation
}

test_entity - satisfies -> test_req

```

Expected labels: `test_req`, `the test text.`, `test_entity`, `satisfies`

### corpus:mermaid-requirement-bench:requirement-docs-5

browser API, SVG. Missing authored label: copies

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
    requirementDiagram

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    functionalRequirement test_req2 {
    id: 1.1
    text: the second test text.
    risk: low
    verifymethod: inspection
    }

    performanceRequirement test_req3 {
    id: 1.2
    text: the third test text.
    risk: medium
    verifymethod: demonstration
    }

    interfaceRequirement test_req4 {
    id: 1.2.1
    text: the fourth test text.
    risk: medium
    verifymethod: analysis
    }

    physicalRequirement test_req5 {
    id: 1.2.2
    text: the fifth test text.
    risk: medium
    verifymethod: analysis
    }

    designConstraint test_req6 {
    id: 1.2.3
    text: the sixth test text.
    risk: medium
    verifymethod: analysis
    }

    element test_entity {
    type: simulation
    }

    element test_entity2 {
    type: word doc
    docRef: reqs/test_entity
    }

    element test_entity3 {
    type: "test suite"
    docRef: github.com/all_the_tests
    }


    test_entity - satisfies -> test_req2
    test_req - traces -> test_req2
    test_req - contains -> test_req3
    test_req3 - contains -> test_req4
    test_req4 - derives -> test_req5
    test_req5 - refines -> test_req6
    test_entity3 - verifies -> test_req5
    test_req <- copies - test_entity2

```

Expected labels: `test_req`, `the test text.`, `test_req2`, `the second test text.`, `test_req3`, `the third test text.`, `test_req4`, `the fourth test text.`, `test_req5`, `the fifth test text.`, `test_req6`, `the sixth test text.`, `test_entity`, `test_entity2`, `test_entity3`, `satisfies`, `traces`, `contains`, `derives`, `refines`, `verifies`, `copies`

Tool output (22371 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

## sankey

### corpus:mermaid-upstream-suite-bench:sankey-docs-energy-full

Node API, SVG. Error: Missing authored label: Agricultural 'waste'

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  sankey:
    showValues: false
---
sankey

Agricultural 'waste',Bio-conversion,124.729
Bio-conversion,Liquid,0.597
Bio-conversion,Losses,26.862
Bio-conversion,Solid,280.322
Bio-conversion,Gas,81.144
Biofuel imports,Liquid,35
Biomass imports,Solid,35
Coal imports,Coal,11.606
Coal reserves,Coal,63.965
Coal,Solid,75.571
District heating,Industry,10.639
District heating,Heating and cooling - commercial,22.505
District heating,Heating and cooling - homes,46.184
Electricity grid,Over generation / exports,104.453
Electricity grid,Heating and cooling - homes,113.726
Electricity grid,H2 conversion,27.14
Electricity grid,Industry,342.165
Electricity grid,Road transport,37.797
Electricity grid,Agriculture,4.412
Electricity grid,Heating and cooling - commercial,40.858
Electricity grid,Losses,56.691
Electricity grid,Rail transport,7.863
Electricity grid,Lighting & appliances - commercial,90.008
Electricity grid,Lighting & appliances - homes,93.494
Gas imports,Ngas,40.719
Gas reserves,Ngas,82.233
Gas,Heating and cooling - commercial,0.129
Gas,Losses,1.401
Gas,Thermal generation,151.891
Gas,Agriculture,2.096
Gas,Industry,48.58
Geothermal,Electricity grid,7.013
H2 conversion,H2,20.897
H2 conversion,Losses,6.242
H2,Road transport,20.897
Hydro,Electricity grid,6.995
Liquid,Industry,121.066
Liquid,International shipping,128.69
Liquid,Road transport,135.835
Liquid,Domestic aviation,14.458
Liquid,International aviation,206.267
Liquid,Agriculture,3.64
Liquid,National navigation,33.218
Liquid,Rail transport,4.413
Marine algae,Bio-conversion,4.375
Ngas,Gas,122.952
Nuclear,Thermal generation,839.978
Oil imports,Oil,504.287
Oil reserves,Oil,107.703
Oil,Liquid,611.99
Other waste,Solid,56.587
Other waste,Bio-conversion,77.81
Pumped heat,Heating and cooling - homes,193.026
Pumped heat,Heating and cooling - commercial,70.672
Solar PV,Electricity grid,59.901
Solar Thermal,Heating and cooling - homes,19.263
Solar,Solar Thermal,19.263
Solar,Solar PV,59.901
Solid,Agriculture,0.882
Solid,Thermal generation,400.12
Solid,Industry,46.477
Thermal generation,Electricity grid,525.531
Thermal generation,Losses,787.129
Thermal generation,District heating,79.329
Tidal,Electricity grid,9.452
UK land based bioenergy,Bio-conversion,182.01
Wave,Electricity grid,19.013
Wind,Electricity grid,289.366
```

Expected labels: `Agricultural 'waste'`, `Bio-conversion`, `Liquid`, `Losses`, `Solid`, `Gas`, `Biofuel imports`, `Biomass imports`, `Coal imports`, `Coal`, `Coal reserves`, `District heating`, `Industry`, `Heating and cooling - commercial`, `Heating and cooling - homes`, `Electricity grid`, `Over generation / exports`, `H2 conversion`, `Road transport`, `Agriculture`, `Rail transport`, `Lighting & appliances - commercial`, `Lighting & appliances - homes`, `Gas imports`, `Ngas`, `Gas reserves`, `Thermal generation`, `Geothermal`, `H2`, `Hydro`, `International shipping`, `Domestic aviation`, `International aviation`, `National navigation`, `Marine algae`, `Nuclear`, `Oil imports`, `Oil`, `Oil reserves`, `Other waste`, `Pumped heat`, `Solar PV`, `Solar Thermal`, `Solar`, `Tidal`, `UK land based bioenergy`, `Wave`, `Wind`

Tool output (59006 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:sankey-docs-double-quotes

Node API, SVG. Error: Missing authored label: Heating and cooling, "homes"; Missing authored label: Heating and cooling, "commercial"

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sankey

Pumped heat,"Heating and cooling, ""homes""",193.026
Pumped heat,"Heating and cooling, ""commercial""",70.672
```

Expected labels: `Pumped heat`, `Heating and cooling, "homes"`, `Heating and cooling, "commercial"`

Tool output (9010 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:sankey-docs-energy-full

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Agricultural 'waste'

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  sankey:
    showValues: false
---
sankey

Agricultural 'waste',Bio-conversion,124.729
Bio-conversion,Liquid,0.597
Bio-conversion,Losses,26.862
Bio-conversion,Solid,280.322
Bio-conversion,Gas,81.144
Biofuel imports,Liquid,35
Biomass imports,Solid,35
Coal imports,Coal,11.606
Coal reserves,Coal,63.965
Coal,Solid,75.571
District heating,Industry,10.639
District heating,Heating and cooling - commercial,22.505
District heating,Heating and cooling - homes,46.184
Electricity grid,Over generation / exports,104.453
Electricity grid,Heating and cooling - homes,113.726
Electricity grid,H2 conversion,27.14
Electricity grid,Industry,342.165
Electricity grid,Road transport,37.797
Electricity grid,Agriculture,4.412
Electricity grid,Heating and cooling - commercial,40.858
Electricity grid,Losses,56.691
Electricity grid,Rail transport,7.863
Electricity grid,Lighting & appliances - commercial,90.008
Electricity grid,Lighting & appliances - homes,93.494
Gas imports,Ngas,40.719
Gas reserves,Ngas,82.233
Gas,Heating and cooling - commercial,0.129
Gas,Losses,1.401
Gas,Thermal generation,151.891
Gas,Agriculture,2.096
Gas,Industry,48.58
Geothermal,Electricity grid,7.013
H2 conversion,H2,20.897
H2 conversion,Losses,6.242
H2,Road transport,20.897
Hydro,Electricity grid,6.995
Liquid,Industry,121.066
Liquid,International shipping,128.69
Liquid,Road transport,135.835
Liquid,Domestic aviation,14.458
Liquid,International aviation,206.267
Liquid,Agriculture,3.64
Liquid,National navigation,33.218
Liquid,Rail transport,4.413
Marine algae,Bio-conversion,4.375
Ngas,Gas,122.952
Nuclear,Thermal generation,839.978
Oil imports,Oil,504.287
Oil reserves,Oil,107.703
Oil,Liquid,611.99
Other waste,Solid,56.587
Other waste,Bio-conversion,77.81
Pumped heat,Heating and cooling - homes,193.026
Pumped heat,Heating and cooling - commercial,70.672
Solar PV,Electricity grid,59.901
Solar Thermal,Heating and cooling - homes,19.263
Solar,Solar Thermal,19.263
Solar,Solar PV,59.901
Solid,Agriculture,0.882
Solid,Thermal generation,400.12
Solid,Industry,46.477
Thermal generation,Electricity grid,525.531
Thermal generation,Losses,787.129
Thermal generation,District heating,79.329
Tidal,Electricity grid,9.452
UK land based bioenergy,Bio-conversion,182.01
Wave,Electricity grid,19.013
Wind,Electricity grid,289.366
```

Expected labels: `Agricultural 'waste'`, `Bio-conversion`, `Liquid`, `Losses`, `Solid`, `Gas`, `Biofuel imports`, `Biomass imports`, `Coal imports`, `Coal`, `Coal reserves`, `District heating`, `Industry`, `Heating and cooling - commercial`, `Heating and cooling - homes`, `Electricity grid`, `Over generation / exports`, `H2 conversion`, `Road transport`, `Agriculture`, `Rail transport`, `Lighting & appliances - commercial`, `Lighting & appliances - homes`, `Gas imports`, `Ngas`, `Gas reserves`, `Thermal generation`, `Geothermal`, `H2`, `Hydro`, `International shipping`, `Domestic aviation`, `International aviation`, `National navigation`, `Marine algae`, `Nuclear`, `Oil imports`, `Oil`, `Oil reserves`, `Other waste`, `Pumped heat`, `Solar PV`, `Solar Thermal`, `Solar`, `Tidal`, `UK land based bioenergy`, `Wave`, `Wind`

### corpus:mermaid-upstream-suite-bench:sankey-docs-double-quotes

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Heating and cooling, "homes", Heating and cooling, "commercial"

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sankey

Pumped heat,"Heating and cooling, ""homes""",193.026
Pumped heat,"Heating and cooling, ""commercial""",70.672
```

Expected labels: `Pumped heat`, `Heating and cooling, "homes"`, `Heating and cooling, "commercial"`

### corpus:mermaid-upstream-suite-bench:sankey-docs-energy-full

browser API, SVG. Missing authored label: Agricultural 'waste'

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  sankey:
    showValues: false
---
sankey

Agricultural 'waste',Bio-conversion,124.729
Bio-conversion,Liquid,0.597
Bio-conversion,Losses,26.862
Bio-conversion,Solid,280.322
Bio-conversion,Gas,81.144
Biofuel imports,Liquid,35
Biomass imports,Solid,35
Coal imports,Coal,11.606
Coal reserves,Coal,63.965
Coal,Solid,75.571
District heating,Industry,10.639
District heating,Heating and cooling - commercial,22.505
District heating,Heating and cooling - homes,46.184
Electricity grid,Over generation / exports,104.453
Electricity grid,Heating and cooling - homes,113.726
Electricity grid,H2 conversion,27.14
Electricity grid,Industry,342.165
Electricity grid,Road transport,37.797
Electricity grid,Agriculture,4.412
Electricity grid,Heating and cooling - commercial,40.858
Electricity grid,Losses,56.691
Electricity grid,Rail transport,7.863
Electricity grid,Lighting & appliances - commercial,90.008
Electricity grid,Lighting & appliances - homes,93.494
Gas imports,Ngas,40.719
Gas reserves,Ngas,82.233
Gas,Heating and cooling - commercial,0.129
Gas,Losses,1.401
Gas,Thermal generation,151.891
Gas,Agriculture,2.096
Gas,Industry,48.58
Geothermal,Electricity grid,7.013
H2 conversion,H2,20.897
H2 conversion,Losses,6.242
H2,Road transport,20.897
Hydro,Electricity grid,6.995
Liquid,Industry,121.066
Liquid,International shipping,128.69
Liquid,Road transport,135.835
Liquid,Domestic aviation,14.458
Liquid,International aviation,206.267
Liquid,Agriculture,3.64
Liquid,National navigation,33.218
Liquid,Rail transport,4.413
Marine algae,Bio-conversion,4.375
Ngas,Gas,122.952
Nuclear,Thermal generation,839.978
Oil imports,Oil,504.287
Oil reserves,Oil,107.703
Oil,Liquid,611.99
Other waste,Solid,56.587
Other waste,Bio-conversion,77.81
Pumped heat,Heating and cooling - homes,193.026
Pumped heat,Heating and cooling - commercial,70.672
Solar PV,Electricity grid,59.901
Solar Thermal,Heating and cooling - homes,19.263
Solar,Solar Thermal,19.263
Solar,Solar PV,59.901
Solid,Agriculture,0.882
Solid,Thermal generation,400.12
Solid,Industry,46.477
Thermal generation,Electricity grid,525.531
Thermal generation,Losses,787.129
Thermal generation,District heating,79.329
Tidal,Electricity grid,9.452
UK land based bioenergy,Bio-conversion,182.01
Wave,Electricity grid,19.013
Wind,Electricity grid,289.366
```

Expected labels: `Agricultural 'waste'`, `Bio-conversion`, `Liquid`, `Losses`, `Solid`, `Gas`, `Biofuel imports`, `Biomass imports`, `Coal imports`, `Coal`, `Coal reserves`, `District heating`, `Industry`, `Heating and cooling - commercial`, `Heating and cooling - homes`, `Electricity grid`, `Over generation / exports`, `H2 conversion`, `Road transport`, `Agriculture`, `Rail transport`, `Lighting & appliances - commercial`, `Lighting & appliances - homes`, `Gas imports`, `Ngas`, `Gas reserves`, `Thermal generation`, `Geothermal`, `H2`, `Hydro`, `International shipping`, `Domestic aviation`, `International aviation`, `National navigation`, `Marine algae`, `Nuclear`, `Oil imports`, `Oil`, `Oil reserves`, `Other waste`, `Pumped heat`, `Solar PV`, `Solar Thermal`, `Solar`, `Tidal`, `UK land based bioenergy`, `Wave`, `Wind`

Tool output (59006 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:sankey-docs-double-quotes

browser API, SVG. Missing authored label: Heating and cooling, "homes"; Missing authored label: Heating and cooling, "commercial"

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sankey

Pumped heat,"Heating and cooling, ""homes""",193.026
Pumped heat,"Heating and cooling, ""commercial""",70.672
```

Expected labels: `Pumped heat`, `Heating and cooling, "homes"`, `Heating and cooling, "commercial"`

Tool output (9010 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

## sequence

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-handle-a-sequencediagram-definition-with-a-accessibility-title-and-description-accd

Node API, SVG. Error: Missing authored label: Diagram Title

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram
title: Diagram Title
accTitle: This is the title
accDescr: Accessibility Description
Alice->Bob:Hello Bob, how are you?
```

Expected labels: `Diagram Title`, `Alice`, `Bob`, `Hello Bob, how are you?`

Tool output (7026 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-handle-a-sequencediagram-definition-with-a-title

Node API, SVG. Error: Missing authored label: Diagram Title

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram
title: Diagram Title
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!
```

Expected labels: `Diagram Title`, `Alice`, `Bob`, `Hello Bob, how are you?`, `I am good thanks!`

Tool output (8280 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-handle-semicolons

Node API, SVG. Error: Missing authored label: Alice; Missing authored label: Bob; Missing authored label: Hello Bob, how are you?; Missing authored label: I am good thanks!

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram;Alice->Bob: Hello Bob, how are you?;Note right of Bob: Bob thinks;Bob-->Alice: I am good thanks!;
```

Expected labels: `Alice`, `Bob`, `Hello Bob, how are you?`, `I am good thanks!`

Tool output (4590 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-parse-actor-participant

Node API, SVG. Error: Missing authored label: A

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram
      participant A@{ "type" : "queue" }
      A->A: test
```

Expected labels: `A`, `test`

Tool output (6465 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-parse-actor-with-stereotype-and-alias

Node API, SVG. Error: Missing authored label: Message Queue

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram
      actor A@{ "type" : "database" } AS Database Server
      actor B@{ "type" : "queue" } as Message Queue
      A->>B: Send message
```

Expected labels: `Database Server`, `Message Queue`, `Send message`

Tool output (8153 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-parse-mixed-participant-types-with-extended-syntax

Node API, SVG. Error: Missing authored label: dsa

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram
        participant lead
        participant dsa@{ "type" : "queue" }
        API->>+Database: getUserb
        Database-->>-API: userb
        dsa --> Database: hello
```

Expected labels: `API`, `Database`, `dsa`, `lead`, `getUserb`, `userb`, `hello`

Tool output (10498 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-parse-queue-participant

Node API, SVG. Error: Missing authored label: Q

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram
      participant Q@{ "type" : "queue" }
      Q->Q: test
```

Expected labels: `Q`, `test`

Tool output (6465 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-draw-two-actors-notes-to-the-left-with-text-wrapped-inline

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Hello Bob, how are you? If you are not available right now, I can leave you a message. Please get back to me as soon as you can!

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram
Alice->>Bob:wrap: Hello Bob, how are you? If you are not available right now, I can leave you a message. Please get back to me as soon as you can!
Note left of Alice: Bob thinks
Bob->>Alice: Fine!
```

Expected labels: `Alice`, `Bob`, `Hello Bob, how are you? If you are not available right now, I can leave you a message. Please get back to me as soon as you can!`, `Fine!`

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-handle-a-sequencediagram-definition-with-a-accessibility-title-and-description-accd

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Diagram Title

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram
title: Diagram Title
accTitle: This is the title
accDescr: Accessibility Description
Alice->Bob:Hello Bob, how are you?
```

Expected labels: `Diagram Title`, `Alice`, `Bob`, `Hello Bob, how are you?`

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-handle-a-sequencediagram-definition-with-a-title

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Diagram Title

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram
title: Diagram Title
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!
```

Expected labels: `Diagram Title`, `Alice`, `Bob`, `Hello Bob, how are you?`, `I am good thanks!`

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-handle-a-sequencediagram-definition-with-a-title-without-a

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Diagram Title

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram
title Diagram Title
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!
```

Expected labels: `Diagram Title`, `Alice`, `Bob`, `Hello Bob, how are you?`, `I am good thanks!`

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-handle-notes-and-messages-with-wrap-specified

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): single-line text, multiline text

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram
participant 1
participant 2
participant 3
participant 4
1->>2:wrap: single-line text
note right of 2:wrap: single-line text
2->>3:wrap: multiline<br/>text
note right of 3:wrap: multiline<br/>text
```

Expected labels: `1`, `2`, `3`, `4`, `single-line text`, `multiline text`

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-handle-semicolons

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Alice, Bob, Hello Bob, how are you?, I am good thanks!

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram;Alice->Bob: Hello Bob, how are you?;Note right of Bob: Bob thinks;Bob-->Alice: I am good thanks!;
```

Expected labels: `Alice`, `Bob`, `Hello Bob, how are you?`, `I am good thanks!`

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-parse-actor-with-stereotype-and-alias

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Database Server

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram
      actor A@{ "type" : "database" } AS Database Server
      actor B@{ "type" : "queue" } as Message Queue
      A->>B: Send message
```

Expected labels: `Database Server`, `Message Queue`, `Send message`

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-parse-participant-with-stereotype-and-simple-alias

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Public API

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram
      participant API@{ "type" : "boundary" } AS Public API
      API->>API: test
```

Expected labels: `Public API`, `test`

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-handle-a-sequencediagram-definition-with-a-accessibility-title-and-description-accd

browser API, SVG. Missing authored label: Diagram Title

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram
title: Diagram Title
accTitle: This is the title
accDescr: Accessibility Description
Alice->Bob:Hello Bob, how are you?
```

Expected labels: `Diagram Title`, `Alice`, `Bob`, `Hello Bob, how are you?`

Tool output (7026 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-handle-a-sequencediagram-definition-with-a-title

browser API, SVG. Missing authored label: Diagram Title

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram
title: Diagram Title
Alice->Bob:Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!
```

Expected labels: `Diagram Title`, `Alice`, `Bob`, `Hello Bob, how are you?`, `I am good thanks!`

Tool output (8280 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-handle-semicolons

browser API, SVG. Missing authored label: Alice; Missing authored label: Bob; Missing authored label: Hello Bob, how are you?; Missing authored label: I am good thanks!

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram;Alice->Bob: Hello Bob, how are you?;Note right of Bob: Bob thinks;Bob-->Alice: I am good thanks!;
```

Expected labels: `Alice`, `Bob`, `Hello Bob, how are you?`, `I am good thanks!`

Tool output (4590 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-parse-actor-participant

browser API, SVG. Missing authored label: A

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram
      participant A@{ "type" : "queue" }
      A->A: test
```

Expected labels: `A`, `test`

Tool output (6465 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-parse-actor-with-stereotype-and-alias

browser API, SVG. Missing authored label: Message Queue

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram
      actor A@{ "type" : "database" } AS Database Server
      actor B@{ "type" : "queue" } as Message Queue
      A->>B: Send message
```

Expected labels: `Database Server`, `Message Queue`, `Send message`

Tool output (8153 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-parse-mixed-participant-types-with-extended-syntax

browser API, SVG. Missing authored label: dsa

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram
        participant lead
        participant dsa@{ "type" : "queue" }
        API->>+Database: getUserb
        Database-->>-API: userb
        dsa --> Database: hello
```

Expected labels: `API`, `Database`, `dsa`, `lead`, `getUserb`, `userb`, `hello`

Tool output (10498 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:sequence-upstream-should-parse-queue-participant

browser API, SVG. Missing authored label: Q

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
sequenceDiagram
      participant Q@{ "type" : "queue" }
      Q->Q: test
```

Expected labels: `Q`, `test`

Tool output (6465 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

## state

### corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-multiline-notes-with-different-line-breaks

Node API, SVG. Error: Missing authored label: Line1 Line2 Line3 Line4 Line5

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram-v2
      State1
      note right of State1
      Line1<br>Line2<br/>Line3<br />Line4<br	/>Line5
      end note
```

Expected labels: `State1`, `Line1 Line2 Line3 Line4 Line5`

Tool output (5681 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-multiline-notes-with-different-line-breaks-2

Node API, SVG. Error: Missing authored label: Line1 Line2 Line3 Line4 Line5

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram
        State1
        note right of State1
          Line1<br>Line2<br/>Line3<br />Line4<br	/>Line5
        end note
```

Expected labels: `State1`, `Line1 Line2 Line3 Line4 Line5`

Tool output (5681 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-note-statements

Node API, SVG. Error: Missing authored label: this is a short note

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram-v2

      [*] --> Active
      Active --> Inactive

      note left of Active : this is a short<br/>note

      note right of Inactive
      A note can also
      be defined on
      several lines
      end note
```

Expected labels: `Active`, `Inactive`, `this is a short note`, `A note can also be defined on several lines`

Tool output (10174 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-note-statements-2

Node API, SVG. Error: Missing authored label: this is a short note

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram

        [*] --> Active
        Active --> Inactive

        note left of Active : this is a short<br/>note

        note right of Inactive
          A note can also
          be defined on
          several lines
        end note
```

Expected labels: `Active`, `Inactive`, `this is a short note`, `A note can also be defined on several lines`

Tool output (10174 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:state-upstream-should-state-definition-with-quotes

Node API, SVG. Error: Missing authored label: Accumulate Enough Data Long State Name

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram-v2

      scale 600 width

      [*] --> State1
      State1 --> State2 : Succeeded
      State1 --> [*] : Aborted
      State2 --> State3 : Succeeded
      State2 --> [*] : Aborted
      state State3 {
        state "Accumulate Enough Data
Long State Name" as long1
        long1 : Just a test
        [*] --> long1
        long1 --> long1 : New Data
        long1 --> ProcessData : Enough Data
      }
      State3 --> State3 : Failed
      State3 --> [*] : Succeeded / Save Result
      State3 --> [*] : Aborted
```

Expected labels: `State1`, `State2`, `State3`, `Accumulate Enough Data Long State Name`, `ProcessData`, `Succeeded`, `Aborted`, `New Data`, `Enough Data`, `Failed`, `Succeeded / Save Result`

Tool output (18018 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:state-upstream-should-state-definition-with-quotes-2

Node API, SVG. Error: Missing authored label: Accumulate Enough Data Long State Name

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram

        scale 600 width

        [*] --> State1
        State1 --> State2 : Succeeded
        State1 --> [*] : Aborted
        State2 --> State3 : Succeeded
        State2 --> [*] : Aborted
        state State3 {
          state "Accumulate Enough Data
Long State Name" as long1
          long1 : Just a test
          [*] --> long1
          long1 --> long1 : New Data
          long1 --> ProcessData : Enough Data
        }
        State3 --> State3 : Failed
        State3 --> [*] : Succeeded / Save Result
        State3 --> [*] : Aborted
```

Expected labels: `State1`, `State2`, `State3`, `Accumulate Enough Data Long State Name`, `ProcessData`, `Succeeded`, `Aborted`, `New Data`, `Enough Data`, `Failed`, `Succeeded / Save Result`

Tool output (18018 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:state-upstream-state-group-name-as-stateidentifier

Node API, SVG. Error: Missing authored label: should point to Big State 1 container; Missing authored label: should point to bigState2 container

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram-v2
        state "Small State 1" as namedState1
        %% Notice that this is named "Big State 1" with an "as"
        state "Big State 1" as bigState1 {
            bigState1InternalState
        }
        namedState1 --> bigState1: should point to \nBig State 1 container

        state "Small State 2" as namedState2
        %% Notice that bigState2 does not have a name; no "as"
        state bigState2 {
            bigState2InternalState
        }
        namedState2 --> bigState2: should point to \nbigState2 container
```

Expected labels: `Small State 1`, `Big State 1`, `bigState1InternalState`, `Small State 2`, `bigState2`, `bigState2InternalState`, `should point to Big State 1 container`, `should point to bigState2 container`

Tool output (11132 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:state-upstream-hide-empty-description

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): this is a string

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram-v2

      hide empty description
      [*] --> State1
      State1 --> [*]
      State1 : this is a string
      State1 : this is another string

      State1 --> State2
      State2 --> [*]
```

Expected labels: `this is a string`, `State2`

### corpus:mermaid-upstream-suite-bench:state-upstream-hide-empty-description-2

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): this is a string

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram

        hide empty description
        [*] --> State1
        State1 --> [*]
        State1 : this is a string
        State1 : this is another string

        State1 --> State2
        State2 --> [*]
```

Expected labels: `this is a string`, `State2`

### corpus:mermaid-upstream-suite-bench:state-upstream-scale

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): this is a string with - in it

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram-v2

      scale 350 width
      [*] --> State1
      State1 --> [*]
      State1 : this is a string with - in it
      State1 : this is another string

      State1 --> State2
      State2 --> [*]
```

Expected labels: `this is a string with - in it`, `State2`

### corpus:mermaid-upstream-suite-bench:state-upstream-scale-2

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): this is a string with - in it

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram

        scale 350 width
        [*] --> State1
        State1 --> [*]
        State1 : this is a string with - in it
        State1 : this is another string

        State1 --> State2
        State2 --> [*]
```

Expected labels: `this is a string with - in it`, `State2`

### corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-multiline-notes-with-different-line-breaks

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Line1 Line2 Line3 Line4 Line5

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram-v2
      State1
      note right of State1
      Line1<br>Line2<br/>Line3<br />Line4<br	/>Line5
      end note
```

Expected labels: `State1`, `Line1 Line2 Line3 Line4 Line5`

### corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-multiline-notes-with-different-line-breaks-2

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Line1 Line2 Line3 Line4 Line5

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram
        State1
        note right of State1
          Line1<br>Line2<br/>Line3<br />Line4<br	/>Line5
        end note
```

Expected labels: `State1`, `Line1 Line2 Line3 Line4 Line5`

### corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-note-statements

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): this is a short note

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram-v2

      [*] --> Active
      Active --> Inactive

      note left of Active : this is a short<br/>note

      note right of Inactive
      A note can also
      be defined on
      several lines
      end note
```

Expected labels: `Active`, `Inactive`, `this is a short note`, `A note can also be defined on several lines`

### corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-note-statements-2

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): this is a short note

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram

        [*] --> Active
        Active --> Inactive

        note left of Active : this is a short<br/>note

        note right of Inactive
          A note can also
          be defined on
          several lines
        end note
```

Expected labels: `Active`, `Inactive`, `this is a short note`, `A note can also be defined on several lines`

### corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-relation-definitions

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): this is a string

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram-v2

      [*] --> State1
      State1 --> [*]
      State1 : this is a string
      State1 : this is another string

      State1 --> State2
      State2 --> [*]
```

Expected labels: `this is a string`, `State2`

### corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-relation-definitions-2

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): this is a string

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram

        [*] --> State1
        State1 --> [*]
        State1 : this is a string
        State1 : this is another string

        State1 --> State2
        State2 --> [*]
```

Expected labels: `this is a string`, `State2`

### corpus:mermaid-upstream-suite-bench:state-upstream-should-only-accept-1-word

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): X

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram-v2
        state valid { X }
```

Expected labels: `valid`, `X`

### corpus:mermaid-upstream-suite-bench:state-upstream-should-state-definition-with-quotes

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Accumulate Enough Data Long State Name

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram-v2

      scale 600 width

      [*] --> State1
      State1 --> State2 : Succeeded
      State1 --> [*] : Aborted
      State2 --> State3 : Succeeded
      State2 --> [*] : Aborted
      state State3 {
        state "Accumulate Enough Data
Long State Name" as long1
        long1 : Just a test
        [*] --> long1
        long1 --> long1 : New Data
        long1 --> ProcessData : Enough Data
      }
      State3 --> State3 : Failed
      State3 --> [*] : Succeeded / Save Result
      State3 --> [*] : Aborted
```

Expected labels: `State1`, `State2`, `State3`, `Accumulate Enough Data Long State Name`, `ProcessData`, `Succeeded`, `Aborted`, `New Data`, `Enough Data`, `Failed`, `Succeeded / Save Result`

### corpus:mermaid-upstream-suite-bench:state-upstream-should-state-definition-with-quotes-2

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Accumulate Enough Data Long State Name

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram

        scale 600 width

        [*] --> State1
        State1 --> State2 : Succeeded
        State1 --> [*] : Aborted
        State2 --> State3 : Succeeded
        State2 --> [*] : Aborted
        state State3 {
          state "Accumulate Enough Data
Long State Name" as long1
          long1 : Just a test
          [*] --> long1
          long1 --> long1 : New Data
          long1 --> ProcessData : Enough Data
        }
        State3 --> State3 : Failed
        State3 --> [*] : Succeeded / Save Result
        State3 --> [*] : Aborted
```

Expected labels: `State1`, `State2`, `State3`, `Accumulate Enough Data Long State Name`, `ProcessData`, `Succeeded`, `Aborted`, `New Data`, `Enough Data`, `Failed`, `Succeeded / Save Result`

### corpus:mermaid-upstream-suite-bench:state-upstream-state-group-name-as-stateidentifier

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): should point to Big State 1 container, should point to bigState2 container

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram-v2
        state "Small State 1" as namedState1
        %% Notice that this is named "Big State 1" with an "as"
        state "Big State 1" as bigState1 {
            bigState1InternalState
        }
        namedState1 --> bigState1: should point to \nBig State 1 container

        state "Small State 2" as namedState2
        %% Notice that bigState2 does not have a name; no "as"
        state bigState2 {
            bigState2InternalState
        }
        namedState2 --> bigState2: should point to \nbigState2 container
```

Expected labels: `Small State 1`, `Big State 1`, `bigState1InternalState`, `Small State 2`, `bigState2`, `bigState2InternalState`, `should point to Big State 1 container`, `should point to bigState2 container`

### corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-multiline-notes-with-different-line-breaks

browser API, SVG. Missing authored label: Line1 Line2 Line3 Line4 Line5

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram-v2
      State1
      note right of State1
      Line1<br>Line2<br/>Line3<br />Line4<br	/>Line5
      end note
```

Expected labels: `State1`, `Line1 Line2 Line3 Line4 Line5`

Tool output (5681 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-multiline-notes-with-different-line-breaks-2

browser API, SVG. Missing authored label: Line1 Line2 Line3 Line4 Line5

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram
        State1
        note right of State1
          Line1<br>Line2<br/>Line3<br />Line4<br	/>Line5
        end note
```

Expected labels: `State1`, `Line1 Line2 Line3 Line4 Line5`

Tool output (5681 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-note-statements

browser API, SVG. Missing authored label: this is a short note

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram-v2

      [*] --> Active
      Active --> Inactive

      note left of Active : this is a short<br/>note

      note right of Inactive
      A note can also
      be defined on
      several lines
      end note
```

Expected labels: `Active`, `Inactive`, `this is a short note`, `A note can also be defined on several lines`

Tool output (10174 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:state-upstream-should-handle-note-statements-2

browser API, SVG. Missing authored label: this is a short note

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram

        [*] --> Active
        Active --> Inactive

        note left of Active : this is a short<br/>note

        note right of Inactive
          A note can also
          be defined on
          several lines
        end note
```

Expected labels: `Active`, `Inactive`, `this is a short note`, `A note can also be defined on several lines`

Tool output (10174 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:state-upstream-should-state-definition-with-quotes

browser API, SVG. Missing authored label: Accumulate Enough Data Long State Name

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram-v2

      scale 600 width

      [*] --> State1
      State1 --> State2 : Succeeded
      State1 --> [*] : Aborted
      State2 --> State3 : Succeeded
      State2 --> [*] : Aborted
      state State3 {
        state "Accumulate Enough Data
Long State Name" as long1
        long1 : Just a test
        [*] --> long1
        long1 --> long1 : New Data
        long1 --> ProcessData : Enough Data
      }
      State3 --> State3 : Failed
      State3 --> [*] : Succeeded / Save Result
      State3 --> [*] : Aborted
```

Expected labels: `State1`, `State2`, `State3`, `Accumulate Enough Data Long State Name`, `ProcessData`, `Succeeded`, `Aborted`, `New Data`, `Enough Data`, `Failed`, `Succeeded / Save Result`

Tool output (18018 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:state-upstream-should-state-definition-with-quotes-2

browser API, SVG. Missing authored label: Accumulate Enough Data Long State Name

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram

        scale 600 width

        [*] --> State1
        State1 --> State2 : Succeeded
        State1 --> [*] : Aborted
        State2 --> State3 : Succeeded
        State2 --> [*] : Aborted
        state State3 {
          state "Accumulate Enough Data
Long State Name" as long1
          long1 : Just a test
          [*] --> long1
          long1 --> long1 : New Data
          long1 --> ProcessData : Enough Data
        }
        State3 --> State3 : Failed
        State3 --> [*] : Succeeded / Save Result
        State3 --> [*] : Aborted
```

Expected labels: `State1`, `State2`, `State3`, `Accumulate Enough Data Long State Name`, `ProcessData`, `Succeeded`, `Aborted`, `New Data`, `Enough Data`, `Failed`, `Succeeded / Save Result`

Tool output (18018 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:state-upstream-state-group-name-as-stateidentifier

browser API, SVG. Missing authored label: should point to Big State 1 container; Missing authored label: should point to bigState2 container

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
stateDiagram-v2
        state "Small State 1" as namedState1
        %% Notice that this is named "Big State 1" with an "as"
        state "Big State 1" as bigState1 {
            bigState1InternalState
        }
        namedState1 --> bigState1: should point to \nBig State 1 container

        state "Small State 2" as namedState2
        %% Notice that bigState2 does not have a name; no "as"
        state bigState2 {
            bigState2InternalState
        }
        namedState2 --> bigState2: should point to \nbigState2 container
```

Expected labels: `Small State 1`, `Big State 1`, `bigState1InternalState`, `Small State 2`, `bigState2`, `bigState2InternalState`, `should point to Big State 1 container`, `should point to bigState2 container`

Tool output (11132 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

## timeline

### corpus:mermaid-upstream-suite-bench:timeline-upstream-should-handle-a-section-and-task-and-its-events-including-markdown-link

Node API, SVG. Error: Missing authored label: [event1](http://example.com)

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
timeline
    section abc-123
      task1: [event1](http://example.com)
      task2: event2: event3
```

Expected labels: `abc-123`, `task1`, `[event1](http://example.com)`, `task2`, `event2`, `event3`

Tool output (12009 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:timeline-upstream-should-handle-a-title-section-task-and-events-with-hashtags

Node API, SVG. Error: Missing authored label: #ev#ent2#; Missing authored label: #ev#ent3#

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
timeline
      title #my#title#
      section #a#bc-123#
      task1: #ev#ent1# : #ev#ent2# : #ev#ent3#
```

Expected labels: `#a#bc-123#`, `task1`, `#ev#ent1#`, `#ev#ent2#`, `#ev#ent3#`

Tool output (8873 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:timeline-upstream-should-handle-a-title-section-task-and-events-with-semicolons

Node API, SVG. Error: Missing authored label: ;ev;ent2;; Missing authored label: ;ev;ent3;

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
timeline
      title ;my;title;
      section ;a;bc-123;
      ;ta;sk1;: ;ev;ent1; : ;ev;ent2; : ;ev;ent3;
```

Expected labels: `;a;bc-123;`, `;ta;sk1;`, `;ev;ent1;`, `;ev;ent2;`, `;ev;ent3;`

Tool output (8897 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:timeline-upstream-should-parse-lr-direction

Node API, SVG. Error: Missing authored label: abc-123

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
timeline LR
    section abc-123
```

Expected labels: `abc-123`

Tool output (6199 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:timeline-upstream-should-parse-td-direction

Node API, SVG. Error: Missing authored label: abc-123

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
timeline TD
    section abc-123
```

Expected labels: `abc-123`

Tool output (6199 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:timeline-upstream-should-handle-a-section-and-task-and-its-events-including-markdown-link

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): [event1](http://example.com)

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
timeline
    section abc-123
      task1: [event1](http://example.com)
      task2: event2: event3
```

Expected labels: `abc-123`, `task1`, `[event1](http://example.com)`, `task2`, `event2`, `event3`

### corpus:mermaid-upstream-suite-bench:timeline-upstream-should-handle-a-title-section-task-and-events-with-hashtags

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): #ev#ent2#, #ev#ent3#

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
timeline
      title #my#title#
      section #a#bc-123#
      task1: #ev#ent1# : #ev#ent2# : #ev#ent3#
```

Expected labels: `#a#bc-123#`, `task1`, `#ev#ent1#`, `#ev#ent2#`, `#ev#ent3#`

### corpus:mermaid-upstream-suite-bench:timeline-upstream-should-handle-a-title-section-task-and-events-with-semicolons

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): ;ev;ent2;, ;ev;ent3;

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
timeline
      title ;my;title;
      section ;a;bc-123;
      ;ta;sk1;: ;ev;ent1; : ;ev;ent2; : ;ev;ent3;
```

Expected labels: `;a;bc-123;`, `;ta;sk1;`, `;ev;ent1;`, `;ev;ent2;`, `;ev;ent3;`

### corpus:mermaid-upstream-suite-bench:timeline-upstream-should-handle-a-section-and-task-and-its-events-including-markdown-link

browser API, SVG. Missing authored label: [event1](http://example.com)

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
timeline
    section abc-123
      task1: [event1](http://example.com)
      task2: event2: event3
```

Expected labels: `abc-123`, `task1`, `[event1](http://example.com)`, `task2`, `event2`, `event3`

Tool output (12009 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:timeline-upstream-should-handle-a-title-section-task-and-events-with-hashtags

browser API, SVG. Missing authored label: #ev#ent2#; Missing authored label: #ev#ent3#

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
timeline
      title #my#title#
      section #a#bc-123#
      task1: #ev#ent1# : #ev#ent2# : #ev#ent3#
```

Expected labels: `#a#bc-123#`, `task1`, `#ev#ent1#`, `#ev#ent2#`, `#ev#ent3#`

Tool output (8873 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:timeline-upstream-should-handle-a-title-section-task-and-events-with-semicolons

browser API, SVG. Missing authored label: ;ev;ent2;; Missing authored label: ;ev;ent3;

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
timeline
      title ;my;title;
      section ;a;bc-123;
      ;ta;sk1;: ;ev;ent1; : ;ev;ent2; : ;ev;ent3;
```

Expected labels: `;a;bc-123;`, `;ta;sk1;`, `;ev;ent1;`, `;ev;ent2;`, `;ev;ent3;`

Tool output (8897 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:timeline-upstream-should-parse-lr-direction

browser API, SVG. Missing authored label: abc-123

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
timeline LR
    section abc-123
```

Expected labels: `abc-123`

Tool output (6199 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:timeline-upstream-should-parse-td-direction

browser API, SVG. Missing authored label: abc-123

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
timeline TD
    section abc-123
```

Expected labels: `abc-123`

Tool output (6199 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

## treemap

### corpus:mermaid-treemap-bench:treemap-e2e-8g-should-handle-scientific-notation-format

Node API, SVG. Error: Missing authored label: Value 2

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

Tool output (5877 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### editor:treemap

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Product investment

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
treemap
title Product investment
"Build"
  "Engineering": 60
  "Design": 25
"Learn"
  "Research": 30
  "Analytics": 15
```

Expected labels: `Product investment`, `Build`, `Engineering`, `Design`, `Learn`, `Research`, `Analytics`

### scaling:treemap:20-groups-240-leaves

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Product allocation

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

### corpus:mermaid-treemap-bench:treemap-e2e-8g-should-handle-scientific-notation-format

browser API, SVG. Missing authored label: Value 2

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

Tool output (5877 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

## treeview

### docs:treeview:0

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): src, index.ts, utils.ts, package.json, README.md

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
treeView-beta
├── src/
│   ├── index.ts
│   └── utils.ts
├── package.json
└── README.md

```

Expected labels: `src`, `index.ts`, `utils.ts`, `package.json`, `README.md`

### docs:treeview:1

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): src, App.tsx, index.ts, .env, Dockerfile, package.json

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
treeView-beta
├── src/
│   ├── App.tsx :::highlight icon(logos:react) ## main component
│   └── index.ts ## entry point
├── .env ## environment variables
├── Dockerfile
└── package.json

```

Expected labels: `src`, `App.tsx`, `index.ts`, `.env`, `Dockerfile`, `package.json`

### docs:treeview:2

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): packages, mermaid, src, parser.ts, renderer.ts, package.json, parser, README.md

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
treeView-beta
├── packages/
│   ├── mermaid/
│   │   ├── src/
│   │   │   ├── parser.ts
│   │   │   └── renderer.ts
│   │   └── package.json
│   └── parser/
│       └── src/
└── README.md

```

Expected labels: `packages`, `mermaid`, `src`, `parser.ts`, `renderer.ts`, `package.json`, `parser`, `README.md`

### docs:treeview:3

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): src, App.tsx

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
treeView-beta
    src/
        App.tsx :::highlight
        index.js
    package.json

```

Expected labels: `src`, `App.tsx`, `index.js`, `package.json`

### docs:treeview:4

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): src, index.js, config.ts, package.json

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
treeView-beta
    src/
        index.js ## app entry point
        config.ts ## runtime configuration
    package.json ## project manifest

```

Expected labels: `src`, `index.js`, `config.ts`, `package.json`

### docs:treeview:5

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): src

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  treeView:
    showIcons: true
---
treeView-beta
    src/
        index.js
    package.json

```

Expected labels: `src`, `index.js`, `package.json`

### docs:treeview:6

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): src

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  treeView:
    showIcons: true
    defaultIconPack: material-icon-theme
    filenameIcons:
      Dockerfile: docker
    extensionIcons:
      .ts: typescript
      .tsx: react-ts
      .txt: none
---
treeView-beta
    src/
        App.tsx
        utils.ts
    Dockerfile
    notes.txt
    README.md

```

Expected labels: `src`, `App.tsx`, `utils.ts`, `Dockerfile`, `notes.txt`, `README.md`

### docs:treeview:7

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): src, App.tsx

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
treeView-beta
    src/
        App.tsx icon(logos:react)
        index.js
    package.json

```

Expected labels: `src`, `App.tsx`, `index.js`, `package.json`

### docs:treeview:8

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): src, index.js

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  treeView:
    showIcons: true
---
treeView-beta
    src/
        index.js icon(none)
    package.json

```

Expected labels: `src`, `index.js`, `package.json`

### docs:treeview:9

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): my-project, src, App.tsx, index.js, .env

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
treeView-beta
    my-project/
        src/
            App.tsx :::highlight icon(logos:react) ## main component
            index.js ## entry point
        .env ## environment variables
        Dockerfile
        package.json

```

Expected labels: `my-project`, `src`, `App.tsx`, `index.js`, `.env`, `Dockerfile`, `package.json`

### docs:treeview:11

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): 🚀 rocket-app, 📦 packages, 🎨 ui, 🛠️ utils, 🧪 tests

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
treeView-beta
    🚀 rocket-app/
        📦 packages/
            🎨 ui/
            🛠️ utils/
        🧪 tests/
        📝 README.md
        ⚙️ config.yaml

```

Expected labels: `🚀 rocket-app`, `📦 packages`, `🎨 ui`, `🛠️ utils`, `🧪 tests`, `📝 README.md`, `⚙️ config.yaml`

## usecase

### docs:usecase:0

Node API, SVG. Error: Missing authored label: Place order; Missing authored label: Order system

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
direction LR
actor Customer("Customer")
systemBoundary "Order system"
  Checkout("Place order")
end
Customer --> Checkout

```

Expected labels: `Customer`, `Place order`, `Order system`

Tool output (6819 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:1

Node API, SVG. Error: Missing authored label: Browse catalogue; Missing authored label: Track delivery; Missing authored label: Storefront; Missing authored label: Fulfilment; Missing authored label: include

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
direction LR
actor Customer
actor Support
systemBoundary Storefront
  Browse("Browse catalogue")
  Checkout("Checkout")
end
systemBoundary Fulfilment
  Track("Track delivery")
end
Customer --> Browse
Customer --> Checkout
Customer --> Track
Support --> Track
Checkout ..> : include Browse

```

Expected labels: `Customer`, `Support`, `Browse catalogue`, `Checkout`, `Track delivery`, `Storefront`, `Fulfilment`, `include`

Tool output (10316 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:2

Node API, SVG. Error: Missing authored label: Browse catalogue; Missing authored label: Track delivery; Missing authored label: Storefront; Missing authored label: Fulfilment; Missing authored label: include

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  theme: default
  look: classic
  layout: dagre
---
usecase-beta
direction LR
actor Customer
actor Support
systemBoundary Storefront
  Browse("Browse catalogue")
  Checkout("Checkout")
end
systemBoundary Fulfilment
  Track("Track delivery")
end
Customer --> Browse
Customer --> Checkout
Customer --> Track
Support --> Track
Checkout ..> : include Browse

```

Expected labels: `Customer`, `Support`, `Browse catalogue`, `Checkout`, `Track delivery`, `Storefront`, `Fulfilment`, `include`

Tool output (10316 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:3

Node API, SVG. Error: Missing authored label: Sign in; Missing authored label: Generate report; Missing authored label: Reset password

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
Customer --> Login
actor Customer
actor Admin("Main administrator")
Login("Sign in")
Report[Generate report]
"Reset password"
Admin --> Report

```

Expected labels: `Customer`, `Main administrator`, `Sign in`, `Generate report`, `Reset password`

Tool output (9235 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:5

Node API, SVG. Error: Missing authored label: Prepare quote; Missing authored label: Archive quote

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor SalesAgent("Sales agent")@{ business: true } <<Employee>>
actor Broker@{ type: hollow, business: true }
Quote("Prepare quote")@{ business: true } <<Core>>
Archive[Archive quote] <<Record>>
SalesAgent --> Quote
Broker --> Quote
Quote --> Archive

```

Expected labels: `Sales agent`, `Broker`, `Prepare quote`, `Archive quote`

Tool output (9702 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:6

Node API, SVG. Error: Missing authored label: **Literal markers**; Missing authored label: Costs 19.95 EUR — VAT included!

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor Analyst(*Analyst*)
Literal(**Literal markers**)
Priced[Costs 19.95 EUR — VAT included!]
Analyst -- files R&D report --> Literal
Analyst --> Priced

```

Expected labels: `*Analyst*`, `**Literal markers**`, `Costs 19.95 EUR — VAT included!`, `files R&D report`

Tool output (9109 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:7

Node API, SVG. Error: Missing authored label: **Literal markers**; Missing authored label: **Formatted label** with a physical line break; Missing authored label: Show "quoted" text

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor Reviewer("`*Reviewer*`")
Literal("**Literal markers**")
Formatted("`**Formatted label**
with a physical line break`")
Quoted("Show #quot;quoted#quot; text")
Reviewer -- "`opens **form**`" --> Formatted
Reviewer --> Literal
Reviewer --> Quoted

```

Expected labels: `*Reviewer*`, `**Literal markers**`, `**Formatted label** with a physical line break`, `Show "quoted" text`, `opens **form**`

Tool output (10108 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:9

Node API, SVG. Error: Missing authored label: Authorize payment; Missing authored label: Create receipt; Missing authored label: Payment service

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
systemBoundary sb1["Payment service"]@{ type: package }:::system
  actor Clerk("Payment clerk")
  Authorize("Authorize payment")
  Receipt[Create receipt]
end
Clerk --> Authorize
Authorize --> Receipt
classDef system stroke:#4b4b7a

```

Expected labels: `Payment clerk`, `Authorize payment`, `Create receipt`, `Payment service`

Tool output (8381 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:10

Node API, SVG. Error: Missing authored label: Authorize payment; Missing authored label: Payment service

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
systemBoundary "Payment service"
  actor Clerk("Payment clerk")
  Authorize("Authorize payment")
end
Payment_service@{ type: package }
Clerk --> Authorize

```

Expected labels: `Payment clerk`, `Authorize payment`, `Payment service`

Tool output (7013 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:13

Node API, SVG. Error: Missing authored label: Checkout; Missing authored label: Payment; Missing authored label: ApplyCoupon; Missing authored label: include; Missing authored label: extend

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor Admin
actor Person
Checkout
Payment
ApplyCoupon
Admin --|> Person
Checkout ..> : include Payment
ApplyCoupon ..> : extend Checkout
ApplyCoupon --|> Checkout

```

Expected labels: `Admin`, `Person`, `Checkout`, `Payment`, `ApplyCoupon`, `include`, `extend`

Tool output (6724 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:14

Node API, SVG. Error: Missing authored label: Payment; Missing authored label: include

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor Customer
Checkout
Payment
Customer opens@-- "starts checkout" ---> Checkout
Checkout payment@..> : include Payment
classDef emphasized stroke:#d33,stroke-width:3px
class opens,payment emphasized
style opens stroke:#06c,stroke-width:4px
opens@{ animation: fast }
payment@{ animate: false }

```

Expected labels: `Customer`, `Checkout`, `Payment`, `starts checkout`, `include`

Tool output (7997 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:15

Node API, SVG. Error: Missing authored label: Sign in; Missing authored label: Requires an **active session**; Missing authored label: Starts the workflow

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
note for Login "`Requires an **active session**`"
note for User "Starts the workflow"
actor User
Login("Sign in")
User --> Login

```

Expected labels: `User`, `Sign in`, `Requires an **active session**`, `Starts the workflow`

Tool output (6700 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:17

Node API, SVG. Error: Missing authored label: Edit profile; Missing authored label: Account

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor Customer:::external
Checkout("Checkout"):::critical
systemBoundary Account
  Profile[Edit profile]
end
json Session@{ "active": true }:::data
Customer --> Checkout
Checkout --> Profile
Profile --> Session
classDef default stroke:#7f8ea3
classDef external,critical stroke-width:3px
class Customer,Checkout external,critical
class Account,Session data
style Checkout stroke:#c33,stroke-width:4px
style Account stroke:#536878

```

Expected labels: `Customer`, `Checkout`, `Edit profile`, `Session`, `Account`

Tool output (9661 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:18

Node API, SVG. Error: Missing authored label: Browse catalogue; Missing authored label: Catalogue; Missing authored label: Payment; Missing authored label: include

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  theme: redux-color
---
usecase-beta
direction LR
actor Customer
systemBoundary Catalogue
  Browse("Browse catalogue")
end
systemBoundary Payment
  Checkout("Checkout")
end
Customer --> Browse
Browse --> Checkout
Checkout ..> : include Browse

```

Expected labels: `Customer`, `Browse catalogue`, `Checkout`, `Catalogue`, `Payment`, `include`

Tool output (7880 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:19

Node API, SVG. Error: Missing authored label: Browse catalogue

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  theme: redux-color
  usecase:
    colorScheme: rotate
---
usecase-beta
direction LR
actor Customer
actor Auditor
Browse("Browse catalogue")
Checkout("Checkout")
Customer --> Browse
Browse --> Checkout
Auditor --> Checkout

```

Expected labels: `Customer`, `Auditor`, `Browse catalogue`, `Checkout`

Tool output (9259 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:20

Node API, SVG. Error: Missing authored label: Browse catalog

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  usecase:
    actorFontSize: 16
    actorFontFamily: Arial
    actorFontWeight: bold
    usecaseFontSize: 14
    usecaseFontFamily: Georgia
    usecaseFontWeight: normal
    nodeSpacing: 60
    rankSpacing: 70
    diagramPadding: 24
    colorScheme: role
    useMaxWidth: false
---
usecase-beta
direction LR
actor Customer
Browse("Browse catalog")
Customer --> Browse

```

Expected labels: `Customer`, `Browse catalog`

Tool output (6938 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:21

Node API, SVG. Error: Missing authored label: Sign in; Missing authored label: Reset password

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
accTitle: Account access use cases
accDescr {
  A customer signs in and can reset a password.
  The diagram names the actor, use cases, and associations.
}
actor Customer
SignIn("Sign in")
Reset("Reset password")
Customer --> SignIn
Customer --> Reset

```

Expected labels: `Customer`, `Sign in`, `Reset password`

Tool output (7869 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:22

Node API, SVG. Error: Missing authored label: Browse products; Missing authored label: Process payment; Missing authored label: Review order; Missing authored label: Validates the **cart** before payment; Missing authored label: Ordering System; Missing authored label: include

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
direction LR
accTitle: Online ordering use cases
accDescr {
  A customer places an order through the storefront.
  Staff review the order and inspect its data.
}
actor Customer("Customer")
actor Staff("Order staff")@{ type: hollow, business: true } <<Employee>>
systemBoundary ordering["Ordering System"]@{ type: package }:::system
  Browse("Browse products")
  Checkout("Checkout") <<Core>>:::critical
  Payment("Process payment")
  Review[Review order]
end
json OrderData@{
  "status": "pending",
  "items": [{ "name": "Book", "quantity": 1 }],
  "total": 29.95
}:::data
note for Checkout "`Validates the **cart** before payment`"
Customer starts@-- "places order" ---> Checkout
Customer --> Browse
Checkout pays@..> : include Payment
Staff --> Review
Review --> OrderData
classDef system stroke:#c8a02a,stroke-width:2px
classDef critical stroke:#c33,stroke-width:3px
classDef data stroke:#3572a5
starts@{ animation: fast }
style pays stroke:#6b46c1,stroke-width:2px

```

Expected labels: `Customer`, `Order staff`, `Browse products`, `Checkout`, `Process payment`, `Review order`, `Validates the **cart** before payment`, `OrderData`, `Ordering System`, `places order`, `include`

Tool output (12106 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:23

Node API, SVG. Error: Missing authored label: Reset password; Missing authored label: Refund (partial)

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor Customer
Reset("`Reset
password`")
Refund("Refund #40;partial#41;")
Customer --> Reset
Customer --> Refund

```

Expected labels: `Customer`, `Reset password`, `Refund (partial)`

Tool output (8038 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:0

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Place order, Order system

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
direction LR
actor Customer("Customer")
systemBoundary "Order system"
  Checkout("Place order")
end
Customer --> Checkout

```

Expected labels: `Customer`, `Place order`, `Order system`

### docs:usecase:1

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Browse catalogue, Track delivery, Storefront, Fulfilment, include

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
direction LR
actor Customer
actor Support
systemBoundary Storefront
  Browse("Browse catalogue")
  Checkout("Checkout")
end
systemBoundary Fulfilment
  Track("Track delivery")
end
Customer --> Browse
Customer --> Checkout
Customer --> Track
Support --> Track
Checkout ..> : include Browse

```

Expected labels: `Customer`, `Support`, `Browse catalogue`, `Checkout`, `Track delivery`, `Storefront`, `Fulfilment`, `include`

### docs:usecase:2

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Browse catalogue, Track delivery, Storefront, Fulfilment, include

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  theme: default
  look: classic
  layout: dagre
---
usecase-beta
direction LR
actor Customer
actor Support
systemBoundary Storefront
  Browse("Browse catalogue")
  Checkout("Checkout")
end
systemBoundary Fulfilment
  Track("Track delivery")
end
Customer --> Browse
Customer --> Checkout
Customer --> Track
Support --> Track
Checkout ..> : include Browse

```

Expected labels: `Customer`, `Support`, `Browse catalogue`, `Checkout`, `Track delivery`, `Storefront`, `Fulfilment`, `include`

### docs:usecase:3

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Main administrator, Sign in, Generate report, Reset password

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
Customer --> Login
actor Customer
actor Admin("Main administrator")
Login("Sign in")
Report[Generate report]
"Reset password"
Admin --> Report

```

Expected labels: `Customer`, `Main administrator`, `Sign in`, `Generate report`, `Reset password`

### docs:usecase:4

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Normal actor, Hollow actor, Awesome actor, Registered icon, Missing icon fallback

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor Normal("Normal actor")
actor Hollow("Hollow actor")@{ type: hollow }
actor Awesome("Awesome actor")@{ type: awesome }
actor Icon("Registered icon")@{ icon: "fa:user" }
actor Fallback("Missing icon fallback")@{ icon: "not-registered:user" }
Normal --> Manage
Hollow --> Manage
Awesome --> Manage
Icon --> Manage
Fallback --> Manage

```

Expected labels: `Normal actor`, `Hollow actor`, `Awesome actor`, `Registered icon`, `Missing icon fallback`, `Manage`

### docs:usecase:5

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Sales agent, Prepare quote, Archive quote

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor SalesAgent("Sales agent")@{ business: true } <<Employee>>
actor Broker@{ type: hollow, business: true }
Quote("Prepare quote")@{ business: true } <<Core>>
Archive[Archive quote] <<Record>>
SalesAgent --> Quote
Broker --> Quote
Quote --> Archive

```

Expected labels: `Sales agent`, `Broker`, `Prepare quote`, `Archive quote`

### docs:usecase:6

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): *Analyst*, **Literal markers**, Costs 19.95 EUR — VAT included!, files R&D report

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor Analyst(*Analyst*)
Literal(**Literal markers**)
Priced[Costs 19.95 EUR — VAT included!]
Analyst -- files R&D report --> Literal
Analyst --> Priced

```

Expected labels: `*Analyst*`, `**Literal markers**`, `Costs 19.95 EUR — VAT included!`, `files R&D report`

### docs:usecase:7

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): *Reviewer*, **Literal markers**, **Formatted label** with a physical line break, Show "quoted" text, opens **form**

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor Reviewer("`*Reviewer*`")
Literal("**Literal markers**")
Formatted("`**Formatted label**
with a physical line break`")
Quoted("Show #quot;quoted#quot; text")
Reviewer -- "`opens **form**`" --> Formatted
Reviewer --> Literal
Reviewer --> Quoted

```

Expected labels: `*Reviewer*`, `**Literal markers**`, `**Formatted label** with a physical line break`, `Show "quoted" text`, `opens **form**`

### docs:usecase:9

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Payment clerk, Authorize payment, Create receipt, Payment service

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
systemBoundary sb1["Payment service"]@{ type: package }:::system
  actor Clerk("Payment clerk")
  Authorize("Authorize payment")
  Receipt[Create receipt]
end
Clerk --> Authorize
Authorize --> Receipt
classDef system stroke:#4b4b7a

```

Expected labels: `Payment clerk`, `Authorize payment`, `Create receipt`, `Payment service`

### docs:usecase:10

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Payment clerk, Authorize payment, Payment service

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
systemBoundary "Payment service"
  actor Clerk("Payment clerk")
  Authorize("Authorize payment")
end
Payment_service@{ type: package }
Clerk --> Authorize

```

Expected labels: `Payment clerk`, `Authorize payment`, `Payment service`

### docs:usecase:12

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): include account details

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor User
Login
User -- "include account details" --> Login

```

Expected labels: `User`, `Login`, `include account details`

### docs:usecase:13

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Checkout, Payment, ApplyCoupon, include, extend

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor Admin
actor Person
Checkout
Payment
ApplyCoupon
Admin --|> Person
Checkout ..> : include Payment
ApplyCoupon ..> : extend Checkout
ApplyCoupon --|> Checkout

```

Expected labels: `Admin`, `Person`, `Checkout`, `Payment`, `ApplyCoupon`, `include`, `extend`

### docs:usecase:14

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Payment, starts checkout, include

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor Customer
Checkout
Payment
Customer opens@-- "starts checkout" ---> Checkout
Checkout payment@..> : include Payment
classDef emphasized stroke:#d33,stroke-width:3px
class opens,payment emphasized
style opens stroke:#06c,stroke-width:4px
opens@{ animation: fast }
payment@{ animate: false }

```

Expected labels: `Customer`, `Checkout`, `Payment`, `starts checkout`, `include`

### docs:usecase:15

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Sign in, Requires an **active session**, Starts the workflow

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
note for Login "`Requires an **active session**`"
note for User "Starts the workflow"
actor User
Login("Sign in")
User --> Login

```

Expected labels: `User`, `Sign in`, `Requires an **active session**`, `Starts the workflow`

### docs:usecase:17

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Edit profile, Account

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor Customer:::external
Checkout("Checkout"):::critical
systemBoundary Account
  Profile[Edit profile]
end
json Session@{ "active": true }:::data
Customer --> Checkout
Checkout --> Profile
Profile --> Session
classDef default stroke:#7f8ea3
classDef external,critical stroke-width:3px
class Customer,Checkout external,critical
class Account,Session data
style Checkout stroke:#c33,stroke-width:4px
style Account stroke:#536878

```

Expected labels: `Customer`, `Checkout`, `Edit profile`, `Session`, `Account`

### docs:usecase:18

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Browse catalogue, Catalogue, Payment, include

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  theme: redux-color
---
usecase-beta
direction LR
actor Customer
systemBoundary Catalogue
  Browse("Browse catalogue")
end
systemBoundary Payment
  Checkout("Checkout")
end
Customer --> Browse
Browse --> Checkout
Checkout ..> : include Browse

```

Expected labels: `Customer`, `Browse catalogue`, `Checkout`, `Catalogue`, `Payment`, `include`

### docs:usecase:19

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Browse catalogue

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  theme: redux-color
  usecase:
    colorScheme: rotate
---
usecase-beta
direction LR
actor Customer
actor Auditor
Browse("Browse catalogue")
Checkout("Checkout")
Customer --> Browse
Browse --> Checkout
Auditor --> Checkout

```

Expected labels: `Customer`, `Auditor`, `Browse catalogue`, `Checkout`

### docs:usecase:20

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Browse catalog

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  usecase:
    actorFontSize: 16
    actorFontFamily: Arial
    actorFontWeight: bold
    usecaseFontSize: 14
    usecaseFontFamily: Georgia
    usecaseFontWeight: normal
    nodeSpacing: 60
    rankSpacing: 70
    diagramPadding: 24
    colorScheme: role
    useMaxWidth: false
---
usecase-beta
direction LR
actor Customer
Browse("Browse catalog")
Customer --> Browse

```

Expected labels: `Customer`, `Browse catalog`

### docs:usecase:21

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Sign in, Reset password

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
accTitle: Account access use cases
accDescr {
  A customer signs in and can reset a password.
  The diagram names the actor, use cases, and associations.
}
actor Customer
SignIn("Sign in")
Reset("Reset password")
Customer --> SignIn
Customer --> Reset

```

Expected labels: `Customer`, `Sign in`, `Reset password`

### docs:usecase:22

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Order staff, Browse products, Process payment, Review order, Validates the **cart** before payment, Ordering System, places order, include

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
direction LR
accTitle: Online ordering use cases
accDescr {
  A customer places an order through the storefront.
  Staff review the order and inspect its data.
}
actor Customer("Customer")
actor Staff("Order staff")@{ type: hollow, business: true } <<Employee>>
systemBoundary ordering["Ordering System"]@{ type: package }:::system
  Browse("Browse products")
  Checkout("Checkout") <<Core>>:::critical
  Payment("Process payment")
  Review[Review order]
end
json OrderData@{
  "status": "pending",
  "items": [{ "name": "Book", "quantity": 1 }],
  "total": 29.95
}:::data
note for Checkout "`Validates the **cart** before payment`"
Customer starts@-- "places order" ---> Checkout
Customer --> Browse
Checkout pays@..> : include Payment
Staff --> Review
Review --> OrderData
classDef system stroke:#c8a02a,stroke-width:2px
classDef critical stroke:#c33,stroke-width:3px
classDef data stroke:#3572a5
starts@{ animation: fast }
style pays stroke:#6b46c1,stroke-width:2px

```

Expected labels: `Customer`, `Order staff`, `Browse products`, `Checkout`, `Process payment`, `Review order`, `Validates the **cart** before payment`, `OrderData`, `Ordering System`, `places order`, `include`

### docs:usecase:23

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Reset password, Refund (partial)

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor Customer
Reset("`Reset
password`")
Refund("Refund #40;partial#41;")
Customer --> Reset
Customer --> Refund

```

Expected labels: `Customer`, `Reset password`, `Refund (partial)`

### docs:usecase:0

browser API, SVG. Missing authored label: Place order; Missing authored label: Order system

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
direction LR
actor Customer("Customer")
systemBoundary "Order system"
  Checkout("Place order")
end
Customer --> Checkout

```

Expected labels: `Customer`, `Place order`, `Order system`

Tool output (6819 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:1

browser API, SVG. Missing authored label: Browse catalogue; Missing authored label: Track delivery; Missing authored label: Storefront; Missing authored label: Fulfilment; Missing authored label: include

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
direction LR
actor Customer
actor Support
systemBoundary Storefront
  Browse("Browse catalogue")
  Checkout("Checkout")
end
systemBoundary Fulfilment
  Track("Track delivery")
end
Customer --> Browse
Customer --> Checkout
Customer --> Track
Support --> Track
Checkout ..> : include Browse

```

Expected labels: `Customer`, `Support`, `Browse catalogue`, `Checkout`, `Track delivery`, `Storefront`, `Fulfilment`, `include`

Tool output (10316 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:2

browser API, SVG. Missing authored label: Browse catalogue; Missing authored label: Track delivery; Missing authored label: Storefront; Missing authored label: Fulfilment; Missing authored label: include

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  theme: default
  look: classic
  layout: dagre
---
usecase-beta
direction LR
actor Customer
actor Support
systemBoundary Storefront
  Browse("Browse catalogue")
  Checkout("Checkout")
end
systemBoundary Fulfilment
  Track("Track delivery")
end
Customer --> Browse
Customer --> Checkout
Customer --> Track
Support --> Track
Checkout ..> : include Browse

```

Expected labels: `Customer`, `Support`, `Browse catalogue`, `Checkout`, `Track delivery`, `Storefront`, `Fulfilment`, `include`

Tool output (10316 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:3

browser API, SVG. Missing authored label: Sign in; Missing authored label: Generate report; Missing authored label: Reset password

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
Customer --> Login
actor Customer
actor Admin("Main administrator")
Login("Sign in")
Report[Generate report]
"Reset password"
Admin --> Report

```

Expected labels: `Customer`, `Main administrator`, `Sign in`, `Generate report`, `Reset password`

Tool output (9235 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:5

browser API, SVG. Missing authored label: Prepare quote; Missing authored label: Archive quote

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor SalesAgent("Sales agent")@{ business: true } <<Employee>>
actor Broker@{ type: hollow, business: true }
Quote("Prepare quote")@{ business: true } <<Core>>
Archive[Archive quote] <<Record>>
SalesAgent --> Quote
Broker --> Quote
Quote --> Archive

```

Expected labels: `Sales agent`, `Broker`, `Prepare quote`, `Archive quote`

Tool output (9702 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:6

browser API, SVG. Missing authored label: **Literal markers**; Missing authored label: Costs 19.95 EUR — VAT included!

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor Analyst(*Analyst*)
Literal(**Literal markers**)
Priced[Costs 19.95 EUR — VAT included!]
Analyst -- files R&D report --> Literal
Analyst --> Priced

```

Expected labels: `*Analyst*`, `**Literal markers**`, `Costs 19.95 EUR — VAT included!`, `files R&D report`

Tool output (9109 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:7

browser API, SVG. Missing authored label: **Literal markers**; Missing authored label: **Formatted label** with a physical line break; Missing authored label: Show "quoted" text

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor Reviewer("`*Reviewer*`")
Literal("**Literal markers**")
Formatted("`**Formatted label**
with a physical line break`")
Quoted("Show #quot;quoted#quot; text")
Reviewer -- "`opens **form**`" --> Formatted
Reviewer --> Literal
Reviewer --> Quoted

```

Expected labels: `*Reviewer*`, `**Literal markers**`, `**Formatted label** with a physical line break`, `Show "quoted" text`, `opens **form**`

Tool output (10108 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:9

browser API, SVG. Missing authored label: Authorize payment; Missing authored label: Create receipt; Missing authored label: Payment service

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
systemBoundary sb1["Payment service"]@{ type: package }:::system
  actor Clerk("Payment clerk")
  Authorize("Authorize payment")
  Receipt[Create receipt]
end
Clerk --> Authorize
Authorize --> Receipt
classDef system stroke:#4b4b7a

```

Expected labels: `Payment clerk`, `Authorize payment`, `Create receipt`, `Payment service`

Tool output (8381 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:10

browser API, SVG. Missing authored label: Authorize payment; Missing authored label: Payment service

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
systemBoundary "Payment service"
  actor Clerk("Payment clerk")
  Authorize("Authorize payment")
end
Payment_service@{ type: package }
Clerk --> Authorize

```

Expected labels: `Payment clerk`, `Authorize payment`, `Payment service`

Tool output (7013 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:13

browser API, SVG. Missing authored label: Checkout; Missing authored label: Payment; Missing authored label: ApplyCoupon; Missing authored label: include; Missing authored label: extend

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor Admin
actor Person
Checkout
Payment
ApplyCoupon
Admin --|> Person
Checkout ..> : include Payment
ApplyCoupon ..> : extend Checkout
ApplyCoupon --|> Checkout

```

Expected labels: `Admin`, `Person`, `Checkout`, `Payment`, `ApplyCoupon`, `include`, `extend`

Tool output (6724 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:14

browser API, SVG. Missing authored label: Payment; Missing authored label: include

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor Customer
Checkout
Payment
Customer opens@-- "starts checkout" ---> Checkout
Checkout payment@..> : include Payment
classDef emphasized stroke:#d33,stroke-width:3px
class opens,payment emphasized
style opens stroke:#06c,stroke-width:4px
opens@{ animation: fast }
payment@{ animate: false }

```

Expected labels: `Customer`, `Checkout`, `Payment`, `starts checkout`, `include`

Tool output (7997 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:15

browser API, SVG. Missing authored label: Sign in; Missing authored label: Requires an **active session**; Missing authored label: Starts the workflow

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
note for Login "`Requires an **active session**`"
note for User "Starts the workflow"
actor User
Login("Sign in")
User --> Login

```

Expected labels: `User`, `Sign in`, `Requires an **active session**`, `Starts the workflow`

Tool output (6700 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:17

browser API, SVG. Missing authored label: Edit profile; Missing authored label: Account

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor Customer:::external
Checkout("Checkout"):::critical
systemBoundary Account
  Profile[Edit profile]
end
json Session@{ "active": true }:::data
Customer --> Checkout
Checkout --> Profile
Profile --> Session
classDef default stroke:#7f8ea3
classDef external,critical stroke-width:3px
class Customer,Checkout external,critical
class Account,Session data
style Checkout stroke:#c33,stroke-width:4px
style Account stroke:#536878

```

Expected labels: `Customer`, `Checkout`, `Edit profile`, `Session`, `Account`

Tool output (9661 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:18

browser API, SVG. Missing authored label: Browse catalogue; Missing authored label: Catalogue; Missing authored label: Payment; Missing authored label: include

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  theme: redux-color
---
usecase-beta
direction LR
actor Customer
systemBoundary Catalogue
  Browse("Browse catalogue")
end
systemBoundary Payment
  Checkout("Checkout")
end
Customer --> Browse
Browse --> Checkout
Checkout ..> : include Browse

```

Expected labels: `Customer`, `Browse catalogue`, `Checkout`, `Catalogue`, `Payment`, `include`

Tool output (7880 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:19

browser API, SVG. Missing authored label: Browse catalogue

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  theme: redux-color
  usecase:
    colorScheme: rotate
---
usecase-beta
direction LR
actor Customer
actor Auditor
Browse("Browse catalogue")
Checkout("Checkout")
Customer --> Browse
Browse --> Checkout
Auditor --> Checkout

```

Expected labels: `Customer`, `Auditor`, `Browse catalogue`, `Checkout`

Tool output (9259 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:20

browser API, SVG. Missing authored label: Browse catalog

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  usecase:
    actorFontSize: 16
    actorFontFamily: Arial
    actorFontWeight: bold
    usecaseFontSize: 14
    usecaseFontFamily: Georgia
    usecaseFontWeight: normal
    nodeSpacing: 60
    rankSpacing: 70
    diagramPadding: 24
    colorScheme: role
    useMaxWidth: false
---
usecase-beta
direction LR
actor Customer
Browse("Browse catalog")
Customer --> Browse

```

Expected labels: `Customer`, `Browse catalog`

Tool output (6938 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:21

browser API, SVG. Missing authored label: Sign in; Missing authored label: Reset password

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
accTitle: Account access use cases
accDescr {
  A customer signs in and can reset a password.
  The diagram names the actor, use cases, and associations.
}
actor Customer
SignIn("Sign in")
Reset("Reset password")
Customer --> SignIn
Customer --> Reset

```

Expected labels: `Customer`, `Sign in`, `Reset password`

Tool output (7869 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:22

browser API, SVG. Missing authored label: Browse products; Missing authored label: Process payment; Missing authored label: Review order; Missing authored label: Validates the **cart** before payment; Missing authored label: Ordering System; Missing authored label: include

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
direction LR
accTitle: Online ordering use cases
accDescr {
  A customer places an order through the storefront.
  Staff review the order and inspect its data.
}
actor Customer("Customer")
actor Staff("Order staff")@{ type: hollow, business: true } <<Employee>>
systemBoundary ordering["Ordering System"]@{ type: package }:::system
  Browse("Browse products")
  Checkout("Checkout") <<Core>>:::critical
  Payment("Process payment")
  Review[Review order]
end
json OrderData@{
  "status": "pending",
  "items": [{ "name": "Book", "quantity": 1 }],
  "total": 29.95
}:::data
note for Checkout "`Validates the **cart** before payment`"
Customer starts@-- "places order" ---> Checkout
Customer --> Browse
Checkout pays@..> : include Payment
Staff --> Review
Review --> OrderData
classDef system stroke:#c8a02a,stroke-width:2px
classDef critical stroke:#c33,stroke-width:3px
classDef data stroke:#3572a5
starts@{ animation: fast }
style pays stroke:#6b46c1,stroke-width:2px

```

Expected labels: `Customer`, `Order staff`, `Browse products`, `Checkout`, `Process payment`, `Review order`, `Validates the **cart** before payment`, `OrderData`, `Ordering System`, `places order`, `include`

Tool output (12106 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### docs:usecase:23

browser API, SVG. Missing authored label: Reset password; Missing authored label: Refund (partial)

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
usecase-beta
actor Customer
Reset("`Reset
password`")
Refund("Refund #40;partial#41;")
Customer --> Reset
Customer --> Refund

```

Expected labels: `Customer`, `Reset password`, `Refund (partial)`

Tool output (8038 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

## venn

### docs:venn:0

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): What makes a good feature

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
venn-beta
  title What makes a good feature
  set Desirable
  set Feasible
  set Viable
  union Desirable,Feasible["Buildable"]
  union Feasible,Viable["Sustainable"]
  union Desirable,Viable["Marketable"]
  union Desirable,Feasible,Viable["Ship it"]

```

Expected labels: `What makes a good feature`, `Desirable`, `Feasible`, `Viable`, `Buildable`, `Sustainable`, `Marketable`, `Ship it`

### docs:venn:1

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): What makes a good feature

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
---
config:
  theme: default
  look: classic
---
venn-beta
  title What makes a good feature
  set Desirable
  set Feasible
  set Viable
  union Desirable,Feasible["Buildable"]
  union Feasible,Viable["Sustainable"]
  union Desirable,Viable["Marketable"]
  union Desirable,Feasible,Viable["Ship it"]

```

Expected labels: `What makes a good feature`, `Desirable`, `Feasible`, `Viable`, `Buildable`, `Sustainable`, `Marketable`, `Ship it`

### docs:venn:2

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): "Team overlap"

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
venn-beta
  title "Team overlap"
  set Frontend
  set Backend
  union Frontend,Backend["APIs"]

```

Expected labels: `"Team overlap"`, `Frontend`, `Backend`, `APIs`

## wardley

### docs:wardley:0

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Tea Shop Value Chain

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
wardley-beta
title Tea Shop Value Chain

anchor Business [0.95, 0.63]
component Cup of Tea [0.79, 0.61]
component Tea [0.63, 0.81]
component Hot Water [0.52, 0.80]
component Kettle [0.43, 0.35]
component Power [0.10, 0.70]

Business -> Cup of Tea
Cup of Tea -> Tea
Cup of Tea -> Hot Water
Hot Water -> Kettle
Kettle -> Power

evolve Kettle 0.62
evolve Power 0.89

note "Standardising power allows Kettles to evolve faster" [0.30, 0.49]

```

Expected labels: `Tea Shop Value Chain`, `Business`, `Cup of Tea`, `Tea`, `Hot Water`, `Kettle`, `Power`, `Standardising power allows Kettles to evolve faster`

### docs:wardley:1

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Your Map Title

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
wardley-beta
title Your Map Title
size [1100, 600]

```

Expected labels: `Your Map Title`

### docs:wardley:2

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Coordinate Examples

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
wardley-beta
title Coordinate Examples

component Infrastructure [0.30, 0.20]        %% Low visibility, low evolution
component Product [0.70, 0.60]               %% High visibility, mid evolution
component User Need [0.90, 0.95]             %% High visibility, high evolution

```

Expected labels: `Coordinate Examples`, `Infrastructure`, `Product`, `User Need`

### docs:wardley:3

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Components

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
wardley-beta
title Components

component API [0.60, 0.70]
component Database [0.40, 0.85] label [-50, 10]
component "Custom Service" [0.55, 0.35]

```

Expected labels: `Components`, `API`, `Database`, `Custom Service`

### docs:wardley:4

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Hyphenated Names

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
wardley-beta
title Hyphenated Names

component real-time processing [0.55, 0.40]
component end-user [0.90, 0.95]

end-user -> real-time processing

```

Expected labels: `Hyphenated Names`, `real-time processing`, `end-user`

### docs:wardley:5

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Anchors

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
wardley-beta
title Anchors

anchor Customer [0.90, 0.95]
anchor Business [0.85, 0.90]

component Service [0.70, 0.75]

Customer -> Service
Business -> Service

```

Expected labels: `Anchors`, `Customer`, `Business`, `Service`

### docs:wardley:7

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Sourcing Strategy

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
wardley-beta
title Sourcing Strategy

anchor Customer [0.80, 0.95]
component Custom App [0.45, 0.85] (build)
component Off-the-shelf Tool [0.85, 0.65] (buy)
component Managed Service [0.60, 0.40] (outsource)
component Cloud Platform [0.95, 0.25] (market)

Customer -> Custom App
Custom App -> Off-the-shelf Tool
Custom App -> Managed Service
Off-the-shelf Tool -> Cloud Platform

```

Expected labels: `Sourcing Strategy`, `Customer`, `Custom App`, `Off-the-shelf Tool`, `Managed Service`, `Cloud Platform`

### docs:wardley:8

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Link Types

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
wardley-beta
title Link Types

component User [0.90, 0.95]
component App [0.75, 0.75]
component API [0.60, 0.60]
component Cache [0.65, 0.45]
component Database [0.15, 0.80]

User -> App
App +> API
API -> Database
API +<> Cache
Cache +'backup'> Database

```

Expected labels: `Link Types`, `User`, `App`, `API`, `Cache`, `Database`

### docs:wardley:10

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Pipeline Evolution

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
wardley-beta
title Pipeline Evolution

component Database [0.40, 0.60]

pipeline Database {
  component "File System" [0.25]
  component "SQL DB" [0.50]
  component "NoSQL" [0.70]
  component "Cloud DB" [0.85]
}

```

Expected labels: `Pipeline Evolution`, `Database`, `File System`, `SQL DB`, `NoSQL`, `Cloud DB`

### docs:wardley:11

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Custom Stages

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
wardley-beta
title Custom Stages

evolution Unmodelled -> Divergent -> Convergent -> Modelled

component Raw Data [0.15, 0.20]
component Analysis [0.45, 0.50]
component Reports [0.75, 0.70]

```

Expected labels: `Custom Stages`, `Raw Data`, `Analysis`, `Reports`

### docs:wardley:12

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Dual Label Stages

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
wardley-beta
title Dual Label Stages

evolution Genesis / Concept -> Custom / Emerging -> Product / Converging -> Commodity / Accepted

component Novel Idea [0.05, 0.20]
component Custom Solution [0.35, 0.50]
component Product [0.65, 0.70]
component Utility [0.95, 0.90]

```

Expected labels: `Dual Label Stages`, `Novel Idea`, `Custom Solution`, `Product`, `Utility`

### docs:wardley:13

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Custom Widths

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
wardley-beta
title Custom Widths

evolution Genesis@0.2 -> Custom@0.4 -> Product@0.75 -> Commodity@1.0

component Novel [0.75, 0.15]
component Bespoke [0.70, 0.35]
component Product [0.65, 0.65]
component Utility [0.60, 0.90]

```

Expected labels: `Custom Widths`, `Novel`, `Bespoke`, `Product`, `Utility`

### docs:wardley:14

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Notes

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
wardley-beta
title Notes

component API [0.60, 0.70]
component Database [0.40, 0.50]

API -> Database

note "Critical decision point" [0.65, 0.55]
note "High risk area" [0.40, 0.35]

```

Expected labels: `Notes`, `API`, `Database`, `Critical decision point`, `High risk area`

### docs:wardley:15

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Annotations, Critical component, Performance layer, Data persistence

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
wardley-beta
title Annotations

component API [0.60, 0.70]
component Cache [0.50, 0.55]
component Database [0.40, 0.40]

API -> Cache
Cache -> Database

annotations [0.10, 0.90]
annotation 1,[0.60, 0.65] "Critical component"
annotation 2,[0.50, 0.50] "Performance layer"
annotation 3,[0.40, 0.35] "Data persistence"

```

Expected labels: `Annotations`, `API`, `Cache`, `Database`, `Critical component`, `Performance layer`, `Data persistence`

### docs:wardley:16

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Forces

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
wardley-beta
title Forces

component Legacy [0.20, 0.85]
component Modern [0.55, 0.60]
component AI [0.70, 0.35]

Legacy -> Modern
Modern -> AI

accelerator "AI Adoption" [0.55, 0.25]
deaccelerator "Legacy Constraints" [0.15, 0.75]

```

Expected labels: `Forces`, `Legacy`, `Modern`, `AI`

### docs:wardley:17

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Custom Size

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
wardley-beta
title Custom Size
size [800, 1000]

```

Expected labels: `Custom Size`

### docs:wardley:18

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Software Platform Strategy, User touchpoints, Integration layer, Data persistence

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
wardley-beta
title Software Platform Strategy
size [1100, 800]

evolution Genesis@0.25 -> Custom@0.5 -> Product@0.75 -> Commodity@1.0

anchor Customer [0.90, 0.95]

component "Mobile App" [0.80, 0.85] (build)
component "Web App" [0.75, 0.80] label [-60, 10] (build)
component "API Gateway" [0.70, 0.65] (buy)
component "Auth Service" [0.60, 0.55] (outsource)
component "Database" [0.50, 0.45] (buy) (inertia)
component "Cloud Platform" [0.30, 0.95] (market)

Customer -> "Mobile App"
Customer -> "Web App"
"Mobile App" -> "API Gateway"
"Web App" -> "API Gateway"
"API Gateway" -> "Auth Service"
"API Gateway" -> "Database"
"Database" -> "Cloud Platform"

evolve "API Gateway" 0.85
evolve "Database" 0.75

accelerator "Cloud Native" [0.20, 0.85]
deaccelerator "Legacy Data" [0.45, 0.35]

annotations [0.10, 0.20]
annotation 1,[0.78, 0.82] "User touchpoints"
annotation 2,[0.70, 0.60] "Integration layer"
annotation 3,[0.50, 0.40] "Data persistence"

note "Build mobile-first experience" [0.85, 0.90]
note "Migrate to cloud-native database" [0.60, 0.50]

```

Expected labels: `Software Platform Strategy`, `Customer`, `Mobile App`, `Web App`, `API Gateway`, `Auth Service`, `Database`, `Cloud Platform`, `Build mobile-first experience`, `Migrate to cloud-native database`, `User touchpoints`, `Integration layer`, `Data persistence`

## xychart

### portfolio:xychart:89

Node API, SVG. Error: Missing authored label: avg; Missing authored label: p50; Missing authored label: p95

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart-beta
  title "An Example Chart"
  x-axis ["90d", "60d", "30d", "7d", "1d", "Current"]
  y-axis "Seconds" 0 --> 198.2
  line "avg" [48.1, 41.5, 45.7, 72.8, 67.7, 59.9]
  line "p50" [38.2, 36.8, 39.7, 54.5, 49.0, 38.4]
  line "p95" [112.2, 75.3, 103.0, 177.0, 180.2, 109.4]
```

Expected labels: `An Example Chart`, `90d`, `60d`, `30d`, `7d`, `1d`, `Current`, `Seconds`, `avg`, `p50`, `p95`

Tool output (13556 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-bar-data

Node API, SVG. Error: Missing authored label: barTitle

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 bar barTitle [23, 45, 56.6, .22]
```

Expected labels: `xAxisName`, `yAxisName`, `barTitle`

Tool output (10884 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-bar-data-spaces-and-symbol

Node API, SVG. Error: Missing authored label: barTitle with space

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 bar "barTitle with space"   [  +23 , -45  , 56.6 ]
```

Expected labels: `xAxisName`, `yAxisName`, `barTitle with space`

Tool output (9842 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-bar-data-with-point-labels

Node API, SVG. Error: Missing authored label: xAxisName; Missing authored label: yAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 bar [10 "A", 20 "B", 30 "C"]
```

Expected labels: `xAxisName`, `yAxisName`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-both-axis-at-once

Node API, SVG. Error: Missing authored label: xAxisName; Missing authored label: yAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
```

Expected labels: `xAxisName`, `yAxisName`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-line-data

Node API, SVG. Error: Missing authored label: lineTitle

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 line lineTitle [23, 45, 56.6]
```

Expected labels: `xAxisName`, `yAxisName`, `lineTitle`

Tool output (10614 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-line-data-with-decimal-values-and-labels

Node API, SVG. Error: Missing authored label: xAxisName; Missing authored label: yAxisName; Missing authored label: Phi-3; Missing authored label: Mistral; Missing authored label: PaLM

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 line [3.8 "Phi-3", 7 "Mistral", 540 "PaLM"]
```

Expected labels: `xAxisName`, `yAxisName`, `Phi-3`, `Mistral`, `PaLM`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-line-data-with-labels-containing-spaces

Node API, SVG. Error: Missing authored label: xAxisName; Missing authored label: yAxisName; Missing authored label: Hello World; Missing authored label: Another Label

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 line [10 "Hello World", 20 "Another Label"]
```

Expected labels: `xAxisName`, `yAxisName`, `Hello World`, `Another Label`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-line-data-with-mixed-labels-and-no-labels

Node API, SVG. Error: Missing authored label: Start; Missing authored label: End

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 line [10 "Start", 20, 30 "End"]
```

Expected labels: `xAxisName`, `yAxisName`, `Start`, `End`

Tool output (9191 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-line-data-with-point-labels

Node API, SVG. Error: Missing authored label: xAxisName; Missing authored label: yAxisName; Missing authored label: First; Missing authored label: Second; Missing authored label: Third

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 line [10 "First", 20 "Second", 30 "Third"]
```

Expected labels: `xAxisName`, `yAxisName`, `First`, `Second`, `Third`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-line-data-with-spaces-and-symbols

Node API, SVG. Error: Missing authored label: lineTitle with space

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 line "lineTitle with space"   [  +23 , -45  , 56.6 ]
```

Expected labels: `xAxisName`, `yAxisName`, `lineTitle with space`

Tool output (10014 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-line-data-with-title-and-point-labels

Node API, SVG. Error: Missing authored label: xAxisName; Missing authored label: yAxisName; Missing authored label: My Line; Missing authored label: A; Missing authored label: B

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 line "My Line" [10 "A", 20 "B"]
```

Expected labels: `xAxisName`, `yAxisName`, `My Line`, `A`, `B`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-multiple-bar-and-line-variant-1

Node API, SVG. Error: Missing authored label: barTitle1; Missing authored label: lineTitle1; Missing authored label: barTitle2; Missing authored label: lineTitle2

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 bar barTitle1 [23, 45, 56.6] 
 line lineTitle1 [11, 45.5, 67, 23] 
 bar barTitle2 [13, 42, 56.89] 
 line lineTitle2 [45, 99, 012]
```

Expected labels: `xAxisName`, `yAxisName`, `barTitle1`, `lineTitle1`, `barTitle2`, `lineTitle2`

Tool output (12084 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-multiple-bar-and-line-variant-2

Node API, SVG. Error: Missing authored label: barTitle1; Missing authored label: lineTitle1; Missing authored label: barTitle2; Missing authored label: lineTitle2

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart horizontal
    title "Basic xychart"
    x-axis "this is x axis" [category1, "category 2", category3]
    y-axis yaxisText 10 --> 150
 bar barTitle1 [23, 45, 56.6]
 line lineTitle1 [11, 45.5, 67, 23]
 bar barTitle2 [13, 42, 56.89]
    line lineTitle2 [45, 99, 012]
```

Expected labels: `Basic xychart`, `this is x axis`, `category1`, `category 2`, `category3`, `yaxisText`, `barTitle1`, `lineTitle1`, `barTitle2`, `lineTitle2`

Tool output (12478 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis

Node API, SVG. Error: Missing authored label: xAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName
```

Expected labels: `xAxisName`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-complete-variant-1

Node API, SVG. Error: Missing authored label: this is x axis; Missing authored label: category1; Missing authored label: category 2; Missing authored label: category3

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
 x-axis "this is x axis" [category1, "category 2", category3]
```

Expected labels: `this is x axis`, `category1`, `category 2`, `category3`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-complete-variant-2

Node API, SVG. Error: Missing authored label: xAxisName; Missing authored label: cat1 with space; Missing authored label: cat2; Missing authored label: cat3

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    [  "cat1  with space"  ,   cat2 , cat3]
```

Expected labels: `xAxisName`, `cat1 with space`, `cat2`, `cat3`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-complete-variant-3

Node API, SVG. Error: Missing authored label: xAxisName; Missing authored label: cat1 with space; Missing authored label: cat2asdf; Missing authored label: cat3

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    [  "cat1  with space"  ,   cat2 asdf , cat3]
```

Expected labels: `xAxisName`, `cat1 with space`, `cat2asdf`, `cat3`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-and-category-data

Node API, SVG. Error: Missing authored label: xAxisName; Missing authored label: cat1; Missing authored label: cat2a

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    [  "cat1"  ,   cat2a  ]
```

Expected labels: `xAxisName`, `cat1`, `cat2a`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-and-range-data

Node API, SVG. Error: Missing authored label: xAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    45.5   -->   33
```

Expected labels: `xAxisName`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-and-range-data-with-only-decimal-part

Node API, SVG. Error: Missing authored label: xAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    45.5   -->   .34
```

Expected labels: `xAxisName`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-with

Node API, SVG. Error: Missing authored label: xAxisName has space

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
    x-axis "xAxisName has space"
```

Expected labels: `xAxisName has space`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-with-with-spaces

Node API, SVG. Error: Missing authored label: xAxisName has space

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
   x-axis    "  xAxisName has space   "
```

Expected labels: `xAxisName has space`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-without

Node API, SVG. Error: Missing authored label: xAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis        xAxisName
```

Expected labels: `xAxisName`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-without-axis-name-and-category-data

Node API, SVG. Error: Missing authored label: cat1; Missing authored label: cat2a

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis    [  "cat1"  ,   cat2a  ]
```

Expected labels: `cat1`, `cat2a`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name

Node API, SVG. Error: Missing authored label: yAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
y-axis yAxisName
```

Expected labels: `yAxisName`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with

Node API, SVG. Error: Missing authored label: yAxisName has space

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
    y-axis "yAxisName has space"
```

Expected labels: `yAxisName has space`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with-and-spaces

Node API, SVG. Error: Missing authored label: yAxisName has space

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
   y-axis    "  yAxisName has space   "
```

Expected labels: `yAxisName has space`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with-range-data

Node API, SVG. Error: Missing authored label: yAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
y-axis yAxisName    45.5   -->   33
```

Expected labels: `yAxisName`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with-range-data-with-only-decimal-part

Node API, SVG. Error: Missing authored label: yAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
y-axis yAxisName    45.5   -->   .33
```

Expected labels: `yAxisName`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with-spaces

Node API, SVG. Error: Missing authored label: yAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
y-axis        yAxisName
```

Expected labels: `yAxisName`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-line-data-with-decimal-values-and-labels

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Phi-3, Mistral, PaLM

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 line [3.8 "Phi-3", 7 "Mistral", 540 "PaLM"]
```

Expected labels: `xAxisName`, `yAxisName`, `Phi-3`, `Mistral`, `PaLM`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-line-data-with-labels-containing-spaces

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Hello World, Another Label

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 line [10 "Hello World", 20 "Another Label"]
```

Expected labels: `xAxisName`, `yAxisName`, `Hello World`, `Another Label`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-line-data-with-mixed-labels-and-no-labels

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): Start, End

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 line [10 "Start", 20, 30 "End"]
```

Expected labels: `xAxisName`, `yAxisName`, `Start`, `End`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-line-data-with-point-labels

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): First, Second, Third

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 line [10 "First", 20 "Second", 30 "Third"]
```

Expected labels: `xAxisName`, `yAxisName`, `First`, `Second`, `Third`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-line-data-with-title-and-point-labels

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): My Line, A, B

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 line "My Line" [10 "A", 20 "B"]
```

Expected labels: `xAxisName`, `yAxisName`, `My Line`, `A`, `B`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-multiple-bar-and-line-variant-2

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): yaxisText

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart horizontal
    title "Basic xychart"
    x-axis "this is x axis" [category1, "category 2", category3]
    y-axis yaxisText 10 --> 150
 bar barTitle1 [23, 45, 56.6]
 line lineTitle1 [11, 45.5, 67, 23]
 bar barTitle2 [13, 42, 56.89]
    line lineTitle2 [45, 99, 012]
```

Expected labels: `Basic xychart`, `this is x axis`, `category1`, `category 2`, `category3`, `yaxisText`, `barTitle1`, `lineTitle1`, `barTitle2`, `lineTitle2`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): xAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName
```

Expected labels: `xAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-complete-variant-2

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): xAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    [  "cat1  with space"  ,   cat2 , cat3]
```

Expected labels: `xAxisName`, `cat1 with space`, `cat2`, `cat3`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-complete-variant-3

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): xAxisName, cat2asdf

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    [  "cat1  with space"  ,   cat2 asdf , cat3]
```

Expected labels: `xAxisName`, `cat1 with space`, `cat2asdf`, `cat3`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-and-category-data

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): xAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    [  "cat1"  ,   cat2a  ]
```

Expected labels: `xAxisName`, `cat1`, `cat2a`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-and-range-data

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): xAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    45.5   -->   33
```

Expected labels: `xAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-and-range-data-with-only-decimal-part

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): xAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    45.5   -->   .34
```

Expected labels: `xAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-with

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): xAxisName has space

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
    x-axis "xAxisName has space"
```

Expected labels: `xAxisName has space`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-with-with-spaces

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): xAxisName has space

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
   x-axis    "  xAxisName has space   "
```

Expected labels: `xAxisName has space`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-without

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): xAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis        xAxisName
```

Expected labels: `xAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with-range-data

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): yAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
y-axis yAxisName    45.5   -->   33
```

Expected labels: `yAxisName`

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with-range-data-with-only-decimal-part

Node API, Parser. Error: Structured parser lost declared labels (raw source/sidecars excluded): yAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
y-axis yAxisName    45.5   -->   .33
```

Expected labels: `yAxisName`

### portfolio:xychart:89

browser API, SVG. Missing authored label: avg; Missing authored label: p50; Missing authored label: p95

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart-beta
  title "An Example Chart"
  x-axis ["90d", "60d", "30d", "7d", "1d", "Current"]
  y-axis "Seconds" 0 --> 198.2
  line "avg" [48.1, 41.5, 45.7, 72.8, 67.7, 59.9]
  line "p50" [38.2, 36.8, 39.7, 54.5, 49.0, 38.4]
  line "p95" [112.2, 75.3, 103.0, 177.0, 180.2, 109.4]
```

Expected labels: `An Example Chart`, `90d`, `60d`, `30d`, `7d`, `1d`, `Current`, `Seconds`, `avg`, `p50`, `p95`

Tool output (13556 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-bar-data

browser API, SVG. Missing authored label: barTitle

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 bar barTitle [23, 45, 56.6, .22]
```

Expected labels: `xAxisName`, `yAxisName`, `barTitle`

Tool output (10884 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-bar-data-spaces-and-symbol

browser API, SVG. Missing authored label: barTitle with space

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 bar "barTitle with space"   [  +23 , -45  , 56.6 ]
```

Expected labels: `xAxisName`, `yAxisName`, `barTitle with space`

Tool output (9842 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-bar-data-with-point-labels

browser API, SVG. Missing authored label: xAxisName; Missing authored label: yAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 bar [10 "A", 20 "B", 30 "C"]
```

Expected labels: `xAxisName`, `yAxisName`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-both-axis-at-once

browser API, SVG. Missing authored label: xAxisName; Missing authored label: yAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
```

Expected labels: `xAxisName`, `yAxisName`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-line-data

browser API, SVG. Missing authored label: lineTitle

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 line lineTitle [23, 45, 56.6]
```

Expected labels: `xAxisName`, `yAxisName`, `lineTitle`

Tool output (10614 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-line-data-with-decimal-values-and-labels

browser API, SVG. Missing authored label: xAxisName; Missing authored label: yAxisName; Missing authored label: Phi-3; Missing authored label: Mistral; Missing authored label: PaLM

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 line [3.8 "Phi-3", 7 "Mistral", 540 "PaLM"]
```

Expected labels: `xAxisName`, `yAxisName`, `Phi-3`, `Mistral`, `PaLM`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-line-data-with-labels-containing-spaces

browser API, SVG. Missing authored label: xAxisName; Missing authored label: yAxisName; Missing authored label: Hello World; Missing authored label: Another Label

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 line [10 "Hello World", 20 "Another Label"]
```

Expected labels: `xAxisName`, `yAxisName`, `Hello World`, `Another Label`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-line-data-with-mixed-labels-and-no-labels

browser API, SVG. Missing authored label: Start; Missing authored label: End

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 line [10 "Start", 20, 30 "End"]
```

Expected labels: `xAxisName`, `yAxisName`, `Start`, `End`

Tool output (9191 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-line-data-with-point-labels

browser API, SVG. Missing authored label: xAxisName; Missing authored label: yAxisName; Missing authored label: First; Missing authored label: Second; Missing authored label: Third

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 line [10 "First", 20 "Second", 30 "Third"]
```

Expected labels: `xAxisName`, `yAxisName`, `First`, `Second`, `Third`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-line-data-with-spaces-and-symbols

browser API, SVG. Missing authored label: lineTitle with space

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 line "lineTitle with space"   [  +23 , -45  , 56.6 ]
```

Expected labels: `xAxisName`, `yAxisName`, `lineTitle with space`

Tool output (10014 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-line-data-with-title-and-point-labels

browser API, SVG. Missing authored label: xAxisName; Missing authored label: yAxisName; Missing authored label: My Line; Missing authored label: A; Missing authored label: B

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 line "My Line" [10 "A", 20 "B"]
```

Expected labels: `xAxisName`, `yAxisName`, `My Line`, `A`, `B`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-multiple-bar-and-line-variant-1

browser API, SVG. Missing authored label: barTitle1; Missing authored label: lineTitle1; Missing authored label: barTitle2; Missing authored label: lineTitle2

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart
x-axis xAxisName
y-axis yAxisName
 bar barTitle1 [23, 45, 56.6] 
 line lineTitle1 [11, 45.5, 67, 23] 
 bar barTitle2 [13, 42, 56.89] 
 line lineTitle2 [45, 99, 012]
```

Expected labels: `xAxisName`, `yAxisName`, `barTitle1`, `lineTitle1`, `barTitle2`, `lineTitle2`

Tool output (12084 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-multiple-bar-and-line-variant-2

browser API, SVG. Missing authored label: barTitle1; Missing authored label: lineTitle1; Missing authored label: barTitle2; Missing authored label: lineTitle2

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart horizontal
    title "Basic xychart"
    x-axis "this is x axis" [category1, "category 2", category3]
    y-axis yaxisText 10 --> 150
 bar barTitle1 [23, 45, 56.6]
 line lineTitle1 [11, 45.5, 67, 23]
 bar barTitle2 [13, 42, 56.89]
    line lineTitle2 [45, 99, 012]
```

Expected labels: `Basic xychart`, `this is x axis`, `category1`, `category 2`, `category3`, `yaxisText`, `barTitle1`, `lineTitle1`, `barTitle2`, `lineTitle2`

Tool output (12478 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis

browser API, SVG. Missing authored label: xAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName
```

Expected labels: `xAxisName`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-complete-variant-1

browser API, SVG. Missing authored label: this is x axis; Missing authored label: category1; Missing authored label: category 2; Missing authored label: category3

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
 x-axis "this is x axis" [category1, "category 2", category3]
```

Expected labels: `this is x axis`, `category1`, `category 2`, `category3`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-complete-variant-2

browser API, SVG. Missing authored label: xAxisName; Missing authored label: cat1 with space; Missing authored label: cat2; Missing authored label: cat3

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    [  "cat1  with space"  ,   cat2 , cat3]
```

Expected labels: `xAxisName`, `cat1 with space`, `cat2`, `cat3`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-complete-variant-3

browser API, SVG. Missing authored label: xAxisName; Missing authored label: cat1 with space; Missing authored label: cat2asdf; Missing authored label: cat3

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    [  "cat1  with space"  ,   cat2 asdf , cat3]
```

Expected labels: `xAxisName`, `cat1 with space`, `cat2asdf`, `cat3`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-and-category-data

browser API, SVG. Missing authored label: xAxisName; Missing authored label: cat1; Missing authored label: cat2a

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    [  "cat1"  ,   cat2a  ]
```

Expected labels: `xAxisName`, `cat1`, `cat2a`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-and-range-data

browser API, SVG. Missing authored label: xAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    45.5   -->   33
```

Expected labels: `xAxisName`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-and-range-data-with-only-decimal-part

browser API, SVG. Missing authored label: xAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis xAxisName    45.5   -->   .34
```

Expected labels: `xAxisName`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-with

browser API, SVG. Missing authored label: xAxisName has space

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
    x-axis "xAxisName has space"
```

Expected labels: `xAxisName has space`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-with-with-spaces

browser API, SVG. Missing authored label: xAxisName has space

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
   x-axis    "  xAxisName has space   "
```

Expected labels: `xAxisName has space`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-with-axis-name-without

browser API, SVG. Missing authored label: xAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis        xAxisName
```

Expected labels: `xAxisName`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-x-axis-without-axis-name-and-category-data

browser API, SVG. Missing authored label: cat1; Missing authored label: cat2a

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
x-axis    [  "cat1"  ,   cat2a  ]
```

Expected labels: `cat1`, `cat2a`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name

browser API, SVG. Missing authored label: yAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
y-axis yAxisName
```

Expected labels: `yAxisName`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with

browser API, SVG. Missing authored label: yAxisName has space

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
    y-axis "yAxisName has space"
```

Expected labels: `yAxisName has space`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with-and-spaces

browser API, SVG. Missing authored label: yAxisName has space

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
   y-axis    "  yAxisName has space   "
```

Expected labels: `yAxisName has space`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with-range-data

browser API, SVG. Missing authored label: yAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
y-axis yAxisName    45.5   -->   33
```

Expected labels: `yAxisName`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with-range-data-with-only-decimal-part

browser API, SVG. Missing authored label: yAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
y-axis yAxisName    45.5   -->   .33
```

Expected labels: `yAxisName`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

### corpus:mermaid-upstream-suite-bench:xychart-upstream-parse-y-axis-with-axis-name-with-spaces

browser API, SVG. Missing authored label: yAxisName

Pinned Mermaid accepted this source; authored labels are declared. Passing these checks does not establish full fidelity or native-model support.

```mermaid
xychart 
y-axis        yAxisName
```

Expected labels: `yAxisName`

Tool output (4583 bytes) remains in the local owning evidence; omitted from this portable report's 128 KiB per-file / 1 MiB per-project output budget. The failure and its original measurement remain recorded.

