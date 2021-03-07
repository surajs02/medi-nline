export interface IJson {
    [key: string]: any;
}
export interface Product {
    name: string;
    price: string;
    retailPrice?: string;
}

// https://github.com/microsoft/TypeScript/issues/15300
export type EnsureTypedIndexes<T> = { [K in keyof T]: T[K] }; // TODO: Review.

export type FunctionAny = (...args: any[]) => any;

export type Last<T extends any[]> = T extends [...(infer H), infer L] ? L : never;
export type Reverse<T extends any[]> = T extends [infer H, ...( infer Tail )]
    ? [...Reverse<Tail>, H]
    : [];
