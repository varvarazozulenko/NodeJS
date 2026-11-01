import type { Request, Response, NextFunction } from "express"
import { treeifyError, ZodError } from "zod"
import jwt from "jsonwebtoken"
import { Prisma } from "../../generated/prisma/client.js"
import type { ErrorWithCode } from "../types.js"

export default function (error: ErrorWithCode, _: Request, response: Response, _next: NextFunction): void {
    console.error(error)

    if (error instanceof jwt.TokenExpiredError) {
        response.status(401).json({
            success: false,
            error: "Токен устарел"
        })
        return
    }

    if (error instanceof jwt.JsonWebTokenError) {
        response.status(401).json({
            success: false,
            error: "Токен не валиден"
        })
        return
    }

    if (error instanceof ZodError) {
        response.status(422).json({
            success: false,
            error: treeifyError(error)
        })
        return
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            response.status(409).json({
                success: false,
                error: "Пользователь с таким email уже существует"
            })
            return
        }
    }

    if (process.env['DEBUG']) {
        console.error(error.stack)
    }

    const parsed = Number(error.code)
    const status = (!isNaN(parsed) && parsed >= 400 && parsed <= 599) ? parsed : 400

    response.status(status).json({
        success: false,
        error: error.message || "Ошибка сервера"
    })
}