import type { Transfer } from "../domain/transfer";
import type { TransferRepository } from "../domain/transfer-repository";

type Dependencies = {
  transferRepository: TransferRepository;
};

export const listTransfers = async (
  { transferRepository }: Dependencies,
  { familyId }: { familyId: string },
): Promise<Transfer[]> => {
  return transferRepository.findAllByFamily(familyId);
};
