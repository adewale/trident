import {afterAll,beforeAll,expect,setDefaultTimeout,test} from 'bun:test'
import {chromium} from 'playwright'
import {inspectSvgDrawing} from '../fidelity/inspect-svg.ts'
import {chromiumExecutable} from './helpers/environment.ts'

// Independent reviewer controls: literal SVGs, never a renderer/model result.
setDefaultTimeout(30_000)
let browser:any
beforeAll(async()=>{browser=await chromium.launch({executablePath:chromiumExecutable,headless:true})})
afterAll(async()=>{await browser?.close()})
const geometry=(x:number)=>`M${x} 20h120v80h-120Z`
const body=(id:string,x:number,overlay='',filter='')=>`<g><path d="${geometry(x)}" fill="#123456" stroke="#123456" stroke-width="4" style="filter:${filter||'none'}"/>${overlay}<text x="${x+60}" y="65" text-anchor="middle" font-size="16">${id}</text></g>`
async function status(figures:string,roles:any[],equalities?:any[]){
  const page=await browser.newPage({viewport:{width:640,height:300}})
  try{
    await page.setContent(`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="150">${figures}</svg>`)
    const expected={labels:roles.map(role=>role.owner),facts:{'theme-paint':{theme:'independent-control',family:'timeline',quantizationTolerancePerChannel:1,comparison:'source-paint-tokens',roles,...(equalities?{equalities}:{})}}}
    const result=await inspectSvgDrawing(page,{family:'timeline',source:'timeline\n2020 : First\n2021 : Second',expected})
    return result.checks.find(check=>check.criterion==='source-fact:theme-paint')?.status
  }finally{await page.close()}
}
test('a required stroke cannot borrow its color from a fully overpainted earlier outline',async()=>{
  const roles=[{owner:'2020',kind:'period',stroke:'#123456'}]
  expect(await status(body('2020',20),roles)).toBe('passed')
  const cover=`<path d="${geometry(20)}" fill="none" stroke="#ff0000" stroke-width="8"/>`
  expect(await status(body('2020',20,cover),roles)).toBe('unavailable')
})
test('zero and degenerate brightness cannot expose an underlying requested RGB token',async()=>{
  const roles=[{owner:'2020',kind:'period',fill:'#123456'}]
  expect(await status(body('2020',20),roles)).toBe('passed')
  for(const filter of ['brightness(0)','brightness(0.001)','brightness(1000000)'])expect(await status(body('2020',20,'',filter),roles)).toBe('unavailable')
})
test('monochrome equality requires each owned fill carrier to remain exposed',async()=>{
  const roles=[{owner:'2020',kind:'period'},{owner:'2021',kind:'period'}],equalities=[{property:'fill',roleIndices:[0,1]}]
  expect(await status(body('2020',20)+body('2021',200),roles,equalities)).toBe('passed')
  const cover=`<path d="${geometry(20)}" fill="#ff0000" stroke="#ff0000" stroke-width="8"/>`
  expect(await status(body('2020',20,cover)+body('2021',200),roles,equalities)).toBe('unavailable')
})
