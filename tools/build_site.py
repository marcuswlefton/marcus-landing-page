"""Generate the shared public pages. Run with Python 3; no dependencies required."""
from pathlib import Path
import html, json, re, hashlib

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://www.marcuslefton.com'
def asset_url(name):
    digest = hashlib.sha256((ROOT / 'assets' / name).read_bytes()).hexdigest()[:12]
    return f'/assets/{name}?v={digest}'

NAV = [('advisory', 'Private Advisory', '/advisory/'), ('evidence', 'Evidence', '/evidence/'), ('publication', 'Mastery in Motion', '/mastery-in-motion/')]

def button(text='Work with Marcus', href='/advisory/', cls='button'):
    return f'<a class="{cls}" href="{href}">{text}</a>'

def page(path, title, description, content, active='', kind='', noindex=False, article_meta=None):
    nav = ''.join(f'<a href="{url}"'+(' aria-current="page"' if key == active else '')+f'>{label}</a>' for key,label,url in NAV)
    canonical = ORIGIN + ('/' if path == 'index.html' else '/' + path.replace('index.html',''))
    schema = {'@context':'https://schema.org','@type':'WebPage','name':title,'url':canonical,'description':description,'isPartOf':{'@type':'WebSite','name':'Marcus Lefton | VYRTŪOSITI','url':ORIGIN}}
    if path == 'index.html':
        schema['about'] = {'@type':'Person','name':'Marcus Lefton','url':ORIGIN,'jobTitle':'Founder and Principal Consultant','worksFor':{'@type':'Organization','name':'VYRTŪOSITI'},'sameAs':['https://www.linkedin.com/in/marcuslefton/']}
    if article_meta:
        schema.update({'@type':'BlogPosting','headline':article_meta['title'],
            'author':{'@type':'Person','name':'Marcus Lefton','url':ORIGIN+'/#marcus'},
            'datePublished':article_meta['published'], 'dateModified':article_meta['modified'],
            'mainEntityOfPage':canonical, 'inLanguage':'en',
            'image':ORIGIN+'/assets/marcus-lefton.webp',
            'publisher':{'@type':'Organization','name':'VYRTŪOSITI','url':ORIGIN}})
    extra_css = f'<link rel="stylesheet" href="{asset_url("essays.css")}">' if active == 'publication' else ''
    doc = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title><meta name="description" content="{html.escape(description, quote=True)}">
<link rel="canonical" href="{canonical}"><meta name="theme-color" content="#080909">
<meta property="og:type" content="{'article' if article_meta else 'website'}"><meta property="og:title" content="{html.escape(title, quote=True)}"><meta property="og:description" content="{html.escape(description, quote=True)}"><meta property="og:url" content="{canonical}">
<meta property="og:image" content="https://i.imgur.com/57TScBW_d.png?maxwidth=520&amp;shape=thumb&amp;fidelity=high">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg"><link rel="preload" href="/assets/manrope-400.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="{asset_url("site.css")}"><link rel="stylesheet" href="{asset_url("refinements.css")}">{extra_css}<script src="{asset_url("site.js")}" defer></script>
{'<meta name="robots" content="noindex,follow">' if noindex else ''}
<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script></head>
<body class="{kind}"><a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap header-inner"><a class="wordmark" href="/" aria-label="Marcus Lefton — Home"><strong>Marcus Lefton</strong><span>VYRTŪOSITI</span></a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="navigation">Menu<span aria-hidden="true">+</span></button><nav id="navigation" aria-label="Main navigation">{nav}{button(href='/advisory/#apply',cls='button button-small nav-cta')}</nav></div></header>
<main id="main">{content}</main>
<footer class="site-footer"><div class="wrap"><div class="footer-top"><a class="wordmark" href="/"><strong>Marcus Lefton</strong><span>VYRTŪOSITI</span></a><p>Performance architecture.<br>A clearer way to your next result.</p><div><a href="/contact/">Contact</a><a href="https://www.linkedin.com/in/marcuslefton/">LinkedIn</a><a href="/mastery-in-motion/">The Sunday letter</a></div></div><div class="footer-bottom"><span>© 2026 VYRTŪOSITI LLC</span><div><a href="/privacy/">Privacy</a><a href="/terms-of-service/">Terms</a></div></div></div></footer></body></html>'''
    dest = ROOT / path; dest.parent.mkdir(parents=True, exist_ok=True); dest.write_text(doc)

def newsletter_form(id='newsletter', label='Join the Sunday letter'):
    return f'''<form class="newsletter-form" id="{id}" action="/.netlify/functions/subscribe" method="post" data-form="newsletter">
