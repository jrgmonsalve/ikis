import { describe, expect, it } from "vitest";
import { listUpcomingCommitments } from "../../../../src/modules/commitments/application/list-upcoming-commitments";
import { InMemoryCommitmentRepository } from "../in-memory-commitment-repository";

describe("listUpcomingCommitments", () => {
  it("includes a commitment due within the window", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();
    await commitmentRepository.create({ familyId: "family-1", name: "Arriendo", amountLimit: 800000, dueDay: 28, accountId: "acc-1" });

    const upcoming = await listUpcomingCommitments(
      { commitmentRepository },
      { familyId: "family-1", today: "2026-09-26", withinDays: 7 },
    );

    expect(upcoming).toHaveLength(1);
    expect(upcoming[0]?.dueDate).toBe("2026-09-28");
    expect(upcoming[0]?.daysUntil).toBe(2);
  });

  it("excludes a commitment due far outside the window", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();
    await commitmentRepository.create({ familyId: "family-1", name: "Arriendo", amountLimit: 800000, dueDay: 28, accountId: "acc-1" });

    const upcoming = await listUpcomingCommitments(
      { commitmentRepository },
      { familyId: "family-1", today: "2026-09-01", withinDays: 7 },
    );

    expect(upcoming).toHaveLength(0);
  });

  it("keeps showing an unpaid commitment as overdue past its due date", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();
    const commitment = await commitmentRepository.create({ familyId: "family-1", name: "Arriendo", amountLimit: 800000, dueDay: 5, accountId: "acc-1" });
    commitment.createdAt = new Date("2026-08-01T00:00:00Z");

    const upcoming = await listUpcomingCommitments(
      { commitmentRepository },
      { familyId: "family-1", today: "2026-09-20", withinDays: 7 },
    );

    expect(upcoming).toHaveLength(1);
    expect(upcoming[0]?.daysUntil).toBe(-15);
  });

  it("starts a freshly created commitment at next month when this month's due day already passed", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();
    const commitment = await commitmentRepository.create({ familyId: "family-1", name: "Credito lulo", amountLimit: 1550000, dueDay: 9, accountId: "acc-1" });
    commitment.createdAt = new Date("2026-09-27T00:00:00Z");

    const upcoming = await listUpcomingCommitments(
      { commitmentRepository },
      { familyId: "family-1", today: "2026-09-27", withinDays: 30 },
    );

    expect(upcoming).toHaveLength(1);
    expect(upcoming[0]?.period).toBe("2026-10");
    expect(upcoming[0]?.dueDate).toBe("2026-10-09");
    expect(upcoming[0]?.daysUntil).toBeGreaterThan(0);
  });

  it("rolls forward to next month once the current period is marked paid", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();
    const commitment = await commitmentRepository.create({ familyId: "family-1", name: "Arriendo", amountLimit: 800000, dueDay: 28, accountId: "acc-1" });
    await commitmentRepository.markPaid("family-1", commitment.id, "2026-09", "tx-1");

    const upcoming = await listUpcomingCommitments(
      { commitmentRepository },
      { familyId: "family-1", today: "2026-09-26", withinDays: 7 },
    );

    expect(upcoming).toHaveLength(0);

    const nextMonthView = await listUpcomingCommitments(
      { commitmentRepository },
      { familyId: "family-1", today: "2026-10-25", withinDays: 7 },
    );
    expect(nextMonthView).toHaveLength(1);
    expect(nextMonthView[0]?.period).toBe("2026-10");
    expect(nextMonthView[0]?.dueDate).toBe("2026-10-28");
  });

  it("excludes archived commitments", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();
    const commitment = await commitmentRepository.create({ familyId: "family-1", name: "Gimnasio", amountLimit: 60000, dueDay: 28, accountId: "acc-1" });
    await commitmentRepository.update("family-1", commitment.id, { archivedAt: new Date() });

    const upcoming = await listUpcomingCommitments(
      { commitmentRepository },
      { familyId: "family-1", today: "2026-09-26", withinDays: 7 },
    );

    expect(upcoming).toHaveLength(0);
  });

  it("sorts by proximity, most urgent first", async () => {
    const commitmentRepository = new InMemoryCommitmentRepository();
    const luz = await commitmentRepository.create({ familyId: "family-1", name: "Luz", amountLimit: 100000, dueDay: 30, accountId: "acc-1" });
    const agua = await commitmentRepository.create({ familyId: "family-1", name: "Agua", amountLimit: 50000, dueDay: 27, accountId: "acc-1" });
    luz.createdAt = new Date("2026-08-01T00:00:00Z");
    agua.createdAt = new Date("2026-08-01T00:00:00Z");

    const upcoming = await listUpcomingCommitments(
      { commitmentRepository },
      { familyId: "family-1", today: "2026-09-26", withinDays: 7 },
    );

    expect(upcoming.map((c) => c.name)).toEqual(["Agua", "Luz"]);
  });
});
