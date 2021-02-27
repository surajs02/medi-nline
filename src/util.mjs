// Prefer ES6 imports as cleaner.

// SOMEDAY: These functions would be better with typing.

import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

export const identity = v => v;
export const tauto = () => true;
export const contra = () => false;
export const noop = () => null; // Prefer `null` for nil conditionals.
export const isNil = v => v == null;
export const isEmpty = v => {
    switch (typeof v) {
    case 'object':
        return v == null
            ? false
            : Array.isArray(v)
                ? v.length < 1
                : Object.keys(v).length < 1;
    case 'string':
        return v.length < 1;
    default:
        return false;
    }
};
export const negate = (p = noop) => (...a) => !p(...a);
export const eq = v1 => v2 => v1 === v2;
export const valueType = v => typeof v;
export const isValueType = valueType => v => typeof v === valueType;

export const isBlankStr = (s = '') => s.trim().length < 1;
export const toLower = (s = '') => s.toLowerCase();
export const mapWords = (t = identity, delimiter = ' ') => (s = '') => s.split(delimiter).map(t).join(delimiter);
export const pluralize = (s = '', count = 1) => count === 1 ? s : `${s}s`;
// Pluralizes words in `s` using a `wordMap` containing `word: count` entries (e.g.,
// `pluralizeWords({ page: pages.length })('fetched page')` returns 'fetched pages').
export const pluralizeWords = (wordMap = {}, t = pluralize) => (s = '') => mapWords(v => v in wordMap ? t(v, wordMap[v]) : v)(s);

export const comp = (...fs) => (...x) => [...fs].reverse().reduce((a, v, i) => i > 0 ? v(a) : v(...a), x);
export const map = (t = identity) => (a = []) => a.map(t);
export const filter = (p = tauto) => (a = []) => a.filter(p);
export const first = (a = []) => a[0];
export const tail = ([, ...a]) => a;
export const queue = v => (a = []) => [v, ...a];
// NOTE: Eslint doesn't understand recursion.
// eslint-disable-next-line no-unused-vars
export const shiftN = n => (a = []) => n < 1 ? a : shiftN(--n)(tail(a)); // DEPRECATED over cleaner `skip` but still a good ref.
export const skip = n => (a = []) => a.slice(n);
export const take = n => (a = []) => a.slice(0, n);
export const takePartition = (takeTo = 1, partitionFrom) => (a = []) => [a.slice(0, takeTo), a.slice(takeTo > 0 ? takeTo : partitionFrom, a.length)];
export const takeWhile = (p = () => false) => (a = []) => {
    let res = [];
    while (a.length > 0 && p(a[0], a)) {
        res = res.concat(take(1)(a));
        a = skip(1)(a);
    }
    return res;
};
export const range = (end = 10, start = 0) => [...Array(end).keys()].map(n => n + start);
export const join = (delimiter = ',') => (a = []) => a.join(delimiter);
export const count = (a = []) => a.length;
export const countIs = n => (a = []) => a.length === n;
export const countIsAny = (a = []) => a.length >= 1;
export const countIsNone = (a = []) => a.length <= 0;
export const difference = (a1 = [], t = identity) => (a2 = []) => a2.filter(v => !a1.includes(t(v)));
export const filterPartition = (p = tauto) => (a = []) => [a.filter(p), a.filter(negate(p))];
export const fillRe = (t = identity, count = 0) => (value, results = []) => count < 1 ? results : fillRe(t, --count)(t(value), results.concat(value));

export const keys = (o = {}) => Object.keys(o);
export const values = (o = {}) => Object.values(o);
export const mapValues = (t = identity) => (o = {}) => keys(o).reduce((a, k) => ({ ...a, [k]: t(o[k], k) }), {});
export const mapEntries = ({ setValue = identity, setKey = (__, k) => k, keep = tauto } = {}) => (o = {}) =>
    keys(o).reduce(
        (a, k) => keep(o[k], k, a)
            ? ({ ...a, [setKey(o[k], k, a)]: setValue(o[k], k, a) })
            : a,
        {}
    );