<label for="{id}-email">Email address</label><div class="email-row"><input id="{id}-email" name="email" type="email" autocomplete="email" placeholder="Your email address" maxlength="254" required><button class="button" type="submit">{label}</button></div>
<div class="honeypot" aria-hidden="true"><label>Leave empty<input name="website" type="text" tabindex="-1" autocomplete="off"></label></div><input type="hidden" name="source" value="mastery_in_motion/{id}"><p class="form-status" role="status" aria-live="polite"></p><p class="form-note">Free. One useful email every Sunday. Unsubscribe anytime. <a href="/privacy/">Privacy</a></p></form>'''

def letter_strip():
    return '<section class="letter-strip" id="join"><div class="wrap letter-grid"><div><p class="eyebrow">The Sunday letter</p><h2>Mastery in Motion.</h2><p>Recognize where your best effort is being wasted—and what to change first.</p><blockquote class="letter-sample">“A missing skill needs practice. Unclear ownership needs a decision.”</blockquote><p class="letter-sample-label">From a Mastery in Motion field note</p>'+button('Read a field note','/mastery-in-motion/the-cost-of-compensation/','text-link')+'</div>'+newsletter_form('home-letter')+'</div></section>'

logo_items = [('apple','Apple'),('mlb','MLB'),('amazon','Amazon'),('us-air-force','U.S. Air Force'),('microsoft','Microsoft'),('ncaa','NCAA'),('tesla','Tesla'),('bainandcompany','Bain & Company'),('flow-research-collective','Flow Research Collective — former consultant and program leader')]
logo_marks = ''.join(f'<div class="logo-item logo-{file}"><img src="/assets/logos/{file}.{"png" if file == "flow-research-collective" else "svg"}" alt="{name}" width="150" height="62" loading="eager"></div>' for file,name in logo_items)
logos = '<section class="experience client-experience wrap" aria-labelledby="client-heading"><div class="client-heading"><p class="eyebrow" id="client-heading">Clients come from worlds where performance matters.</p><p>Selected client backgrounds and professional affiliations across private advisory, professional sport, and performance research &amp; technology.</p></div><div class="logo-marquee"><button class="logo-motion-toggle" type="button" aria-label="Pause client logo animation" aria-pressed="false"></button><div class="logo-window"><div class="logo-track"><div class="logo-group">'+logo_marks+'</div><div class="logo-group" aria-hidden="true">'+logo_marks+'</div></div></div></div><div class="logo-evidence-link"><a class="text-link" href="/evidence/">Explore the evidence <span aria-hidden="true">→</span></a></div></section>'

system = (ROOT / 'tools/diagnostic.html').read_text()
home=f'''<section class="hero wrap"><div class="hero-copy"><p class="eyebrow">Private performance advisory</p><h1>Build the capacity.<br><span>Make it count.</span></h1><p class="hero-lead">For founders and high-stakes operators.</p><p class="hero-support">I identify what’s limiting your next consequential result, then help you build the capacity, skills, and systems to achieve it.</p><p class="hero-support">Perform better. Live well.</p><div class="actions">{button()}{button('Read Mastery in Motion','/mastery-in-motion/','text-link')}</div></div><figure class="portrait"><img src="/assets/marcus-lefton.webp" alt="Marcus Lefton" width="840" height="1826" fetchpriority="high" decoding="async"></figure></section>
{logos}
<section class="home-endorsement wrap" aria-label="Client perspective"><figure><blockquote>“I feel like I am getting every penny’s worth.”</blockquote><figcaption><strong>Ethan Evans</strong><span>Former Amazon VP</span></figcaption><a class="text-link" href="https://www.linkedin.com/posts/ethanevansvp_despite-being-retired-from-my-vp-job-i-activity-7275918001512595457-ARC9/" target="_blank" rel="noopener noreferrer">Read his original account <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a></figure></section>
<section class="about-section wrap" id="marcus">
<div class="section-intro"><p class="eyebrow">Why this perspective</p><h2>Different arenas.<br><span>One connected view.</span></h2><p>Each arena sharpened how I connect the person, the demands, and the result.</p></div>
<div class="arena-list">
<div><div class="arena-heading"><span class="arena-domain">Professional baseball</span><h3>Colorado Rockies</h3></div><p>Connecting physical preparation, recovery, and team systems so individual and collective performance hold across a long season.</p></div>
<div><div class="arena-heading"><span class="arena-domain">Performance research &amp; technology</span><h3>Sparta Science<br>Flow Research Collective</h3></div><div class="arena-insight"><p>Force-plate measurement and readiness at Sparta Science. Applied performance neuroscience as a former consultant and program leader at FRC.</p><a class="sparta-acquisition" href="https://ouraring.com/blog/oura-acquires-sparta-science-to-expand-enterprise-capabilities/">Sparta Science was acquired by ŌURA in 2024.</a></div></div>
<div><div class="arena-heading"><span class="arena-domain">Entrepreneurship</span><h3>Founder &amp; co-founder</h3></div><p>Founder of VYRTŪOSITI. Co-founder of Flow Prone Performance. Building lean teams where human judgment, clear ownership, and thoughtful use of AI turn expertise into results.</p></div>
<div><div class="arena-heading"><span class="arena-domain">Private advisory</span><h3>VYRTŪOSITI</h3></div><p>Connecting capacity, judgment, skills, and systems to the consequential result a founder or high-stakes operator needs next.</p></div>
</div>
<p class="personal-perspective">I’m also a father of two. The question is personal: how do you build something meaningful and still have energy and attention for the people you’re building it with?</p></section>
{system}
<section class="offer-section wrap"><div><p class="eyebrow">The Performance Architecture Intensive</p><h2>Thirty days focused<br><span>on what matters.</span></h2><p>I carry the analysis and intervention design. You bring the context, test the changes, and help determine what comes next.</p>{button()}</div><div class="offer-spec"><p>Private. Direct. Built around you.</p><dl><div><dt>Focus</dt><dd>One consequential result</dd></div><div><dt>Duration</dt><dd>30 days</dd></div><div><dt>Investment</dt><dd>$5,000</dd></div><div><dt>Output</dt><dd>Your Performance Map: a working diagnosis, changes tested in your circumstances, and a clear decision about what to continue, change, or stop.</dd></div></dl></div></section>
{letter_strip()}'''
page('index.html','Marcus Lefton | Performance Architecture & Private Advisory','Private performance advisory for founders and high-stakes operators. Build the capacity, skills, and systems for your next consequential result with Marcus Lefton.',home,kind='home')

application='''<section class="application-section wrap" id="apply"><div class="application-intro"><p class="eyebrow">Work with Marcus</p><h2>Tell me what<br>needs to change.</h2><p>I’ll review your application and reply by email. If the fit looks promising, we’ll have a complimentary 15-minute conversation about the result, the working relationship, and the scope.</p><p class="muted">Before you commit, we agree the session schedule, between-session support, and the work required from you. Applying carries no payment obligation.</p><p class="small">Prefer email? <a class="text-link" href="mailto:marcus@marcuslefton.com">marcus@marcuslefton.com</a></p></div>
<form class="application-form" action="/.netlify/functions/apply" method="post" data-form="application"><div class="field-pair"><label>Your name<input name="first_name" autocomplete="name" maxlength="120" required></label><label>Email address<input type="email" name="email" autocomplete="email" maxlength="254" required></label></div><label>Role / company<input name="role_company" autocomplete="organization" maxlength="240" required></label><label>What result matters, and what is getting in the way?<textarea name="current_issue" rows="4" maxlength="3000" required placeholder="A few sentences is enough."></textarea></label><label>What have you already tried? <span class="optional">Optional</span><textarea name="already_tried" rows="2" maxlength="2000"></textarea></label><div class="field-pair"><label>Why is now the right time? <span class="optional">Optional</span><input name="why_now" maxlength="600"></label><label>LinkedIn / website <span class="optional">Optional</span><input type="url" name="linkedin_website" maxlength="500" placeholder="https://"></label></div><label>Are you open to a $5,000 engagement if there is a fit?<select name="readiness" required><option value="">Select an answer</option><option value="Yes">Yes</option><option value="Maybe, depends on fit">I’d like to understand the fit first</option><option value="Not right now">Not right now</option></select></label><div class="honeypot" aria-hidden="true"><label>Leave empty<input name="website" tabindex="-1" autocomplete="off"></label></div><input type="hidden" name="source" value="advisory"><button class="button" type="submit">Send your application</button><p class="form-status" role="status" aria-live="polite"></p><p class="form-note">Your details are used to respond to this enquiry. <a href="/privacy/">Privacy policy</a>.</p></form></section>'''
advisory=f'''<section class="page-hero wrap advisory-lab-hero"><p class="eyebrow">Private advisory · VYRTŪOSITI</p><h1>One consequential result.<br><span>A system built<br class="mobile-break"> to support it.</span></h1><div class="page-hero-bottom"><div class="advisory-introduction"><p class="lead">A 30-day private engagement to identify what is limiting your next consequential result, test focused changes, and build a performance system around you.</p><div class="actions">{button('Work with Marcus','#apply')}{button('Explore the evidence','/evidence/','text-link')}</div><p class="advisory-next-step">Apply for a complimentary 15-minute fit conversation. No payment to apply.</p></div><aside class="engagement-summary" aria-labelledby="intensive-heading"><p class="small-label">Private 1:1 with Marcus</p><h2 id="intensive-heading">Performance Architecture<br>Intensive.</h2><dl><div><dt>Duration</dt><dd>30 days</dd></div><div><dt>Investment</dt><dd>$5,000</dd></div></dl><p class="engagement-summary-output">Your Performance Map, focused changes tested in your week, and a clear next sequence.</p></aside></div><div class="lab-lenses" aria-label="Dimensions considered in the engagement"><span>Capacity</span><span>Cognition</span><span>Capability</span><span>Execution</span><span>Leverage</span><span>Context</span></div></section>
<section class="wrap section-rule fit-section"><h2>You know there is more.<br><span>Make it available where it matters.</span></h2><div><p>Your ambition has outgrown the way you operate. You may need sharper performance under pressure, a step up in your role or business, or a way to deliver without exhausting everything else. We start with the result you want—not a predetermined protocol.</p><p>The Intensive is for a founder or high-stakes operator with a specific result worth solving for—and enough willingness to change how it gets produced.</p></div></section>
<section class="paper-section engagement-journey" id="engagement"><div class="wrap"><div class="section-intro"><p class="eyebrow">The engagement</p><h2>We work on the thing<br>that changes the rest.</h2><p>I carry the analysis and intervention design. You bring the context and test the changes in your actual week.</p></div><ol class="process-list engagement-flow"><li><span>01</span><div><h3>Get the real picture.</h3><p>Define the result. Review relevant calendars, responsibilities, work patterns, and recovery context. Establish a baseline we can use.</p></div><small>Context & baseline</small></li><li><span>02</span><div><h3>Find the constraint.</h3><p>Look across capacity, cognition, capability, execution, leverage, and context. Separate the presenting problem from the most useful explanation to test.</p></div><small>Your Performance Map</small></li><li><span>03</span><div><h3>Change. Observe. Refine.</h3><p>Run a focused intervention, review what happens, and adjust. Record what to keep, what to stop, and the next priority.</p></div><small>Evidence & next moves</small></li></ol></div></section>
<section class="deliverable-section" id="deliverable"><div class="wrap deliverable-grid"><div><p class="eyebrow">What you leave with</p><h2>A working system.<br><span>Yours to use.</span></h2><p>Your Performance Map connects the result you want with the changes that deserve your attention.</p><dl class="map-outputs"><div><dt>A clear starting point</dt><dd>The result, baseline, and evidence we will use to judge progress.</dd></div><div><dt>A considered intervention</dt><dd>Where to act first, why it matters, and what we test in your actual week.</dd></div><div><dt>Your next sequence</dt><dd>What to keep, what to change, and where to focus next.</dd></div></dl><p class="small muted">Illustrative reconstruction based on an earlier commercial-performance engagement. This shows the working format, not an original client document or a promised outcome.</p>{button('Work with Marcus','#apply','text-link')}</div><article class="performance-map"><header><span>VYRTŪOSITI</span><span>Example · Anonymized</span></header><h3>Stronger results.<br>A life you can be present for.</h3><dl><div><dt>The outcome we’re building</dt><dd>Produce your strongest commercial work more consistently—and finish the day with attention and energy left for home.</dd></div><div><dt>The expensive constraint · Hypothesis</dt><dd>Lower-value demands may be consuming the hours when your judgment and attention are sharpest. The work that moves the result gets what is left.</dd></div><div><dt>The change</dt><dd>Match consequential work to your best cognitive state. Move lower-value demands out of those hours. Build recovery and a clear shutdown into the day so performance has a repeatable foundation.</dd></div><div><dt>What counts as progress</dt><dd>Commercial results alongside how they were produced: time on high-value work, recovery, and the ability to switch off and be present at home.</dd></div><div><dt>The test under pressure</dt><dd>When demand rises, do the results hold without work taking over the rest of life? Keep what holds. Revise what still depends on pushing harder.</dd></div></dl></article></div></section>

