#!/usr/bin/env python3
"""Single source of truth for MyPandulipi website prices.

Run `python3 tools/prices.py` after changing any price below. It rewrites the
price blocks on index.html and the price list on bulk.html (between the
PRICES:... markers) and the Product offers in the homepage structured data.
"""
import json, math, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Keep catalogue rates separate so a seasonal offer can be ended without losing
# the normal retail or bulk prices.
FESTIVE_PRICES = {
    "chalisa": 99, "aarti": 99, "bhaktamar": 99,
    "sundarkand": 799, "gita": 649,
    "silver-hanuman": 999, "silver-bhaktamar": 1299,
}

# key: (name, devanagari, mrp, price, [(qty label, per-piece price), ...])
PRODUCTS = {
    "sundarkand": ("Sundarkand Pandulipi", "सुन्दरकाण्ड", 1999, 1099,
                   [("10 to 25", 1049), ("26 to 50", 999), ("51 to 100", 949), ("Above 100", 899)]),
    "gita": ("Shrimad Bhagavad Gita", "श्रीमद्भगवद्गीता", 1999, 999,
             [("10 to 25", 949), ("26 to 50", 900), ("51 to 100", 849), ("Above 100", 800)]),
    "chalisa": ("Chalisa (any of 7)", "चालीसा", 249, 149,
                [("10 to 25", 140), ("26 to 50", 130), ("51 to 100", 120), ("Above 100", 110)]),
    "aarti": ("Aarti Sangrah", "आरती संग्रह", 299, 149,
              [("10 to 25", 140), ("26 to 50", 130), ("51 to 100", 120), ("Above 100", 110)]),
    "bhaktamar": ("Bhaktamar Stotra", "भक्तामर स्तोत्र", 299, 199,
                  [("10 to 25", 179), ("26 to 50", 169), ("51 to 100", 149), ("Above 100", 119)]),
    "silver-hanuman": ("Silver Hanuman Chalisa", "रजत हनुमान चालीसा", 2500, 1100,
                       [("Above 10", 999)]),
    "silver-bhaktamar": ("Silver Bhaktamar Stotra", "रजत भक्तामर स्तोत्र", 3000, 1499,
                         [("Above 10", 1199)]),
}
REGULAR = ["sundarkand", "gita", "chalisa", "aarti", "bhaktamar"]
SILVER = ["silver-hanuman", "silver-bhaktamar"]

# Homepage card/feature title -> product key
CARD_MAP = {
    "Sundarkand": "sundarkand", "Shrimad Bhagavad": "gita",
    "Hanuman Chalisa": "chalisa", "Krishna Chalisa": "chalisa", "Shiv Chalisa": "chalisa",
    "Lakshmi Chalisa": "chalisa", "Surya Chalisa": "chalisa", "Durga Chalisa": "chalisa",
    "Ganesh Chalisa": "chalisa", "Aarti Sangrah": "aarti", "Bhaktamar Stotra": "bhaktamar",
    "Silver Hanuman Chalisa": "silver-hanuman", "Silver Bhaktamar Stotra": "silver-bhaktamar",
}


def inr(n):
    s = str(n)
    if len(s) <= 3:
        return "₹" + s
    head, tail = s[:-3], s[-3:]
    head = re.sub(r"(\d)(?=(\d\d)+$)", r"\1,", head)
    return "₹" + head + "," + tail


def off(mrp, price):  # rounded down, same as the catalogue
    return math.floor((mrp - price) * 100 / mrp)


def current_price(key):
    return FESTIVE_PRICES.get(key, PRODUCTS[key][3])


def current_tiers(key):
    # Quantity orders must never cost more per piece than the live offer.
    return [(qty, min(price, current_price(key))) for qty, price in PRODUCTS[key][4]]


def price_block(key):
    name, deva, mrp, regular, _ = PRODUCTS[key]
    price = current_price(key)
    each = " each" if key == "chalisa" else ""
    festive = ' data-festive="true"' if key in FESTIVE_PRICES else ''
    badge = 'Festive offer' if key in FESTIVE_PRICES else f'{off(mrp, price)}% off'
    bulk_label = 'See all product prices'
    regular_amount = f'<s class="price-regular">{inr(regular)}</s>' if price < regular else f'<span class="price-regular">{inr(regular)}</span>'
    return (
        f'<!-- PRICE:{key} -->'
        f'<div class="price"{festive}><span class="price-now">{inr(price)}{each}</span>'
        f'<span class="price-off">{badge}</span>'
        f'<span class="price-reference"><span>Regular {regular_amount}</span>'
        f'<span class="price-mrp">MRP <s>{inr(mrp)}</s></span></span></div>'
        f'<a class="price-bulk" href="bulk.html#price-list">{bulk_label} <span aria-hidden="true">→</span></a>'
        f'<!-- /PRICE -->'
    )


