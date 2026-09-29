import type { Request, Response, NextFunction } from 'express'
import * as z from 'zod'

type Kind = "body" | "query"

export interface ValidatedRequest<B = any, Q = any> extends Request {
    bodyParsed?: B
    queryParsed?: Q
}

export default function validate(schema: z.ZodType, kind: Kind) {
    return (request: ValidatedRequest, _: Response, next: NextFunction) => {
        const result = schema.safeParse(request[kind])

        if (!result.success) {
            next(result.error)
            return
        }

        if (kind === "body") {
            request.bodyParsed = result.data
        } else {
            request.queryParsed = result.data
        }

        next()
    }
}