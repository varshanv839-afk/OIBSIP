export type ReservationStatus = 'CONFIRMED' | 'CANCELLED';

export type SeatClass = '1AC' | '2AC' | '3AC' | 'SL' | 'CC' | 'EC';

export interface UserAccount {
  username: string;
  fullName: string;
  role: string;
}

export interface SampleCredential {
  username: string;
  password: string;
  fullName: string;
  role: string;
}

export interface Train {
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  availableClasses: SeatClass[];
  baseFare: number;
}

export interface Reservation {
  pnrNumber: string;
  passengerName: string;
  trainNumber: string;
  trainName: string;
  journeyDate: string;
  source: string;
  destination: string;
  seatClass: SeatClass;
  fare: number;
  bookedByUsername: string;
  bookedAt: string;
  status: ReservationStatus;
  cancelledAt: string | null;
}

export interface BookingPayload {
  passengerName: string;
  trainNumber: string;
  trainName: string;
  journeyDate: string;
  source: string;
  destination: string;
  seatClass: SeatClass;
  bookedByUsername: string;
}

export interface JavaSourceFile {
  name: string;
  relativePath: string;
  description: string;
  content: string;
}

export type ActivePage = 'home' | 'book' | 'lookup' | 'cancel' | 'java';
