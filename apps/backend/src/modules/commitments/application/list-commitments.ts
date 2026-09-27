import type { Commitment } from "../domain/commitment";
import type { CommitmentRepository } from "../domain/commitment-repository";

type Dependencies = {
  commitmentRepository: CommitmentRepository;
};

export const listCommitments = async (
  { commitmentRepository }: Dependencies,
  { familyId }: { familyId: string },
): Promise<Commitment[]> => {
  return commitmentRepository.findAllByFamily(familyId);
};
