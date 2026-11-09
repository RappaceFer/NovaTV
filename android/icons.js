// NovaTV — © 2026 Rappace — Logiciel libre sous licence MIT
const { chromium } = require('playwright');
const fs = require('fs');
const font = f => 'data:font/otf;base64,' + fs.readFileSync('/home/claude/novatv/www/fonts/' + f).toString('base64');
const css = `@font-face{font-family:D;src:url(${font('InterDisplay-ExtraBold.otf')})}@font-face{font-family:I;src:url(${font('Inter-SemiBold.otf')})}
*{margin:0}html,body{background:transparent}`;
const grad = '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5f8dff"/><stop offset="1" stop-color="#b16cff"/></linearGradient>';
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192"><defs>${grad}
<radialGradient id="h" cx=".3" cy=".2" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
<rect x="8" y="8" width="176" height="176" rx="44" fill="url(#g)"/><rect x="8" y="8" width="176" height="176" rx="44" fill="url(#h)"/>
<ellipse cx="96" cy="100" rx="74" ry="28" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="5" transform="rotate(-16 96 100)"/>
<text x="96" y="132" text-anchor="middle" font-family="D" font-size="104" fill="#fff" transform="skewX(-8) translate(14 0)">N</text>
<path d="M150 38l3.6 9.4 9.4 3.6-9.4 3.6-3.6 9.4-3.6-9.4-9.4-3.6 9.4-3.6z" fill="#fff"/></svg>`;
const banner = `<div style="width:1280px;height:720px;position:relative;overflow:hidden;background:radial-gradient(900px 500px at 78% 10%,#1d3a9a 0%,transparent 60%),radial-gradient(700px 420px at 10% 110%,#5a2a8a 0%,transparent 60%),linear-gradient(135deg,#050718,#0a1238 60%,#1a0f33)">
<svg width="1280" height="720" style="position:absolute;inset:0"><defs>${grad}</defs>
<g fill="#c8d8ff" opacity=".6"><circle cx="90" cy="70" r="2.5"/><circle cx="300" cy="140" r="2"/><circle cx="1150" cy="90" r="3"/><circle cx="980" cy="620" r="2"/><circle cx="160" cy="600" r="2"/><circle cx="1210" cy="420" r="2"/><circle cx="640" cy="60" r="2"/></g>
<ellipse cx="660" cy="370" rx="560" ry="120" fill="none" stroke="url(#g)" stroke-width="9" transform="rotate(-9 660 370)"/>
<text x="150" y="455" font-family="D" font-size="250" letter-spacing="-6" fill="#fff" transform="skewX(-10) translate(70 0)">Nova<tspan fill="url(#g)">TV</tspan></text>
<path d="M1160 160l11 28 28 11-28 11-11 28-11-28-28-11 28-11z" fill="#fff"/></svg></div>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setViewportSize({ width: 192, height: 192 });
  await p.setContent(`<style>${css}</style>${icon}`); await p.waitForTimeout(300);
  await p.screenshot({ path: 'icon.png', omitBackground: true });
  await p.setViewportSize({ width: 1280, height: 720 });
  await p.setContent(`<style>${css}</style>${banner}`); await p.waitForTimeout(300);
  await p.screenshot({ path: 'banner.png' });
  fs.writeFileSync('mark.svg', icon);
  await b.close();
})();
