import * as z from 'zod'

export const createAccountInputSchema = z.strictObject({
    email: z.email().min(3, "Email минимум 3 символа"),
    password: z.string().min(4, "Пароль минимум 4 символа"),
    role: z.enum(['user', 'moderator']).optional().default('user')
})

export const createProfileInputSchema = z.strictObject({
    bio: z.string().min(3, "Биография должна быть не менее 3 символов"),
    avatar: z.string().optional()
})