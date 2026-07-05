import type { Account } from "../domain/account";
import type { AccountChanges, AccountRepository } from "../domain/account-repository";

type Dependencies = {
  accountRepository: AccountRepository;
};

type UpdateAccountInput = {
  familyId: string;
  id: string;
  changes: AccountChanges;
};

export const updateAccount = async (
  { accountRepository }: Dependencies,
  { familyId, id, changes }: UpdateAccountInput,
): Promise<Account> => {
  const existing = await accountRepository.findById(familyId, id);
  if (!existing) {
    throw new Error("Account not found");
  }

  return accountRepository.update(familyId, id, changes);
};
