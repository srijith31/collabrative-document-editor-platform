const { chromium } = require('playwright');

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:5173/login');
    
    console.log('Filling credentials...');
    await page.fill('label:has-text("Email Address") + div input, input[type="text"], input[type="email"]', 'tester515014@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    console.log('Submitting login form...');
    await Promise.all([
      page.click('button:has-text("Sign In")'),
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 })
    ]);
    
    console.log('Navigating to document page...');
    await page.goto('http://localhost:5173/document/6a33ec01a64221b58f88bc45', { waitUntil: 'networkidle', timeout: 15000 });
  } catch (err) {
    console.error('Error during navigation/login:', err);
  }

  console.log('Waiting 5 seconds for page updates...');
  await page.waitForTimeout(5000);

  // Scroll down the correct container
  console.log('Scrolling down the correct preview scroll container...');
  const scrollResult = await page.evaluate(() => {
    const paper = document.querySelector('.college-report-editor-paper');
    if (!paper) return { error: 'No paper element found' };
    const container = paper.parentElement.parentElement;
    if (!container) return { error: 'No parent-parent container found' };
    
    const oldScrollTop = container.scrollTop;
    container.scrollTop = 800; // scroll down
    return {
      oldScrollTop,
      newScrollTop: container.scrollTop,
      containerTag: container.tagName,
      containerClass: container.className,
      containerScrollHeight: container.scrollHeight,
      containerClientHeight: container.clientHeight
    };
  });

  console.log('Scroll Result:', JSON.stringify(scrollResult, null, 2));

  console.log('Waiting 2 seconds...');
  await page.waitForTimeout(2000);

  const screenshotPath = '/Users/srijithsharma/.gemini/antigravity-ide/brain/e08f77c0-a052-43e2-8a88-aa5d79df44cd/scratch_preview_scrolled.png';
  console.log(`Taking scrolled screenshot: ${screenshotPath}`);
  await page.screenshot({ path: screenshotPath });

  console.log('Closing browser...');
  await browser.close();
}

main().catch(err => {
  console.error('Unhandled error in script:', err);
});
