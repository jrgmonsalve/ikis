import type { Family } from "./family";

export type NewFamily = {
  name: string;
};

export interface FamilyRepository {
  create(family: NewFamily): Promise<Family>;
}
