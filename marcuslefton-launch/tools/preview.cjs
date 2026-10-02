// Local QA server: the actual Netlify handlers with a clearly simulated Kit transport.
// Never makes subscriptions or sends email. Blocked from public access by _redirects.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
process.env.KIT_API_KEY='local-test-fixture';process.env.URL='http://127.0.0.1:4173';
let mode='success';
global.fetch=async()=>({ok:mode==='success',status:mode==='success'?200:502,json:async()=>mode==='success'?{subscription:{id:1}}:{error:'Simulated Kit failure'}});
const handlers={subscribe:require('../netlify/functions/subscribe').handler,apply:require('../netlify/functions/apply').handler};
const redirects=fs.readFileSync(path.join(root,'_redirects'),'utf8').split('\n').filter(x=>x&&!x.startsWith('#')).map(x=>x.split(/\s+/));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.webp':'image/webp','.woff':'font/woff','.xml':'application/xml','.txt':'text/plain'};
http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1:4173');
  if(url.pathname==='/__test__/mode'&&req.method==='POST'){let b='';for await(const c of req)b+=c;mode=b==='failure'?'failure':'success';res.end(mode);return;}
  if(url.pathname.startsWith('/.netlify/functions/')){
    const handler=handlers[url.pathname.split('/').pop()];if(!handler){res.writeHead(404);res.end();return;}
    let body='';for await(const c of req)body+=c;
    const result=await handler({httpMethod:req.method,headers:req.headers,body});
    res.writeHead(result.statusCode,result.headers);res.end(result.body);return;
  }
  const redirect=redirects.find(([from])=>from===url.pathname);
  if(redirect){res.writeHead(parseInt(redirect[2]),{Location:redirect[1]});res.end();return;}
  let file=path.join(root,decodeURIComponent(url.pathname));
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  let code=200;if(!fs.existsSync(file)||!fs.statSync(file).isFile()){code=404;file=path.join(root,'404.html');}
  res.writeHead(code,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
}).listen(4173,'127.0.0.1',()=>console.log('Local preview: http://127.0.0.1:4173 — simulated email transport'));
