import type { User } from "./user";

export type NewUser = {
  googleId: string;
  email: string;
  name: string;
};

export interface UserRepository {
  findByGoogleId(googleId: string): Promise<User | null>;
  create(user: NewUser): Promise<User>;
}