<section class="faq-section wrap"><h2>A few practical questions.</h2><div class="faq-list"><details><summary>What does the 30-day commitment involve?</summary><p>You bring the goal and relevant context: for example, your calendar, responsibilities, performance data, and what you have already tried. I synthesize the evidence and design the first intervention. We review what changes and refine the approach. Before payment, we agree the session schedule, between-session support, and what implementation will ask of you.</p></details><details><summary>What is the difference between the fit call and the Intensive?</summary><p>The complimentary 15-minute conversation helps us decide whether to work together. The paid Intensive includes the deeper review, intervention design, testing, and Performance Map.</p></details><details><summary>Does every engagement cover all six dimensions?</summary><p>We examine the connections that matter to your result. The work may concentrate on a small number of changes once the evidence points to a useful place to intervene.</p></details><details><summary>What outcomes can you promise?</summary><p>A defined process and tangible working outputs. Business and personal outcomes depend on your context, implementation, and factors beyond the engagement. Earlier client results describe individual experiences.</p></details><details><summary>What happens after the 30 days?</summary><p>You leave with the working map, evidence, and next sequence. Any further advisory work is a separate conversation, with its scope and fee agreed in writing.</p></details></div></section>{application}'''
page('advisory/index.html','Private Advisory | 30-Day Performance Architecture Intensive','A $5,000, 30-day private engagement with Marcus Lefton. Define the result, find the constraint, test changes, and build your Performance Map.',advisory,'advisory',kind='advisory-page')

# Selected excerpts supplied by Marcus; preserve wording and initials.
reviews = json.loads((ROOT / 'tools/client-reviews.json').read_text())
def review_fig(review):
    return '<figure class="client-review"><p class="eyebrow">'+html.escape(review['theme'])+'</p><blockquote>“'+html.escape(review['quote'])+'”</blockquote><figcaption>'+html.escape(review['name'])+'</figcaption></figure>'
review_featured = ''.join(review_fig(r) for r in reviews[:6])
review_archive = ''.join(review_fig(r) for r in reviews[6:])

review_emphasis = {
    'Donovan M.': 'apply to all different real world settings',
    'Elizabeth L.': 'get to the heart of the conversation quickly',
    'Naomi W.': 'small actionable steps',
    'Debb B.': 'an outstanding coach and trusted advisor',
    'Carlomagno M.': 'how clear he puts everything for you to take action',
    'Yonnas G.': 'felt very heard and got clear direction',
}
def wall_review(review):
    quote = html.escape(review['quote'])
    phrase = review_emphasis.get(review['name'])
    if phrase:
        phrase = html.escape(phrase)
        quote = quote.replace(phrase, '<strong>'+phrase+'</strong>')
    feature = ' wall-review-emphasis' if review['name'] in ['Donovan M.', 'Debb B.', 'Carlomagno M.'] else ''
    return '<figure class="wall-review'+feature+'"><blockquote>“'+quote+'”</blockquote><figcaption>'+html.escape(review['name'])+'</figcaption></figure>'
wall_reviews = ''.join(wall_review(r) for r in reviews)
evidence=f'''<section class="wrap review-wall-intro"><h1>In their own words.</h1><p>Professional athletes. Founders. Executives. Technical specialists. Different arenas, demanding standards—their accounts of working with Marcus.</p></section>
<section class="wrap review-wall" aria-label="Client reviews"><div class="wall-lead">
<figure class="wall-review wall-review-featured"><blockquote>“The strongest testimonial I can give you is the five digit sum I pay to have six months of private advisory calls with Marcus. <strong>I feel like I am getting every penny’s worth.”</strong></blockquote><div class="featured-review-footer"><figcaption>Ethan Evans<span>Former Amazon VP</span></figcaption><a class="text-link" href="https://www.linkedin.com/posts/ethanevansvp_despite-being-retired-from-my-vp-job-i-activity-7275918001512595457-ARC9/" target="_blank" rel="noopener noreferrer">Read the original <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a></div></figure>
<figure class="wall-review wall-review-sport"><blockquote>“Had some of my <strong>best seasons</strong> alongside Marcus.”</blockquote><figcaption>Ryan McMahon<span>MLB All-Star</span></figcaption></figure>
<figure class="wall-review wall-review-range"><blockquote>“He could go vertically deep and horizontally in recommending <strong>operationally, physically, and psychologically.</strong>”</blockquote><figcaption>Ted Tanner<span>CTO, Investor</span></figcaption><a class="text-link" href="https://www.tedtanner.org/review-flow-research-collective/">Read the original <span aria-hidden="true">↗</span></a></figure>
</div>{wall_reviews}
</section><section class="closing-cta wrap"><h2>What could change<br><span>for you?</span></h2>{button()}</section>'''
page('evidence/index.html','Evidence | Marcus Lefton & VYRTŪOSITI','Client perspectives on Marcus Lefton’s work across private advisory, professional sport, and performance coaching.',evidence,'evidence')

ESSAYS = json.loads((ROOT/'tools/essays.json').read_text())
def essay_url(essay):
    return '/mastery-in-motion/'+essay['slug']+'/'

selected_essays = '<section class="wrap selected-essays" aria-labelledby="essays-heading"><div class="essay-section-heading"><h2 id="essays-heading">Selected essays.</h2><p>Start with the question closest to your week.</p></div><div class="essay-list">'+''.join(
    f'<a class="essay-card" href="{essay_url(e)}"><div><h3>{html.escape(e["title"])}</h3><p>{html.escape(e["lead"])}</p></div><span class="essay-arrow" aria-hidden="true">↗</span></a>' for e in ESSAYS)+'</div></section>'

publication=f'''<section class="wrap letter-hero-simple"><p class="eyebrow">Mastery in Motion · The Sunday letter</p><h1>Make your best<br><span>more repeatable.</span></h1><p class="letter-hero-copy">One practical idea each Sunday to think clearly, perform well, and build with intention. Drawn from my work in professional baseball, performance neuroscience, entrepreneurship, and private advisory. Written by Marcus Lefton</p>{newsletter_form('join','Subscribe free')}</section>
{selected_essays}
<section class="wrap letter-benefits"><h2>A clearer read.<br><span>A practical next move.</span></h2><div class="letter-benefit-grid"><div><h3>One useful idea.</h3><p>A pattern, question, or adjustment you can test in the week ahead.</p></div><div><h3>A connected perspective.</h3><p>See how your physiology, attention, judgment, and working systems affect one another.</p></div><div><h3>Built for your week.</h3><p>Short, practical reading. Choose what matters to your situation and put it to work.</p></div></div></section>
<section class="wrap newsletter-author"><img src="/assets/marcus-lefton.webp" width="840" height="1826" loading="lazy" alt="Marcus Lefton"><div><p class="eyebrow">From Marcus</p><h2>Different arenas.<br><span>A wider field of view.</span></h2><p>My work has taken me from professional baseball with the Colorado Rockies to human-performance technology at Sparta Science, applied neuroscience at Flow Research Collective, and private advisory for founders and high-stakes operators. Alongside that work, I’ve built VYRTŪOSITI and co-founded Flow Prone Performance.</p><p>Across those settings, I’ve worked with the body producing the effort, the mind directing it, and the systems shaping the result. That experience informs what I notice: when a focus problem calls for recovery, when more effort conceals a missing skill, and when better performance starts with changing the work itself.</p><p><strong>Mastery in Motion brings that connected perspective to your next decision.</strong></p></div></section>
<section class="wrap newsletter-close letter-close-simple"><h2>Get the next Sunday letter.</h2><p>One useful idea each Sunday. A more informed next move for your week.</p>{newsletter_form('closing-join','Subscribe free')}</section>'''
page('mastery-in-motion/index.html','Mastery in Motion | Marcus Lefton’s Sunday Letter','One useful idea each Sunday from professional sport, applied performance, and private advisory. Read Marcus Lefton’s field notes and join Mastery in Motion.',publication,'publication')

for essay in ESSAYS:
    words = len(re.sub(r'<[^>]+>', ' ', essay['body']).split())
    minutes = max(1, round(words/200))
    date_label = 'Updated October 5, 2026' if essay['published'] != essay['modified'] else 'October 5, 2026'
    related = ''.join(f'<a href="{essay_url(e)}">{html.escape(e["title"])} <span aria-hidden="true">→</span></a>' for e in ESSAYS if e['slug'] != essay['slug'])
    article = f'''<article class="article wrap essay-page"><header><a class="text-link" href="/mastery-in-motion/">Mastery in Motion</a><p class="essay-meta"><a href="/#marcus" rel="author">Marcus Lefton</a><span><time datetime="{essay['modified']}">{date_label}</time> · {minutes} min read</span></p><h1>{html.escape(essay['title'])}</h1><p class="lead">{html.escape(essay['lead'])}</p></header>
