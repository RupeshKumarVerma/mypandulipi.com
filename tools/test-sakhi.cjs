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
    const singles = [['Hanuman Chalisa',149,249],['BhagwatGeeta',999,1999],['Sundarkand',1099,1999],['Aarti Sangrah',149,299],['Bhaktamar Stotra',199,299],['Silver Hanuman Chalisa',1100,2500],['Silver Bhaktamar',1499,3000]];
    for (const [name, price, mrp] of singles) {
      const answer = await ask(name);
      assert.ok(answer.includes('Selling price: '+money(price)+' per piece'), name+' selling price');
      assert.ok(answer.includes('MRP: '+money(mrp)), name+' MRP');
    }
    const boundaryRates = [[1,149],[4,149],[5,110],[9,110],[10,110],[25,110],[26,110],[50,110],[51,110],[100,110],[101,110]];
    for (const [qty, rate] of boundaryRates) {
      const answer = await ask(qty+' Hanuman Chalisa');
      assert.ok(answer.includes(qty+' × '+money(rate)+' = '+money(qty*rate)), answer);
    }
    assert.ok((await ask('10 Silver Hanuman Chalisa')).includes('10 × ₹699 = ₹6,990'));
    assert.ok((await ask('11 Silver Hanuman Chalisa')).includes('11 × ₹699 = ₹7,689'));
    assert.ok((await ask('26 Geeta')).includes('26 × ₹649 = ₹16,874'));
    assert.ok((await ask('10 Durga Chalisa')).includes('combo product total is ₹899'));
    assert.ok((await ask('Navratri offer')).includes('Save ₹591'));
    let wa = new URL(await page.locator('#ps-whatsapp').getAttribute('href'));
    assert.equal(wa.hostname,'wa.me'); assert.equal(wa.pathname,'/918982659046');
    assert.ok(wa.searchParams.get('text').includes('Quantity: 10'));
    assert.ok(wa.searchParams.get('text').includes('Navratri'));
    assert.ok(wa.searchParams.get('text').includes('₹899'));
    assert.ok(!wa.searchParams.get('text').includes('₹1,100'));
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
    assert.ok((await ask('Bhaktamar Stotra')).includes('25 × ₹110 = ₹2,750'), 'Quantity-first follow-up');
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
    assert.ok((await ask('Large Aarti Sangrah')).includes('Festive offer: ₹599 per piece'));
    assert.ok(!(await page.locator('.ps-bot').last().innerText()).includes('₹149'));
    assert.ok((await ask('Delivery')).includes('free within Indore'));
    assert.ok((await ask('Cash on delivery')).includes('payment options'));
    assert.ok((await ask('return policy')).includes('confirmed return policy'));
    assert.ok((await ask('हिंदी')).includes('पांडुलिपि सखी'));
    assert.ok((await ask('१० हनुमान चालीसा')).includes('10 × ₹110 = ₹1,100'));
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
      assert.ok((await ask('Sundarkand')).includes('Selling price: ₹1,099 per piece'), path);
    }
    // Source-image prices, edition routing and the five-piece offer boundary.
    await reset();
    let answer = await ask('Festive offers');
    assert.ok(answer.includes('Minimum order: 5 pieces'));
    assert.equal(await page.locator('.ps-bot').last().locator('.ps-product').count(),8);
    await page.locator('.ps-bot').last().getByRole('button',{name:/Sundarkand Pandulipi — Regular/}).click();
    await page.locator('#ps-send:not([disabled])').waitFor();
    assert.ok((await page.locator('.ps-bot').last().innerText()).includes('Festive offer: ₹499 per piece'));
    answer = await ask('4 copies');
    assert.ok(answer.includes('below the festive minimum'));
    assert.ok(!answer.includes('4 ×'));
    answer = await ask('5 copies');
    assert.ok(answer.includes('5 × ₹499 = ₹2,495'));
    prefill = new URL(await page.locator('#ps-whatsapp').getAttribute('href')).searchParams.get('text');
    assert.ok(prefill.includes('Minimum') || prefill.includes('minimum order 5'));
    assert.ok(prefill.includes('₹2,495'));
    for (const [name,rate] of [['Hanuman Chalisa Sanskaran',599],['Large Aarti Sangrah',599],['premium Sundarkand',799],['Shri Ramcharitmanas Set',799],['Bajrang Baan',110],['mini Bhaktamar Stotra',110],['mini Aarti Sangrah',110],['Geeta festive offer',649],['Silver Hanuman festive offer',699]]) {
      await reset();
      answer = await ask('5 '+name);
      assert.ok(answer.includes('5 × '+money(rate)+' = '+money(5*rate)), name+': '+answer);
      assert.ok(answer.includes('Minimum order: 5 pieces'),name+' minimum');
    }
    await reset(); answer = await ask('festive Sundarkand');
    assert.equal(await page.locator('.ps-bot').last().locator('.ps-product').count(),2,'Both Sundarkand editions are offered');
    await reset(); answer = await ask('festive Aarti Sangrah');
    assert.equal(await page.locator('.ps-bot').last().locator('.ps-product').count(),2,'Mini and large Aarti stay distinct');
    await reset(); answer = await ask('Silver Bhaktamar festive offer');
    assert.ok(answer.includes('don’t have a published festive rate'));
    await reset(); answer = await ask('5 mini Geeta');
    assert.ok(answer.includes('don’t have a published festive rate'));
    assert.ok(!answer.includes('₹110'));
    await reset(); answer = await ask('५ हनुमान चालीसा');
    assert.ok(answer.includes('5 × ₹110 = ₹550'));
    assert.ok(answer.includes('न्यूनतम ऑर्डर: 5'));
    await page.goto(base,{waitUntil:'domcontentloaded'});
    const expectedFestive = [['mini',149,110],['sundarkand-regular',699,499],['hanuman-sanskaran',949,599],['aarti-large',949,599],['gita',999,649],['silver-hanuman',999,699],['sundarkand-premium',1099,799],['ramcharitmanas',1099,799]];
    for (const [id,regular,price] of expectedFestive) {
      const row = page.locator('[data-festive-id="'+id+'"]');
      assert.equal(await row.locator('.festive-regular').innerText(),money(regular));
      assert.equal(await row.locator('.festive-price').innerText(),money(price));
      assert.ok((await row.innerText()).includes('Save '+money(regular-price)));
      const url = new URL(await row.locator('a').getAttribute('href'));
      assert.equal(url.origin,'https://wa.me');
      assert.equal(url.pathname,'/918982659046');
      assert.ok(url.searchParams.get('text').includes('Minimum order: 5 pieces'));
    }
    for (const [width,height] of [[1440,1100],[390,844],[320,568]]) {
      await page.setViewportSize({width,height});
      const box = await page.locator('#festive-offer').boundingBox();
      assert.ok(box.x>=0 && box.x+box.width<=width,'Festive section exceeds viewport');
      for (const cell of await page.locator('.festive-table td,.festive-table th[scope="row"]').all()) {
        const bounds = await cell.boundingBox();
        assert.ok(bounds.x>=0 && bounds.x+bounds.width<=width,'Festive table overflows');
      }
      if(process.env.SAKHI_SCREENSHOT_DIR) await page.locator('#festive-offer').screenshot({path:process.env.SAKHI_SCREENSHOT_DIR+'/festive-'+width+'.png'});
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
