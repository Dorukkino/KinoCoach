import { UserRole } from "@/domain/value-objects/UserRole";
import { AccountStatus } from "./IAuthService";

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  accountStatus: AccountStatus;
}

export interface IUserRepository {
  findById(id: string): Promise<UserProfile | null>;
  findByEmail(email: string): Promise<UserProfile | null>;
  create(profile: {
    id: string;
    email: string;
    role: UserRole;
    fullName: string;
  }): Promise<UserProfile>;
  updateRole(id: string, role: UserRole): Promise<void>;
}
