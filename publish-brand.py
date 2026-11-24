"""Apply the publication identity after each bot generates its daily HTML."""
from pathlib import Path
import json
import re
import sys

site = Path(sys.argv[1])
page = site / "index.html"
html = page.read_text(encoding="utf-8")

name = "ShaoYao Daily"
short_name = "芍药日报"
manifest = {"id": "./", "start_url": "./", "scope": "./", "display": "standalone",
            "name": name + " · " + short_name, "short_name": short_name, "lang": "zh-CN",
            "theme_color": "#11493e", "background_color": "#11493e"}
(site / "site.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False), encoding="utf-8")
head = f"""
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#11493e">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="apple-mobile-web-app-title" content="{short_name}">
<link rel="manifest" href="./site.webmanifest">
<style>
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

