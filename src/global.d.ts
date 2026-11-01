declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DEBUG?: string
            SALT: string
            DATABASE_URL?: string
            JWT_SECRET: string
        }
    }
}

export { }