export const filterEntries = (p = tauto) => (o = {}) => mapEntries({ keep: p })(o);
export const filterBlankEntries = (o = {}) => filterEntries(negate(isBlankStr))(o);
export const grab = k => (o = {}) => o[k];
export const reduceEntries = (t, init = []) => (o = {}) => keys(o).reduce((a, k) => t(o[k], k, a), init);
export const delimitKeys = (delimiter = ',') => (o = {}) => reduceEntries((__, k, a) => a.concat(k))(o).join(delimiter);
export const delimitValues = (delimiter = ',') => (o = {}) => reduceEntries((v, __, a) => a.concat(v))(o).join(delimiter);

// Prefer `ife` aka IIFE to reduce parentheses.
export const ife = (f = noop, ...a) => (() => f(...a))();
export const throwIf = (p = () => true, m = 'No error message') => v => p(v)
    ? ife(() => {
        throw new Error(m);
    })
    : v;
export const log = (m, { logger = console.debug, t = identity } = {}) => (...a) => {
    logger(m, ...a.map(t));
    return a[0];
};

export const isIntLike = v => {
    const _v = parseInt(v);
    return !isNaN(_v) && Number.isInteger(_v);
};
export const inc = v => v + 1;

export const promiseMap = (t = () => Promise.resolve, { concurrency = Infinity, results = [] } = {}) => async (data = []) => {
    if (data.length < 1) return results;

    const [mappableData, nextData] = takePartition(concurrency)(data);

    // eslint-disable-next-line no-unused-vars
    return promiseMap(
        t,
        {
            concurrency,
            results: results.concat(await Promise.all(mappableData.map(t))),
        }
    )(nextData);
};
// TODO: Support concurrency.
// Applies promise `handler` to `data` until `p` returns false or `data` no longer changes between iterations.
export const promiseWhile = (handler = Promise.resolve, p = contra, dataT = identity) => async data => {
    const r = await handler(data);
    const nextData = dataT(data);

    // eslint-disable-next-line no-unused-vars
    return p(r) && nextData !== data ? await promiseWhile(handler, p, dataT)(nextData) : r;
};

export const axiosGetData = async url => (await axios.get(url)).data;

export const querySelectorAllNodes = (s = '') => html => {
    const $ = cheerio.load(html);
    return [$(s).toArray(), $];
};

// NOTE: ES modules seem to lack `__filename` & __dirname`.
export const getFilename = fileUrl => fileURLToPath(fileUrl);
export const getDirname = filename => dirname(filename);
export const fileUrlToDirname = fileUrl => getDirname(getFilename(fileUrl));
export const pathJoin = (...filenames) => p => path.join(p, ...filenames);
export const fileExists = p =>
    new Promise(r => fs.access(
        p, fs.constants.F_OK, e => r(e == null)
    ));
// Overwrite.
export const fileWrite = (p, data) =>
    new Promise((r, j) => fs.writeFile(
        p, data, e => e ? j(e) : r()
    ));
export const getPathStat = p => new Promise(
    (r, j) => fs.lstat(p, (e, stats) => e == null ? r(stats) : j(e))
);
export const isFilePath = async p => (await getPathStat(p)).isFile();
export const isDirPath = async p => (await getPathStat(p)).isDirectory();
export const createDir = p => new Promise(
    (r, j) => fs.mkdir(p, e => e == null ? r() : j(e))
);
export const ensureDirExists = async p => {
    if (!(await fileExists(p)) || !(await isDirPath(p))) await createDir(p);
};

export const readCliInput = async prompt => {
    const cli = readline.createInterface(process.stdin, process.stdout);
    const input = await new Promise(r => cli.question(prompt, r));
    cli.close();
    return input;
};
export const readIsCliInputYes = async prompt => comp(eq('y'), first, toLower)(await readCliInput(`${prompt} (y or N): `));
