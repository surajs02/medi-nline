import cheerio from 'cheerio'; // SOMEDAY: Try other parsers.
import path, { dirname } from 'path';

import { PRODUCTS_URL, MAX_CONCURRENT_PAGES, PRODUCT_CLASSES } from './constants';
import { IJson, Product } from './types';
import { minikit as M } from './util';

// This file (`fetchProdcutssimpe.mjs`) attempts to replicate the functionality of the
// original functional implementation (`fetchProducts.mjs`) whilst using less utilities and a
// contrasting imperative approach.

const getTotalProductsArg = (): number => {
    const tProducts = parseInt(process.argv[2]);
    const isInvalidNumber = isNaN(tProducts) || !Number.isInteger(tProducts);
    if (isInvalidNumber) throw new Error('N must be an natural number');

    return tProducts;
};

const fetchPageProducts = async (pageNum: number): Promise<Product[]> => {
    const $: cheerio.Root = cheerio.load(
        await M.axiosGetData(PRODUCTS_URL + pageNum)
    );
    const elToProduct = (el: cheerio.Element) => Object
        .keys(PRODUCT_CLASSES)
        .reduce(
            (product: Product, k: string) => ({
                ...product,
                [k]: $(`.${PRODUCT_CLASSES[k]}`, el).text(),
            })
            , {} as Product);

    return $('.product-list-item')
        .toArray()
        .map(elToProduct);
};
const fetchProducts = async (
    tProducts = 50, pageNum = 1
): Promise<[Product[], number, number, number]> => {
    let tConcurrentFetches = 1;
    let targetPage: Product[] = [];
    while (targetPage.length < tProducts) {
        const nums: number[] = [...Array(MAX_CONCURRENT_PAGES).keys()];
        const pageNums: number[] = nums.map((v: number): number => v + pageNum);
        const fetches: Promise<Product[]>[] = pageNums.map(fetchPageProducts);
        const pages: (Product[])[] = await Promise.all(fetches);
        const pageHasNeededProducts = (v: Product[]): boolean => v.length >= tProducts;
        targetPage = pages.find(pageHasNeededProducts) || [];

        pageNum += 1;
        tConcurrentFetches += 1;
    }

    return [
        targetPage.slice(0, tProducts),
        pageNum,
        tConcurrentFetches,
        MAX_CONCURRENT_PAGES,
    ];
};

const productsToCsv = (products: Product[]): string => {
    // NOTE: Using `IJson` since interfaces seem to lack typed indexes hence tsc won't
    // find overlap between `Product` (i.e., only has string fields) & object type with
    // string fields (cf. https://github.com/microsoft/TypeScript/issues/15300).
    const removeBlankValues = <T extends IJson>(o: T): T => Object.keys(o).reduce(
        (a, k) => {
            const v = o[k];
            return v.trim().length < 1 ? a : { ...a, [k]: v };
        },
        {} as T
    );
    const productCsvs: string[] = products.map((product: Product): string => {
        const cleanProduct: Product = removeBlankValues(product);
        return Object
            .values(cleanProduct)
            .join(',');
    });

    const header: string = Object
        .keys(products[0])
        .join(',');
    productCsvs.unshift(header);

    return productCsvs.join('\n');
};
const writeProductsCsv = async (csv: string): Promise<string> => {
    const buildPath: string = path.join(dirname(`${__dirname}/..`), 'build');
    const productsPath: string = path.join(buildPath, 'products.csv');

    await M.ensureDirExists(buildPath);
    await M.writeFile(productsPath)(csv);

    return productsPath;
};

const main = async () => {
    const tProducts: number = getTotalProductsArg();

    console.info(`Fetching [${tProducts}] products ...\n`);

    const [products, pageNum, tConcurrentFetches, concurrency] = await fetchProducts(tProducts);
    const tFetchedProducts: number = products.length;
    const productsCsv: string = productsToCsv(products);

    // Prefer side effects like logs outside pure functions.
    console.info(
        `Got [${tFetchedProducts}]  ${M.pluralize(tFetchedProducts)('product')} from [${pageNum}] ${M.pluralize(pageNum)('page')} (in [${tConcurrentFetches}] ${M.pluralize(tConcurrentFetches)('fetch')} with concurrency [${concurrency}])`
    );
    console.info(`Showing [${tProducts}] products:\n`);
    console.info(productsCsv);

    const writeToFile: boolean = await M.readIsCliInputYes('\nSave products as csv?');
    return writeToFile
        ? console.info(`Wrote products csv to [${await writeProductsCsv(productsCsv)}]`)
        : console.info('Did not write products');
};

try {
    void main();
} catch (e: unknown) {
    console.error('Main failed', e);
}
