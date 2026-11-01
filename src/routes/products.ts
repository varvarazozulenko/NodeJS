import path from "node:path"
import fs from "node:fs"
import { Router, type Response } from "express"
import multer from "multer"
import * as z from 'zod'

import { prisma, Prisma } from "../prisma.js"
import { formatSuccess } from "../middleware/format-result.js"
import authenticate from "../middleware/authenticate.js"
import {
    getManyProductsInputSchema,
    createProductInputSchema,
    updateProductInputSchema
} from '../schemas/products.schema.js'
import type { RequestWithAuth } from "../types.js"

const uploadDir = path.join(process.cwd(), 'assets', 'uploads')
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (_request, _file, callback) => callback(null, uploadDir),
    filename: (_request, file, callback) => {
        const ext = path.extname(file.originalname)
        callback(null, `${Date.now()}_${Math.round(Math.random() * 1e5)}${ext}`)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
        if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
            callback(null, true)
        } else {
            callback(new Error('Разрешены только форматы JPEG и PNG'))
        }
    }
})

export const productsRouter = Router()

productsRouter.get('/', async (request: RequestWithAuth, response: Response) => {
    const input = z.parse(getManyProductsInputSchema, { query: request.query })
    const { category, creator, minPrice, maxPrice, page, limit } = input.query

    const where: Prisma.ProductWhereInput = {
        archived: false,
        price: { gte: minPrice, lte: maxPrice }
    }

    if (category) {
        where.category = category
    }

    if (creator) {
        where.account = { email: creator }
    }

    const [total, rawProducts] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { id: 'desc' },
            include: {
                account: {
                    select: { email: true }
                }
            }
        })
    ])

    const data = rawProducts.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        description: product.description,
        imageUrl: product.imageUrl,
        archived: product.archived,
        createdAt: product.createdAt,
        accountEmail: product.account.email
    }))

    const meta = {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1
    }

    formatSuccess(response, { data, meta }, "200")
})

productsRouter.get('/:id', authenticate, async (request: RequestWithAuth, response: Response) => {
    const id = Number(request.params['id'])
    if (isNaN(id)) {
        throw new Error('Некорректный ID товара')
    }

    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            account: {
                select: {
                    email: true,
                    profile: {
                        select: {
                            bio: true,
                            avatar: true
                        }
                    }
                }
            }
        }
    })

    if (!product) {
        const error = new Error('Товар не найден')
        // @ts-expect-error
        error.code = "404"
        throw error
    }

    const result = {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        description: product.description,
        imageUrl: product.imageUrl,
        archived: product.archived,
        createdAt: product.createdAt,
        accountEmail: product.account.email,
        profile: product.account.profile
    }

    formatSuccess(response, result, "200")
})

productsRouter.post('/', authenticate, upload.single('image'), async (request: RequestWithAuth, response: Response) => {
    const input = z.parse(createProductInputSchema, { body: request.body })
    const userId = request.user!.id

    const imageUrl = request.file ? `/static/${request.file.filename}` : null

    const product = await prisma.product.create({
        data: {
            name: input.body.name,
            price: input.body.price,
            category: input.body.category,
            description: input.body.description ?? null,
            imageUrl,
            accountId: userId
        },
        include: {
            account: { select: { email: true } }
        }
    })

    formatSuccess(response, { ...product, accountEmail: product.account.email }, "201")
})

productsRouter.patch('/:id', authenticate, upload.single('image'), async (request: RequestWithAuth, response: Response) => {
    const input = z.parse(updateProductInputSchema, {
        params: request.params,
        body: request.body
    })

    const productId = input.params.id
    const userId = request.user!.id
    const userRole = request.user!.role

    const existing = await prisma.product.findUnique({
        where: { id: productId }
    })

    if (!existing) {
        const error = new Error('Товар не найден')
        // @ts-expect-error
        error.code = "404"
        throw error
    }

    if (userRole !== 'moderator' && existing.accountId !== userId) {
        const error = new Error('Недостаточно прав')
        // @ts-expect-error
        error.code = "403"
        throw error
    }

    const imageUrl = request.file ? `/static/${request.file.filename}` : undefined

    const updated = await prisma.product.update({
        where: { id: productId },
        data: {
            ...(input.body.name ? { name: input.body.name } : {}),
            ...(input.body.price !== undefined ? { price: input.body.price } : {}),
            ...(input.body.category ? { category: input.body.category } : {}),
            ...(input.body.description !== undefined ? { description: input.body.description } : {}),
            ...(imageUrl !== undefined ? { imageUrl } : {})
        },
        include: {
            account: { select: { email: true } }
        }
    })

    formatSuccess(response, { ...updated, accountEmail: updated.account.email }, "200")
})