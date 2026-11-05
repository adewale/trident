// spacedock-dev/mermaidtext: call the package's own (unexported) per-family parsers,
// parseGraph, parseState, parseClass, parseER and parseSequence, through an export
// file injected with `go build -overlay`, and print what they return. See
// ../../bridges.ts for the reply protocol. The bridge parses nothing itself.
//
// These parsers have no error value: on any source they do not accept they return
// nil / ok=false and Render falls through to the next parser and finally to a framed
// copy of the source. That refusal is reported as `unsupported`. A parser with two
// results (parseClass, parseER: the graph and its compartments) is printed as an array.
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"

	mt "github.com/spacedock-dev/mermaidtext"
)

var parserName = map[string]string{"flowchart": "parseGraph", "state": "parseState", "class": "parseClass", "er": "parseER", "sequence": "parseSequence"}

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
			reply(map[string]any{"adapterGap": fmt.Sprint("mermaidtext bridge panic: ", r)})
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
	results, declined, known := mt.TridentBridgeParse(req.Family, req.Source)
	if !known {
		reply(map[string]any{"unsupported": "mermaidtext has no " + req.Family + " parser (it parses graph/flowchart, stateDiagram, classDiagram, erDiagram and sequenceDiagram)"})
		return
	}
	if declined {
		reply(map[string]any{"unsupported": "mermaidtext " + parserName[req.Family] + " declined this source (returned nil/ok=false; Render would fall through to its framed-source fallback)"})
		return
	}
	var model any = results
	if len(results) == 1 {
		model = results[0]
	}
	os.Stdout.WriteString(`{"value":` + newEncoder(mt.TridentBridgeEnums).encode(model) + "}\n")
}
