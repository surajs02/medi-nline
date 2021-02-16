import cheerio from 'cheerio'; // SOMEDAY: Try other parsers.
import { readIsCliInputYes } from './util.mjs';

// Prefer fully quantified extensions.
// NOTE: `.mjs`=ES (requires Node 13+) & `.js`=CommonJs.
import { comp, first, shiftN, isIntLike, ife, axiosGetData, mapValues, map, join, take, filterBlankEntries, delimitKeys, pathJoin, fileUrlToDirname, fileWrite, ensureDirExists, queue } from './util.mjs';

const tProducts = comp(first, shiftN(2))(process.argv);

if (!isIntLike(tProducts)) throw Error(`N must be an natural number but got [${tProducts}]`);

console.info(`Fetching N=[${tProducts}] products ...`);

const MEDINO_POPULAR_URL = 'https://www.medino.com/popular-products?up-to-page=';
const MAX_PAGES = 10;

const productClasses = {
    name: 'product-list-link-text',
    price: 'product-list-price-span',
    retailPrice: 'rrp',
};
const elToProduct = $ => el => mapValues(c => $(`.${c}`, el).text())(productClasses);

// NOTE: Functions are cleaner (although this function could be even cleaner) but could use interface to support swapping parser (after adding TS).
const extractProducts = async (pageNum = 1, products = []) => {
    const $ = cheerio.load(await axiosGetData(MEDINO_POPULAR_URL + pageNum));
    products = $('.product-list-item').toArray().map(elToProduct($));
    return pageNum < MAX_PAGES && products.length < tProducts
        ? await extractProducts(++pageNum, products)
        : [products, pageNum];
};

const fetchProducts = async () => await extractProducts();

const writeProductsCsv = async csv => {
    const buildPath = comp(pathJoin('build'), fileUrlToDirname)(`${import.meta.url}/..`);
    const productsPath = pathJoin('products.csv')(buildPath);

    await ensureDirExists(buildPath);
    await fileWrite(productsPath, csv);

    return productsPath;
};

const productsToCsv = products => {
    const header = comp(delimitKeys(), first)(products);
    return comp(join('\n'), queue(header), map(filterBlankEntries), take(tProducts))(products);
};

ife(async () => {
    // Prefer side effects like logs outside pure functions.
    const [products, pageNum] = await fetchProducts();
    console.info(`Got [${products.length}] products from [${pageNum}] pages, showing [${tProducts}] products:\n`);

    const productsCsv = productsToCsv(products);
    console.info(productsCsv);

    // Prefer returning in functions.
    return console.info(
        await readIsCliInputYes('\nSave products as csv?')
            ? `Wrote products csv to [${await writeProductsCsv(productsCsv)}]`
            : 'Did not write products'
    );
});
