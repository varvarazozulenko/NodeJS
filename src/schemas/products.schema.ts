import * as z from "zod"
import { metaSchema } from "./common.schema.js"

export const categoryEnum = z.enum(['electronics', 'clothing', 'food', 'other'])

export const createProductInputSchema = z.object({
    body: z.strictObject({
        name: z.string().min(2).max(100),
        price: z.coerce.number().positive(),
        category: categoryEnum,
        description: z.string().max(500).optional().nullable(),
        // imageUrl: z.nullable(z.url()),
    }),
    headers: z.looseObject({
        authorization: z.string().min(3)
    }),
})

export const productSchema = z.object({
    id: z.number().positive().int(),
    name: z.string().min(2).max(100),
    price: z.number().positive(),
    category: categoryEnum,
    description: z.nullable(z.string().max(500)),
    imageUrl: z.nullable(z.string()),
    archived: z.boolean(),
    accountEmail: z.string().min(3),
    createdAt: z.date()
})

export const getProductOutputSchema = productSchema

export const getProductsInputSchema = z.object({
    query: z.object({
        category: z.optional(z.literal(['electronics', 'clothing', 'food', 'other'])),
        minPrice: z.optional(z.number().positive()).default(-Number.MAX_SAFE_INTEGER),
        maxPrice: z.optional(z.number().positive()).default(Number.MAX_SAFE_INTEGER),
        page: z.optional(z.number().positive().int()).default(1),
        limit: z.optional(z.number().positive().int()).default(10)
    }),
})

export const getProductsOutputSchema = z.array(productSchema)

export const getProductsWithMetaOutputSchema = z.object({
    data: getProductsOutputSchema,
    meta: metaSchema
})

export const getManyProductsInputSchema = z.object({
    query: z.object({
        category: categoryEnum.optional(),
        minPrice: z.coerce.number().positive().default(0),
        maxPrice: z.coerce.number().positive().default(Number.MAX_SAFE_INTEGER),
        page: z.coerce.number().positive().int().default(1),
        limit: z.coerce.number().positive().int().default(10)
    })
})

export const updateProductInputSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100).optional(),
        price: z.coerce.number().positive().optional(),
        category: categoryEnum.optional(),
        description: z.string().max(500).optional().nullable()
    }),
    params: z.object({
        id: z.coerce.number().int().positive()
    }),
    headers: z.looseObject({
        authorization: z.string().min(3)
    })
})