// Prefer ES6 imports as cleaner.

// SOMEDAY: These functions would be better with typing.

import axios from 'axios';
import cheerio from 'cheerio';

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
export const isBlankStr = (s = '') => s.trim().length < 1;

export const comp = (...fs) => x => fs.reverse().reduce((a, v) => v(a), x);
export const map = (t = identity) => (a = []) => a.map(t);
export const filter = (p = tauto) => (a = []) => a.filter(p);
export const first = (a = []) => a[0];
export const tail = ([, ...a]) => a;
export const negate = (p = noop) => (...a) => !p(...a);
// NOTE: Eslint doesn't understand recursion.
// eslint-disable-next-line no-unused-vars
export const shiftN = n => (a = []) => n < 1 ? a : shiftN(--n)(tail(a)); // DEPRECATED over `sliceN` but still a good ref.
export const sliceN = n => (a = []) => a.slice(n);
export const take = n => (a = []) => a.slice(0, n);
export const range = (end = 10, start = 0) => [...Array(end).keys()].map(n => n + start);
export const join = (delimiter = ',') => (a = []) => a.join(delimiter);

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
export const filterBlankEntries = (o = {}) => comp(delimitValues(), filterEntries(negate(isBlankStr)))(o);
export const grab = k => (o = {}) => o[k];
export const reduceEntries = (t, init = []) => (o = {}) => keys(o).reduce((a, k) => t(o[k], k, a), init);
export const delimitKeys = (delimiter = ',') => (o = {}) => reduceEntries((__, k, a) => a.concat(k))(o).join(delimiter);
export const delimitValues = (delimiter = ',') => (o = {}) => reduceEntries((v, __, a) => a.concat(v))(o).join(delimiter);

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
