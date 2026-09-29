import * as z from 'zod'
import type { Request, Response, NextFunction } from "express"
import { MulterError } from "multer"
import { formatError } from "../lib/format-result.js"

const errorHandler = (
    error: Error,
    _: Request,
    response: Response,
    __: NextFunction
) => {
    if (error instanceof z.ZodError) {
        formatError(response, "Ошибка валидации входных данных", 422, error.issues)
        return
    }
    if (error instanceof MulterError) {
        formatError(response, `Ошибка загрузки файла: ${error.message}`, 400)
        return
    }
    formatError(response, error.message || "Внутренняя ошибка сервера", 400)
}

export default errorHandler