'use strict';
const FORM_IDS = { newsletter: '9270901', application: '9586922' };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function response(statusCode, payload, native, kind) {
  const headers = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if (native && payload.ok === true) return {statusCode:303,headers:{...headers,Location:kind === 'newsletter' ? '/thankyou/' : '/application-received/'},body:''};
  if (native) return {statusCode,headers:{...headers,'Content-Type':'text/html; charset=utf-8'},body:`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Submission not confirmed | Marcus Lefton</title><link rel="stylesheet" href="/assets/site.css"><main class="confirmation wrap"><p class="eyebrow">Marcus Lefton · VYRTŪOSITI</p><h1>We could not confirm receipt.</h1><p class="lead">${escape(payload.error)}</p><p><a class="text-link" href="${kind === 'newsletter' ? '/mastery-in-motion/#join' : '/advisory/#apply'}">Return to the form</a></p><p><a href="mailto:marcus@marcuslefton.com">marcus@marcuslefton.com</a></p></main></html>`};
  return {statusCode,headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(payload)};
}
function origins() {
  const allowed = new Set(['https://marcuslefton.com','https://www.marcuslefton.com']);
  for (const value of [process.env.URL,process.env.DEPLOY_PRIME_URL,process.env.DEPLOY_URL]) {
    if (!value) continue;
    try { allowed.add(new URL(value).origin); } catch (_) {}
  }
  return allowed;
}
function isAllowedOrigin(origin) {
  if (origins().has(origin)) return true;
  // Netlify build URL variables may be absent in the Functions runtime.
  // Permit only this site's numbered deploy previews, never arbitrary Netlify sites.
  return /^https:\/\/deploy-preview-[1-9][0-9]*--marcuslefton\.netlify\.app$/.test(origin);
}
function handlerFor(kind) {
  return async event => {
    const headers = Object.fromEntries(Object.entries(event.headers || {}).map(([k,v]) => [k.toLowerCase(),v]));
    const native = (headers['content-type'] || '').includes('application/x-www-form-urlencoded');
    const send = (code,body) => response(code,body,native,kind);
    if (event.httpMethod !== 'POST') return send(405,{error:'Method not allowed.'});
    if (headers.origin && !isAllowedOrigin(headers.origin)) return send(403,{error:'This request could not be verified. Please use the form on marcuslefton.com.'});
    if (!event.body || Buffer.byteLength(event.body) > 18000) return send(400,{error:'Please shorten your message and try again.'});
    let data;
    try {
      const raw = event.isBase64Encoded ? Buffer.from(event.body,'base64').toString('utf8') : event.body;
      data = native ? Object.fromEntries(new URLSearchParams(raw)) : JSON.parse(raw);
    } catch (_) { return send(400,{error:'The request could not be read. Please try again.'}); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return send(400,{error:'Invalid request.'});
    const str = name => typeof data[name] === 'string' ? data[name].trim() : '';
    if (str('website')) return send(200,{ok:true,message:'Request received.'});
    const email = str('email').toLowerCase();
    if (email.length > 254 || !EMAIL.test(email) || email.includes('..') || email.startsWith('.')) return send(400,{error:'Enter a valid email address.'});
    const source = str('source').replace(/[^a-zA-Z0-9 _./|:-]/g,'').slice(0,240) || kind;
    const fields = {opt_in_source:source};
    const payload = {email,fields};
    if (kind === 'application') {
      const limits = {first_name:120,role_company:240,current_issue:3000,already_tried:2000,why_now:600,linkedin_website:500,prompted_by:600,journey:2000};
      for (const [name,limit] of Object.entries(limits)) if (str(name).length > limit) return send(400,{error:'One of your answers is too long. Please shorten it and try again.'});
      if (!str('first_name') || !str('role_company') || !str('current_issue')) return send(400,{error:'Please include your name, role, and the result you want to work toward.'});
      if (!['Yes','Maybe, depends on fit','Not right now'].includes(str('readiness'))) return send(400,{error:'Please select your investment readiness.'});
      if (str('linkedin_website')) {
        try { if (!['https:','http:'].includes(new URL(str('linkedin_website')).protocol)) throw new Error(); }
        catch (_) { return send(400,{error:'Use a complete LinkedIn or website address beginning with https://.'}); }
      }
      if (str('prompted_by')) fields.advisory_prompted_by = str('prompted_by');
      if (str('journey')) {
        const allowedPaths = new Set(['/', '/advisory/', '/evidence/', '/evidence/commercial-performance/', '/evidence/founder-dependent-business/', '/evidence/capacity-and-career-performance/', '/mastery-in-motion/', '/mastery-in-motion/founder-time-management/', '/mastery-in-motion/the-cost-of-compensation/', '/mastery-in-motion/think-clearly-under-pressure/']);
        try {
          const journey = JSON.parse(str('journey'));
          if (Array.isArray(journey)) {
            const paths = journey.filter(path => typeof path === 'string' && allowedPaths.has(path)).slice(0,16);
            if (paths.length) fields.advisory_journey = paths.join(' > ') + ' > enquiry';
          }
        } catch (_) { /* Attribution never blocks an otherwise valid application. */ }
      }
      payload.first_name = str('first_name');
      Object.assign(fields,{bottleneck_source:source,bottleneck_role_company:str('role_company'),bottleneck_current_issue:str('current_issue'),bottleneck_already_tried:str('already_tried'),bottleneck_why_now:str('why_now'),bottleneck_linkedin_website:str('linkedin_website'),bottleneck_audit_readiness:str('readiness')});
    }
    const key = process.env.KIT_API_KEY;
    if (!key) { console.error('Kit API key is not configured.'); return send(503,{error:'The form is temporarily unavailable. Please email marcus@marcuslefton.com.'}); }
    payload.api_key = key;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(),12000);
    try {
      const upstream = await fetch(`https://api.convertkit.com/v3/forms/${FORM_IDS[kind]}/subscribe`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
      const result = await upstream.json().catch(() => null);
      if (!upstream.ok || !result?.subscription?.id) {
        console.error('Kit did not confirm submission.',{status:upstream.status,kind});
        return send(502,{error:'We could not confirm receipt. Please try again or email marcus@marcuslefton.com.'});
      }
      return send(200,{ok:true,message:kind === 'newsletter' ? 'Request received. Check your inbox.' : 'Application received. Marcus will reply by email.'});
    } catch (_) {
      console.error('Kit request failed.',{kind});
      return send(502,{error:'We could not confirm receipt. Please try again or email marcus@marcuslefton.com.'});
    } finally { clearTimeout(timer); }
  };
}
module.exports = {handlerFor};
