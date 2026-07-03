import type { User } from "./user";

export type NewUser = {
  googleId: string;
  email: string;
  name: string;
};

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  create(user: NewUser): Promise<User>;
  assignFamily(userId: string, familyId: string): Promise<void>;
}