<div class="article-body">{essay['body']}</div>
<aside class="essay-advisory"><h2>Find what needs to change first.</h2><p>{html.escape(essay['cta'])}</p>{button('Explore private advisory','/advisory/','text-link')}</aside>
<div class="article-subscribe"><h2>A clearer read on your next move.</h2><p>One practical idea each Sunday from professional sport, performance neuroscience, entrepreneurship, and private advisory.</p>{newsletter_form('essay-'+essay['slug'],'Get the Sunday letter')}</div>
<aside class="essay-author"><p><strong>Written by Marcus Lefton.</strong> My perspective spans professional baseball with the Colorado Rockies, performance technology at Sparta Science, and applied neuroscience at Flow Research Collective. I advise founders and high-stakes operators through VYRTŪOSITI.</p><a class="text-link" href="/evidence/">Explore the evidence <span aria-hidden="true">→</span></a><p class="essay-origin">{html.escape(essay['source'])}</p></aside>
<nav class="essay-related" aria-label="Related essays"><h2>Continue reading.</h2>{related}</nav></article>'''
    page('mastery-in-motion/'+essay['slug']+'/index.html',essay['title']+' | Marcus Lefton',essay['description'],article,'publication','essay',article_meta=essay)

page('contact/index.html','Contact Marcus Lefton | VYRTŪOSITI','Contact Marcus Lefton for private advisory and other enquiries.',f'<section class="page-hero wrap contact"><p class="eyebrow">Contact</p><h1>Start with<br><span>what matters.</span></h1><p class="lead">For private advisory, tell me the result you are working toward and what is getting in the way.</p>{button("Apply for the Intensive","/advisory/#apply")}<div class="contact-detail"><h2>Other enquiries</h2><a class="text-link" href="mailto:marcus@marcuslefton.com">marcus@marcuslefton.com</a><p>Based in Arizona. Working with clients remotely.</p></div></section>')
page('thankyou/index.html','Check your inbox | Mastery in Motion','Your subscription request has been received. Check your inbox for the next step.',f'<section class="confirmation wrap"><p class="eyebrow">Mastery in Motion</p><h1>Check your inbox.</h1><p class="lead">If you have just subscribed, look for an email from Marcus and confirm your address if prompted. Check spam or promotions if it has not arrived.</p><p>Already subscribed? You’ll continue receiving the Sunday letter.</p><div class="actions">{button("Read a field note","/mastery-in-motion/the-cost-of-compensation/")}{button("Return home","/","text-link")}</div><p class="small">Need help? <a href="mailto:marcus@marcuslefton.com">Email Marcus</a>.</p></section>',noindex=True)
page('application-received/index.html','Application received | Marcus Lefton','Your application has been received. Marcus will review it and reply by email.',f'<section class="confirmation wrap"><p class="eyebrow">Private advisory</p><h1>Thank you<br><span>for the context.</span></h1><p class="lead">If you have just submitted the application, it has been received. I’ll review it and reply by email about fit and next steps.</p><p>No payment has been taken. If the fit looks promising, we’ll arrange a complimentary 15-minute conversation.</p>{button("Explore the evidence","/evidence/")}<p class="small">Something to add? <a href="mailto:marcus@marcuslefton.com">marcus@marcuslefton.com</a>.</p></section>',noindex=True)
page('404.html','Page not found | Marcus Lefton','Find private advisory, evidence, and Mastery in Motion.',f'<section class="confirmation wrap"><p class="eyebrow">Page not found</p><h1>Let’s get you<br><span>to the right place.</span></h1><div class="actions">{button("Return home","/")}{button("Private advisory","/advisory/","text-link")}</div></section>',noindex=True)

# Preserve the existing legal wording; replace presentation and shared navigation only.
for name,title in [('privacy','Privacy Policy'),('terms-of-service','Terms of Service')]:
    source_path=ROOT/'tools'/f'{name}.source.html'
    if not source_path.exists():
        source_path.write_text((ROOT/name/'index.html').read_text())
    text=source_path.read_text()
    body=text.split('<div class="policy-container">',1)[1].split('<div class="footer-block',1)[0]
    body=re.sub(r'<div class="brand-mark[^>]*>.*?</div>','',body,flags=re.S)
    body=re.sub(r'\sstyle="[^"]*"','',body)
    body=body.replace('fade-up','')
    body=re.sub(r'(?m)^\s+$','',body)
    page(name+'/index.html',title+' | VYRTŪOSITI',title+' for VYRTŪOSITI LLC.',f'<article class="legal wrap">{body}</article>')

routes=['/','/advisory/','/evidence/','/mastery-in-motion/','/contact/','/privacy/','/terms-of-service/']
routes += [essay_url(e) for e in ESSAYS]
(ROOT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>{ORIGIN}{r}</loc></url>' for r in routes)+'</urlset>')
(ROOT/'robots.txt').write_text('User-agent: *\nAllow: /\nDisallow: /tools/\nDisallow: /docs/\nDisallow: /draft/\nSitemap: '+ORIGIN+'/sitemap.xml\n')
print('Generated primary, article, legal, contact, and confirmation pages.')
