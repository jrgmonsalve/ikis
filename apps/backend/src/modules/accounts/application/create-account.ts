import type { Account } from "../domain/account";
import type { AccountRepository, NewAccount } from "../domain/account-repository";

type Dependencies = {
  accountRepository: AccountRepository;
};

export const createAccount = async ({ accountRepository }: Dependencies, input: NewAccount): Promise<Account> => {
  return accountRepository.create(input);
};
