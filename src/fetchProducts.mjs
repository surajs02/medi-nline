import cheerio from 'cheerio'; // SOMEDAY: Try other parsers.

// Prefer fully quantified extensions.
// NOTE: `.mjs`=ES (requires Node 13+) & `.js`=CommonJs.
import { comp, first, isIntLike, ife, axiosGetData, mapValues, map, join, filterBlankEntries, delimitKeys, pathJoin, fileUrlToDirname, fileWrite, ensureDirExists, queue, readIsCliInputYes, throwIf, countIsNone, negate, skip, count, promiseWhile } from './util.mjs';

const PRODUCTS_URL = `https://www.medi${'no'}.com/popular-products?up-to-page=`; // Domain fuzzed for privacy.
// eslint-disable-next-line no-unused-vars
const MAX_CONCURRENT_PAGES = 10;

const getTotalProductsArg = () => {
    const throwIfMissingArg = throwIf(countIsNone, 'Missing arg'); // TODO: Add types.
    const throwIfInvalidNumber = throwIf(negate(isIntLike), 'N must be an natural number');
    const getValidTotalProductsArg = comp(throwIfInvalidNumber, first, throwIfMissingArg, skip(2));
    return getValidTotalProductsArg(process.argv);
};

const productClasses = {
    name: 'product-list-link-text',
    price: 'product-list-price-span',
    retailPrice: 'rrp',
};
const fetchPageProducts = async pageNum => {
    const $ = cheerio.load(await axiosGetData(PRODUCTS_URL + pageNum));
    const getElByClass = containerEl => c => $(`.${c}`, containerEl);
    const getElText = el => el.text();
    const elToProduct = el => mapValues(comp(getElText, getElByClass(el)))(productClasses);

    return $('.product-list-item').toArray().map(elToProduct);
};
const fetchProducts = async (tProducts, pageNum = 1) => [
    await promiseWhile(
        fetchPageProducts,
        products => count(products) < tProducts,
        _pageNum => {
            pageNum = _pageNum; // Track current `pageNum` for return.
            return ++_pageNum;
        }
    )(pageNum),
    pageNum,
];

// DEPRECATED but kept for ref.
// NOTE: Functions are cleaner (although this function could be even cleaner) but could use interface to support swapping parser (after adding TS).
// const fetchProducts = async (tProducts, pageNum = 1) => {
//     const $ = cheerio.load(await axiosGetData(PRODUCTS_URL + pageNum));
//     const getElByClass = containerEl => c => $(`.${c}`, containerEl);
//     const getElText = el => el.text();
//     const elToProduct = el => mapValues(comp(getElText, getElByClass(el)))(productClasses);

//     // NOTE: Avoid passing products in recursion since each pages are additive (i.e., appends new products).
//     const products = $('.product-list-item').toArray().map(elToProduct);
//     return count(products) < tProducts
//         ? await fetchProducts(tProducts, ++pageNum)
//         : [take(tProducts)(products), pageNum];
// };

const writeProductsCsv = async csv => {
    const buildPath = comp(pathJoin('build'), fileUrlToDirname)(`${import.meta.url}/..`);
    const productsPath = pathJoin('products.csv')(buildPath);

    await ensureDirExists(buildPath);
    await fileWrite(productsPath, csv);

    return productsPath;
};

const productsToCsv = products => {
    const header = comp(delimitKeys(), first)(products);
    return comp(join('\n'), queue(header), map(filterBlankEntries))(products);
};

ife(async () => {
    const tProducts = getTotalProductsArg();

    console.info(`Fetching N=[${tProducts}] products ...`);

    const [products, pageNum] = await fetchProducts(tProducts);
    const productsCsv = productsToCsv(products);

    // Prefer side effects like logs outside pure functions.
    console.info(`Got [${count(products)}] products from [${pageNum}] pages, showing [${tProducts}] products:\n`);
    console.info(productsCsv);

    const writeToFile = await readIsCliInputYes('\nSave products as csv?');
    // Prefer returning in functions.
    return console.info(
        writeToFile
            ? `Wrote products csv to [${await writeProductsCsv(productsCsv)}]`
            : 'Did not write products'
    );
});
