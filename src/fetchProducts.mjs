import cheerio from 'cheerio'; // SOMEDAY: Try other parsers.

// Prefer fully quantified extensions.
import { comp, first, shiftN, isIntLike, ife, axiosGetData, mapValues } from './util.mjs'; // NOTE: `.mjs`=ES (requires Node 13+) & `.js`=CommonJs.

const tProducts = comp(first, shiftN(2))(process.argv);

if (!isIntLike(tProducts)) throw Error(`N must be an natural number but got [${tProducts}]`);

console.info(`Fetching N=[${tProducts}] products ...`);

const MEDINO_POPULAR_URL = 'https://www.medino.com/popular-products?up-to-page=';
const MAX_PAGES = 2;

const productClasses = {
    name: 'product-list-link-text',
    price: 'product-list-price-span',
    retailPrice: 'rrp',
};

ife(async () => {
    let products = [];

    const elToProduct = $ => el => mapValues(c => $(`.${c}`, el).text())(productClasses);

    let i = 1;
    while (i < MAX_PAGES && products.length < tProducts) {
        const $ = cheerio.load(await axiosGetData(MEDINO_POPULAR_URL + i));
        products = $('.product-list-item').toArray().map(elToProduct($));
        i++;
    }

    console.debug('products', products);
});
