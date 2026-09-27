import { deleteTransaction } from "../../transactions/application/delete-transaction";
import type { TransactionRepository } from "../../transactions/domain/transaction-repository";
import { assertValidPeriod } from "../domain/commitment";
import type { CommitmentRepository } from "../domain/commitment-repository";

type Dependencies = {
  commitmentRepository: CommitmentRepository;
  transactionRepository: TransactionRepository;
};

type UnmarkCommitmentPaidInput = {
  familyId: string;
  commitmentId: string;
  period: string;
};

export const unmarkCommitmentPaid = async (
  { commitmentRepository, transactionRepository }: Dependencies,
  { familyId, commitmentId, period }: UnmarkCommitmentPaidInput,
): Promise<void> => {
  assertValidPeriod(period);

  const commitment = await commitmentRepository.findById(familyId, commitmentId);
  if (!commitment) {
    throw new Error("Commitment not found");
  }

  const payment = await commitmentRepository.findPayment(familyId, commitmentId, period);
  if (!payment) {
    return;
  }

  try {
    await deleteTransaction({ transactionRepository }, { familyId, id: payment.transactionId });
  } catch (err) {
    if (!(err instanceof Error && err.message === "Transaction not found")) {
      throw err;
    }
  }

  await commitmentRepository.unmarkPaid(familyId, commitmentId, period);
};
