import * as z from 'zod'
import type { BaseEntity, DataWithMeta } from "../types.js";
import { productSchema, getProductOutputSchema, getProductsInputSchema, createProductInputSchema, updateProductInputSchema } from '../schemas/products.schema.js'
import { inputSchema } from '../schemas/common.schema.js';

type Product = z.output<typeof productSchema>
type GetProductOutput = z.output<typeof getProductOutputSchema>

abstract class BaseRepository<
    T extends BaseEntity,
    TSync,
    TGetAll = z.output<typeof inputSchema>,
    TAdd = z.output<typeof inputSchema>,
    TUpdate = z.output<typeof inputSchema>
> {
    abstract getAll(input: TGetAll): TSync extends true ? DataWithMeta<T> : Promise<DataWithMeta<T>>;
    abstract getOne(id: T['id']): TSync extends true ? Partial<T> | undefined : Promise<Partial<T> | undefined>;
    abstract add(record: TAdd, imageUrl?: string | null): TSync extends true ? Partial<T> : Promise<Partial<T>>;
    abstract update(id: T['id'], record: TUpdate, imageUrl?: string | null): TSync extends true ? Partial<T> | undefined : Promise<Partial<T> | undefined>;
    abstract delete(id: T['id']): TSync extends true ? void : Promise<void>;
}

export abstract class ProductsRepository<KSync> extends BaseRepository<
    Product,
    KSync,
    z.output<typeof getProductsInputSchema>,
    z.output<typeof createProductInputSchema>,
    z.output<typeof updateProductInputSchema>
> {
    abstract override getAll(input: z.output<typeof getProductsInputSchema>): KSync extends true ? DataWithMeta<Product> : Promise<DataWithMeta<Product>>;
    abstract override getOne(id: Product['id']): KSync extends true ? GetProductOutput | undefined : Promise<GetProductOutput | undefined>;
    abstract override add(record: z.output<typeof createProductInputSchema>, imageUrl?: string | null): KSync extends true ? Product : Promise<Product>;
    abstract override update(id: Product['id'], record: z.output<typeof updateProductInputSchema>, imageUrl?: string | null): KSync extends true ? Product | undefined : Promise<Product | undefined>;
    abstract override delete(id: Product['id']): KSync extends true ? void : Promise<void>;
}

// abstract class BaseRepository<T extends BaseEntity, TSync> {
//     abstract getAll(input: z.output<typeof inputSchema>): TSync extends true ? DataWithMeta<T> : Promise<DataWithMeta<T>>;
//     abstract getOne(id: T['id']): TSync extends true ? Partial<T> | undefined : Promise<Partial<T> | undefined>;
//     abstract add(record: z.output<typeof inputSchema>): TSync extends true ? Partial<T> : Promise<Partial<T>>;
//     // abstract update(id: T['id'], newRecord: Partial<T>): TSync extends true ? Partial<T> : Promise<Partial<T>>;
//     abstract delete(id: T['id']): TSync extends true ? void : Promise<void>;
// }

// export abstract class ProductsRepository<KSync> extends BaseRepository<Product, KSync> {
//     abstract override getAll(input: z.output<typeof getProductsInputSchema>): KSync extends true ? DataWithMeta<Product> : Promise<DataWithMeta<Product>>
//     abstract override getOne(id: Product['id']): KSync extends true ? GetProductOutput | undefined : Promise<GetProductOutput | undefined>;
//     abstract override add(record: z.output<typeof createProductInputSchema>): KSync extends true ? Partial<Product> : Promise<Partial<Product>>;
//     // abstract override update(id: Product['id'], newRecord: Partial<Product>): KSync extends true ? Partial<Product> : Promise<Partial<Product>>;
//     abstract override delete(id: Product['id']): KSync extends true ? void : Promise<void>;
// }
