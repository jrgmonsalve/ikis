import type { Account } from "../domain/account";
import type { AccountRepository } from "../domain/account-repository";

type Dependencies = {
  accountRepository: AccountRepository;
};

export const listAccounts = async (
  { accountRepository }: Dependencies,
  { familyId }: { familyId: string },
): Promise<Account[]> => {
  return accountRepository.findAllByFamily(familyId);
};
