export type Role = "ADMIN" | "USER";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResult {
  accessToken: string;
  user: AuthUser;
}
