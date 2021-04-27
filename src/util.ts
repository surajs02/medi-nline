// Prefer ES6 imports as cleaner.

// SOMEDAY: These functions would be better with typing.

import axios from 'axios';
import cheerio from 'cheerio';
import readline from 'readline';

import * as H from 'hofkit';
import * as HN from 'hofkit/dist/node';

export const axiosGetData = async (url: string): Promise<any> => (await axios.get(url)).data;

export const filterBlankEntries = (o = {}) => H.filterEntries(H.stringCountIsAny)(o);

export const isIntLike = (v: string): boolean => {
    const _v = parseInt(v);
    return !isNaN(_v) && Number.isInteger(_v);
};

export const readCliInput = async (prompt: string) => {
    const cli = readline.createInterface(process.stdin, process.stdout);
    const input = await new Promise(r => cli.question(prompt, r));
    cli.close();
    return input;
};
export const readIsCliInputYes = async (prompt: string): Promise<boolean> => H.compose(
    H.strictEquals('y'),
    H.head,
    H.lowerCase
)(await readCliInput(`${prompt} (y or N): `)) as unknown as Promise<boolean>;

export const querySelectorAllNodes = (s = '') => (html: string): [cheerio.Element[], cheerio.Root] => {
    const $ = cheerio.load(html);
    return [$(s).toArray(), $];
};

// TODO: Port?
export const isEmpty = (v: (any | any[] | string)): boolean => {
    switch (typeof v) {
        case 'object': {
            return v == null
                ? false
                : Array.isArray(v)
                    ? v.length < 1
                    : Object.keys(v).length < 1;
        }
        case 'string': {
            return v.length < 1;
        }
        default: {
            return false;
        }
    }
};
// TODO: Port?
export const takeWhile = <T>(p: (v: T, arr: T[]) => boolean = H.contra) =>
    (a: T[] = []) => {
        let remaining = [...a];
        let res: T[] = [];
        while (remaining.length > 0 && p(remaining[0], remaining)) {
            res = [...res, ...H.take(1)(remaining)];
            remaining = H.skip(1)(remaining);
        }
        return res;
    };
// TODO: Port?
// TODO: Support concurrency.
// Applies promise `handler` to `data` until `p` returns `false` or `data` no longer changes between iterations.
export const promiseWhile = <T>(
    handler: (value: T) => Promise<T> = v => Promise.resolve(v),
    p: (v: T) => boolean = H.contra,
    dataT: (value: T) => T = H.identity
) =>
    async (data: T): Promise<T> => {
        const r = await handler(data);
        const nextData = dataT(data);

        return p(r) && nextData !== data
            ? await promiseWhile(handler, p, dataT)(nextData)
            : r;
    };

// Custom interface to `hofkit` provides abstraction benefits (e.g.,
// prevents lib name changes breaking this project, provides namespace for
// grouping `hofkit` `core`/`node` & custom utils, etc.).
export const minikit = {
    // `hofkit-core`.
    all: H.all,
    compose: H.compose,
    count: H.count,
    countIsAny: H.countIsAny,
    countIsNone: H.countIsNone,
    delimitKeys: H.delimitKeys,
    delimitValues: H.delimitValues,
    fillRecursive: H.fillRecursive,
    head: H.head,
    increment: H.increment,
    decrement: H.decrement,
    join: H.join,
    negate: H.negate,
    noop: H.noop,
    map: H.map,
    mapEntries: H.mapEntries,
    pluralize: H.pluralize,
    pluralizeWords: H.pluralizeWords,
    prepend: H.prepend,
    promiseTryOr: H.promiseTryOr,
    skip: H.skip,
    stringCountIsAny: H.stringCountIsAny,
    take: H.take,
    throwIf: H.throwIf,

    // `hofkit-node`.
    ensureDirExists: HN.ensureDirExists,
    writeFile: HN.writeFile,
    pathJoin: HN.pathJoin,

    // Custom.
    axiosGetData,
    filterBlankEntries,
    isIntLike,
    readIsCliInputYes,
    querySelectorAllNodes,
};
