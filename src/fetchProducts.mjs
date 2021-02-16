import cheerio from 'cheerio'; // SOMEDAY: Try other parsers.

// Prefer fully quantified extensions.
import { comp, first, shiftN, range, isIntLike, ife, axiosGetData, mapValues } from './util.mjs'; // NOTE: `.mjs`=ES (requires Node 13+) & `.js`=CommonJs.

const tProducts = comp(first, shiftN(2))(process.argv);

if (!isIntLike(tProducts)) throw Error(`N must be an natural number but got [${tProducts}]`);

console.info(`Fetching N=[${tProducts}] products ...`);

const MEDINO_POPULAR_URL = 'https://www.medino.com/popular-products?up-to-page=';
const MAX_PAGES = 1;

const productClasses = {
    name: 'product-list-link-text',
    price: 'product-list-price-span',
    retailPrice: 'rrp',
};

ife(async () => {
    // TODO: Fetch page by page.
    const pages = await Promise.all(
        range(MAX_PAGES, 1).map(async n => {
            const $ = cheerio.load(await axiosGetData(MEDINO_POPULAR_URL + n));
            return $('.product-list-item').toArray().map(el =>
                mapValues(c => $(`.${c}`, el).text())(productClasses)
            );
        })
    );

    console.debug('pages', pages);
});
