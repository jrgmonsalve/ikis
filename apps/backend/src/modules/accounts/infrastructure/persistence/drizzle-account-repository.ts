import { and, eq } from "drizzle-orm";
import type { Db } from "../../../../shared/db";
import type { Account } from "../../domain/account";
import type { AccountChanges, AccountRepository, NewAccount } from "../../domain/account-repository";
import { accounts } from "./accounts.schema";

export class DrizzleAccountRepository implements AccountRepository {
  constructor(private readonly db: Db) {}

  async findById(familyId: string, id: string): Promise<Account | null> {
    const [row] = await this.db
      .select()
      .from(accounts)
      .where(and(eq(accounts.familyId, familyId), eq(accounts.id, id)))
      .limit(1);
    return row ?? null;
  }

  async findAllByFamily(familyId: string): Promise<Account[]> {
    return this.db.select().from(accounts).where(eq(accounts.familyId, familyId));
  }

  async create(input: NewAccount): Promise<Account> {
    const row: Account = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      balance: 0,
      currency: input.currency ?? "COP",
      familyId: input.familyId,
      name: input.name,
      type: input.type,
    };

    await this.db.insert(accounts).values(row);

    return row;
  }

  async update(familyId: string, id: string, changes: AccountChanges): Promise<Account> {
    await this.db
      .update(accounts)
      .set(changes)
      .where(and(eq(accounts.familyId, familyId), eq(accounts.id, id)));

    const updated = await this.findById(familyId, id);
    if (!updated) {
      throw new Error("Account not found");
    }

    return updated;
  }
}
