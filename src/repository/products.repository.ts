import * as z from 'zod'
import { prisma, Prisma } from '../prisma.js'

import { ProductsRepository } from "./abstract.js";
import { productSchema, createProductInputSchema, getProductOutputSchema, getProductsInputSchema, updateProductInputSchema } from '../schemas/products.schema.js'
import { products } from "../data.js";
import type { DataWithMeta } from '../types.js';

type Product = z.output<typeof productSchema>

class ProductsRepositorySqlite extends ProductsRepository<false> {
    override async add(record: z.output<typeof createProductInputSchema>, imageUrl?: string | null
    ): Promise<Product> {
        const createdRecord = await prisma.product.create({
            data: {
                name: record.body.name,
                price: record.body.price,
                category: record.body.category,
                description: record.body.description ?? null,
                imageUrl: imageUrl ?? null,
                accountEmail: record.headers.authorization,
                archived: false
            }
        })

        return createdRecord as Product
    }

    override async getAll(input: z.output<typeof getProductsInputSchema>): Promise<DataWithMeta<Product>> {
        const { category, minPrice, maxPrice, page, limit } = input.query

        const where: Prisma.ProductWhereInput = {
            archived: false,
            price: {
                gte: minPrice,
                lte: maxPrice
            }
        }

        if (category) {
            where.category = category
        }

        const [total, items] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { id: 'desc' }
            })
        ])

        return {
            data: items as Product[],
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit) || 1
            }
        }
    }

    override async getOne(id: number): Promise<z.output<typeof getProductOutputSchema> | undefined> {
        const item = await prisma.product.findUnique({
            where: { id: Number(id) }
        })

        if (!item) return undefined
        return item as Product
    }

    override async update(
        id: number,
        record: z.output<typeof updateProductInputSchema>,
        imageUrl?: string | null
    ): Promise<Product | undefined> {
        const dataToUpdate: Prisma.ProductUpdateInput = {
            ...(record.body.name ? { name: record.body.name } : {}),
            ...(record.body.price !== undefined ? { price: record.body.price } : {}),
            ...(record.body.category ? { category: record.body.category } : {}),
            ...(record.body.description !== undefined ? { description: record.body.description } : {}),
            ...(imageUrl !== undefined ? { imageUrl } : {})
        }

        const updated = await prisma.product.update({
            where: { id: Number(id) },
            data: dataToUpdate
        })

        return updated as Product
    }

    override async delete(id: number): Promise<void> {
        await prisma.product.delete({
            where: { id: Number(id) }
        })
    }
}

class ProductsRepositoryMemory extends ProductsRepository<true> {
    private products: Product[];

    constructor() {
        super()
        this.products = products as Product[];
    }

    override getAll(input: z.output<typeof getProductsInputSchema>): DataWithMeta<Product> {
        const filteredData = this.products.filter((product) => {
            if (input.query.category && product.category !== input.query.category) {
                return false
            }
            return product.price >= input.query.minPrice && product.price <= input.query.maxPrice
        })

        const paginatedData = filteredData.slice((input.query.page - 1) * input.query.limit, input.query.page * input.query.limit)

        const meta = {
            total: filteredData.length,
            page: input.query.page,
            limit: input.query.limit,
            pages: Math.ceil(filteredData.length / input.query.limit) || 1,
        } 

        return { data: paginatedData, meta }
    }

    override getOne(id: number): z.output<typeof getProductOutputSchema> | undefined {
        return this.products.find(product => product.id === Number(id))
    }

    override add(record: z.output<typeof createProductInputSchema>, imageUrl?: string | null): Product {
        const lastId = this.products.at(-1)?.id ?? 0
        const newProd: Product = {
            id: lastId + 1,
            name: record.body.name,
            price: record.body.price,
            category: record.body.category,
            description: record.body.description ?? null,
            imageUrl: imageUrl ?? null,
            archived: false,
            accountEmail: record.headers.authorization,
            createdAt: new Date()
        }
        this.products.push(newProd)
        return newProd
    }

    override update(id: number, record: z.output<typeof updateProductInputSchema>, imageUrl?: string | null): Product | undefined {
        const index = this.products.findIndex(p => p.id === Number(id))
        if (index === -1) return undefined

        const existing = this.products[index]!
        const updated: Product = {
            id: existing.id,
            name: record.body.name ?? existing.name,
            price: record.body.price ?? existing.price,
            category: record.body.category ?? existing.category,
            description: record.body.description !== undefined ? record.body.description : existing.description,
            imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
            archived: existing.archived,
            accountEmail: existing.accountEmail,
            createdAt: existing.createdAt
        }

        this.products[index] = updated
        return updated
    }
    override delete(id: number): void {
        const recordIndex = this.products.findIndex(product => product.id === Number(id))

        if (recordIndex === -1) {
            this.products.splice(recordIndex, 1)
        } 
    }
}

export const productsRepository = !process.env['DATABASE_URL'] ? new ProductsRepositoryMemory() : new ProductsRepositorySqlite()