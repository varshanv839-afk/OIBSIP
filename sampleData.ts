import type { BookingPayload, SampleCredential, SeatClass } from '../types/reservation';

export const SAMPLE_CREDENTIALS: SampleCredential[] = [
  {
    username: 'admin',
    password: 'admin123',
    fullName: 'System Administrator',
    role: 'Station Master',
  },
  {
    username: 'passenger1',
    password: 'rail2026',
    fullName: 'Aarav Sharma',
    role: 'Passenger',
  },
  {
    username: 'oasis_intern',
    password: 'java123',
    fullName: 'Oasis Intern',
    role: 'Developer',
  },
];

export const SEAT_CLASS_INFO: Record<SeatClass, { label: string; multiplier: number }> = {
  '1AC': { label: 'First AC (1AC)', multiplier: 2.4 },
  '2AC': { label: 'AC 2-Tier (2AC)', multiplier: 1.65 },
  '3AC': { label: 'AC 3-Tier (3AC)', multiplier: 1.25 },
  SL: { label: 'Sleeper (SL)', multiplier: 1.0 },
  CC: { label: 'AC Chair Car (CC)', multiplier: 1.15 },
  EC: { label: 'Executive Chair (EC)', multiplier: 2.0 },
};

export function getTodayLocalISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateClassFare(baseFare: number, seatClass: SeatClass): number {
  const info = SEAT_CLASS_INFO[seatClass];
  return Math.round(baseFare * (info ? info.multiplier : 1.0) * 100) / 100;
}

export function validatePnrInput(pnr: string): string | null {
  const trimmed = pnr.trim().toUpperCase();
  if (!trimmed) {
    return 'PNR number cannot be empty.';
  }
  if (!/^PNR\d{7}$/.test(trimmed)) {
    return 'Invalid PNR format. Expected PNR followed by 7 digits (e.g. PNR1004521).';
  }
  return null;
}

export function validateBookingFields(
  fields: Omit<BookingPayload, 'bookedByUsername'>
): Record<string, string> {
  const errors: Record<string, string> = {};

  const passengerName = fields.passengerName.trim();
  if (!passengerName) {
    errors.passengerName = 'Passenger name is required.';
  } else if (passengerName.length < 2 || passengerName.length > 60) {
    errors.passengerName = 'Passenger name must be between 2 and 60 characters.';
  } else if (!/^[A-Za-z][A-Za-z .'-]*$/.test(passengerName)) {
    errors.passengerName = 'Passenger name may only contain letters, spaces, dots, apostrophes, and hyphens.';
  }

  const trainNumber = fields.trainNumber.trim();
  if (!trainNumber) {
    errors.trainNumber = 'Train number is required.';
  } else if (!/^\d{5}$/.test(trainNumber)) {
    errors.trainNumber = 'Train number must be exactly 5 digits (e.g. 12951).';
  }

  const trainName = fields.trainName.trim();
  if (!trainName) {
    errors.trainName = 'Train name is required.';
  } else if (trainName.length < 3) {
    errors.trainName = 'Train name must be at least 3 characters.';
  }

  const journeyDate = fields.journeyDate.trim();
  if (!journeyDate) {
    errors.journeyDate = 'Journey date is required.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(journeyDate)) {
    errors.journeyDate = 'Use YYYY-MM-DD date format.';
  } else if (journeyDate < getTodayLocalISO()) {
    errors.journeyDate = `Journey date cannot be in the past (${getTodayLocalISO()} or later required).`;
  }

  const source = fields.source.trim();
  if (!source) {
    errors.source = 'Source station is required.';
  } else if (source.length < 2 || !/^[A-Za-z][A-Za-z .()-]*$/.test(source)) {
    errors.source = 'Enter a valid source station name.';
  }

  const destination = fields.destination.trim();
  if (!destination) {
    errors.destination = 'Destination station is required.';
  } else if (destination.length < 2 || !/^[A-Za-z][A-Za-z .()-]*$/.test(destination)) {
    errors.destination = 'Enter a valid destination station name.';
  } else if (source && source.toLowerCase() === destination.toLowerCase()) {
    errors.destination = 'Destination station must differ from source station.';
  }

  if (!fields.seatClass) {
    errors.seatClass = 'Please select a travel class.';
  }

  return errors;
}
