# Pandulipi Sakhi integration (draft)

This is a standalone chat widget, not yet connected to the live storefront. No production files have been changed.

## Install
1. Place `pandulipi-sakhi.js` in the public/static directory served by the site.
2. Before the script, expose current products as `window.PANDULIPI_CATALOG = [{name: 'Example', price: 149, offerPrice: 110, description: '...', url: '/products/example'}]`. These are examples, not authoritative prices.
3. Load `<script src="/pandulipi-sakhi.js" defer></script>` in the website's layout.
4. Optional: set `window.PANDULIPI_SAKHI_API='/api/sakhi/chat'` to a secure server-side AI endpoint returning JSON `{reply: '...'}`. Do not put AI API keys in client-side JavaScript.
5. Test product matching, mobile responsiveness, Hindi/Hinglish questions, bulk inquiries, and WhatsApp link to 918982659046.

## Current limitations
- AI endpoint is **not** implemented. Without it, the widget uses deterministic basic responses, not generative AI.
- Catalogue must be wired to the actual site data source. If absent, no prices are invented.
- Widget has not been inserted into the site's page layout; this repo's application source was not discoverable through the connected API.
- The current WhatsApp handover opens a new chat; it does not automatically send messages.
- The AI endpoint must validate inputs and prices server-side, apply rate limits, and keep API credentials secret.
