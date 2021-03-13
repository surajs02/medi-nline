// Prefer ES6 imports as cleaner.

// SOMEDAY: These functions would be better with typing.

import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { FunctionAny, Last, Reverse } from './types';

export const identity = <T>(v: T, ...__: any[]): T => v;
export const tauto = (): boolean => true;
export const contra = (): boolean => false;
export const noop = (): null => null; // Prefer `null` for nil conditionals.
export const isNil = <T>(v: T): boolean => v == null;
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
export const negate = (p: (...args: any[]) => boolean = contra) => (...a: any[]): boolean => !p(...a); // NOTE: Cannot explicitly type as args can vary.
export const eq = <T>(v1: T) => (v2: T): boolean => v1 === v2;
export const valueType = <T>(v: T): string => typeof v;
export const isValueType = (_valueType: string) => <T>(v: T): boolean => typeof v === _valueType;

export const isBlankStr = (s = ''): boolean => s.trim().length < 1;
export const toLower = (s = ''): string => s.toLowerCase();
export const mapWords = (t: (char: string, i: number) => string = identity, delimiter = ' ') => (s = ''): string => s.split(delimiter).map(t).join(delimiter);
export const pluralize = (s = '', count = 1): string => count === 1 ? s : `${s}s`;
// Pluralizes words in `s` using a `wordMap` containing `word: count` entries (e.g.,
// `pluralizeWords({ page: pages.length })('fetched page')` returns 'fetched pages').
export const pluralizeWords = (wordMap: Record<string, number> = {}, t: (char: string, count: number) => string = pluralize) => (s = '') => mapWords(v => v in wordMap ? t(v, wordMap[v]) : v)(s);

// eslint-disable-next-line operator-linebreak
export const comp =
    <Fs extends FunctionAny[]>(...fns: Fs) =>
        (x: any) => {
            // TODO: Add typing to each function args/return for chain typing rather than final type?
            type _Reversed = Reverse<Fs>;
            type _Last = Last<_Reversed>;
            type _ReturnType = ReturnType<_Last extends FunctionAny ? _Last : any>;

            return [...fns].reverse().reduce( (a, v) => v(a), x) as _ReturnType;
        };

export const map = <T, U>(t: (v: T, i: number) => U) => (a: T[] = []): U[] => a.map(t);
export const filter = <T>(p: (v: T, i: number) => boolean = tauto) => (a: T[] = []): T[] => a.filter(p);
export const first = <T>(a: T[] = []): T => a[0];
export const tail = <T>(a: T[] = []) => {
    const [, ...rest] = a;
    return rest;
};
export const queue = <T>(v: T) => (a: T[] = []): T[] => [v, ...a];
// NOTE: Eslint doesn't understand recursion.
// eslint-disable-next-line no-unused-vars
export const shiftN = (n: number) => <T>(a: T[] = []): T[] => n < 1 ? a : shiftN(--n)(tail(a)); // DEPRECATED over cleaner `skip` but still a good ref.
export const skip = (n: number) => <T>(a: T[] = []) => a.slice(n);
export const take = (n: number) => <T>(a: T[] = []) => a.slice(0, n);
export const takePartition = (takeTo = 1, partitionFrom?: number) => <T>(a: T[] = []): [T[], T[]] => [a.slice(0, takeTo), a.slice(takeTo > 0 ? takeTo : partitionFrom, a.length)];
export const takeWhile = <T>(p: (v: T, arr: T[]) => boolean = contra) => (a: T[] = []) => {
    let res: T[] = [];
    while (a.length > 0 && p(a[0], a)) {
        res = res.concat(take(1)(a));
        a = skip(1)(a);
    }
    return res;
};
export const range = (end = 10, start = 0): number[] => [...Array<number>(end).keys()].map(n => n + start);
export const join = (delimiter = ',') => (a: string[] = []): string => a.join(delimiter);
export const count = <T>(a: T[] = []): number => a.length;
export const countIs = (n: number) => <T>(a: T[] = []): boolean => a.length === n;
export const countIsAny = <T>(a: T[] = []): boolean => a.length >= 1;
export const countIsNone = <T>(a: T[] = []): boolean => a.length <= 0;
export const difference = <T>(a1: T[] = []) => (a2: T[] = []): T[] => a2.filter(v => !a1.includes(v));
export const filterPartition = <T>(p: (v: T, i: number) => boolean = tauto) => (a: T[] = []) => [a.filter(p), a.filter(negate(p))];
export const fillRe = <T>(t: (v: T) => T = identity, count = 0) => (value: T, results: T[] = []): T[] => count < 1 ? results : fillRe(t, --count)(t(value), results.concat(value));

export const keys = <T>(o: Record<string, T> = {}): string[] => Object.keys(o);
export const values = <T>(o: Record<string, T> = {}): T[] => Object.values(o);
export const mapValues = <T, U>(t: (value: T, key: string) => T | U = identity) => (o: Record<string, T> = {}): Record<string, T | U> => Object.keys(o).reduce((a, k) => ({ ...a, [k]: t(o[k], k) }), {});
export const mapEntries = <T, U>(
    {
        setValue = identity,
        setKey = (__, k) => k,
        keep = tauto,
    }: {
        setValue?: (value: T, k: string, o: Record<string, T>) => T | U;
        setKey?: (value: T, key: string, o: Record<string, T>) => string;
        keep?: (value: T, k: string, o: Record<string, T>) => boolean;
    } = {}
) => (o: Record<string, T> = {}): Record<string, T | U> =>
    Object.keys(o).reduce(
        (a, k) => keep(o[k], k, a)
            ? ({ ...a, [setKey(o[k], k, a)]: setValue(o[k], k, a) })
            : a,
        {}
    );
