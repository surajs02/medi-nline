export interface IJson {
    [key: string]: any;
}

// https://github.com/microsoft/TypeScript/issues/15300
export type EnsureTypedIndexes<T> = { [K in keyof T]: T[K] }; // TODO: Review.