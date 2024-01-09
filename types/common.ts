export type MaybePromise<T> = T | Promise<T>;

export type ArrayItem<Array extends any[]> = Array extends (infer Item)[] ? Item : never;
