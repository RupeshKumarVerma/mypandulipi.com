# Pandulipi Sakhi

Pandulipi Sakhi is the storefront’s ivory-and-brown floating shopping guide. It is loaded on the home, bulk-orders, journal and Who We Are pages.

## Behaviour

- Opens only when the visitor chooses **Ask Sakhi**; supports keyboard close and mobile layouts.
- Understands product names in English, Hindi and common Hinglish spellings.
- Reads product names, images, MRP and selling prices from `index.html`, and quantity tiers from the JSON data in `bulk.html`. It fetches these pages on other storefront pages. No independent price list is hardcoded in the widget.
- Reads the Durga combo’s quantity, total and coupon from the Special Offer section.
- Supports quantity totals, budget suggestions, gifting follow-ups and catalogue-grounded FAQs.
- Opens an editable WhatsApp enquiry to **+91 8982659046**, including the selected product, quantity, gifting purpose and latest enquiry. All response links and WhatsApp suggestion buttons open WhatsApp directly. Links within older responses keep the product and quantity shown in that response. It does not send the message or place the order automatically.
- Does not store chats, collect payment data or send conversations to an AI provider.

This version is an automated catalogue/FAQ guide, not a generative AI service. Unknown questions, edition-specific requests, mixed-order quotations and private order enquiries go to the team on WhatsApp. A future generative integration needs a secure server endpoint with server-side credentials and authoritative price validation; do not add an API key to these browser files.

## Maintaining prices and catalogue

Use the existing `tools/prices.py` workflow for the website’s prices. The assistant reads the resulting product cards and price table. Preserve these selectors if redesigning the catalogue:

`FESTIVE_PRICES` contains the active seasonal overrides, including silver editions. `PRODUCTS` retains standard catalogue prices, which remain visible alongside festive prices and MRP. The generator applies the lower of the current offer and existing bulk rate to each quantity tier, and marks active offers with `data-festive="true"`. Sakhi uses that marker for festive-price enquiries and reads `.price-regular` to quote the regular selling price. The product catalogue PDF section and its download links have been removed from the website.

- Product cards: `#collection .feature` and `#collection .scard`
- Titles: `h3` / `h4`; prices: `.price-now`, `.price-mrp`
- Existing `<!-- PRICE:key -->` markers link each product to the correct bulk tier.
- Quantity calculations: `#bulk-pricing-data` JSON generated from the same pricing source. The visible quantity-slab column has been removed; the storefront shows MRP, regular and festive selling prices only.
- Special offer: `#special-offer`, `.offer-pack`, `.offer-price`, `.offer-regular`, `.offer-coupon strong`

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

The test accepts `SAKHI_BASE_URL`, `PLAYWRIGHT_MODULE` and `CHROMIUM_EXECUTABLE` environment variables. It exercises catalogue prices, tier boundaries, Hindi queries, conversational context, safe WhatsApp handover, mobile layout, keyboard close and unavailable-catalogue handling.
