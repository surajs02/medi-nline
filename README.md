# medino-nline

A Node CLI web scraper that fetches & prints `N` lines of product names with prices from the medino website.

## Install

```bash
git clone https://github.com/surajs02/medino-nline.git
cd medino-nline
node -v # v14.15.5 (LTS), although minimum v13 is required.
npm install
```

## Usage

```bash
npm start 1 # E.g., prints 'Nurofen Plus 32 Tablets,8.99'.
```

## Contributing

Linting instructions available at [eslint-config-jsx](https://www.npmjs.com/package/eslint-config-jsx).

## Considerations

- Could use python but already done a python scraper ([wabler](https://www.gosuraj.com/projects/wabler/)) & prefer js
- Could improve querying via: `(fetch) -> (parse) -> (db) -> (query)`

## Future Plans

- Logo
- Cache result
- Functional methods
- Live reload
- Unit tests
- TS
- Extend CLI (e.g., select page)
- Related products
- Show price savings
- Allow sort/filter

