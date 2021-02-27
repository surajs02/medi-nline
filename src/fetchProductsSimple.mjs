import cheerio from 'cheerio'; // SOMEDAY: Try other parsers.
import path, { dirname } from 'path';

// Prefer fully quantified extensions.
// NOTE: `.mjs`=ES (requires Node 13+) & `.js`=CommonJs.
import { ife, axiosGetData, fileWrite, ensureDirExists, readIsCliInputYes,
    count, pluralize,
} from './util.mjs';

// This file (`fetchProdcutssimpe.mjs`) attempts to replicate the functionality of the
// original functional implementation (`fetchProducts.mjs`) whilst using less utilities and a
// contrasting imperative approach.

// Domain fuzzed for privacy.
const PRODUCTS_URL = `https://www.medi${'no'}.com/popular-products?up-to-page=`;

const getTotalProductsArg = () => {
    const tProducts = parseInt(process.argv[2]);
    if (isNaN(tProducts) || !Number.isInteger(tProducts)) throw new Error('N must be an natural number');

    return tProducts;
};

const productClasses = {
    name: 'product-list-link-text',
    price: 'product-list-price-span',
    retailPrice: 'rrp',
};
const fetchPageProducts = async pageNum => {
    const $ = cheerio.load(await axiosGetData(PRODUCTS_URL + pageNum));
    const elToProduct = el =>
        Object.keys(productClasses).reduce((product, k) =>
            ({ ...product, [k]: $(`.${productClasses[k]}`, el).text() })
        , {});

    return $('.product-list-item').toArray().map(elToProduct);
};
const fetchProducts = async (tProducts, pageNum = 1) => {
    const MAX_CONCURRENT_PAGES = 10;

    let tConcurrentFetches = 1;
    let targetPage = [];
    while (targetPage.length < tProducts) {
        const pageNums = [...Array(MAX_CONCURRENT_PAGES).keys()].map(v => v + pageNum);
        const pages = await Promise.all(pageNums.map(fetchPageProducts));
        const pageHasNeededProducts = v => v.length >= tProducts;
        targetPage = pages.find(pageHasNeededProducts);

        pageNum += 1;
        tConcurrentFetches += 1;
    }

    return [(targetPage.slice(0, tProducts)), pageNum, tConcurrentFetches, MAX_CONCURRENT_PAGES];
};

const productsToCsv = products => {
    const removeBlankValues = o => Object.keys(o).reduce(
        (a, k) => {
            const v = o[k];
            return v.trim().length < 1 ? a : { ...a, [k]: v };
        },
        {}
    );
    const productCsvs = products.map(product => {
        const cleanProduct = removeBlankValues(product);
        return Object.values(cleanProduct).join(',');
    });

    const header = Object.keys(products[0]).join(',');
    productCsvs.unshift(header);

    return productCsvs.join('\n');
};
const writeProductsCsv = async csv => {
    const buildPath = path.join(dirname(`${import.meta.url}/..`), 'build');
    const productsPath = path.join(buildPath)('products.csv');

    await ensureDirExists(buildPath);
    await fileWrite(productsPath, csv);

    return productsPath;
};


const main = (async () => {
    const tProducts = getTotalProductsArg();

    console.info(`Fetching [${tProducts}] products ...\n`);

    const [products, pageNum, tConcurrentFetches, concurrency] = await fetchProducts(tProducts);
    const tFetchedProducts = products.length;
    const productsCsv = productsToCsv(products);

    // Prefer side effects like logs outside pure functions.
    console.info(`Got [${tFetchedProducts}]  ${pluralize('product', tFetchedProducts)} from [${pageNum}] ${pluralize('page', pageNum)} (in [${tConcurrentFetches}] ${pluralize('fetch', tConcurrentFetches)} with concurrency [${concurrency}])`);
    console.info(`Showing [${tProducts}] products:\n`);
    console.info(productsCsv);

    const writeToFile = await readIsCliInputYes('\nSave products as csv?');
    return writeToFile
        ? console.info(`Wrote products csv to [${await writeProductsCsv(productsCsv)}]`)
        : console.info('Did not write products');
});
main();
