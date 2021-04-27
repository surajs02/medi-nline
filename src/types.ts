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
