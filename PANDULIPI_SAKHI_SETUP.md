# Meera

Meera is the storefront’s ivory-and-brown floating shopping guide. It is loaded on the home, bulk-orders, journal and Who We Are pages.

## Behaviour

- Opens only when the visitor chooses **Ask Meera**; supports keyboard close and mobile layouts.
- Understands product names in English, Hindi and common Hinglish spellings.
- Reads product names, images and descriptions from `index.html`. Other storefront pages fetch that catalogue. No prices or quantity tiers are loaded or quoted.
- Reads the Durga combo’s quantity and coupon from the Special Offer section.
- Collects quantities and customer budgets, supports product suggestions, gifting follow-ups and catalogue-grounded FAQs.
- Opens an editable WhatsApp enquiry to **+91 8982659046**, including the selected product, quantity, gifting purpose, customer budget and latest enquiry. All response links and WhatsApp suggestion buttons open WhatsApp directly. Links within older responses keep the product and quantity shown in that response. It does not send the message or place the order automatically.
- Does not store chats, collect payment data or send conversations to an AI provider.

This version is an automated catalogue/FAQ guide, not a generative AI service. Unknown questions, edition-specific requests, mixed-order quotations and private order enquiries go to the team on WhatsApp. A future generative integration needs a secure server endpoint with server-side credentials and authoritative price validation; do not add an API key to these browser files.

## Maintaining the catalogue

All public product prices, discounts, MRP and structured-data offers are removed. Meera directs all price and festive-offer questions to WhatsApp without calculating totals or claiming products fit a budget. Customer-provided budgets are included in their enquiry only.

`tools/prices.py` retains previous rates for reference, with `DISPLAY_PRICES = False`. Running it removes generated price blocks and structured offers; changing rates alone does not restore price displays. Do not enable prices without a new instruction from the owner. The old priced Navratri poster is no longer linked; the offer uses the price-free Durga product photo. Catalogue PDF download links remain removed.

Preserve these selectors if redesigning the catalogue:

- Product cards: `#collection .feature` and `#collection .scard`
- Titles: `h3` / `h4`; descriptions and `.tag` product features
- Special offer: `#special-offer`, `.offer-pack`, `.offer-coupon strong`

Update the FAQ wording in `pandulipi-sakhi.js` when shipping, packaging or ordering policies change. For a newly named granth, also extend its Hindi/Hinglish aliases. The assistant never promises stock, arrival dates, payment methods or unpublished edition prices.

## Files and deployment

- `pandulipi-sakhi.js`: conversation, catalogue parsing and WhatsApp enquiry
- `pandulipi-sakhi.css`: scoped styles and floating-button spacing
- `assets/fonts/sakhi-devanagari.woff2`: self-hosted Hindi glyphs; SIL Open Font License included alongside it
- Script inclusion on `index.html`, `bulk.html`, `blog.html`, `who-we-are.html`

GitHub Pages deploys the `main` branch. Update the script and CSS query versions together when changing cached assets. To remove the assistant, remove the four script tags; the remaining site does not depend on it.

## Verification

Serve the repository locally and run the browser checks with Playwright installed:

```sh
python -m http.server 8765
node tools/test-sakhi.cjs
```

The test accepts `SAKHI_BASE_URL`, `PLAYWRIGHT_MODULE` and `CHROMIUM_EXECUTABLE` environment variables. It exercises absence of public prices, product details, offer enquiries, Hindi queries, conversational context, safe WhatsApp handover, mobile layout, keyboard close and unavailable-catalogue handling.
