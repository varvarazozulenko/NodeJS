import * as z from 'zod'

export const registerUserSchema = z.strictObject({
    email: z.email().min(3),
    password: z.string().min(4, "Пароль минимум 4 символа"),
    role: z.enum(['user', 'moderator']).optional().default('user')
})

export const createUserSchema = registerUserSchema

export const loginUserSchema = z.strictObject({
    email: z.email(),
    password: z.string()
})