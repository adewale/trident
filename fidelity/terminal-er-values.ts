export interface TerminalErAttribute { type: string; name: string; keys: string[]; comment?: string }
/** Pinned Mermaid ER documentation defines a leading name asterisk as an
 * alternative PK marker (entityRelationshipDiagram.md:371 at 1fb7869866dd619168d840291c9c54b4f129758b).
 * Keep literal declarations separately; this is their semantic field value. */
export function terminalErAttributeValue(type: string, name: string, keys: readonly string[], comment?: string): TerminalErAttribute {
  const primary = name.startsWith('*')
  return { type: type.normalize('NFC'), name: (primary ? name.slice(1) : name).normalize('NFC'), keys: [...new Set([...keys, ...(primary ? ['PK'] : [])])].sort(), ...(comment === undefined ? {} : { comment: comment.normalize('NFC') }) }
}
/** Source syntax: type/name, optional explicit key list and quoted comment. */
export function terminalErSourceAttribute(raw: string): TerminalErAttribute | undefined {
  const match = /^(\S+)\s+(\S+)(?:\s+((?:PK|FK|UK)(?:\s*,\s*(?:PK|FK|UK))*))?(?:\s+"([^"]*)")?\s*$/.exec(raw)
  return match ? terminalErAttributeValue(match[1]!, match[2]!, match[3]?.split(/\s*,\s*/) ?? [], match[4]) : undefined
}
