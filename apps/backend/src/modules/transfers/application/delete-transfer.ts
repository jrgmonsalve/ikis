import type { Account } from "../../accounts/domain/account";
import type { TransferRepository } from "../domain/transfer-repository";

type Dependencies = {
  transferRepository: TransferRepository;
};

type DeleteTransferInput = {
  familyId: string;
  id: string;
};

export const deleteTransfer = async (
  { transferRepository }: Dependencies,
  { familyId, id }: DeleteTransferInput,
): Promise<{ fromAccount: Account; toAccount: Account }> => {
  const existing = await transferRepository.findById(familyId, id);
  if (!existing) {
    throw new Error("Transfer not found");
  }

  return transferRepository.delete(familyId, id, existing);
};
