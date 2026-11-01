import { type NextFunction, type Response } from "express"
import { type RequestWithAuth } from "../types.js"

type Operation = 'delete' | 'create' | 'edit' | 'read'
type Resource = 'account' | 'products' // TODO добавить products

type Permission = `${Operation}:${Resource}`
type Role = 'user' | 'moderator' | 'guest'

type Permissions = Record<Permission, Role[]>

const PERMISSIONS: Permissions = {
    'create:account': ['moderator', 'guest'],
    'edit:account': ['moderator'],
    'read:account': ['moderator'],
    'delete:account': ['moderator'],

    'create:products': ['user', 'moderator'],
    'read:products': ['user', 'moderator'],
    'edit:products': ['user', 'moderator'],
    'delete:products': ['user', 'moderator'],
}

export default function authorize(rule: Permission) {
    return (request: RequestWithAuth, _response: Response, next: NextFunction) => {
        const role: Role = request.user?.role ?? 'guest'
        const hasRights = PERMISSIONS[rule].includes(role)

        if (!hasRights) {
            const error = new Error('Недостаточно прав')
            // @ts-expect-error статус-код 403 Forbidden
            error.code = "403"
            return next(error) 
        }

        next()
    }
}

