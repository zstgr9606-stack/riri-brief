"""Apply the publication identity after each bot generates its daily HTML."""
from pathlib import Path
from shutil import copyfile
import json
import re
import sys

site = Path(sys.argv[1])
page = site / "index.html"
html = page.read_text(encoding="utf-8")
html = re.sub(r'<p class="page-foot">[^<]*</p>', "", html)

name = "ShaoYao Daily"
for size in (180, 512):
    icon = f"sy-navy-{size}.png"
    copyfile(Path(__file__).with_name(icon), site / icon)
manifest = {"id": "./", "start_url": "./", "scope": "./", "display": "standalone",
            "name": name, "short_name": name, "lang": "zh-CN",
            "theme_color": "#fbfaf7", "background_color": "#fbfaf7",
            "icons": [{"src": "./sy-navy-512.png", "sizes": "512x512", "type": "image/png"}]}
(site / "site.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False), encoding="utf-8")
head = f"""
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#fbfaf7">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="{name}">
<link rel="apple-touch-icon" sizes="180x180" href="./sy-navy-180.png">
<link rel="icon" type="image/png" href="./sy-navy-180.png">
<link rel="manifest" href="./site.webmanifest?v=navy">
<style>
.top h1::before, .mobile-masthead::before {{
  content:""; display:inline-block; vertical-align:-.1em; width:.94em; height:.94em;
  margin-right:.24em; border-radius:20%; background:#214c63 url('./sy-navy-180.png') center/cover;
}}
html:root {{
  color-scheme:light; --bg:#fbfaf7; --ink:#233344; --muted:#586572; --line:#dfe3e4;
  --rule:#abb4b8; --chip:#edf0ee; --accent:#294966;
  --green:var(--ink); --green-2:var(--rule); --warn:var(--chip); --warn-bar:var(--rule);
  background:var(--bg);
}}
html body, html body .wrap {{background:var(--bg); color:var(--ink)}}

@media (max-width:700px) {{
  html .wrap .mobile-masthead {{font-size:clamp(1.35rem,6.2vw,1.8rem);white-space:nowrap}}
  .wrap .m-bar {{gap:.35rem}}
  html .wrap .toolbar {{padding-top:2px}}
  #cols > .col:first-child {{margin-top:12px}}
}}
</style>"""
html, count = re.subn(r'<meta name="viewport"[^>]*>', lambda _: head, html, count=1)
if not count:
    raise ValueError("Viewport metadata missing in generated page")
html, titles = re.subn(r'<title>[^<]*</title>', "<title>" + name + "</title>", html, count=1)
html, headings = re.subn(r'<h1>[^<]*</h1>', "<h1>" + name + "</h1>", html, count=1)
if not titles or not headings:
    raise ValueError("Missing masthead or document title")
# Keep the publishing bot and archive URLs stable while updating its public name.
def update_columns(match):
    payload = json.loads(match[2])
    for column in payload.get("bots", []):
        if column["slug"] == "ai-tools":
            column["column"] = "Product Radar"
        elif column["slug"] == "creator-watch":
            column["column"] = "Creator Watch"
        cadence = {"ai-tools": "周一、周四", "new-ideas": "周三、周六"}.get(column["slug"])
        if cadence:
            column.update(cadence=cadence, cadenceFrom="2026-11-24")
    data = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).replace("<", r"\u003c")
    return match[1] + data + match[3]

html, payload_count = re.subn(r'(<script id="payload" type="application/json">)(.*?)(</script>)',
                              update_columns, html, count=1, flags=re.S)
if not payload_count:
    raise ValueError("Missing briefing payload")
# The generated reader normally fetches only that day's issue for a daily column.
html = html.replace("weekly = botBy[slug].weekly;", """weekly = botBy[slug].weekly ||
      (botBy[slug].cadenceFrom && date >= botBy[slug].cadenceFrom);""")
page.write_text(html, encoding="utf-8")


