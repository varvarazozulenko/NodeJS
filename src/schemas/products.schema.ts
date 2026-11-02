import * as z from "zod"
import { metaSchema } from "./common.schema.js"

export const categoryEnum = z.enum(['electronics', 'clothing', 'food', 'other'])

export const getManyProductsInputSchema = z.object({
    query: z.object({
        category: categoryEnum.optional(),
        creator: z.string().optional(),
        minPrice: z.coerce.number().positive().default(0),
        maxPrice: z.coerce.number().positive().default(Number.MAX_SAFE_INTEGER),
        page: z.coerce.number().positive().int().default(1),
        limit: z.coerce.number().positive().int().default(10)
    })
})

export const createProductInputSchema = z.object({
    body: z.object({
        name: z.string().min(2).max(100),
        price: z.coerce.number().positive(), 
        category: z.enum(['electronics', 'clothing', 'food', 'other']),
        description: z.string().max(500).optional().nullable()
    })
})

export const updateProductInputSchema = z.object({
    params: z.object({
        id: z.coerce.number().int().positive()
    }),
    body: z.object({
        name: z.string().min(2).max(100).optional(),
        price: z.coerce.number().positive().optional(),
        category: categoryEnum.optional(),
        description: z.string().max(500).optional().nullable()
    })
})

export const productSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    price: z.number(),
    category: categoryEnum,
    description: z.string().nullable(),
    imageUrl: z.string().nullable(),
    archived: z.boolean(),
    createdAt: z.date(),
    accountId: z.number()
})

export const getProductOutputSchema = productSchema.extend({
    email: z.email()
})

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
