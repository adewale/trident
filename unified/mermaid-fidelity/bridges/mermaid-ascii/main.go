// AlexanderGrooff/mermaid-ascii: call the project's own public per-family parsers
// (pkg/graph.Parse, pkg/sequence.Parse, pkg/er.Parse) and print the returned model.
// See ../../bridges.ts for the reply protocol. The bridge parses nothing itself.
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"regexp"

	"github.com/AlexanderGrooff/mermaid-ascii/pkg/diagram"
	"github.com/AlexanderGrooff/mermaid-ascii/pkg/er"
	"github.com/AlexanderGrooff/mermaid-ascii/pkg/graph"
	"github.com/AlexanderGrooff/mermaid-ascii/pkg/sequence"
)

// The parsers' own "this is not my diagram type" refusals, as opposed to syntax errors.
var notThisType = map[string]*regexp.Regexp{
	"flowchart": regexp.MustCompile(`^unsupported graph type `),
	"sequence":  regexp.MustCompile(`^expected "sequenceDiagram" keyword$`),
	"er":        regexp.MustCompile(`^expected "erDiagram" keyword$`),
}

func reply(v map[string]any) {
	b, err := json.Marshal(v)
	if err != nil {
		b = []byte(`{"adapterGap":"bridge could not encode its reply"}`)
	}
	os.Stdout.Write(append(b, '\n'))
}

func main() {
	defer func() {
		if r := recover(); r != nil {
			reply(map[string]any{"adapterGap": fmt.Sprint("mermaid-ascii bridge panic: ", r)})
		}
	}()
	var req struct {
		Family string `json:"family"`
		Source string `json:"source"`
	}
	input, err := io.ReadAll(os.Stdin)
	if err == nil {
		err = json.Unmarshal(input, &req)
	}
	if err != nil {
		reply(map[string]any{"adapterGap": "bridge request was not JSON: " + err.Error()})
		return
	}
	// The project strips YAML frontmatter before detecting and parsing every
	// diagram (render.RenderDiagramWithStatus); the bridge applies that same step.
	source, _ := diagram.StripFrontmatter(req.Source)

	var model any
	switch req.Family {
	case "flowchart":
		// "cli" is the style type the mermaid-ascii CLI's graph adapter passes (render.GraphDiagram.Parse).
		model, err = graph.Parse(source, "cli")
	case "sequence":
		model, err = sequence.Parse(source)
	case "er":
		model, err = er.Parse(source)
	default:
		reply(map[string]any{"unsupported": "mermaid-ascii has no " + req.Family + " parser (it parses graph/flowchart, sequenceDiagram and erDiagram)"})
		return
	}
	if err != nil {
		if notThisType[req.Family].MatchString(err.Error()) {
			reply(map[string]any{"unsupported": "mermaid-ascii " + req.Family + " parser: " + err.Error()})
		} else {
			reply(map[string]any{"error": map[string]string{"name": "ParseError", "message": err.Error()}})
		}
		return
	}
	text := newEncoder(graph.TridentBridgeEnums, sequence.TridentBridgeEnums, er.TridentBridgeEnums).encode(model)
	os.Stdout.WriteString(`{"value":` + text + "}\n")
}
