from pathlib import Path
import re,json,base64
root=Path(__file__).resolve().parents[1]
routes={'/':'Home','/advisory/':'Private Advisory','/evidence/':'Evidence','/mastery-in-motion/':'Mastery in Motion','/mastery-in-motion/the-cost-of-compensation/':'Field Note','/contact/':'Contact','/privacy/':'Privacy','/terms-of-service/':'Terms','/thankyou/':'Newsletter confirmation','/application-received/':'Application confirmation','/404.html/':'Page not found'}
pages={}
for path,label in routes.items():
 file=root/('404.html' if path=='/404.html/' else path.strip('/')+'/index.html' if path!='/' else 'index.html')
 src=file.read_text();match=re.search(r'<body([^>]*)>(.*?)</body>',src,re.S)
 body=re.sub(r'<script.*?</script>','',match[2],flags=re.S)
 cls=re.search(r'class="([^"]*)"',match[1])
 head=re.search(r'<head>(.*?)</head>',src,re.S)[1]
 head=re.sub(r'<link[^>]*rel="(?:stylesheet|preload)"[^>]*>','',head)
 head=re.sub(r'<script[^>]*src=[^>]*>.*?</script>','',head,flags=re.S)
 pages[path]={'label':label,'body':body,'bodyClass':cls[1] if cls else '', 'head':head}
css='\n'.join((root/f'assets/{x}.css').read_text() for x in ['site','refinements'])
alltext=css+json.dumps(pages)
assets={}
for p in (root/'assets').rglob('*'):
 if p.is_file() and '/'+str(p.relative_to(root)) in alltext and p.suffix in ['.svg','.webp','.png','.woff']:
  mime={'.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff':'font/woff'}[p.suffix]
  assets['/'+str(p.relative_to(root))]='data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode()
script=(root/'assets/site.js').read_text()
preview=script[:script.index('  // Only campaign')]+'''})();
document.addEventListener('click',event=>{const link=event.target.closest('a');if(!link)return;const href=link.getAttribute('href')||'';if(href.startsWith('#'))return;if(/^https?:|^mailto:/.test(href)){link.target='_blank';link.rel='noopener noreferrer';return}event.preventDefault();parent.postMessage({type:'marcus-navigate',href},'*')});
document.querySelectorAll('form').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();parent.postMessage({type:'marcus-navigate',href:form.action.includes('/apply')?'/application-received/':'/thankyou/'},'*')}));
window.addEventListener('message',event=>{if(event.source===parent&&event.data?.type==='review-anchor'){document.getElementById(event.data.hash.slice(1))?.scrollIntoView()}});
'''
payload=json.dumps(dict(pages=pages,css=css,assets=assets,previewScript=preview,liveScript=script)).replace('<','\\u003c')
fragment=(root/'tools/full-review-shell.html').read_text().replace('__DATA__',payload)
assert len(fragment.encode())<1000000,len(fragment.encode())
out=root.parent/'marcus-virtuosity-review.html';out.write_text(fragment);print(out,len(fragment.encode()))
