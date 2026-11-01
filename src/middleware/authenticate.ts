import { type NextFunction, type Response } from "express"
import jwt from 'jsonwebtoken'
import { type RequestWithAuth, type UserPayload } from "../types.js"

export default function authenticate(request: RequestWithAuth, _response: Response, next: NextFunction) {
    const authHeader = request.headers.authorization

    if (!authHeader) {
        return next(new Error('Отсутствует информация для аутентификации'))
    }

    const authString = authHeader.match(/^Bearer\s+(.*)$/)
    const accessToken = authString?.[1]

    if (!accessToken) {
        return next(new Error('Некорректный формат токена (ожидается Bearer <token>)'))
    }

    try {
        const payload = jwt.verify(accessToken, process.env.JWT_SECRET) as UserPayload
        request.user = payload
        next()
    } catch (err) {
        next(err)
    }
}