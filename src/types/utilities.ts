export type SetOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Simplify<T> = { [K in keyof T]: T[K] } & {};
