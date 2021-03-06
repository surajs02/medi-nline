import cheerio from 'cheerio'; // SOMEDAY: Try other parsers.
import path, { dirname } from 'path';

// Prefer fully quantified extensions.
// NOTE: `.mjs`=ES (requires Node 13+) & `.js`=CommonJs.
import { axiosGetData, fileWrite, ensureDirExists, readIsCliInputYes, pluralize } from './util';
import { PRODUCTS_URL, MAX_CONCURRENT_PAGES } from './constants';

import { productClasses, Product } from './fetchProducts';
import { EnsureTypedIndexes, IJson } from './types';

// This file (`fetchProdcutssimpe.mjs`) attempts to replicate the functionality of the
// original functional implementation (`fetchProducts.mjs`) whilst using less utilities and a
// contrasting imperative approach.

const getTotalProductsArg = (): number => {
    const tProducts = parseInt(process.argv[2]);
    if (isNaN(tProducts) || !Number.isInteger(tProducts)) throw new Error('N must be an natural number');

    return tProducts;
};

const fetchPageProducts = async (pageNum: number): Promise<Product[]> => {
    const $: cheerio.Root = cheerio.load(await axiosGetData(PRODUCTS_URL + pageNum));
    const elToProduct = (el: cheerio.Element) =>
        Object.keys(productClasses).reduce((product: Product, k: string) =>
            ({ ...product, [k]: $(`.${productClasses[k]}`, el).text() })
        , {} as Product);

    return $('.product-list-item').toArray().map(elToProduct);
};
const fetchProducts = async (tProducts: number = 50, pageNum = 1): Promise<[Product[], number, number, number]> => {
    let tConcurrentFetches = 1;
    let targetPage: Product[] = [];
    while (targetPage.length < tProducts) {
        const nums = [...Array(MAX_CONCURRENT_PAGES).keys()];
        const pageNums = nums.map((v: number): number => v + pageNum);
        const fetches = pageNums.map(fetchPageProducts);
        const pages = await Promise.all(fetches);
        const pageHasNeededProducts = (v: Product[]): boolean => v.length >= tProducts;
        targetPage = pages.find(pageHasNeededProducts) || [];

        pageNum += 1;
        tConcurrentFetches += 1;
    }

    return [targetPage.slice(0, tProducts), pageNum, tConcurrentFetches, MAX_CONCURRENT_PAGES];
};

const productsToCsv = (products: Product[]) => {
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
    const productCsvs = products.map((product: Product) => {
        const cleanProduct = removeBlankValues(product);
        return Object.values(cleanProduct).join(',');
    });

    const header = Object.keys(products[0]).join(',');
    productCsvs.unshift(header);

    return productCsvs.join('\n');
};
const writeProductsCsv = async (csv: string): Promise<string> => {
    const buildPath = path.join(dirname(`${__filename}/..`), 'build');
    const productsPath = path.join(buildPath, 'products.csv');

    await ensureDirExists(buildPath);
    await fileWrite(productsPath, csv);

    return productsPath;
};


const main = (async () => {
    const tProducts: number = getTotalProductsArg();

    console.info(`Fetching [${tProducts}] products ...\n`);

    const [products, pageNum, tConcurrentFetches, concurrency] = await fetchProducts(tProducts);
    const tFetchedProducts: number = products.length;
    const productsCsv = productsToCsv(products);

    // Prefer side effects like logs outside pure functions.
    console.info(`Got [${tFetchedProducts}]  ${pluralize('product', tFetchedProducts)} from [${pageNum}] ${pluralize('page', pageNum)} (in [${tConcurrentFetches}] ${pluralize('fetch', tConcurrentFetches)} with concurrency [${concurrency}])`);
    console.info(`Showing [${tProducts}] products:\n`);
    console.info(productsCsv);

    const writeToFile: boolean = await readIsCliInputYes('\nSave products as csv?');
    return writeToFile
        ? console.info(`Wrote products csv to [${await writeProductsCsv(productsCsv)}]`)
        : console.info('Did not write products');
});
main();
