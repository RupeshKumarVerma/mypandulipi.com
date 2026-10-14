/* Browser-level checks against the actual published-style catalogue.
 * Start: python -m http.server 8765
 * Then: node tools/test-sakhi.cjs (requires Playwright with Chromium)
 */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.SAKHI_BASE_URL || 'http://127.0.0.1:8765/';
const money = n => '₹' + n.toLocaleString('en-IN');
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_EXECUTABLE || undefined, args:['--no-sandbox','--disable-dev-shm-usage']});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base, {waitUntil:'domcontentloaded'});
    await page.locator('#ps-launch').click();
    const ask = async message => {
      await page.locator('#ps-input').fill(message);
      await page.locator('#ps-input').press('Enter');
      await page.locator('#ps-send:not([disabled])').waitFor();
      // Every navigational link inside Sakhi must go directly to WhatsApp.
      const links = await page.locator('#pandulipi-sakhi-root a').evaluateAll(nodes => nodes.map(a => ({href:a.href,target:a.target,rel:a.rel})));
      for (const link of links) {
        const url = new URL(link.href);
        assert.equal(url.origin,'https://wa.me');
        assert.equal(url.pathname,'/918982659046');
        assert.ok(url.searchParams.get('text'));
        assert.equal(link.target,'_blank');
        assert.ok(link.rel.includes('noopener'));
      }
      return await page.locator('.ps-bot').last().innerText();
    };
    const reset = () => page.locator('#ps-reset').click();
    await ask('Browse products');
    assert.equal(await page.locator('.ps-bot').last().locator('.ps-product').count(), 13);
    const singles = [['Hanuman Chalisa',99,249,149],['Durga Chalisa',99,249,149],['Shiv Chalisa',99,249,149],['Lakshmi Chalisa',99,249,149],['Surya Chalisa',99,249,149],['Krishna Chalisa',99,249,149],['Ganesh Chalisa',99,249,149],['BhagwatGeeta',649,1999,999],['Sundarkand',799,1999,1099],['Aarti Sangrah',99,299,149],['Bhaktamar Stotra',99,299,199],['Silver Hanuman Chalisa',999,2500,1100],['Silver Bhaktamar',1299,3000,1499]];
    for (const [name, price, mrp, regular] of singles) {
      const answer = await ask(name);
      assert.ok(answer.includes('Selling price: '+money(price)+' per piece'), name+' selling price');
      assert.ok(answer.includes('Regular price: '+money(regular)), name+' regular price');
      assert.ok(answer.includes('MRP: '+money(mrp)), name+' MRP');
    }
    const boundaryRates = [[1,99],[9,99],[10,99],[25,99],[26,99],[50,99],[51,99],[100,99],[101,99]];
    for (const [qty, rate] of boundaryRates) {
      const answer = await ask(qty+' Hanuman Chalisa');
      assert.ok(answer.includes(qty+' × '+money(rate)+' = '+money(qty*rate)), answer);
    }
    assert.ok((await ask('10 Silver Hanuman Chalisa')).includes('10 × ₹999 = ₹9,990'));
    assert.ok((await ask('11 Silver Hanuman Chalisa')).includes('11 × ₹999 = ₹10,989'));
    assert.ok((await ask('10 Silver Bhaktamar')).includes('10 × ₹1,299 = ₹12,990'));
    assert.ok((await ask('11 Silver Bhaktamar')).includes('11 × ₹1,199 = ₹13,189'));
    assert.ok((await ask('26 Geeta')).includes('26 × ₹649 = ₹16,874'));
    for (const query of ['festive offer', 'offers', 'त्योहारी ऑफर']) {
      const festive = await ask(query);
      assert.ok(festive.includes('₹99') && festive.includes('₹799') && festive.includes('₹649') && festive.includes('₹999') && festive.includes('₹1,299'), query);
      assert.ok(!festive.includes('₹899'), 'Generic festive enquiry must not be limited to the Navratri combo');
    }
    await ask('English');
    assert.ok((await ask('10 Durga Chalisa')).includes('combo product total is ₹899'));
    assert.ok((await ask('Navratri offer')).includes('Save ₹591'));
    let wa = new URL(await page.locator('#ps-whatsapp').getAttribute('href'));
    assert.equal(wa.hostname,'wa.me'); assert.equal(wa.pathname,'/918982659046');
    assert.ok(wa.searchParams.get('text').includes('Quantity: 10'));
    assert.ok(wa.searchParams.get('text').includes('Navratri'));
    await reset(); await ask('10 Bhaktamar Stotra');
    const bhaktamarLink = await page.locator('.ps-inline-link').last().getAttribute('href');
    let prefill = new URL(bhaktamarLink).searchParams.get('text');
    assert.ok(prefill.includes('Product: Bhaktamar Stotra') && prefill.includes('Quantity: 10'));
    assert.equal(await page.locator('#ps-quick a').getAttribute('href'), bhaktamarLink, 'Order suggestion goes directly to the same WhatsApp enquiry');
    await ask('Sundarkand');
    assert.equal(await page.locator('.ps-inline-link').first().getAttribute('href'), bhaktamarLink, 'Older response keeps its own product and quantity');
    await ask('delivery');
    prefill = new URL(await page.locator('#ps-whatsapp').getAttribute('href')).searchParams.get('text');
    assert.ok(prefill.includes('Product: Sundarkand Pandulipi') && prefill.includes('Enquiry: delivery'));
    await reset(); await ask('25 copies');
    assert.ok((await ask('Bhaktamar Stotra')).includes('25 × ₹99 = ₹2,475'), 'Quantity-first follow-up');
    await reset(); await ask('Gift suggestions');
    assert.ok((await ask('Corporate gifting')).includes('budget per gift'));
    await ask('200');
    assert.equal(await page.locator('.ps-bot').last().locator('.ps-product').count(),9,'Budget follow-up is not a quantity');
    await ask('Hanuman Chalisa'); await ask('10 copies');
    wa = new URL(await page.locator('#ps-whatsapp').getAttribute('href'));
    assert.ok(wa.searchParams.get('text').includes('Purpose: Corporate gifting'));
    assert.ok((await ask('yes')).includes('WhatsApp'));
    assert.ok((await ask('0 pieces')).includes('whole-number'));
    assert.ok((await ask('1.5 copies')).includes('whole-number'));
    assert.ok((await ask('Large Aarti Sangrah')).includes('exact edition'));
    assert.ok(!(await page.locator('.ps-bot').last().innerText()).includes('₹99'));
    assert.ok((await ask('Delivery')).includes('free within Indore'));
    assert.ok((await ask('Cash on delivery')).includes('payment options'));
    assert.ok((await ask('return policy')).includes('confirmed return policy'));
    assert.ok((await ask('हिंदी')).includes('पांडुलिपि सखी'));
    assert.ok((await ask('१० हनुमान चालीसा')).includes('10 × ₹99 = ₹990'));
    await ask('English');
    assert.ok((await ask('the weather tomorrow')).includes('don’t have a confirmed answer'));
    await ask('<img src=x onerror="window.sakhiXss=1">');
    assert.equal(await page.evaluate(()=>window.sakhiXss),undefined);
    assert.equal(await page.locator('.ps-user').last().locator('img').count(),0);
    await page.locator('#ps-input').press('Escape');
    assert.ok(await page.locator('#ps-panel').isHidden());
    assert.equal(await page.evaluate(()=>document.activeElement.id),'ps-launch');
    for (const [width,height] of [[1440,1000],[390,844],[320,568]]) {
      await page.setViewportSize({width,height});
      const [launch,whatsapp] = await Promise.all([page.locator('#ps-launch').boundingBox(),page.locator('.fab').boundingBox()]);
      assert.ok(whatsapp.x+whatsapp.width<=launch.x || launch.x+launch.width<=whatsapp.x,'Floating controls overlap');
      await page.locator('#ps-launch').click();
      const panel = await page.locator('#ps-panel').boundingBox();
      const input = await page.locator('#ps-input').boundingBox();
      assert.ok(panel.x>=0 && panel.y>=0 && panel.x+panel.width<=width && panel.y+panel.height<=height,'Panel exceeds viewport');
      assert.ok(input.y+input.height<=panel.y+panel.height, 'Input clipped');
      if (process.env.SAKHI_SCREENSHOT_DIR) {
        await reset(); await ask('Hanuman Chalisa');
        await page.screenshot({path:process.env.SAKHI_SCREENSHOT_DIR+'/sakhi-'+width+'.png'});
      }
      await page.locator('#ps-close').click();
    }
    for (const path of ['bulk.html','blog.html','who-we-are.html']) {
      await page.goto(new URL(path,base).href,{waitUntil:'domcontentloaded'});
      await page.locator('#ps-launch').click();
      assert.ok((await ask('Sundarkand')).includes('Selling price: ₹799 per piece'), path);
    }
    // An unavailable catalogue must never produce an invented price.
    await page.route('**/index.html',route=>route.abort());
    await page.route('**/bulk.html',route=>route.abort());
    await page.goto(new URL('blog.html',base).href,{waitUntil:'domcontentloaded'});
    await page.locator('#ps-launch').click();
    assert.ok((await ask('Browse products')).includes('couldn’t load the catalogue'));
    assert.ok((await page.locator('#ps-whatsapp').getAttribute('href')).startsWith('https://wa.me/918982659046'));
    assert.deepEqual(errors,[]);
    console.log('PASS: catalogue, prices, tiers, offer, Hindi, follow-ups, WhatsApp, input safety, mobile, keyboard, page integration and network failure.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
