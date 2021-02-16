import cheerio from 'cheerio'; // SOMEDAY: Try other parsers.

// Prefer fully quantified extensions.
// NOTE: `.mjs`=ES (requires Node 13+) & `.js`=CommonJs.
import { comp, first, shiftN, isIntLike, ife, axiosGetData, mapValues, map, join, take, filterBlankEntries, delimitKeys, pathJoin, fileUrlToDirname, fileWrite, ensureDirExists, queue } from './util.mjs';

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

// NOTE: Functions are cleaner (although this function could be even cleaner) but could use interface to support swapping parser (after adding TS).
const getProducts = async (pageNum = 1, products = []) => {
    const $ = cheerio.load(await axiosGetData(MEDINO_POPULAR_URL + pageNum));
    products = $('.product-list-item').toArray().map(elToProduct($));
    return pageNum < MAX_PAGES && products.length < tProducts
        ? await getProducts(++pageNum, products)
        : [products, pageNum];
};

ife(async () => {
    const [products, pageNum] = await getProducts();

    console.info(`Got ${products.length} products from ${pageNum} pages, showing ${tProducts} products:\n`);

    const header = comp(delimitKeys(), first)(products);
    const productsCsv = comp(join('\n'), queue(header), map(filterBlankEntries), take(tProducts))(products);

    console.info(productsCsv);

    const buildPath = comp(pathJoin('build'), fileUrlToDirname)(`${import.meta.url}/..`);
    const productsPath = pathJoin('products.csv')(buildPath);

    await ensureDirExists(buildPath);
    await fileWrite(productsPath, productsCsv);
});
