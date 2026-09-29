import path from 'node:path'
import { Router, type Request, type Response } from "express";
import multer from "multer";

const uploadMiddlewareMemory = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1024 * 1024 * 2 }
})

const uploadMiddlewareDisk = multer({
    storage: multer.diskStorage({
        destination: path.join(import.meta.dirname, '..', '..', 'assets', 'media'),
        filename: (_, file, callback) => {
            const extension = path.extname(file.originalname)
            const nameWithoutExtension = path.parse(file.originalname).name
            const name = `${nameWithoutExtension}_${Date.now()}${extension}`
            callback(null, name)
        }
    }),
    limits: { fileSize: 1024 * 1024 * 2 },
    fileFilter: (_, file, callback) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'text/plain']
        if (allowedMimeTypes.includes(file.mimetype)){
            callback(null, true)
        }
        callback(new Error('Недопустимый mimeType'))
    }
})


export const mediaRouter = Router()

mediaRouter.get('/media', (request: Request, response: Response) => {
    response.json()
})

mediaRouter.post('/media/upload', uploadMiddlewareDisk.single('document'), (request: Request, response: Response) => {
    console.log(request.file)
    response.end()
})