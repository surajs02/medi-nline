import cheerio from 'cheerio'; // SOMEDAY: Try other parsers.

// Prefer `.ts` since ts introduced.
import { comp, first, isIntLike, ife, axiosGetData, mapValues, map, join, filterBlankEntries,
    delimitKeys, pathJoin, fileUrlToDirname, fileWrite, ensureDirExists, queue, readIsCliInputYes,
    throwIf, countIsNone, negate, skip, count, fillRe, take, countIsAny, pluralizeWords, inc,
    delimitValues,
    noop,
    tryOrDAsync,
} from './util';
import { PRODUCTS_URL, MAX_CONCURRENT_PAGES } from './constants';

import sourceMap from 'source-map-support';

sourceMap.install();

const getTotalProductsArg = () => {
    const throwIfMissingArg = throwIf(countIsNone, 'Missing arg');
    const throwIfInvalidNumber = throwIf(negate(isIntLike), 'N must be an natural number');
    const getValidTotalProductsArg = comp(throwIfInvalidNumber, first, throwIfMissingArg, skip(2));
    return getValidTotalProductsArg(process.argv) as number;
};

export interface Product {
    name: string;
    price: string;
    retailPrice?: string;
}
export const productClasses: Record<string, string> = {
    name: 'product-list-link-text',
    price: 'product-list-price-span',
    retailPrice: 'rrp',
};
const fetchPageProducts = async (pageNum: number): Promise<Product[]> => {
    const $: cheerio.Root = cheerio.load(await axiosGetData(PRODUCTS_URL + pageNum));
    const getElByClass = (containerEl: cheerio.Element) => (c: string): cheerio.Cheerio => $(`.${c}`, containerEl);
    const getElText = (el: cheerio.Cheerio) => el.text();
    const elToProduct = (el: cheerio.Element) => mapValues(comp(getElText, getElByClass(el)))(productClasses) as Product;

    return $('.product-list-item').toArray().map(elToProduct);
};
const fetchProducts = async (tProducts: number, pageNum = 1, tConcurrentFetches = 1): Promise<[Product[], number, number, number]> => {
    const pageNums = fillRe(inc, MAX_CONCURRENT_PAGES)(pageNum);
    const tPageNums = count(pageNums);

    const pages = await Promise.all(pageNums.map(fetchPageProducts));
    const pageHasNeededProducts = (v: Product[]): boolean => v.length >= tProducts;
    const targetPage: Product[] = pages.find(pageHasNeededProducts) || [];
    return countIsAny(targetPage)
        ? [take(tProducts)(targetPage), tPageNums, tConcurrentFetches, MAX_CONCURRENT_PAGES]
        : await fetchProducts(tProducts, inc(tPageNums), inc(tConcurrentFetches));
};

const productsToCsv = (products: Product[]): string => {
    const header = comp(delimitKeys(), first)(products);

    return comp(
        join('\n'),
        queue(header),
        map(comp(delimitValues(), filterBlankEntries))
    )(products) as unknown as string;
};
const writeProductsCsv = async (csv: string) => {
    const buildPath = comp(pathJoin('build'), fileUrlToDirname)(`${__filename}`) as string;
    const productsPath = pathJoin('products.csv')(buildPath);

    await ensureDirExists(buildPath);
    await fileWrite(productsPath, csv);

    return productsPath;
};

const main = async () => {
    const tProducts: number = getTotalProductsArg();

    console.info(`Fetching [${tProducts}] products ...\n`);

    const [products, pageNum, tConcurrentFetches, concurrency] = await fetchProducts(tProducts);
    const tFetchedProducts: number = count(products);
    const productsCsv: string = productsToCsv(products);

    // Prefer side effects like logs outside pure functions.
    comp(console.info, pluralizeWords({
        product: tFetchedProducts,
        page: pageNum,
        fetch: tConcurrentFetches,
    }))(`Got [${tFetchedProducts}] product from [${pageNum}] page (in [${tConcurrentFetches}] fetch with concurrency [${concurrency}])`);
    console.info(`Showing [${tProducts}] products:\n`);
    console.info(productsCsv);

    const writeToFile: boolean = await readIsCliInputYes('\nSave products as csv?');
    // Prefer returning in functions.
    return console.info(
        writeToFile
            ? `Wrote products csv to [${await writeProductsCsv(productsCsv)}]`
            : 'Did not write products'
    );
};
tryOrDAsync(noop, { isVerbose: true })(main)

