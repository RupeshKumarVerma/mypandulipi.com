/* Pandulipi Sakhi: catalogue-grounded storefront guide.
 * Prices are read from the published product cards and bulk table, not copied here.
 * No external AI service, API key, chat storage or automatic WhatsApp sending.
 */
(() => {
  'use strict';
  if (document.getElementById('pandulipi-sakhi-root')) return;
  const script = document.currentScript;
  const base = new URL('.', script.src);
  const site = path => new URL(path, base).href;
  const phone = '918982659046';
  const money = n => '₹' + Number(n).toLocaleString('en-IN');
  const text = node => node ? node.textContent.replace(/\s+/g, ' ').trim() : '';
  const amount = node => { const n = text(node).match(/[\d,]+/); return n ? Number(n[0].replace(/,/g, '')) : null; };
  const norm = value => String(value).toLowerCase().normalize('NFKC').replace(/[०-९]/g, d => '०१२३४५६७८९'.indexOf(d)).replace(/[’']/g, '').replace(/\s+/g, ' ').trim();
  const has = (q, words) => words.some(w => /[\u0900-\u097f]/.test(w) ? q.includes(w) : new RegExp('(^|[^a-z])' + w + '([^a-z]|$)').test(q));
  const aliases = {
    sundarkand: ['sundarkand', 'sunderkand', 'sundar kand', 'sunder kand', 'सुंदरकांड', 'सुन्दरकाण्ड', 'सुन्दरकांड', 'सुंदरकाण्ड'],
    gita: ['gita', 'geeta', 'bhagwatgeeta', 'shrimadbhagwatgeeta', 'shrimadbhagwadgeeta', 'bhagwadgeeta', 'bhagavadgita', 'bhagwadgita', 'bhagwat geeta', 'bhagavad gita', 'गीता'],
    hanuman: ['hanuman', 'hanumaan', 'hanumna', 'bajrang', 'हनुमान', 'हनुमत'],
    durga: ['durga', 'दुर्गा'], shiv: ['shiv', 'shiva', 'mahadev', 'शिव', 'महादेव'],
    krishna: ['krishna', 'krishn', 'krishan', 'कृष्ण'], lakshmi: ['lakshmi', 'laxmi', 'लक्ष्मी'],
    ganesh: ['ganesh', 'ganesha', 'ganpati', 'गणेश', 'गणपति'], surya: ['surya', 'सूर्य'],
    aarti: ['aarti', 'arti', 'aarati', 'आरती'], bhaktamar: ['bhaktamar', 'bhaktambar', 'bhaktambhar', 'भक्तामर', 'भक्ताम्बर']
  };
  const state = { products: [], tiers: {}, offer: null, loaded: false, loading: null, selected: null, quantity: null, awaiting: null, purpose: '', hindi: false, busy: false };
  const say = (en, hi) => state.hindi && hi ? hi : en;
  const wa = message => 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
  function enquiry() {
    let message = 'Radhe Radhe! I came through Pandulipi Sakhi on MyPandulipi.com.';
    if (state.selected) message += '\nProduct: ' + state.selected.name;
    if (state.quantity) message += '\nQuantity: ' + state.quantity;
    if (state.purpose) message += '\nPurpose: ' + state.purpose;
    if (state.selected && state.offer && state.selected.family === 'durga' && state.quantity === state.offer.quantity) message += '\nPlease check the ' + state.offer.coupon + ' combo offer.';
    return message + '\nPlease confirm availability, final pricing and delivery charges.';
  }
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = site('pandulipi-sakhi.css?v=2'); document.head.append(css);
  const root = document.createElement('div'); root.id = 'pandulipi-sakhi-root';
  root.innerHTML = `
    <button id="ps-launch" type="button" aria-expanded="false" aria-controls="ps-panel" aria-label="Open Pandulipi Sakhi shopping assistant">
      <span class="ps-avatar" aria-hidden="true"><img src="${site('assets/nav-logo12.png')}" alt=""></span>
      <span><strong>Ask Sakhi</strong><small>Your gifting companion</small></span><span class="ps-spark" aria-hidden="true">✦</span>
    </button>
    <section id="ps-panel" role="dialog" aria-labelledby="ps-title" hidden>
      <header id="ps-head"><span class="ps-avatar" aria-hidden="true"><img src="${site('assets/nav-logo12.png')}" alt=""></span><div><h2 id="ps-title">Pandulipi Sakhi</h2><p>पांडुलिपि सखी · Product & gifting guide</p></div><button id="ps-close" type="button" aria-label="Close Sakhi">×</button></header>
      <div class="ps-toolbar"><span>Rooted in devotion. Here to help.</span><button id="ps-language" type="button" aria-label="Switch to Hindi">हिन्दी</button><button id="ps-reset" type="button" aria-label="Start a new conversation">↺</button></div>
      <div id="ps-messages" role="log" aria-label="Conversation with Sakhi" aria-live="polite" aria-relevant="additions"></div>
      <div id="ps-quick" aria-label="Suggested questions"></div>
      <a id="ps-whatsapp" target="_blank" rel="noopener noreferrer">Continue on WhatsApp <span aria-hidden="true">↗</span></a>
      <form id="ps-form"><label class="ps-sr" for="ps-input">Ask about a product, price or gift</label><input id="ps-input" type="text" placeholder="Ask about a product or price…" autocomplete="off" maxlength="500" required><button id="ps-send" type="submit" aria-label="Send message"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m4 4 17 8-17 8 3-8-3-8Z"/><path d="M7 12h14"/></svg></button></form>
      <p class="ps-disclaimer">Automated guide · Final orders confirmed on WhatsApp</p>
    </section>`;
  document.body.append(root); document.body.classList.add('sakhi-ready');
  const $ = id => root.querySelector('#' + id);
  function refreshLink() { $('ps-whatsapp').href = wa(enquiry()); }
  function add(message, who = 'bot') {
    const bubble = document.createElement('div'); bubble.className = 'ps-bubble ps-' + who;
    if (message) { const p = document.createElement('p'); p.textContent = message; bubble.append(p); }
    $('ps-messages').append(bubble);
    while ($('ps-messages').children.length > 60) $('ps-messages').firstElementChild.remove();
    return bubble;
  }
  function scroll() { $('ps-messages').scrollTop = $('ps-messages').scrollHeight; refreshLink(); }
  function chips(items) {
    $('ps-quick').replaceChildren();
    items.forEach(item => { const b = document.createElement('button'); b.type = 'button'; b.textContent = item; b.addEventListener('click', () => send(item)); $('ps-quick').append(b); });
  }
  function homeChips() { chips(state.hindi ? ['उत्पाद देखें', 'उपहार सुझाव', 'थोक ऑर्डर', 'डिलीवरी'] : ['Browse products', 'Gift suggestions', 'Bulk order', 'Delivery']); }
  function greeting() {
    add(say('राधे राधे! 🙏 I’m Sakhi, your MyPandulipi shopping companion.\n\nTell me the granth you’re looking for. I can help with prices, gifting and quantities.', 'राधे राधे! 🙏 मैं पांडुलिपि सखी हूँ।\n\nआप कौन-सा ग्रंथ खोज रहे हैं? मैं कीमत, उपहार और ऑर्डर की मात्रा चुनने में मदद कर सकती हूँ।'));
    homeChips(); scroll();
  }
  function family(name) { const q = norm(name); return Object.keys(aliases).find(key => has(q, aliases[key])) || q; }
  function parseProducts(doc) {
    return [...doc.querySelectorAll('#collection .feature, #collection .scard')].map(card => {
      const title = card.querySelector('h3,h4');
      const name = title ? (title.getAttribute('aria-label') || text(title)) : '';
      const price = amount(card.querySelector('.price-now'));
      const image = card.querySelector('img');
      const description = card.querySelector('.feature-copy > p:not(.feature-deva),.scard-body > p');
      const priceKey = (card.innerHTML.match(/<!--\s*PRICE:([\w-]+)/) || [])[1];
      return { name, price, mrp: amount(card.querySelector('.price-mrp')), description: text(description), tags: [...card.querySelectorAll('.tag')].map(text), family: family(name), silver: /silver/i.test(name), priceKey, image: image ? site(image.getAttribute('src')) : null, url: site('index.html#' + (card.id || 'collection')) };
    }).filter(p => p.name && Number.isFinite(p.price) && p.price > 0);
  }
  function parseBulk(doc) {
    const result = {};
    doc.querySelectorAll('.prow:not(.prow--head)').forEach(row => {
      const name = text(row.querySelector('.pname b'));
      if (!name) return;
      const key = /silver.*hanuman/i.test(name) ? 'silver-hanuman' : /silver.*bhaktamar/i.test(name) ? 'silver-bhaktamar' : /chalisa/i.test(name) ? 'chalisa' : family(name);
      result[key] = [...row.querySelectorAll('.ptiers li')].map(li => {
        const label = text(li.querySelector('span')), numbers = label.match(/\d+/g) || [];
        const min = /^above/i.test(label) ? Number(numbers[0]) + 1 : Number(numbers[0]);
        const max = /^above/i.test(label) ? Infinity : Number(numbers[1] || numbers[0]);
        return { min, max, label, price: amount(li.querySelector('b')) };
      }).filter(t => t.min > 0 && t.price > 0);
    });
    return result;
  }
  async function page(path) {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 9000);
    try { const res = await fetch(site(path), { cache: 'no-cache', signal: controller.signal }); if (!res.ok) throw Error('Catalogue unavailable'); return new DOMParser().parseFromString(await res.text(), 'text/html'); }
    finally { clearTimeout(timeout); }
  }
  function loadCatalogue() {
    if (state.loaded) return Promise.resolve();
    if (state.loading) return state.loading;
    state.loading = (async () => {
      const results = await Promise.allSettled([document.querySelector('#collection .price-now') ? Promise.resolve(document) : page('index.html'), document.querySelector('.plist .prow') ? Promise.resolve(document) : page('bulk.html')]);
      if (results[0].status === 'fulfilled') {
        const doc = results[0].value;
        state.products = parseProducts(doc);
        const offer = doc.querySelector('#special-offer');
        if (offer) {
          const quantity = Number((text(offer.querySelector('.offer-pack')).match(/pack of (\d+)/i) || [])[1]);
          const price = amount(offer.querySelector('.offer-price'));
          if (quantity && price && /durga/i.test(text(offer.querySelector('h3')))) state.offer = { quantity, price, regular: amount(offer.querySelector('.offer-regular')), coupon: text(offer.querySelector('.offer-coupon strong')) };
        }
      }
      if (results[1].status === 'fulfilled') state.tiers = parseBulk(results[1].value);
      state.loaded = state.products.length > 0 && Object.keys(state.tiers).length > 0;
    })().finally(() => { state.loading = null; });
    return state.loading;
  }
  function productCards(products, intro) {
    const bubble = add(intro); const list = document.createElement('div'); list.className = 'ps-products';
    products.forEach(p => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'ps-product';
      if (p.image) { const img = document.createElement('img'); img.src = p.image; img.alt = ''; img.loading = 'lazy'; button.append(img); }
      const label = document.createElement('span'), title = document.createElement('strong'), price = document.createElement('small');
      title.textContent = p.name; price.textContent = money(p.price) + say(' / piece', ' / प्रति पीस'); label.append(title, price); button.append(label);
      button.addEventListener('click', () => send(p.name)); list.append(button);
    });
    bubble.append(list);
  }
  function matchProducts(q) {
    const families = Object.keys(aliases).filter(key => has(q, aliases[key]));
    const silver = has(q, ['silver', 'rajat', 'रजत', 'चांदी', 'चाँदी']);
    return state.products.filter(p => families.includes(p.family) && p.silver === silver);
  }
  function quantity(q) {
    const digits = norm(q);
    let match = digits.match(/(?:qty|quantity|pieces|copies|मात्रा)\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i) || digits.match(/(-?\d+(?:\.\d+)?)\s*(?:pieces?|pcs?|copies|copy|books?|sets?|पीस|प्रतियां|प्रतियाँ|नग)/i);
    if (!match && /^-?\d+(?:\.\d+)?$/.test(digits)) match = [digits, digits];
    if (!match && matchProducts(q).length && !has(q, ['under', 'budget', 'below', 'rupees', 'rs', '₹', 'बजट']) && !/[₹]/.test(q)) match = digits.match(/(?:^|\s)(-?\d+(?:\.\d+)?)\s+(?=[a-z\u0900-\u097f])/i);
    if (!match && has(q, ['one copy', 'single piece', 'एक पीस', 'एक प्रति'])) return 1;
    return match ? Number(match[1]) : null;
  }
  function unitPrice(p, count) { const tier = (state.tiers[p.priceKey] || []).find(t => count >= t.min && count <= t.max); return tier ? tier.price : p.price; }
  function productReply(p, count = null, showTiers = false) {
    if (state.selected !== p && state.awaiting !== 'product') state.quantity = null;
    state.selected = p;
    if (count !== null) state.quantity = count;
    const qty = state.quantity;
    let reply = p.name + '\n' + say('Selling price: ', 'विक्रय मूल्य: ') + money(p.price) + say(' per piece', ' प्रति पीस');
    if (p.mrp) reply += '\nMRP: ' + money(p.mrp);
    if (!qty) reply += '\n\n' + (p.tags.length ? p.tags.join(' · ') : p.description);
    const tiers = state.tiers[p.priceKey] || [];
    if (qty) {
      const rate = unitPrice(p, qty);
      reply += '\n\n' + qty + ' × ' + money(rate) + ' = ' + money(qty * rate);
      reply += '\n' + say('Product subtotal; delivery, if applicable, is confirmed by our team.', 'यह उत्पाद का उप-योग है। डिलीवरी शुल्क, यदि लागू हो, टीम बताएगी।');
      if (qty >= 10 && !tiers.length) reply += '\n' + say('Bulk rates could not be checked. This subtotal uses the listed single-piece price; please request a bulk quote.', 'थोक दर अभी जाँच नहीं सकी। यह एक पीस की दर से उप-योग है; थोक कोटेशन के लिए टीम से पूछें।');
      state.awaiting = null;
    } else {
      if (showTiers && tiers.length) reply += '\n\n' + say('Bulk pricing per piece:\n', 'थोक मूल्य प्रति पीस:\n') + tiers.map(t => t.label + ': ' + money(t.price)).join('\n');
      reply += '\n\n' + say('How many copies would you like?', 'आपको कितनी प्रतियाँ चाहिए?'); state.awaiting = 'quantity';
    }
    if (p.family === 'durga' && state.offer) {
      const o = state.offer;
      reply += '\n\n' + say('Navratri special: ', 'नवरात्रि ऑफर: ') + o.quantity + say(' copies for ', ' प्रतियाँ ') + money(o.price) + '. ' + say('Use code ', 'कोड ') + o.coupon + '.';
      if (qty === o.quantity) reply += '\n' + say('With this coupon, the combo product total is ', 'इस कूपन के साथ कॉम्बो का कुल उत्पाद मूल्य ') + money(o.price) + '.';
    }
    const bubble = add(reply);
    const a = document.createElement('a'); a.href = p.url; a.textContent = say('View product on website ↗', 'वेबसाइट पर उत्पाद देखें ↗'); a.className = 'ps-inline-link'; bubble.append(a);
    chips(qty ? [say('Order on WhatsApp', 'WhatsApp पर ऑर्डर'), say('Delivery', 'डिलीवरी'), say('Browse products', 'उत्पाद देखें')] : [say('1 copy', '1 पीस'), say('10 copies', '10 पीस'), say('Bulk pricing', 'थोक मूल्य')]);
  }
  function offerReply() {
    if (!state.offer) { add(say('Our team can confirm current festive offers on WhatsApp. Which product are you interested in?', 'वर्तमान ऑफर की पुष्टि हमारी टीम WhatsApp पर करेगी। आप कौन-सा उत्पाद चाहते हैं?')); return; }
    const o = state.offer;
    state.selected = state.products.find(p => p.family === 'durga' && !p.silver) || null;
    state.quantity = o.quantity;
    add(say('Navratri Kanya Poojan combo\n', 'नवरात्रि कन्या पूजन कॉम्बो\n') + o.quantity + say(' Durga Chalisa Pandulipis with gift boxes: ', ' दुर्गा चालीसा पांडुलिपियाँ, गिफ्ट बॉक्स सहित: ') + money(o.price) + (o.regular ? '\n' + say('Regular total: ', 'सामान्य कुल मूल्य: ') + money(o.regular) + ' · ' + say('Save ', 'बचत ') + money(o.regular - o.price) : '') + '\n' + say('Coupon: ', 'कूपन: ') + o.coupon + '\n\n' + say('Would you like to check availability on WhatsApp?', 'क्या आप WhatsApp पर उपलब्धता की पुष्टि करना चाहेंगे?'));
    chips([say('Order on WhatsApp', 'WhatsApp पर ऑर्डर'), say('Delivery', 'डिलीवरी'), say('Browse products', 'उत्पाद देखें')]);
  }
  function reply(raw) {
    let q = norm(raw);
    if (state.awaiting === 'budget' && /^\d+$/.test(q)) q = 'budget ' + q;
    const matches = matchProducts(q), count = quantity(q);
    if (/[\u0900-\u097f]/.test(raw)) state.hindi = true;
    if (has(q, ['english'])) { state.hindi = false; greeting(); return; }
    if (has(q, ['hindi', 'हिंदी', 'हिन्दी']) && !matches.length) { state.hindi = true; greeting(); return; }
    if (has(q, ['sanskaran', 'संस्करण']) || (has(q, ['large', 'big', 'premium', 'बड़ा', 'बड़ी']) && matches.some(p => p.family === 'aarti'))) {
      state.selected = null; state.quantity = null;
      add(say('For the large / Sanskaran edition, please ask our team for the exact edition and current price. I will not use a smaller edition’s price for it.', 'बड़े / संस्करण वाले ग्रंथ की सही कीमत और उपलब्धता हमारी टीम बताएगी। उसकी जगह छोटे संस्करण की कीमत लागू नहीं होगी।')); homeChips(); return;
    }
    if (q === 'order' || q === 'buy' || (has(q, ['yes', 'yes please', 'हाँ', 'हां']) && state.selected) || has(q, ['whatsapp', 'contact', 'human', 'call', 'order now', 'place order', 'order on whatsapp', 'संपर्क', 'ऑर्डर करें', 'खरीदना']) && !matches.length) {
      add(say('Tap “Continue on WhatsApp” below. I’ve prepared your product and quantity in the enquiry. Our team will confirm your order at 8982659046. You can review the message before sending.', 'नीचे “WhatsApp पर आगे बढ़ें” दबाएँ। चुने हुए उत्पाद और मात्रा का संदेश तैयार है। हमारी टीम 8982659046 पर ऑर्डर की पुष्टि करेगी। भेजने से पहले आप संदेश देख सकते हैं।'));
      chips([say('Browse products', 'उत्पाद देखें'), say('Delivery', 'डिलीवरी')]); return;
    }
    if (has(q, ['navratri', 'kanya', 'kanjak', 'coupon', 'combo', 'offer', 'offers', 'special offer', 'नवरात्रि', 'कन्या', 'कंजक', 'कूपन', 'कॉम्बो'])) { offerReply(); return; }
    if (matches.length === 1 && has(q, ['delivery', 'shipping', 'payment', 'packing', 'packaging', 'gift box'])) {
      if (state.selected !== matches[0]) state.quantity = null;
      state.selected = matches[0];
      if (count !== null && Number.isInteger(count) && count > 0 && count <= 10000) state.quantity = count;
    }
    if (has(q, ['delivery', 'shipping', 'dispatch', 'pincode', 'pin code', 'deliver', 'डिलीवरी', 'शिपिंग', 'कब मिलेगा']) && !has(q, ['cash on delivery', 'cod'])) {
      add(say('We ship across India. Delivery is free within Indore; charges may apply outside Indore. Please share your city / PIN code with our team on WhatsApp for the delivery charge and estimated arrival date.', 'पूरे भारत में डिलीवरी उपलब्ध है। इंदौर में डिलीवरी निःशुल्क है; बाहर शुल्क लागू हो सकता है। शुल्क और अनुमानित तारीख जानने के लिए WhatsApp पर टीम को शहर / पिन कोड बताएँ।')); chips([say('Order on WhatsApp', 'WhatsApp पर ऑर्डर'), say('Browse products', 'उत्पाद देखें')]); return;
    }
    if (has(q, ['payment', 'upi', 'cod', 'cash on delivery', 'pay', 'भुगतान', 'पेमेंट'])) {
      add(say('Orders are confirmed on WhatsApp first. Our team shares payment details only after confirmation. We never call you for payment or send QR codes / payment links first. Please ask the team which payment options are available for your order.', 'पहले WhatsApp पर ऑर्डर की पुष्टि होती है, उसके बाद टीम भुगतान की जानकारी देती है। हम भुगतान के लिए कॉल या पहले से QR / पेमेंट लिंक नहीं भेजते। अपने ऑर्डर के भुगतान विकल्प टीम से पूछें।')); return;
    }
    if (has(q, ['return', 'refund', 'cancel', 'damaged', 'track', 'tracking', 'रिटर्न', 'रिफंड', 'खराब', 'ट्रैक', 'रद्द'])) {
      add(say('For an existing order, tracking, cancellation or a damaged item, please contact our team on WhatsApp with your order details. I don’t have access to private order records or a confirmed return policy.', 'पुराने ऑर्डर, ट्रैकिंग, रद्द करने या खराब वस्तु के लिए WhatsApp पर टीम को ऑर्डर की जानकारी दें। मेरे पास निजी ऑर्डर रिकॉर्ड या पक्की रिटर्न नीति की जानकारी नहीं है।')); return;
    }
    if (has(q, ['who are you', 'are you ai', 'are you a bot', 'chatgpt', 'तुम कौन', 'आप कौन'])) { add(say('I’m Pandulipi Sakhi, MyPandulipi’s automated product and gifting guide. I use our published catalogue to help with prices and common shopping questions. Our team handles final orders on WhatsApp.', 'मैं पांडुलिपि सखी, MyPandulipi की स्वचालित उत्पाद और उपहार मार्गदर्शिका हूँ। प्रकाशित कैटलॉग से कीमत और सामान्य खरीदारी की जानकारी देती हूँ। टीम WhatsApp पर अंतिम ऑर्डर लेती है।')); return; }
    if (has(q, ['founder', 'owner', 'who we are', 'about us', 'made in', 'location', 'address', 'rangwasa', 'कहाँ बन', 'निर्माण', 'मालिक', 'संस्थापक'])) {
      add(say('MyPandulipi is the venture of Chandni and Rupesh, based in Rangwasa, Indore. We make manuscript-style sacred granths with thoughtful gift packaging. Contact us on WhatsApp before arranging a visit.', 'MyPandulipi, चाँदनी और रुपेश की पहल है। रंगवासा, इंदौर में हम पांडुलिपि स्वरूप के पवित्र ग्रंथ और उपहार पैकिंग तैयार करते हैं। मिलने आने से पहले WhatsApp पर संपर्क करें।')); return;
    }
    if (has(q, ['what is pandulipi', 'manuscript', 'material', 'wood', 'handwritten', 'पांडुलिपि क्या', 'लकड़ी', 'हस्तलिखित'])) {
      add(say('Pandulipi means manuscript. Our regular collection recreates that traditional form with printed scripture pages, wooden covers and thread-tied binding. Silver editions have a different finish and binding. Which granth would you like to explore?', 'पांडुलिपि का अर्थ manuscript है। हमारा सामान्य संग्रह मुद्रित शास्त्र-पृष्ठों, लकड़ी के कवर और धागे की बंधाई से उस पारंपरिक रूप को प्रस्तुत करता है। रजत संस्करण की फिनिश और बंधाई अलग है। कौन-सा ग्रंथ देखना चाहेंगे?')); homeChips(); return;
    }
    if (has(q, ['packing', 'packaging', 'gift box', 'custom', 'personalise', 'personalize', 'logo', 'पैकिंग', 'बॉक्स', 'लोगो'])) {
      add(say('The listed prices include gift boxes. Sundarkand has a premium gift box and chandan-scented wooden cover. For bulk orders, you can ask about a printed personal note or card. Which product and quantity do you have in mind?', 'सूचीबद्ध कीमतों में गिफ्ट बॉक्स शामिल है। सुंदरकांड के साथ प्रीमियम बॉक्स और चंदन-सुगंधित लकड़ी का कवर है। थोक ऑर्डर में निजी संदेश / कार्ड के लिए टीम से पूछ सकते हैं। कौन-सा उत्पाद और कितनी मात्रा चाहिए?')); return;
    }
    if (count !== null && (!Number.isInteger(count) || count < 1 || count > 10000)) { add(say('Please enter a whole-number quantity from 1 to 10,000. For a larger order, our team can help on WhatsApp.', 'कृपया 1 से 10,000 के बीच पूर्ण संख्या में मात्रा बताएँ। उससे बड़े ऑर्डर के लिए WhatsApp पर संपर्क करें।')); return; }
    if (matches.length > 1) { state.selected = null; state.quantity = null; productCards(matches, say('Here are the matching products. Choose one to see its prices and quantity options. For a mixed order, our team can prepare a combined quote.', 'ये उत्पाद मिले हैं। कीमत और मात्रा चुनने के लिए एक उत्पाद दबाएँ। मिश्रित ऑर्डर का कुल कोटेशन टीम बनाएगी।')); return; }
    if (matches.length === 1) { productReply(matches[0], count, has(q, ['bulk', 'wholesale', 'थोक'])); return; }
    if (count !== null) {
      if (state.selected) productReply(state.selected, count);
      else { state.quantity = count; state.awaiting = 'product'; productCards(state.products.filter(p => !p.silver), say('For ' + count + ' copies, which product would you like?', count + ' प्रतियों के लिए कौन-सा उत्पाद चाहिए?')); }
      return;
    }
    if (has(q, ['bulk', 'wholesale', 'quantity', 'थोक', 'ज्यादा'])) {
      if (state.selected) { state.quantity = null; productReply(state.selected, null, true); }
      else { add(say('Bulk pricing starts at 10 copies for the regular collection. The seven wooden chalisas can be mixed to reach a bulk quantity. Which title and how many copies would you like?', 'सामान्य संग्रह में थोक मूल्य 10 प्रतियों से शुरू होता है। सात लकड़ी वाली चालीसाओं को मिलाकर थोक मात्रा बना सकते हैं। कौन-सा ग्रंथ और कितनी प्रतियाँ चाहिए?')); chips(['Hanuman Chalisa', 'Durga Chalisa', 'Sundarkand', 'Bhaktamar Stotra']); }
      return;
    }
    if (has(q, ['gift', 'gifting', 'diwali', 'corporate', 'wedding', 'family', 'celebration', 'परिवार', 'समारोह', 'कॉर्पोरेट', 'उपहार', 'दिवाली', 'गिफ्ट', 'विवाह'])) {
      state.purpose = has(q, ['corporate', 'कॉर्पोरेट']) ? 'Corporate gifting' : has(q, ['wedding', 'विवाह']) ? 'Wedding gifting' : has(q, ['diwali', 'दिवाली']) ? 'Diwali gifting' : has(q, ['family', 'परिवार']) ? 'Family gifting' : 'Gifting';
      if (state.selected) { add(say('That would make a thoughtful gift. How many copies do you need? I can check the listed quantity price before connecting you to our team.', 'यह एक सुंदर उपहार होगा। कितनी प्रतियाँ चाहिए? टीम से जोड़ने से पहले मैं सूचीबद्ध मात्रा की कीमत बता सकती हूँ।')); state.awaiting = 'quantity'; chips(['1 copy', '10 copies', '50 copies']); }
      else if (state.purpose !== 'Gifting') {
        add(say('For ' + state.purpose.toLowerCase() + ', what is your budget per gift? You can also name a granth and the number of copies you need.', 'उपहार के लिए प्रति पीस आपका बजट कितना है? आप ग्रंथ का नाम और प्रतियों की संख्या भी बता सकते हैं।'));
        state.awaiting = 'budget';
        chips([say('Under 200', 'बजट 200'), say('Under 1000', 'बजट 1000'), 'Sundarkand']);
      } else { productCards(state.products.filter(p => ['sundarkand', 'gita', 'hanuman', 'bhaktamar'].includes(p.family) && !p.silver), say('For gifting, explore these favourites. Is it for family, a celebration or a corporate order?', 'उपहार के लिए ये लोकप्रिय विकल्प देखें। परिवार, समारोह या कॉर्पोरेट ऑर्डर के लिए चाहिए?')); chips(['Family gift', 'Corporate gifting', 'Wedding gifting']); }
      return;
    }
    if (has(q, ['budget', 'under', 'below', 'बजट', 'कम कीमत'])) {
      const budget = Number((q.replace(/,/g, '').match(/\d+/) || [])[0]);
      if (!budget) { state.awaiting = 'budget'; add(say('What is your budget per gift? For example, “under 200”.', 'प्रति उपहार आपका बजट कितना है? उदाहरण: “under 200”।')); return; }
      state.awaiting = null;
      const within = state.products.filter(p => p.price <= budget);
      if (within.length) productCards(within, say('These options fit a per-piece budget of ' + money(budget) + '.', 'प्रति पीस ' + money(budget) + ' के बजट में ये विकल्प हैं।'));
      else add(say('No current single-piece listing fits that budget. For bulk options, tell me a product and quantity or ask our team on WhatsApp.', 'इस बजट में कोई वर्तमान एकल-पीस विकल्प नहीं है। थोक विकल्प के लिए उत्पाद और मात्रा बताएँ या WhatsApp पर टीम से पूछें।'));
      return;
    }
    if (has(q, ['products', 'product', 'browse', 'catalogue', 'catalog', 'collection', 'prices', 'price list', 'उत्पाद', 'कैटलॉग', 'संग्रह', 'कीमतें'])) {
      state.selected = null; state.quantity = null; state.awaiting = null;
      if (state.products.length) productCards(state.products, say('Choose a granth to see its details and bulk prices. These are the prices currently listed on our website.', 'विवरण और थोक कीमत देखने के लिए ग्रंथ चुनें। ये हमारी वेबसाइट पर अभी सूचीबद्ध कीमतें हैं।'));
      else add(say('I couldn’t load the catalogue just now. You can still reach our team using the WhatsApp button below for confirmed prices.', 'अभी कैटलॉग नहीं खुल सका। सही कीमतों के लिए नीचे WhatsApp बटन से टीम से बात करें।'));
      homeChips(); return;
    }
    if (has(q, ['chalisa', 'चालीसा', 'silver', 'रजत'])) { const silver = has(q, ['silver', 'रजत']); productCards(state.products.filter(p => silver ? p.silver : p.priceKey === 'chalisa'), say('Which edition would you like to see?', 'आप कौन-सा संस्करण देखना चाहेंगे?')); return; }
    if (has(q, ['price', 'cost', 'rate', 'kitna', 'kitne', 'कीमत', 'मूल्य', 'कितने'])) { if (state.selected) productReply(state.selected); else { add(say('Which product would you like the price for?', 'कौन-से उत्पाद की कीमत चाहिए?')); homeChips(); } return; }
    if (has(q, ['hi', 'hello', 'hey', 'namaste', 'radhe', 'namaskar', 'jai shri ram', 'नमस्ते', 'राधे', 'नमस्कार', 'जय श्री राम'])) { greeting(); return; }
    if (has(q, ['thanks', 'thank you', 'धन्यवाद', 'शुक्रिया'])) { add(say('You’re most welcome! 🙏 May your gift bring devotion and joy. Shall we explore another granth or continue your order on WhatsApp?', 'आपका स्वागत है! 🙏 आपका उपहार भक्ति और आनंद लाए। कोई और ग्रंथ देखें या WhatsApp पर ऑर्डर आगे बढ़ाएँ?')); homeChips(); return; }
    add(say('I can help with MyPandulipi products, prices, gifting and common shopping questions. I don’t have a confirmed answer to that one. Try a product name, or continue on WhatsApp for help from our team.', 'मैं MyPandulipi के उत्पादों, कीमत, उपहार और सामान्य खरीदारी में मदद कर सकती हूँ। इस प्रश्न का पक्का उत्तर मेरे पास नहीं है। उत्पाद का नाम लिखें या WhatsApp पर टीम से पूछें।')); homeChips();
  }
  async function send(value) {
    const raw = String(value || '').trim().slice(0, 500);
    if (!raw || state.busy) return;
    state.busy = true; $('ps-send').disabled = true; $('ps-input').value = ''; add(raw, 'user');
    $('ps-messages').setAttribute('aria-busy', 'true');
    let loading;
    if (!state.loaded) loading = add(say('Checking our catalogue…', 'कैटलॉग देख रही हूँ…'));
    scroll();
    try { await loadCatalogue(); if (loading) loading.remove(); reply(raw); }
    catch { if (loading) loading.remove(); add(say('Something didn’t load. Please try again, or use WhatsApp below to reach our team.', 'जानकारी लोड नहीं हो सकी। फिर कोशिश करें या नीचे WhatsApp से संपर्क करें।')); }
    finally { state.busy = false; $('ps-send').disabled = false; $('ps-messages').setAttribute('aria-busy', 'false'); updateLanguage(); scroll(); }
  }
  function updateLanguage() {
    $('ps-language').textContent = state.hindi ? 'English' : 'हिन्दी';
    $('ps-language').setAttribute('aria-label', state.hindi ? 'Switch to English' : 'Switch to Hindi');
    $('ps-input').placeholder = say('Ask about a product or price…', 'उत्पाद या कीमत पूछें…');
    $('ps-whatsapp').firstChild.textContent = say('Continue on WhatsApp ', 'WhatsApp पर आगे बढ़ें ');
  }
  function setOpen(open) {
    $('ps-panel').hidden = !open; $('ps-launch').setAttribute('aria-expanded', String(open)); document.body.classList.toggle('sakhi-open', open);
    if (open) { loadCatalogue().catch(() => {}); if (!matchMedia('(max-width: 600px)').matches) $('ps-input').focus(); scroll(); }
    else $('ps-launch').focus();
  }
  $('ps-launch').addEventListener('click', () => setOpen($('ps-panel').hidden));
  $('ps-close').addEventListener('click', () => setOpen(false));
  root.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('ps-panel').hidden) { e.stopPropagation(); setOpen(false); } });
  $('ps-form').addEventListener('submit', e => { e.preventDefault(); send($('ps-input').value); });
  $('ps-language').addEventListener('click', () => { state.hindi = !state.hindi; updateLanguage(); greeting(); });
  $('ps-reset').addEventListener('click', () => { if (state.busy) return; state.selected = null; state.quantity = null; state.purpose = ''; state.awaiting = null; $('ps-messages').replaceChildren(); greeting(); });
  greeting(); refreshLink();
})();
