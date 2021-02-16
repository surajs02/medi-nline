// Prefer ES6 imports as cleaner.

import axios from 'axios';
import cheerio from 'cheerio';

export const identity = v => v;
export const noop = () => null; // Prefer null for nil conditionals.

export const comp = (...fs) => x => fs.reverse().reduce((a, v) => v(a), x);
export const map = (t = identity) => (a = []) => a.map(t);
export const first = (a = []) => a[0];
export const tail = ([, ...a]) => a;
export const negate = (p = noop) => (...a) => !p(a);
// eslint-disable-next-line no-unused-vars
export const shiftN = n => (a = []) => n < 1 ? a : shiftN(--n)(tail(a));

export const range = (end = 10, start = 0) => [...Array(end).keys()].map(n => n + start);

export const keys = (o = {}) => Object.keys(o);
export const values = (o = {}) => Object.values(o);
export const mapValues = (t = identity) => (o = {}) => keys(o).reduce((a, k) => ({ ...a, [k]: t(o[k], k) }), {});
export const grab = k => (o = {}) => o[k];

// Prefer `ife` aka IIFE to reduce parentheses.
export const ife = (f = noop, ...a) => (() => f(...a))();
export const throwIf = (p = () => true, m = 'No error message') => v => p()
    ? ife(() => {
        throw new Error(m);
    })
    : v;

export const isPositive = (n = 1) => n > 0;
export const isIntLike = v => {
    const _v = parseInt(v);
    return !isNaN(_v) && Number.isInteger(_v);
};

export const axiosGetData = async url => (await axios.get(url)).data;

export const querySelectorAllNodes = (s = '') => html => {
    const $ = cheerio.load(html);
    return [$(s).toArray(), $];
};
