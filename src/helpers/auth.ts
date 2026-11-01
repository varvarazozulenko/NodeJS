import { scrypt } from 'node:crypto'
import jwt from 'jsonwebtoken'
import type { UserPayload } from '../types.js'

export const hashPassword = (password: string): Promise<string> => new Promise((resolve, reject) => {
    const salt = process.env.SALT || 'default-salt-key-minimum-16-bytes'
    scrypt(password, salt, 32, (error, result) => {
        if (error) {
            reject(error)
            return
        }
        resolve(result.toString('hex'))
    })
})

export const generateTokens = (payload: UserPayload) => {
    const secret = process.env.JWT_SECRET

    if (!secret) {
        throw new Error('JWT_SECRET не задан в переменных окружения .env')
    }

    const accessToken = jwt.sign(payload, secret, { expiresIn: "15m" })
    const refreshToken = jwt.sign(payload, secret, { expiresIn: "2d" })

    return { accessToken, refreshToken }
}