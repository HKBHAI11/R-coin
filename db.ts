import { PrismaClient } from '@prisma/client';

/** Single shared client for the API process. Avoids connection pool exhaustion from multiple instances. */
export const db = new PrismaClient();
