import cheerio from 'cheerio'; // SOMEDAY: Try other parsers.
import sourceMap from 'source-map-support';

import { PRODUCTS_URL, MAX_CONCURRENT_PAGES, PRODUCT_CLASSES } from './constants';
import { Product } from './types';
import { minikit as M } from './util';

sourceMap.install();

const getTotalProductsArg = (): number => {
    const throwIfMissingArg = M.throwIf(M.countIsNone, Error('Missing arg'));
    const throwIfInvalidNumber = M.throwIf(
        M.negate(M.isIntLike),
        Error('N must be a number')
    );
    const getValidTotalProductsArg = M.compose(
        throwIfInvalidNumber,
        M.head,
        throwIfMissingArg,
        M.skip(2)
    );

    return getValidTotalProductsArg(process.argv) as number;
};

const fetchPageProducts = async (pageNum: number): Promise<Product[]> => {
    const $: cheerio.Root = cheerio.load(await M.axiosGetData(PRODUCTS_URL + pageNum));
    const getElByClass = (containerEl: cheerio.Element) =>
        (c: string): cheerio.Cheerio => $(`.${c}`, containerEl);
    const getElText = (el: cheerio.Cheerio): string => el.text();
    const elToProduct = (el: cheerio.Element): Product => {
        const elClassToText = (className: string) => M.compose(
            getElText,
            getElByClass(el)
        )(className);
        const elClassTextMap = M.mapEntries({
            valueMapper: (className: string) => elClassToText(className),
        })(PRODUCT_CLASSES);

        return elClassTextMap as unknown as Product;
    };

    return $('.product-list-item')
        .toArray()
        .map(elToProduct);
};
const fetchProducts = async (
    tProducts: number,
    pageNum = 1,
    tConcurrentFetches = 1
): Promise<[Product[], number, number, number]> => {
    const pageNums: number[] = M.fillRecursive(M.increment, MAX_CONCURRENT_PAGES)([pageNum]);
    const tPageNums: number = M.count(pageNums);
    const pages: Product[][] = await Promise.all(
        pageNums.map(fetchPageProducts)
    );
    const pageHasNeededProducts = (v: Product[]): boolean => v.length >= tProducts;
    const targetPage: Product[] = pages.find(pageHasNeededProducts) || [];

    return M.countIsAny(targetPage)
        ? [
            M.take(tProducts)(targetPage),
            tPageNums,
            tConcurrentFetches,
            MAX_CONCURRENT_PAGES,
        ]
        : await fetchProducts(
            tProducts,
            M.increment(tPageNums),
            M.increment(tConcurrentFetches)
        );
};

const productsToCsv = (products: Product[]): string => {
    const header: string = M.compose(M.delimitKeys(), M.head)(products);

    return M.compose(
        M.join('\n'),
        M.prepend(header),
        M.map(
            p => M.compose(M.delimitValues(), M.filterBlankEntries)(p)
        )
    )(products) as unknown as string;
};
const writeProductsCsv = async (csv: string): Promise<string> => {
    const buildPath = M.pathJoin(__dirname)('build') ?? '';
    const productsPath = M.pathJoin(buildPath)('products.csv') ?? '';
    const isPathsOk = M.all(M.stringCountIsAny)([buildPath, productsPath]);

    if (isPathsOk) {
        await M.ensureDirExists(buildPath);
        await M.writeFile(productsPath)(csv);
    }

    return productsPath;
};

const main = async () => {
    const tProducts: number = getTotalProductsArg();

    console.info(`Fetching [${tProducts}] products ...\n`);

    const [products, pageNum, tConcurrentFetches, concurrency] = await fetchProducts(tProducts);
    const tFetchedProducts: number = M.count(products);
    const productsCsv: string = productsToCsv(products);

    // Prefer side effects like logs outside pure functions.
    M.compose(console.info, M.pluralizeWords({
        product: tFetchedProducts,
        page: pageNum,
        fetch: tConcurrentFetches,
    }))(
        `Got [${tFetchedProducts}] product from [${pageNum}] page (in [${tConcurrentFetches}] fetch with concurrency [${concurrency}])`
    );
    console.info(`Showing [${tProducts}] products:\n`);
    console.info(productsCsv);

    const writeToFile: boolean = await M.readIsCliInputYes('\nSave products as csv?');
    // Prefer returning in functions.
    return console.info(
        writeToFile
            ? `Wrote products csv to [${await writeProductsCsv(productsCsv)}]`
            : 'Did not write products'
    );
};

void M.promiseTryOr(
    main,
    (__?: any, e?: unknown) => console.error('main failed: ', e)
)();
