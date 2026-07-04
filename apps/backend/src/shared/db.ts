import { drizzle } from "drizzle-orm/d1";

export type Db = ReturnType<typeof drizzle>;

export const createDb = (d1: D1Database): Db => drizzle(d1);
