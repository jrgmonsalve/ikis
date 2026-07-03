import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { User } from "../../domain/user";
import type { NewUser, UserRepository } from "../../domain/user-repository";
import { users } from "./users.schema";

export class DrizzleUserRepository implements UserRepository {
  private readonly db: ReturnType<typeof drizzle>;

  constructor(d1: D1Database) {
    this.db = drizzle(d1);
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return row ?? null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return row ?? null;
  }

  async create(input: NewUser): Promise<User> {
    const row: User = {
      id: crypto.randomUUID(),
      familyId: null,
      createdAt: new Date(),
      ...input,
    };

    await this.db.insert(users).values(row);

    return row;
  }

  async assignFamily(userId: string, familyId: string): Promise<void> {
    await this.db.update(users).set({ familyId }).where(eq(users.id, userId));
  }
}
