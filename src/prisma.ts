import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient, Prisma } from "../generated/prisma/client.js";

const connectionString = process.env['DATABASE_URL'];

if (!connectionString) {
    throw new Error('Данные для подключения отсутствуют')
}

const adapter = new PrismaBetterSqlite3({ url: connectionString });

export const prisma = new PrismaClient({ adapter });
export { Prisma }