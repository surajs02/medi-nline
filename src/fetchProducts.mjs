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
const elToProduct = $ => el => mapValues(c => $(`.${c}`, el).text())(productClasses);

const getProducts = async (pageNum = 1, products = []) => {
    const $ = cheerio.load(await axiosGetData(MEDINO_POPULAR_URL + pageNum));
    products = $('.product-list-item').toArray().map(elToProduct($));
    return pageNum < MAX_PAGES && products.length < tProducts
        ? await getProducts(++pageNum, products)
        : [products, pageNum];
};

ife(async () => {
    const [products] = await getProducts();

    console.debug('products', products);
});
