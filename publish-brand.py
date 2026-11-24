"""Apply the publication identity after each bot generates its daily HTML."""
from pathlib import Path
from shutil import copyfile
import json
import re
import sys

site = Path(sys.argv[1])
page = site / "index.html"
html = page.read_text(encoding="utf-8")

name = "ShaoYao Daily"
short_name = "芍药日报"
for size in (180, 512):
    icon = f"sy-monogram-{size}.png"
    copyfile(Path(__file__).with_name(icon), site / icon)
manifest = {"id": "./", "start_url": "./", "scope": "./", "display": "standalone",
            "name": name + " · " + short_name, "short_name": short_name, "lang": "zh-CN",
            "theme_color": "#faf9f6", "background_color": "#faf9f6",
            "icons": [{"src": "./sy-monogram-512.png", "sizes": "512x512", "type": "image/png"}]}
(site / "site.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False), encoding="utf-8")
head = f"""
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#faf9f6">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="{short_name}">
<link rel="apple-touch-icon" sizes="180x180" href="./sy-monogram-180.png">
<link rel="icon" type="image/png" href="./sy-monogram-180.png">
<link rel="manifest" href="./site.webmanifest">
<style>
.top h1::before, .mobile-masthead::before {{
  content:""; display:inline-block; vertical-align:-.1em; width:.94em; height:.94em;
  margin-right:.24em; border-radius:20%; background:#460c25 url('./sy-monogram-180.png') center/cover;
}}
html:root {{
  color-scheme:light; --bg:#faf9f6; --ink:#252321; --muted:#625e59; --line:#e4e0da;
  --rule:#b8b1aa; --chip:#efede8; --accent:#651c35;
  --green:var(--ink); --green-2:var(--rule); --warn:var(--chip); --warn-bar:var(--rule);
  background:var(--bg);
}}
html body, html body .wrap {{background:var(--bg); color:var(--ink)}}

@media (max-width:700px) {{
  html .wrap .mobile-masthead {{font-size:clamp(1.35rem,6.2vw,1.8rem);white-space:nowrap}}
  .wrap .m-bar {{gap:.35rem}}
  html .wrap .toolbar {{padding-top:8px}}
  html.home-screen .wrap .toolbar {{padding-top:36px}}
  html.home-screen .wrap {{padding-top:env(safe-area-inset-top,0px)}}
}}
@media (max-width:700px) and (display-mode:standalone) {{
  html body .wrap .toolbar {{padding-top:36px}}
}}
</style>"""
html, count = re.subn(r'<meta name="viewport"[^>]*>', lambda _: head, html, count=1)
if not count:
    raise ValueError("Viewport metadata missing in generated page")
html, titles = re.subn(r'<title>[^<]*</title>', "<title>" + name + " · " + short_name + "</title>", html, count=1)
html, headings = re.subn(r'<h1>[^<]*</h1>', "<h1>" + name + "</h1>", html, count=1)
if not titles or not headings:
    raise ValueError("Missing masthead or document title")
page.write_text(html, encoding="utf-8")


