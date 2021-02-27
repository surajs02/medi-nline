import cheerio from 'cheerio'; // SOMEDAY: Try other parsers.
import { delimitValues } from './util.mjs';
import { inc } from './util.mjs';

// Prefer fully quantified extensions.
// NOTE: `.mjs`=ES (requires Node 13+) & `.js`=CommonJs.
import { comp, first, isIntLike, ife, axiosGetData, mapValues, map, join, filterBlankEntries,
    delimitKeys, pathJoin, fileUrlToDirname, fileWrite, ensureDirExists, queue, readIsCliInputYes,
    throwIf, countIsNone, negate, skip, count, fillRe, take, countIsAny, pluralizeWords,
} from './util.mjs';

// Domain fuzzed for privacy.
const PRODUCTS_URL = `https://www.medi${'no'}.com/popular-products?up-to-page=`;

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
const fetchProducts = async (tProducts, pageNum = 1, tConcurrentFetches = 1) => {
    const MAX_CONCURRENT_PAGES = 10;
    const pageNums = fillRe(inc, MAX_CONCURRENT_PAGES)(pageNum);
    const tPageNums = count(pageNums);

    const pages = await Promise.all(pageNums.map(fetchPageProducts));
    const pageHasNeededProducts = v => v.length >= tProducts;
    const targetPage = pages.find(pageHasNeededProducts);
    return countIsAny(targetPage)
        ? [take(tProducts)(targetPage), tPageNums, tConcurrentFetches, MAX_CONCURRENT_PAGES]
        : fetchProducts(tProducts, inc(tPageNums), inc(tConcurrentFetches), MAX_CONCURRENT_PAGES);
};

const productsToCsv = products => {
    const header = comp(delimitKeys(), first)(products);
    return comp(
        join('\n'),
        queue(header), 
        map(comp(delimitValues(), filterBlankEntries))
    )(products);
};
const writeProductsCsv = async csv => {
    const buildPath = comp(pathJoin('build'), fileUrlToDirname)(`${import.meta.url}/..`);
    const productsPath = pathJoin('products.csv')(buildPath);

    await ensureDirExists(buildPath);
    await fileWrite(productsPath, csv);

    return productsPath;
};

ife(async () => {
    const tProducts = getTotalProductsArg();

    console.info(`Fetching [${tProducts}] products ...\n`);

    const [products, pageNum, tConcurrentFetches, concurrency] = await fetchProducts(tProducts);
    const tFetchedProducts = count(products);
    const productsCsv = productsToCsv(products);

    // Prefer side effects like logs outside pure functions.
    comp(console.info, pluralizeWords({
        product: tFetchedProducts,
        page: pageNum,
        fetch: tConcurrentFetches,
    }))(`Got [${tFetchedProducts}] product from [${pageNum}] page (in [${tConcurrentFetches}] fetch with concurrency [${concurrency}])`);
    console.info(`Showing [${tProducts}] products:\n`);
    console.info(productsCsv);

    const writeToFile = await readIsCliInputYes('\nSave products as csv?');
    // Prefer returning in functions.
    return console.info(
        writeToFile
            ? `Wrote products csv to [${await writeProductsCsv(productsCsv)}]`
            : 'Did not write products'
    );
});