def update_index():
    p = ROOT / "index.html"
    html = p.read_text()
    html = re.sub(r"\n[ \t]*<!-- PRICE:[^>]*-->.*?<!-- /PRICE -->", "", html, flags=re.S)
    html = re.sub(r"\n[ \t]+\n(?=[ \t]*<div class=\"(buy rv|scard-foot)\">)", "\n", html)

    # Feature blocks (Sundarkand, Gita): insert before <div class="buy rv">
    def feat(m):
        block = m.group(0)
        title = re.search(r"<h3[^>]*>(.*?)</h3>", block, re.S).group(1)
        key = next((k for t, k in CARD_MAP.items() if title.startswith(t)), None)
        if not key:
            return block
        return block.replace('<div class="buy rv">', price_block(key) + '\n        <div class="buy rv">', 1)
    html = re.sub(r'<div class="feature-copy">.*?<div class="buy rv">', feat, html, flags=re.S)

    # Small cards: insert before <div class="scard-foot">
    def card(m):
        block = m.group(0)
        title = re.search(r"<h4>(.*?)</h4>", block).group(1)
        key = CARD_MAP.get(title)
        if not key:
            return block
        return block.replace('<div class="scard-foot">', price_block(key) + '\n          <div class="scard-foot">', 1)
    html = re.sub(r'<div class="scard-body">\s*<h4>.*?<div class="scard-foot">', card, html, flags=re.S)

    # Structured data: offers on Product entries
    m = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', html, re.S)
    data = json.loads(m.group(2))
    ld_map = {
        "Sundarkand Pandulipi": "sundarkand", "Hanuman Chalisa Pandulipi": "chalisa",
        "Chalisa Sangrah Pandulipi": "chalisa", "Silver Hanuman Chalisa": "silver-hanuman",
        "Aarti Sangrah Pandulipi": "aarti", "Shrimad Bhagavad Gita Pandulipi": "gita",
        "Bhaktamar Stotra Pandulipi": "bhaktamar", "Silver Bhaktamar Stotra": "silver-bhaktamar",
    }
    graph = data["@graph"]
    names = {g.get("name") for g in graph}
    if "Bhaktamar Stotra Pandulipi" not in names:
        graph.append({"@type": "Product", "name": "Bhaktamar Stotra Pandulipi",
                      "image": ["https://mypandulipi.com/assets/grid/bhaktamar-stotra.jpg"],
                      "description": "Bhaktamar Stotra in pandulipi form, with an engraved wooden cover and thread-tied pages.",
                      "brand": {"@type": "Brand", "name": "mypandulipi"}})
    if "Silver Bhaktamar Stotra" not in names:
        graph.append({"@type": "Product", "name": "Silver Bhaktamar Stotra",
                      "image": ["https://mypandulipi.com/assets/grid/silver-bhaktamar-stotra.jpg"],
                      "description": "Bhaktamar Stotra on silver pages with Navkar Mahamantra and Uvasaggaharam Stavan, in a red velvet gift box.",
                      "brand": {"@type": "Brand", "name": "mypandulipi"}})
    for g in graph:
        key = ld_map.get(g.get("name"))
        if g.get("@type") == "Product" and key:
            g["offers"] = {"@type": "Offer", "price": str(current_price(key)), "priceCurrency": "INR",
                           "availability": "https://schema.org/InStock",
                           "url": "https://mypandulipi.com/#collection"}
    html = html[:m.start(2)] + "\n" + json.dumps(data, ensure_ascii=False, indent=2) + "\n" + html[m.end(2):]
    p.write_text(html)


def row(key):
    name, deva, mrp, regular, _ = PRODUCTS[key]
    price = current_price(key)
    label = 'Festive price' if key in FESTIVE_PRICES else 'Our price'
    regular_amount = f'<s>{inr(regular)}</s>' if price < regular else inr(regular)
    return (f'<div class="prow"><div class="pname"><b>{name}</b><span class="deva" lang="hi">{deva}</span></div>'
            f'<div class="pmrp"><span class="plabel">MRP</span><s>{inr(mrp)}</s></div>'
            f'<div class="pours"><span class="plabel">{label}</span><b>{inr(price)}</b>'
            f'<span class="pregular">Regular {regular_amount}</span><small>{off(mrp, price)}% off MRP</small></div></div>')


def update_bulk():
    p = ROOT / "bulk.html"
    html = p.read_text()
    rows = "\n".join(row(k) for k in REGULAR)
    silver = "\n".join(row(k) for k in SILVER)
    # Preserve existing quantity calculations for Meera without displaying a
    # quantity-slab table on the storefront.
    bulk_data = json.dumps({k: [{"label": q, "price": v} for q, v in current_tiers(k)]
                            for k in REGULAR + SILVER}, ensure_ascii=False)
    table = f'''<!-- PRICES -->
    <div class="plist rv">
      <div class="prow prow--head" aria-hidden="true"><span>Granth</span><span>MRP</span><span>Selling price</span></div>
{rows}
      <div class="pgroup"><span>Special premium collection</span><span class="deva" lang="hi">रजत संग्रह</span></div>
{silver}
    </div>
    <script type="application/json" id="bulk-pricing-data">{bulk_data}</script>
    <!-- /PRICES -->'''
    html = re.sub(r"<!-- PRICES -->.*?<!-- /PRICES -->", lambda _: table, html, flags=re.S)
    p.write_text(html)


if __name__ == "__main__":
    update_index()
    update_bulk()
    print("Prices updated.")
