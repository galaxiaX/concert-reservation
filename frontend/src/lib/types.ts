export type Role = "ADMIN" | "USER";

export type ReservationStatus = "ACTIVE" | "CANCELED";

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

/** User's own reservation history row (`GET /me/reservations`). Dates are ISO strings over JSON. */
export interface MyReservation {
  id: string;
  concertName: string;
  status: ReservationStatus;
  reservedAt: string;
  canceledAt: string | null;
}

/** Admin audit-log row — one per reserve and per cancel (`GET /admin/reservations`). */
export interface AuditLogRow {
  datetime: string;
  username: string;
  concertName: string;
  action: "Reserve" | "Cancel";
}
