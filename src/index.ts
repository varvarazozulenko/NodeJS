import express, { type Request, type Response } from 'express'
import path from 'node:path'

import logger from './middleware/logging.js'
import errorHandler from './middleware/error-handling.js'
import { productsRouter } from './routes/products.js'

const app = express()

const staticMediaFolder = path.join(process.cwd(), 'assets', 'media')
app.use('/media', express.static(staticMediaFolder))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(logger)

app.use('/api/products', productsRouter)

app.get('/', (_: Request, res: Response) => {
    res.json({ message: "API каталога товаров работает" })
})

app.use((_: Request, response: Response) => {
    response.status(404).json({
        success: false,
        error: "Ресурс не найден"
    })
})

app.use(errorHandler)

app.listen(3000, () => {
    console.log()
})