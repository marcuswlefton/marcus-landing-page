"""Package the existing homepage for copy/paste and an isolated inline review."""
from pathlib import Path
import base64
import html
import re

ROOT = Path(__file__).resolve().parents[1]

def inline_asset(match):
    relative = match.group(1)
    path = ROOT / relative.lstrip('/')
    mime = {'.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff': 'font/woff'}[path.suffix]
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()

source = (ROOT / 'index.html').read_text()
css = '\n'.join((ROOT / name).read_text() for name in ('assets/site.css', 'assets/refinements.css'))
css = re.sub(r"/((?:assets/)[^'\")]+)", lambda m: inline_asset(m), css)
source = re.sub(r'<link rel="preload"[^>]+>', '', source)
source = re.sub(r'<link rel="stylesheet"[^>]+>', '', source)
source = source.replace('<script src="/assets/site.js" defer></script>', '<style>' + css + '</style>')
source = re.sub(r'(?<=src=")(/assets/[^\"]+)', inline_asset, source)
script = (ROOT / 'assets/site.js').read_text()
source = source.replace('</body>', '<script>' + script + '</script></body>')
source = source.replace('href="/assets/favicon.svg"', 'href="' + inline_asset(re.match(r'(.*)', '/assets/favicon.svg')) + '"')
out = ROOT / 'exports'
out.mkdir(exist_ok=True)
(out / 'marcus-homepage.html').write_text(source)

# The review has no networking or live form submissions. The copyable source
# retains the original Netlify integration for use in the existing site.
preview_script = script[:script.index('  // Only campaign')] + '''
  document.querySelectorAll('form').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    form.querySelector('.form-status').textContent = 'Preview only. No information has been sent.';
  }));
  document.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (!href.startsWith('#')) link.addEventListener('click', event => {
      event.preventDefault();
      document.getElementById('review-notice').textContent = 'Homepage preview. Other pages are included in the existing project.';
    });
  });
})();'''
preview = source.replace('<script>' + script + '</script>', '<script>' + preview_script + '</script>')
preview = preview.replace('<main id="main">', '<p id="review-notice" role="status" style="padding:0 24px;color:#c7b78d"></p><main id="main">')
preview = re.sub(r'<form ([^>]*?)action="[^"]+"', r'<form \1action="#"', preview)
shell = (ROOT / 'tools/review-shell.html').read_text()
fragment = shell.replace('__PREVIEW__', html.escape(preview, quote=True)).replace('__SOURCE__', html.escape(source))
assert len(fragment.encode()) < 1_000_000
destination = ROOT.parent / 'marcus-homepage-review.html'
destination.write_text(fragment)
print(f'Inline review: {destination} ({len(fragment.encode()):,} bytes)')
print(f'Copyable homepage: {out / "marcus-homepage.html"}')
