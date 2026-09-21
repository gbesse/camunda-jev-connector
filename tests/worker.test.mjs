// Purpose: Check native Camunda SDK polling, single acknowledgements, incident behavior and template schema compatibility.
import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import Ajv from 'ajv';
import {createJobHandler,createBoundedClient,registerWorker,JOB_TYPE} from '../src/index.mjs';
const read=async p=>JSON.parse(await readFile(new URL(p,import.meta.url)));
const pack=await read('../packs/support-triage.json'),fixture=await read('../examples/synthetic-billing-response.json');
function handler(options={}){return createJobHandler({packs:{[pack.name]:pack},provider:async()=>structuredClone(fixture),...options});}
function job(){const complete=[],fail=[],ignored=[];return{ignore:async()=>{ignored.push(true);return 'JOB_ACTION_RECEIPT';},ignored,jobKey:'42',variables:{jevPack:pack.name,jevState:{text:'Charged twice'}},complete:async data=>{complete.push(data);return 'JOB_ACTION_RECEIPT';},fail:async data=>{fail.push(data);return 'JOB_ACTION_RECEIPT';},completed:complete,failed:fail};}
test('successful job has exactly one completion and full record',async()=>{const j=job();await handler()(j);assert.equal(j.completed.length,1);assert.equal(j.failed.length,0);assert.equal(j.completed[0].jev.outcome,'billing');});
test('unknown pack raises an incident and does not call inference',async()=>{const j=job();j.variables.jevPack='unknown';const errors=[];await handler({provider:()=>assert.fail('unexpected inference'),onError:e=>errors.push(e)})(j);assert.equal(j.failed[0].retries,0);assert.equal(j.completed.length,0);assert.equal(errors.length,1);});
test('provider deadline fails the task without turning it into a fallback',async()=>{const j=job();await handler({provider:()=>new Promise(()=>{}),timeoutMs:5,onError:()=>{}})(j);assert.equal(j.failed.length,1);assert.equal(j.completed.length,0);});
test('ambiguous completion is reported and released locally without a second broker acknowledgement',async()=>{const j=job(),errors=[];j.complete=()=>new Promise(()=>{});await handler({acknowledgementTimeoutMs:5,onError:e=>errors.push(e)})(j);assert.match(errors[0].message,/deadline/);assert.equal(j.failed.length,0);assert.equal(j.ignored.length,1);});
test('official element template schema accepts the Modeler template',async()=>{const schema=await read('../node_modules/@camunda/zeebe-element-templates-json-schema/resources/schema.json');const validate=new Ajv({strict:false,allErrors:true}).compile(schema);assert.ok(validate(await read('../element-templates/jev-decision.json')),JSON.stringify(validate.errors));});
test('real SDK worker activates and completes a job through its HTTP adapter', {timeout:7000},async t=>{
 let delivered=false;const calls=[];let resolveDone;const done=new Promise(resolve=>{resolveDone=resolve;});
 const client=createBoundedClient({config:{CAMUNDA_REST_ADDRESS:'http://127.0.0.1:18080',CAMUNDA_AUTH_STRATEGY:'NONE'},fetch:async(input,init={})=>{
  const url=typeof input==='string'?input:input.url;const body=JSON.parse(init.body||(input instanceof Request?await input.clone().text():'{}')||'{}');calls.push({url,body});assert.ok(init.signal);assert.equal(init.redirect,'error');
  if(url.endsWith('/jobs/activation')){
   if(delivered)return Response.json({jobs:[]});delivered=true;
   return Response.json({jobs:[{jobKey:'42',type:JOB_TYPE,processInstanceKey:'1',processDefinitionKey:'2',processDefinitionId:'jev-test',processDefinitionVersion:1,elementId:'Task',elementInstanceKey:'3',worker:'jev-decisions',retries:1,deadline:Date.now()+90000,variables:{jevPack:pack.name,jevState:{text:'Charged twice'}},customHeaders:{}}]});
  }
  if(url.endsWith('/jobs/42/completion')){resolveDone(body);return new Response(null,{status:204});}
  throw new Error('Unexpected SDK endpoint: '+url);
 }});
 const worker=registerWorker(client,{packs:{[pack.name]:pack},provider:async()=>structuredClone(fixture)});t.after(()=>worker.stop());
 const result=await Promise.race([done,new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('SDK worker did not complete: '+JSON.stringify(calls))),5000);timer.unref();})]);
 assert.equal(result.variables.jev.outcome,'billing');assert.equal(calls[0].body.type,JOB_TYPE);
});
