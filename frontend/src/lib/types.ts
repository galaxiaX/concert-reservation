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

export interface Concert {
  id: string;
  name: string;
  description: string;
  totalSeats: number;
  availableSeats: number;
  isReservedByCurrentUser: boolean;
  reservationId: string | null;
}

export interface AdminStats {
  totalSeats: number;
  reserved: number;
  canceled: number;
}
