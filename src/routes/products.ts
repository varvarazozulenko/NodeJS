import { Router, type Request, type Response, type NextFunction } from "express"
import path from "node:path"
import fs from "node:fs"
import multer from "multer"
import * as z from 'zod'

import { productsRepository } from "../repository/products.repository.js"
import { formatSuccess, formatError } from "../middleware/format-result.js"
import { getManyProductsInputSchema, getProductsWithMetaOutputSchema, createProductInputSchema, updateProductInputSchema, getProductOutputSchema } from '../schemas/products.schema.js'


const uploadDir = path.join(process.cwd(), 'assets', 'uploads')
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir)
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `${Date.now()}_${Math.round(Math.random() * 1e5)}${ext}`)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 МБ
    fileFilter: (_req, file, callback) => {
        if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
            callback(null, true)
        } else {
            callback(new Error('Разрешен только формат JPEG и PNG'))
        }
    }
})

export const productsRouter = Router()

productsRouter.get('/', async (request: Request, response: Response, next: NextFunction) => {
    try {
        const input = z.parse(getManyProductsInputSchema, { query: request.query })
        const { data, meta } = await productsRepository.getAll(input)

        const responseData = getProductsWithMetaOutputSchema.parse({ data, meta })
        formatSuccess(response, responseData, "200")
    } catch (error) {
        next(error)
    }
})

productsRouter.get('/:id', async (request: Request, response: Response, next: NextFunction) => {
    try {
        const id = Number(request.params['id'])
        if (isNaN(id)) {
            formatError(response, "Некорректный ID", "400")
            return
        }

        const product = await productsRepository.getOne(id)
        if (!product) {
            formatError(response, "Товар не найден", "404")
            return
        }

        const responseData = getProductOutputSchema.parse(product)
        formatSuccess(response, responseData, "200")
    } catch (error) {
        next(error)
    }
})

productsRouter.post('/', upload.single('image'), async (request: Request, response: Response, next: NextFunction) => {
    try {
        const input = z.parse(createProductInputSchema, {
            body: request.body,
            headers: request.headers
        })

        const imageUrl = request.file ? `/static/${request.file.filename}` : null
        const createdProduct = await productsRepository.add(input, imageUrl)

        const responseData = getProductOutputSchema.parse(createdProduct)
        formatSuccess(response, responseData, "201")
    } catch (error) {
        next(error)
    }
})

productsRouter.patch('/:id', upload.single('image'), async (request: Request, response: Response, next: NextFunction) => {
    try {
        const input = z.parse(updateProductInputSchema, {
            body: request.body,
            params: request.params,
            headers: request.headers
        })

        const existing = await productsRepository.getOne(input.params.id)
        if (!existing) {
            formatError(response, "Товар не найден", "404")
            return
        }
        
        const imageUrl = request.file ? `/static/${request.file.filename}` : undefined
        const updated = await productsRepository.update(input.params.id, input, imageUrl)

        const responseData = getProductOutputSchema.parse(updated!)
        formatSuccess(response, responseData, "200")
    } catch (error) {
        next(error)
    }
})