const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Log console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  console.log('Navigating to reports.php...');
  await page.goto('http://localhost/jgc_constructions/reports.php', { waitUntil: 'networkidle0' });

  // Get active classes and dimensions before click
  let modalActiveBefore = await page.evaluate(() => {
    const modal = document.getElementById('customReportModal');
    return modal ? {
      classes: modal.className,
      display: window.getComputedStyle(modal).display,
      zIndex: window.getComputedStyle(modal).zIndex,
      offsetWidth: modal.offsetWidth,
      offsetHeight: modal.offsetHeight
    } : null;
  });
  console.log('Custom Modal Before Click:', modalActiveBefore);

  console.log('Clicking Custom Report Builder button...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Custom Report Builder'));
    if (btn) btn.click();
    else console.log('Button not found!');
  });

  // Wait a bit
  await new Promise(r => setTimeout(r, 500));

  let modalActiveAfter = await page.evaluate(() => {
    const modal = document.getElementById('customReportModal');
    return modal ? {
      classes: modal.className,
      display: window.getComputedStyle(modal).display,
      zIndex: window.getComputedStyle(modal).zIndex,
      offsetWidth: modal.offsetWidth,
      offsetHeight: modal.offsetHeight
    } : null;
  });
  console.log('Custom Modal After Click:', modalActiveAfter);

  await browser.close();
})();
