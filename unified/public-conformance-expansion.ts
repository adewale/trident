import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import ts from 'typescript'
import type { PublicTestDeclaration } from './public-conformance-inventory.ts'

export const reviewedPublicExpansionScope = 'Unchanged original public parse/detection callbacks, including static first-party registry examples, plus the original structural accessibility render matrix. Private DB assertions, native registration/configuration lifecycle and mixed documentation tests have no equivalent reviewed peer contract. Source eligibility is independent of candidate outcomes; native original and installed-reference controls must qualify the complete selected scope before peer scores.'
export const expandedPublicFiles = ['packages/mermaid/src/diagram-api/diagram-orchestration.spec.ts', 'packages/mermaid/src/diagrams/eventmodeling/eventmodeling.spec.ts', 'packages/mermaid/src/diagrams/sequence/sequenceDiagram.spec.js', 'packages/examples/src/example.spec.ts'] as const
const additions = new Map<string, PublicTestDeclaration['publicOperation']>([
  ...[17,46,53,60,67,91].map(line=>[expandedPublicFiles[0]+':'+line,'detectType'] as const),
  [expandedPublicFiles[1]+':95','parse'],
  ...[913,2388,2598,2615,2631].map(line=>[expandedPublicFiles[2]+':'+line,'parse'] as const),
  [expandedPublicFiles[3]+':91','parse'],
])
export const reviewedAdditionalPublicOperation = (id:string)=>additions.get(id)
const hash=(value:string)=>createHash('sha256').update(value).digest('hex')
const unwrap=(node:ts.Expression):ts.Expression=>ts.isSatisfiesExpression(node)||ts.isAsExpression(node)||ts.isParenthesizedExpression(node)?unwrap(node.expression):node
/** Freeze fixture data by reading literal AST values. No source module, parser,
 * renderer, model, dynamic import or arbitrary JavaScript evaluator executes. */
function literal(node:ts.Expression):any {
  node=unwrap(node)
  if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node))return node.text
  if(node.kind===ts.SyntaxKind.TrueKeyword)return true
  if(node.kind===ts.SyntaxKind.FalseKeyword)return false
  if(ts.isArrayLiteralExpression(node))return node.elements.map(item=>{if(!ts.isExpression(item))throw Error('Nonliteral registry item');return literal(item)})
  if(ts.isObjectLiteralExpression(node))return Object.fromEntries(node.properties.map(item=>{if(!ts.isPropertyAssignment(item)||!ts.isIdentifier(item.name)&&!ts.isStringLiteral(item.name))throw Error('Nonliteral registry property');return[item.name.text,literal(item.initializer)]}))
  throw Error('Registry fixture must remain static literal data: '+node.getText().slice(0,80))
}
export function readStaticExampleRegistry(upstream:string){
  const indexPath='packages/examples/src/index.ts', text=readFileSync(join(upstream,indexPath),'utf8'),tree=ts.createSourceFile(indexPath,text,ts.ScriptTarget.Latest,true),imports=new Map<string,string>()
  for(const statement of tree.statements)if(ts.isImportDeclaration(statement)&&statement.importClause?.name&&ts.isStringLiteral(statement.moduleSpecifier))imports.set(statement.importClause.name.text,statement.moduleSpecifier.text)
  const registry=tree.statements.flatMap(statement=>ts.isVariableStatement(statement)?[...statement.declarationList.declarations]:[]).find(item=>ts.isIdentifier(item.name)&&item.name.text==='diagramData')
  if(!registry?.initializer||!ts.isArrayLiteralExpression(registry.initializer))throw Error('Original registry is no longer a static ordered array')
  return registry.initializer.elements.flatMap((item)=>{
    if(!ts.isIdentifier(item)||!imports.has(item.text))throw Error('Original registry entry is not a fixed default import')
    const path=join(dirname(indexPath),imports.get(item.text)!).replace(/\.js$/,'.ts'),source=readFileSync(resolve(upstream,path),'utf8'),module=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true)
    const exported=module.statements.find(statement=>ts.isExportAssignment(statement)&&!statement.isExportEquals)
    if(!exported||!ts.isExportAssignment(exported))throw Error('Missing literal registry default export')
    const data=literal(exported.expression)
    if(typeof data.id!=='string'||typeof data.name!=='string'||!Array.isArray(data.examples)||data.examples.some((example:any)=>typeof example.title!=='string'||typeof example.code!=='string'))throw Error('Incomplete original example fixture')
    return data.examples.map((example:any,index:number)=>({id:data.id as string,name:data.name as string,title:example.title as string,code:example.code as string,index,path,sourceSha256:hash(source),codeSha256:hash(example.code),registrySha256:hash(text)}))
  })
}
function eachParameters(upstream:string,input:PublicTestDeclaration):any[]{
  const text=readFileSync(join(upstream,input.path),'utf8'),tree=ts.createSourceFile(input.path,text,ts.ScriptTarget.Latest,true)
  let parameters:ts.Expression|undefined
  const visit=(node:ts.Node)=>{if(ts.isCallExpression(node)&&tree.getLineAndCharacterOfPosition(node.getStart(tree)).line+1===input.line&&ts.isCallExpression(node.expression)&&ts.isPropertyAccessExpression(node.expression.expression)&&node.expression.expression.name.text==='each')parameters=node.expression.arguments[0];ts.forEachChild(node,visit)}
  visit(tree)
  if(!parameters)throw Error('Original parameter matrix changed: '+input.id)
  const values=literal(parameters)
  if(!Array.isArray(values)||!values.length)throw Error('Empty original parameter matrix')
  return values
}
export function expandReviewedPublicCallbacks(upstream:string,declarations:readonly PublicTestDeclaration[]):PublicTestDeclaration[]{
  return declarations.flatMap<PublicTestDeclaration>(input=>{
    const base={...input,declarationId:input.id}
    if(input.id===expandedPublicFiles[0]+':17')return eachParameters(upstream,input).map(value=>{
      if(typeof value.text!=='string'||typeof value.expected!=='string')throw Error('Original detector parameter changed')
      return {...base,id:input.id+'#parameter:'+encodeURIComponent(value.text),parameter:value.text,nativeRegistrationLine:input.line,fullName:input.fullName.replace('$text',value.text).replace('$expected',value.expected)}
    })
    if(input.id===expandedPublicFiles[2]+':2388')return eachParameters(upstream,input).map(value=>{
      if(typeof value!=='string')throw Error('Original actor parameter changed')
      return {...base,id:input.id+'#parameter:'+value,parameter:value,nativeRegistrationLine:input.line,fullName:input.fullName.replace('%s',value)}
    })
    if(input.id===expandedPublicFiles[3]+':91')return readStaticExampleRegistry(upstream).map(value=>({...base,id:input.id+'#parameter:'+value.id+':'+value.index,parameter:value.id+':'+value.index,nativeRegistrationLine:input.line,fullName:input.fullName.replace('`${diagram.name}: ${example.title}`',value.name+': '+value.title),parameterSourcePath:value.path,parameterSourceSha256:value.sourceSha256,parameterCodeSha256:value.codeSha256,registrySourceSha256:value.registrySha256,family:value.id}))
    return [base]
  })
}
