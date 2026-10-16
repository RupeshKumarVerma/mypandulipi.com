/* Browser-level checks against the actual published-style catalogue.
 * Start: python -m http.server 8765
 * Then: node tools/test-sakhi.cjs (requires Playwright with Chromium)
 */
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.SAKHI_BASE_URL || 'http://127.0.0.1:8765/';
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_EXECUTABLE || undefined, args:['--no-sandbox','--disable-dev-shm-usage']});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}, reducedMotion:'reduce'});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base, {waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('#collection .feature, #collection .scard:not(.scard--more)').count(), 13);
    assert.equal(await page.locator('.price, .price-bulk, #bulk-pricing-data').count(), 0);
    assert.ok(!/₹|MRP|Selling price/.test(await page.locator('body').innerText()));
    assert.equal(await page.locator('#special-offer img').getAttribute('src'), 'assets/durga-chalisa.jpg');
    const graph = await page.locator('script[type="application/ld+json"]').evaluate(n => JSON.parse(n.textContent)['@graph']);
    assert.ok(graph.filter(p => p['@type'] === 'Product').every(p => !p.offers));
    const offerLink = new URL(await page.locator('.offer-order').getAttribute('href'));
    assert.ok(!/₹|Rs\s*\d|INR\s*\d/i.test(offerLink.searchParams.get('text')));
    await page.locator('#ps-launch').click();
    const ask = async message => {
      await page.locator('#ps-input').fill(message);
      await page.locator('#ps-input').press('Enter');
      await page.locator('#ps-send:not([disabled])').waitFor();
      // Every navigational link inside Meera must go directly to WhatsApp.
      const links = await page.locator('#pandulipi-sakhi-root a').evaluateAll(nodes => nodes.map(a => ({href:a.href,target:a.target,rel:a.rel})));
      for (const link of links) {
        const url = new URL(link.href);
        assert.equal(url.origin,'https://wa.me');
        assert.equal(url.pathname,'/918982659046');
        assert.ok(url.searchParams.get('text'));
        assert.equal(link.target,'_blank');
        assert.ok(link.rel.includes('noopener'));
      }
      const answer = await page.locator('.ps-bot').last().innerText();
      assert.ok(!/₹|MRP|Selling price|Regular price|\d[\d,]*% off|Rs\.?\s*\d/.test(answer), 'Meera must not quote a product price: '+answer);
      return answer;
    };
    const reset = () => page.locator('#ps-reset').click();
    await ask('Browse products');
    assert.equal(await page.locator('.ps-bot').last().locator('.ps-product').count(), 13);
    const singles = ['Hanuman Chalisa','Durga Chalisa','Shiv Chalisa','Lakshmi Chalisa','Surya Chalisa','Krishna Chalisa','Ganesh Chalisa','BhagwatGeeta','Sundarkand','Aarti Sangrah','Bhaktamar Stotra','Silver Hanuman Chalisa','Silver Bhaktamar'];
    for (const name of singles) {
      const answer = await ask(name);
      assert.ok(answer.includes('For current pricing and availability'), name+' enquiry');
      assert.ok(answer.includes('How many copies'), name+' quantity follow-up');
    }
    for (const query of ['10 Hanuman Chalisa', '11 Silver Bhaktamar', '26 Geeta']) {
      assert.ok((await ask(query)).includes('Quantity: '+query.split(' ')[0]), query);
    }
    for (const query of ['festive offer', 'offers', 'त्योहारी ऑफर']) {
      assert.ok((await ask(query)).includes('WhatsApp'), query);
    }
    await ask('English');
    assert.ok((await ask('10 Durga Chalisa')).includes('Quantity: 10'));
    assert.ok((await ask('Navratri offer')).includes('10 Durga Chalisa'));
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
    assert.ok((await ask('Bhaktamar Stotra')).includes('Quantity: 25'), 'Quantity-first follow-up');
    await reset(); await ask('Gift suggestions');
    assert.ok((await ask('Corporate gifting')).includes('budget per gift'));
    await ask('200');
    assert.ok((await page.locator('.ps-bot').last().innerText()).includes('include your budget'));
    assert.ok(!new URL(await page.locator('#ps-whatsapp').getAttribute('href')).searchParams.get('text').includes('Quantity: 200'));
    await ask('Hanuman Chalisa'); await ask('10 copies');
    wa = new URL(await page.locator('#ps-whatsapp').getAttribute('href'));
    assert.ok(wa.searchParams.get('text').includes('Purpose: Corporate gifting'));
    assert.ok(wa.searchParams.get('text').includes('Customer budget per gift (INR): 200'));
    assert.ok((await ask('yes')).includes('WhatsApp'));
    assert.ok((await ask('0 pieces')).includes('whole-number'));
    assert.ok((await ask('1.5 copies')).includes('whole-number'));
    assert.ok((await ask('Large Aarti Sangrah')).includes('exact edition'));
    assert.ok(!(await page.locator('.ps-bot').last().innerText()).includes('₹99'));
    assert.ok((await ask('Delivery')).includes('free within Indore'));
    assert.ok((await ask('Cash on delivery')).includes('payment options'));
    assert.ok((await ask('return policy')).includes('confirmed return policy'));
    assert.ok((await ask('हिंदी')).includes('मीरा'));
    assert.ok((await ask('१० हनुमान चालीसा')).includes('मात्रा: 10'));
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
      assert.equal(await page.locator('.price, .plist, #bulk-pricing-data').count(), 0);
      assert.ok(!/₹|MRP|Selling price/.test(await page.locator('body').innerText()),path);
      await page.locator('#ps-launch').click();
      assert.ok((await ask('Sundarkand')).includes('For current pricing and availability'), path);
    }
    // An unavailable catalogue must never produce an invented price.
    await page.route('**/index.html',route=>route.abort());
    await page.route('**/bulk.html',route=>route.abort());
    await page.goto(new URL('blog.html',base).href,{waitUntil:'domcontentloaded'});
    await page.locator('#ps-launch').click();
    assert.ok((await ask('Browse products')).includes('couldn’t load the catalogue'));
    assert.ok((await page.locator('#ps-whatsapp').getAttribute('href')).startsWith('https://wa.me/918982659046'));
    assert.deepEqual(errors,[]);
    console.log('PASS: price-free catalogue, offer enquiries, Hindi, follow-ups, WhatsApp, input safety, mobile, keyboard, page integration and network failure.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
