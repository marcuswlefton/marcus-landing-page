const {test} = require('node:test');
const assert = require('node:assert/strict');
const {handlerFor} = require('../netlify/lib/forms');
const newsletter = handlerFor('newsletter');
const application = handlerFor('application');
const event = data => ({httpMethod:'POST',headers:{origin:'https://www.marcuslefton.com','content-type':'application/json'},body:JSON.stringify(data)});
const complete = {email:'qa@example.com',first_name:'Website QA',role_company:'Test',current_issue:'Test submission',readiness:'Yes',source:'advisory | linkedin / featured'};
test('form transport, routing, validation, and truthful confirmation', async () => {
  process.env.KIT_API_KEY = 'test-fixture-key';
  for (const kind of [newsletter, application]) {
    for (const origin of ['https://deploy-preview-1--marcuslefton.netlify.app','https://deploy-preview-24--marcuslefton.netlify.app']) {
      assert.equal((await kind({...event({email:'invalid'}),headers:{origin}})).statusCode,400);
    }
    for (const origin of ['https://deploy-preview-1--other-site.netlify.app','https://deploy-preview-1--marcuslefton.netlify.app.evil.example','http://deploy-preview-1--marcuslefton.netlify.app','null']) {
      assert.equal((await kind({...event({email:'invalid'}),headers:{origin}})).statusCode,403);
    }
  }
  let captured;
  global.fetch = async (url,options) => { captured={url,payload:JSON.parse(options.body)};return {ok:true,status:200,json:async()=>({subscription:{id:123}})}; };
  let res=await newsletter(event({email:' QA@example.com ',source:'mastery_in_motion | linkedin'}));
  assert.equal(res.statusCode,200);assert.equal(JSON.parse(res.body).ok,true);assert.match(captured.url,/9270901/);assert.equal(captured.payload.email,'qa@example.com');assert.equal(captured.payload.fields.opt_in_source,'mastery_in_motion | linkedin');
  res=await application(event(complete));
  assert.equal(res.statusCode,200);assert.match(captured.url,/9586922/);assert.equal(captured.payload.fields.bottleneck_current_issue,'Test submission');assert.equal(captured.payload.first_name,'Website QA');assert.equal(captured.payload.fields.bottleneck_audit_readiness,'Yes');
  res=await application(event({...complete,prompted_by:'A founder forwarded the essay',journey:JSON.stringify(['/mastery-in-motion/the-cost-of-compensation/','/advisory/','/private-client?email=secret@example.com'])}));
  assert.equal(res.statusCode,200);
  assert.equal(captured.payload.fields.advisory_prompted_by,'A founder forwarded the essay');
  assert.equal(captured.payload.fields.advisory_journey,'/mastery-in-motion/the-cost-of-compensation/ > /advisory/ > enquiry');
  res=await application(event({...complete,journey:JSON.stringify(['/evidence/founder-dependent-business/','/advisory/','/private?email=secret@example.com'])}));
  assert.equal(res.statusCode,200);
  assert.equal(captured.payload.fields.advisory_journey,'/evidence/founder-dependent-business/ > /advisory/ > enquiry');
  res=await application(event({...complete,journey:JSON.stringify(['/evidence/capacity-and-career-performance/','/advisory/','/private?email=secret@example.com'])}));
  assert.equal(res.statusCode,200);
  assert.equal(captured.payload.fields.advisory_journey,'/evidence/capacity-and-career-performance/ > /advisory/ > enquiry');
  assert.equal(captured.payload.fields.advisory_stage,undefined); // Never overwrite an existing paid/qualified status.
  assert.equal((await application(event({...complete,prompted_by:'x'.repeat(601)}))).statusCode,400);
  assert.equal((await application(event({...complete,journey:'not json'}))).statusCode,200);
  res=await application({...event(complete),headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams(complete).toString()});
  assert.equal(res.statusCode,303);assert.equal(res.headers.Location,'/application-received/');
  res=await newsletter({...event({email:'qa@example.com'}),headers:{'content-type':'application/x-www-form-urlencoded'},body:'email=qa%40example.com'});
  assert.equal(res.statusCode,303);assert.equal(res.headers.Location,'/thankyou/');
  assert.equal((await newsletter(event({email:'broken'}))).statusCode,400);
  assert.equal((await newsletter(event(null))).statusCode,400);
  assert.equal((await newsletter({...event({}),body:'{'})).statusCode,400);
  assert.equal((await application(event({...complete,current_issue:''}))).statusCode,400);
  assert.equal((await application(event({...complete,current_issue:'x'.repeat(3001)}))).statusCode,400);
  assert.equal((await application(event({...complete,linkedin_website:'javascript:alert(1)'}))).statusCode,400);
  assert.equal((await newsletter({...event({}),httpMethod:'GET'})).statusCode,405);
  assert.equal((await newsletter({...event({email:'qa@example.com'}),headers:{origin:'https://unrelated.example'}})).statusCode,403);
  captured=null;assert.equal((await newsletter(event({website:'bot',email:'qa@example.com'}))).statusCode,200);assert.equal(captured,null);
  global.fetch=async()=>({ok:false,status:422,json:async()=>({error:'Rejected'})});
  res=await application(event(complete));assert.equal(res.statusCode,502);assert.equal(JSON.parse(res.body).ok,undefined);
  global.fetch=async()=>({ok:true,status:200,json:async()=>({})});
  assert.equal((await newsletter(event({email:'qa@example.com'}))).statusCode,502);
  global.fetch=async()=>{throw new Error('network failure')};
  assert.equal((await newsletter(event({email:'qa@example.com'}))).statusCode,502);
  delete process.env.KIT_API_KEY;
  assert.equal((await newsletter(event({email:'qa@example.com'}))).statusCode,503);
});
