"""Dependency-free structural and internal-link verification."""
from html.parser import HTMLParser
from pathlib import Path
import json, re, sys
from urllib.parse import urljoin, urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]
CORE = [
    'evidence/founder-dependent-business/index.html',
    'evidence/commercial-performance/index.html',
    'index.html','advisory/index.html','evidence/index.html','mastery-in-motion/index.html',
    'mastery-in-motion/the-cost-of-compensation/index.html','contact/index.html',
    'mastery-in-motion/founder-time-management/index.html',
    'mastery-in-motion/think-clearly-under-pressure/index.html',
    'privacy/index.html','terms-of-service/index.html','thankyou/index.html',
    'application-received/index.html','404.html'
]

class Doc(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=[]; self.hrefs=[]; self.srcs=[]; self.jsonld=[]; self._script=False; self._script_type=''; self._data=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if a.get('id'): self.ids.append(a['id'])
        if tag=='a' and a.get('href'): self.hrefs.append(a['href'])
        if tag in ('img','script') and a.get('src'): self.srcs.append(a['src'])
        if tag=='script': self._script=True; self._script_type=a.get('type',''); self._data=[]
    def handle_data(self, data):
        if self._script and self._script_type=='application/ld+json': self._data.append(data)
    def handle_endtag(self, tag):
        if tag=='script' and self._script:
            if self._script_type=='application/ld+json': self.jsonld.append(''.join(self._data))
            self._script=False; self._script_type=''; self._data=[]

redirects={}
for raw in (ROOT/'_redirects').read_text().splitlines():
    raw=raw.strip()
    if raw and not raw.startswith('#'):
        parts=raw.split()
        if len(parts)>=2 and '*' not in parts[0]: redirects[parts[0]]=parts[1]

def route_exists(route):
    route=route.split('?',1)[0].split('#',1)[0]
    seen=set()
    while route in redirects and route not in seen:
        seen.add(route); route=redirects[route].split('#',1)[0]
    if not route or route=='/': return (ROOT/'index.html').exists()
    target=ROOT/route.lstrip('/')
    return target.is_file() or (target/'index.html').is_file()

failures=[]
for rel in CORE:
    text=(ROOT/rel).read_text()
    doc=Doc(); doc.feed(text)
    dup=sorted({x for x in doc.ids if doc.ids.count(x)>1})
    if dup: failures.append(f'{rel}: duplicate IDs {dup}')
    for href in doc.hrefs:
        if href.startswith('/') and not route_exists(href): failures.append(f'{rel}: missing internal link {href}')
    for href in doc.hrefs:
        if not href.startswith(('/', '#')) or '#' not in href: continue
        route = urlsplit(urljoin('/'+rel, href))
        target = ROOT / route.path.lstrip('/')
        if target.is_dir(): target = target / 'index.html'
        if target.is_file() and route.fragment:
            linked = Doc(); linked.feed(target.read_text())
            if unquote(route.fragment) not in linked.ids:
                failures.append(f'{rel}: missing fragment {href}')
    for src in doc.srcs:
        if src.startswith('/') and not route_exists(src): failures.append(f'{rel}: missing local asset {src}')
    for block in doc.jsonld:
        try: json.loads(block)
        except json.JSONDecodeError as e: failures.append(f'{rel}: invalid JSON-LD ({e})')
    if '<main' not in text or text.count('<h1') != 1: failures.append(f'{rel}: expected one main and one h1')

root=(ROOT/'index.html').read_text()
if 'id="join"' not in root: failures.append('index.html: #join compatibility anchor is missing')
if re.search(r'8,000\+|1,400\+|35-hour|Bottleneck Audit|Private Bottleneck', '\n'.join((ROOT/x).read_text() for x in CORE), re.I):
    failures.append('Core pages contain a retired or unsupported claim/offer term.')
for endpoint in ['subscribe','apply']:
    if not (ROOT/f'netlify/functions/{endpoint}.js').exists(): failures.append(f'Missing {endpoint} form handler')
for route in ['/','/advisory/','/evidence/','/mastery-in-motion/']:
    if f'https://www.marcuslefton.com{route}' not in (ROOT/'sitemap.xml').read_text(): failures.append(f'Sitemap missing {route}')
if failures:
    print('\n'.join(failures)); sys.exit(1)
print(f'PASS: {len(CORE)} core documents, metadata payloads, assets, internal links, redirects, handlers, and retired-claim checks.')
