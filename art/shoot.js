const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: 1 });
  await p.goto('file://' + __dirname + '/art.html'); await p.evaluate(() => document.fonts.ready);
  for (const [id, w, h] of JSON.parse(process.argv[2])) {
    await p.evaluate(id => { document.querySelectorAll('.s').forEach(e => e.style.display = 'none'); document.getElementById(id).style.display = 'block'; }, id);
    await p.setViewportSize({ width: w, height: h });
    await p.screenshot({ path: __dirname + '/' + id + '.png', omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
  }
  await b.close();
})();