export const filterEntries = (p = tauto) => (o = {}) => mapEntries({ keep: p })(o);
export const filterBlankEntries = (o = {}) => filterEntries(negate(isBlankStr))(o);
export const grab = (k: string) => <T>(o: Record<string, T> = {}): T => o[k];
export const delimitKeys = (delimiter = ',') => <T>(o: Record<string, T> = {}) => Object.keys(o).join(delimiter);
export const delimitValues = (delimiter = ',') => <T>(o: Record<string, T> = {}) => Object.values(o).join(delimiter); // TODO: String safety.

// Prefer `ife` aka IIFE to reduce parentheses.
export const ife = (f: FunctionAny = noop, ...a: []) => (() => f(...a))();
export const throwIf = <T>(p: (v: T) => boolean = tauto, m = 'No error message') => (v: T) => p(v)
    ? ife(() => {
        throw new Error(m);
    })
    : v;
export const tryOrD = (d: FunctionAny, { isVerbose = false }: { isVerbose?: boolean } = {}) => (f: FunctionAny) => {
    try {
        return f();
    } catch (e: unknown) {
        if (isVerbose) console.warn(`Tried [${f.name}] but failed, defaulting to [${d.name}]\n`, e);

        return d();
    }
};
export const tryOrDAsync = (d: FunctionAny, { isVerbose = false }: { isVerbose?: boolean } = {}) => async (f: FunctionAny) => {
    try {
        await f();
    } catch (e: unknown) {
        if (isVerbose) console.warn(`Tried [${f.name}] but failed, defaulting to [${d.name}]\n`, e);
        return d();
    }
};
export const log = (
    m: string,
    { logger = console.debug, t = identity }: { logger?: (m: string, ...a: any[]) => any; t?: (v: any) => any } = {}
) => (...a: any[]) => {
    logger(m, ...a.map(t));
    return a[0];
};

export const isIntLike = (v: string): boolean => {
    const _v = parseInt(v);
    return !isNaN(_v) && Number.isInteger(_v);
};
export const inc = (v: number): number => v + 1;

export const promiseMap = <T>(
    t: (value: T) => Promise<T> = v => Promise.resolve(v),
    { concurrency = Infinity, results = [] }: { concurrency?: number; results?: T[] } = {}
) => async (data: T[] = []): Promise<T[]> => {
    if (data.length < 1) return results;

    const [mappableData, nextData] = takePartition(concurrency)(data);
    const next = await Promise.all(mappableData.map(t));
    results = results.concat(next);

    // eslint-disable-next-line no-unused-vars
    return await promiseMap(
        t,
        {
            concurrency,
            results,
        }
    )(nextData);
};
// TODO: Support concurrency.
// Applies promise `handler` to `data` until `p` returns false or `data` no longer changes between iterations.
export const promiseWhile = <T>(handler: (value: T) => Promise<T> = v => Promise.resolve(v), p: (v: T) => boolean = contra, dataT: (value: T) => T = identity) => async (data: T): Promise<T> => {
    const r = await handler(data);
    const nextData = dataT(data);

    // eslint-disable-next-line no-unused-vars
    return p(r) && nextData !== data ? await promiseWhile(handler, p, dataT)(nextData) : r;
};

export const axiosGetData = async (url: string): Promise<any> => (await axios.get(url)).data;

export const querySelectorAllNodes = (s = '') => (html: string): [cheerio.Element[], cheerio.Root] => {
    const $ = cheerio.load(html);
    return [$(s).toArray(), $];
};

// NOTE: ES modules seem to lack `__filename` & __dirname`.
export const getFilename = (fileUrl: string): string => fileURLToPath(fileUrl);
export const getDirname = (filename: string): string => dirname(filename);
export const fileUrlToDirname = (fileUrl: string): string => getDirname(getFilename(fileUrl));
export const pathJoin = (...filenames: string[]) => (p: string): string => path.join(p, ...filenames);
export const fileExists = (p: string): Promise<boolean> =>
    new Promise(r => fs.access(
        p, fs.constants.F_OK, e => r(e == null)
    ));
// Overwrite.
export const fileWrite = (p: string, data: string): Promise<void> =>
    new Promise((r, j) => fs.writeFile(
        p, data, e => e != null ? j(e) : r()
    ));
export const getPathStat = (p: string): Promise<fs.Stats> => new Promise(
    (r, j) => fs.lstat(p, (e, stats) => e == null ? r(stats) : j(e))
);
export const isFilePath = async (p: string): Promise<boolean> => (await getPathStat(p)).isFile();
export const isDirPath = async (p: string): Promise<boolean> => (await getPathStat(p)).isDirectory();
export const createDir = (p: string): Promise<void> => new Promise(
    (r, j) => fs.mkdir(p, e => e == null ? r() : j(e))
);
export const ensureDirExists = async (p: string): Promise<void> => {
    if (!(await fileExists(p)) || !(await isDirPath(p))) await createDir(p);
};

export const readCliInput = async (prompt: string) => {
    const cli = readline.createInterface(process.stdin, process.stdout);
    const input = await new Promise(r => cli.question(prompt, r));
    cli.close();
    return input;
};
export const readIsCliInputYes = async (prompt: string): Promise<boolean> => comp(eq('y'), first, toLower)(await readCliInput(`${prompt} (y or N): `)) as unknown as Promise<boolean>;
