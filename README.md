# medi-nline

<div align="center"><img src="./logo/nline.png" width="50%"/></div>

`medi-nline` is a Node CLI web scraper that fetches products from a pharmacy website, which are printed and optionally saved as `csv`.

## Install

```bash
git clone https://github.com/surajs02/medi-nline.git
cd medi-nline
node -v # v14.15.5 (LTS), although minimum v13 is required.
npm install
```

## Usage

**NOTE**: This tool won't exceed 10 pages to avoid overwhelming servers.

Scrape 50 products:
```bash
npm start 50
```

Example output:
```
Fetching [50] products ...

Got [50] products from [10] pages (in [1] fetch with concurrency [10])
Showing [50] products:

name,price,retailPrice
Selsun Dandruff Treatment Shampoo 2.5% 100ml,£3.29
HuxD3 20,000 IU 30 Vegetarian Capsules,£6.79
Viscotears Liquid Gel Eye Drops 10g,£2.79
Nurofen Plus 32 Tablets,£8.99
BetterYou Dlux+ Vitamin D + K2 Oral Spray 12ml,£5.91
Selsun Dandruff Shampoo 2.5% 150ml,£5.59
Salactol Wart Paint 10ml,£2.89,£3.10
Always Maxi Classic Night Pads 8s,£0.99,£1.95
Johnson's Face Care Daily Essentials Gentle Make-Up Removal Pads 30 Pads,£2.99
BetterYou Dlux 3000 Vitamin D Oral Spray 15ml,£5.59
Bristol Co-codamol 8/500 mg 32 Tablets,£2.09
Dermol Lotion 500ml,£9.49,£11.97
Bimuno Daily 30 Sachets,£9.99,£11.99
Care Hydrogen Peroxide Solution 6% 20 vols 200ml,£1.49
Adcal-D3 Fruit flavoured 56 Chewable Tablets,£5.99
KN95 Respiratory Protective Mask 1s,£2.39
Celluvisc Eye Drops 1% w/v Unite Dose 30s',£4.29
Colgate Maximum Cavity Protection Fresh Mint Toothpaste 75ml,£1.49
Golden Eye Ointment 5g,£6.69
Gaviscon Advance Peppermint 500ml,£7.99
Always Classic Maxi Wings 9s,£0.99
Kamill Hand & Nail Cream Intensive 100ml,£1.49,£4.99
Numark Paracetamol 500mg 32 Caplets,£0.99,£1.20
OptiBac Probiotics For women 30 Capsules,£15.19,£18.99
Johnson's Face Care Daily Essentials Hydrating 24 Hour Day Cream SPF 15 50ml,£2.69
The Goat Soap With Manuka Honey 100g,£2.59,£3.50
Solpadeine Max 30 Tablets,£7.49
Natures Aid Serrapeptase 250,000iu 60 Tablets,£22.99,£29.95
Solgar Niacin (Vitamin B3) 500 mg 100 Capsules,£9.19,£11.75
Ferrograd-C Prolonged Released 30 Tablets,£4.99
Adcal -D3 750mg/200 I.U 112 Caplets,£4.99
BetterYou Dlux4000 Vitamin D Oral Spray 15ml,£5.91
Nair Sensitive Hair Removal Cream 80ml,£1.09
Bristol Paracetamol 500mg 32 Capsules,£1.59
Sanex Men Active Control 48H Anti-Perspirant 250ml,£2.49
OptiBac Probiotics For Women 90 Capsules,£39.99,£49.99
Eucerin Dry Skin Intensive Lotion 250ml,£10.99,£13.16
Care Hydrogen Peroxide Solution 9% 30 vols 200ml,£1.25
Gaviscon Advance Aniseed Suspension 500ml,£7.99
Bristol Aspirin 75mg Gastro-Resistant  28 Tablets,£1.59
Solgar Vitamin D3 2500 IU (62.5µg) Liquid 59ml,£9.99,£12.50
Bee Health Propolis Liquid 30ml,£3.59,£4.98
Care Hydrogen Peroxide solution 3% 10 vols 200ml,£1.49
Kotex Maxi Super 14 Pads,£1.15
Celluvisc Eye Drops 0.5% x/v Unite Dose 30x0.4ml,£6.79
Arm & Hammer Extra White Care Baking Soda Toothpaste 125g,£1.29
Doublebase Gel Pump 500g,£9.09,£11.54
Panadol Advance 16 Tablets,£1.49,£1.65
Nytol One-A-Night 50mg Tablets 20 Tablets,£6.69,£6.89
Solpadeine Max Soluble Tablets 32,£7.89,£8.09

Save products as csv? (y or N): n
Did not write products
```

## Contributing

Linting instructions available at [eslint-config-jsx](https://www.npmjs.com/package/eslint-config-jsx).

## Considerations

- Could use python but already done a python scraper ([wabler](https://www.gosuraj.com/projects/wabler/)) & prefer js
- Could improve querying via: `(fetch) -> (parse) -> (db) -> (query)`

## Future Plans

- [x] Logo
- [x] Cache result
- Add option to open saved csv
- Functional methods
- Live reload
- Unit tests
- TS
- Extend CLI (e.g., select page)
- Related products
- Show price savings
- Allow sort/filter

## Medi Site Critique

### Good:
- simple, well branded site
- functional accounts, product categories/browsing/search
- advice section is a good addition and could serve as an area for potential expansion and community engagement (eg blog posts, site changes, promotions, etc)

### Improvable:
- product UI is busy and key information is scattered in a format that isn't consistent with established e-commerce conventions, eg:
    - 3-4 products per row to allow more space to present product data like images
    - product cards should include in order:
        - for category browsing: image, reviews, optional promoting, price, saving, purchase call-to-action
        - additional useful options:
            - amount data: ml/litres/grams/kg
            - bookmark/favourite/wishlist
- allow product comparison
- support customer questions & answers (ie customer to customer support may reveal issues not reported to customer support or customers may make beneficial recommendations)
- potentially missed opportunity for sponsored products
- carousels to showcase promotions
- search results layout should be a list as difficult for users to distinguish from category browsing pages
- progressing pages requires the user to click 'load more' button (which appears to append rather than page hence should be refactorable to infinite scroll), which adds friction to the core browsing UX:
    - from a UX perspective: increasing user resources/effort reduces engagement time hence reduces potential sales, can be improved via infinite scroll (eg [Wiki Randoms](https://www.gosuraj.com/projects/wiki-randoms/))
    - from a development perspective: can be resolved without reinventing the wheel via existing infinite scroll solutions (a wealth of existing well supported solutions is a benefit of using popular UI libraries such as React)
- no go-to-top button adds further friction to browsing (although potentially offset by the simple useful category links sidebar)
- wording: eg
> Order within 6hrs 53mins to have it sent out today.

but could be:
> Order within 6hrs 53mins start delivery today

Or (if next day delivery is possible)
> Order within 6hrs 53mins for next day delivery
- very simple basket, could be improved:
    - with save-for-later feature (reduces user resources as less effort saving/revisiting products)
    - quantity picker should be a dropdown to minimize user clicks/effort
    - show total savings to close sale & promote future sales
    - support & show bookmarked, past purchases, etc
- product page:
    - product in categories could group categories
    - compare with similar items
    - allow reporting incorrect info
    - buy now option
    - frequently bought together
    - share
- a styleguide could be created to ensure UI components (cards, buttons, etc) are consistent hence effectively communicating a brand design language that can become familiar to users (e.g., Material Design - but can be made specific to a product with dedicated buttons for positive/negative/aux actions, which ensures users are confident at quickly locating an action and understanding what its operation intuitively)