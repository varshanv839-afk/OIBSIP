import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  BookingPayload,
  JavaSourceFile,
  Reservation,
  SeatClass,
  Train,
} from './src/types/reservation.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const RESERVATIONS_FILE = path.join(DATA_DIR, 'reservations.json');

interface StoredUser {
  username: string;
  password: string;
  fullName: string;
  role: string;
}

const SAMPLE_USERS: StoredUser[] = [
  { username: 'admin', password: 'admin123', fullName: 'System Administrator', role: 'Station Master' },
  { username: 'passenger1', password: 'rail2026', fullName: 'Aarav Sharma', role: 'Passenger' },
  { username: 'oasis_intern', password: 'java123', fullName: 'Oasis Intern', role: 'Developer' },
];

const SAMPLE_TRAINS: Train[] = [
  {
    trainNumber: '12951',
    trainName: 'Mumbai Rajdhani Express',
    source: 'New Delhi',
    destination: 'Mumbai Central',
    departureTime: '16:55',
    arrivalTime: '08:35',
    duration: '15h 40m',
    availableClasses: ['1AC', '2AC', '3AC'],
    baseFare: 1850,
  },
  {
    trainNumber: '12002',
    trainName: 'Bhopal Shatabdi Express',
    source: 'New Delhi',
    destination: 'Bhopal Jn',
    departureTime: '06:00',
    arrivalTime: '14:25',
    duration: '08h 25m',
    availableClasses: ['EC', 'CC'],
    baseFare: 1120,
  },
  {
    trainNumber: '12301',
    trainName: 'Howrah Rajdhani Express',
    source: 'Howrah Jn',
    destination: 'New Delhi',
    departureTime: '16:50',
    arrivalTime: '10:05',
    duration: '17h 15m',
    availableClasses: ['1AC', '2AC', '3AC'],
    baseFare: 1980,
  },
  {
    trainNumber: '12627',
    trainName: 'Karnataka Express',
    source: 'Bengaluru City',
    destination: 'New Delhi',
    departureTime: '19:20',
    arrivalTime: '09:00',
    duration: '37h 40m',
    availableClasses: ['2AC', '3AC', 'SL'],
    baseFare: 940,
  },
  {
    trainNumber: '22691',
    trainName: 'Bengaluru Rajdhani Express',
    source: 'Bengaluru City',
    destination: 'Hazrat Nizamuddin',
    departureTime: '20:00',
    arrivalTime: '05:30',
    duration: '33h 30m',
    availableClasses: ['1AC', '2AC', '3AC'],
    baseFare: 2150,
  },
  {
    trainNumber: '11077',
    trainName: 'Jhelum Express',
    source: 'Pune Jn',
    destination: 'Jammu Tawi',
    departureTime: '17:20',
    arrivalTime: '10:15',
    duration: '40h 55m',
    availableClasses: ['2AC', '3AC', 'SL'],
    baseFare: 780,
  },
  {
    trainNumber: '12245',
    trainName: 'Yesvantpur Duronto Express',
    source: 'Howrah Jn',
    destination: 'Yesvantpur',
    departureTime: '10:50',
    arrivalTime: '16:00',
    duration: '29h 10m',
    availableClasses: ['1AC', '2AC', '3AC', 'SL'],
    baseFare: 1420,
  },
  {
    trainNumber: '12430',
    trainName: 'Lucknow AC Superfast',
    source: 'New Delhi',
    destination: 'Lucknow',
    departureTime: '23:25',
    arrivalTime: '07:25',
    duration: '08h 00m',
    availableClasses: ['1AC', '2AC', '3AC', 'CC'],
    baseFare: 890,
  },
];

const VALID_CLASSES: SeatClass[] = ['1AC', '2AC', '3AC', 'SL', 'CC', 'EC'];

function getFutureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function calculateFare(baseFare: number, seatClass: SeatClass): number {
  switch (seatClass) {
    case '1AC':
      return Math.round(baseFare * 2.4 * 100) / 100;
    case 'EC':
      return Math.round(baseFare * 2.0 * 100) / 100;
    case '2AC':
      return Math.round(baseFare * 1.65 * 100) / 100;
    case '3AC':
      return Math.round(baseFare * 1.25 * 100) / 100;
    case 'CC':
      return Math.round(baseFare * 1.15 * 100) / 100;
    default:
      return baseFare;
  }
}

function ensureStoreInitialized(): Reservation[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(RESERVATIONS_FILE)) {
    const initial: Reservation[] = [
      {
        pnrNumber: 'PNR1004521',
        passengerName: 'Priya Nair',
        trainNumber: '12951',
        trainName: 'Mumbai Rajdhani Express',
        journeyDate: getFutureDate(10),
        source: 'New Delhi',
        destination: 'Mumbai Central',
        seatClass: '2AC',
        fare: 3052.5,
        bookedByUsername: 'passenger1',
        bookedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        status: 'CONFIRMED',
        cancelledAt: null,
      },
      {
        pnrNumber: 'PNR1004522',
        passengerName: 'Rohan Verma',
        trainNumber: '12002',
        trainName: 'Bhopal Shatabdi Express',
        journeyDate: getFutureDate(15),
        source: 'New Delhi',
        destination: 'Bhopal Jn',
        seatClass: 'CC',
        fare: 1288,
        bookedByUsername: 'oasis_intern',
        bookedAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'CONFIRMED',
        cancelledAt: null,
      },
    ];
    fs.writeFileSync(RESERVATIONS_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(RESERVATIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveReservations(list: Reservation[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(RESERVATIONS_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function validateBookingPayload(payload: Partial<BookingPayload>): Record<string, string> {
  const errors: Record<string, string> = {};

  const passengerName = (payload.passengerName ?? '').trim();
  if (!passengerName) {
    errors.passengerName = 'Passenger name is required.';
  } else if (passengerName.length < 2 || passengerName.length > 60) {
    errors.passengerName = 'Passenger name must be between 2 and 60 characters.';
  } else if (!/^[A-Za-z][A-Za-z .'-]*$/.test(passengerName)) {
    errors.passengerName = 'Passenger name may only contain letters, spaces, dots, apostrophes, and hyphens.';
  }

  const trainNumber = (payload.trainNumber ?? '').trim();
  if (!trainNumber) {
    errors.trainNumber = 'Train number is required.';
  } else if (!/^\d{5}$/.test(trainNumber)) {
    errors.trainNumber = 'Train number must be exactly 5 digits (e.g. 12951).';
  }

  const trainName = (payload.trainName ?? '').trim();
  if (!trainName) {
    errors.trainName = 'Train name is required.';
  } else if (trainName.length < 3) {
    errors.trainName = 'Train name must be at least 3 characters.';
  }

  const journeyDate = (payload.journeyDate ?? '').trim();
  if (!journeyDate) {
    errors.journeyDate = 'Journey date is required.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(journeyDate)) {
    errors.journeyDate = 'Journey date must follow YYYY-MM-DD format.';
  } else {
    const [y, m, d] = journeyDate.split('-').map(Number);
    const parsed = new Date(Date.UTC(y, m - 1, d));
    const isRealDate =
      parsed.getUTCFullYear() === y &&
      parsed.getUTCMonth() === m - 1 &&
      parsed.getUTCDate() === d;
    if (!isRealDate) {
      errors.journeyDate = 'Please enter a valid calendar date.';
    } else if (journeyDate < getTodayDate()) {
      errors.journeyDate = `Journey date cannot be in the past (${getTodayDate()} or later required).`;
    }
  }

  const source = (payload.source ?? '').trim();
  if (!source) {
    errors.source = 'Source station is required.';
  } else if (source.length < 2 || !/^[A-Za-z][A-Za-z .()-]*$/.test(source)) {
    errors.source = 'Enter a valid source station name.';
  }

  const destination = (payload.destination ?? '').trim();
  if (!destination) {
    errors.destination = 'Destination station is required.';
  } else if (destination.length < 2 || !/^[A-Za-z][A-Za-z .()-]*$/.test(destination)) {
    errors.destination = 'Enter a valid destination station name.';
  } else if (source && source.toLowerCase() === destination.toLowerCase()) {
    errors.destination = 'Destination station must differ from source station.';
  }

  const seatClass = (payload.seatClass ?? '').trim().toUpperCase() as SeatClass;
  if (!seatClass || !VALID_CLASSES.includes(seatClass)) {
    errors.seatClass = 'Select a valid travel class (1AC, 2AC, 3AC, SL, CC, or EC).';
  }

  return errors;
}

function generateUniquePnr(existing: Reservation[]): string {
  const existingPnrs = new Set(existing.map((r) => r.pnrNumber));
  let pnr = '';
  do {
    const num = crypto.randomInt(1000000, 9999999);
    pnr = `PNR${num}`;
  } while (existingPnrs.has(pnr));
  return pnr;
}

function readJavaSources(): JavaSourceFile[] {
  const javaBase = path.join(__dirname, 'java-console-app');
  const definitions: Array<{ name: string; relPath: string; description: string }> = [
    {
      name: 'OnlineReservationApp.java',
      relPath: 'src/com/oasis/reservation/OnlineReservationApp.java',
      description: 'Main entry point with login loop, menu navigation, booking, lookup, and cancellation.',
    },
    {
      name: 'ReservationService.java',
      relPath: 'src/com/oasis/reservation/ReservationService.java',
      description: 'Service layer handling authentication, sample train data, unique PNR generation, and storage.',
    },
    {
      name: 'InputValidator.java',
      relPath: 'src/com/oasis/reservation/InputValidator.java',
      description: 'Input validation utility ensuring valid passenger names, train numbers, dates, routes, and PNRs.',
    },
    {
      name: 'Reservation.java',
      relPath: 'src/com/oasis/reservation/Reservation.java',
      description: 'Reservation model storing PNR, passenger, train, route, status, and ASCII ticket formatting.',
    },
    {
      name: 'Train.java',
      relPath: 'src/com/oasis/reservation/Train.java',
      description: 'Train schedule model with supported travel classes and class-based fare calculation.',
    },
    {
      name: 'User.java',
      relPath: 'src/com/oasis/reservation/User.java',
      description: 'User credentials model with password verification helper.',
    },
    {
      name: 'README.md',
      relPath: 'README.md',
      description: 'Compilation instructions, project structure, and test credentials.',
    },
  ];

  return definitions
    .map((item) => {
      const fullPath = path.join(javaBase, item.relPath);
      if (!fs.existsSync(fullPath)) {
        return null;
      }
      return {
        name: item.name,
        relativePath: `java-console-app/${item.relPath}`,
        description: item.description,
        content: fs.readFileSync(fullPath, 'utf8'),
      };
    })
    .filter((item): item is JavaSourceFile => item !== null);
}

async function startServer() {
  ensureStoreInitialized();

  const app = express();
  app.use(express.json());

  // 1. Login endpoint
  app.post('/api/auth/login', (req, res) => {
    const username = String(req.body?.username ?? '').trim();
    const password = String(req.body?.password ?? '');

    if (!username) {
      res.status(400).json({ error: 'Username is required.' });
      return;
    }
    if (!password.trim()) {
      res.status(400).json({ error: 'Password is required.' });
      return;
    }

    const match = SAMPLE_USERS.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (!match) {
      res.status(401).json({ error: 'Invalid username or password. Please check your credentials.' });
      return;
    }

    res.json({
      user: {
        username: match.username,
        fullName: match.fullName,
        role: match.role,
      },
    });
  });

  // 2. Sample train schedule endpoint
  app.get('/api/trains', (_req, res) => {
    res.json({ trains: SAMPLE_TRAINS });
  });

  // 3. List all reservations (most recent first)
  app.get('/api/reservations', (_req, res) => {
    const list = ensureStoreInitialized().slice().reverse();
    res.json({ reservations: list });
  });

  // 4. Lookup reservation by PNR
  app.get('/api/reservations/:pnr', (req, res) => {
    const pnr = String(req.params.pnr ?? '').trim().toUpperCase();
    if (!/^PNR\d{7}$/.test(pnr)) {
      res.status(400).json({
        error: 'Invalid PNR format. PNR must start with "PNR" followed by 7 digits (e.g. PNR1004521).',
      });
      return;
    }

    const list = ensureStoreInitialized();
    const found = list.find((r) => r.pnrNumber.toUpperCase() === pnr);
    if (!found) {
      res.status(404).json({ error: `No reservation found with PNR ${pnr}.` });
      return;
    }

    res.json({ reservation: found });
  });

  // 5. Create new reservation
  app.post('/api/reservations', (req, res) => {
    const payload: Partial<BookingPayload> = req.body ?? {};
    const errors = validateBookingPayload(payload);

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        error: 'Please fix the highlighted validation errors before booking.',
        fieldErrors: errors,
      });
      return;
    }

    const list = ensureStoreInitialized();
    const trainNumber = payload.trainNumber!.trim();
    const seatClass = payload.seatClass!.trim().toUpperCase() as SeatClass;
    const matchedTrain = SAMPLE_TRAINS.find((t) => t.trainNumber === trainNumber);
    const baseFare = matchedTrain ? matchedTrain.baseFare : 950;
    const fare = calculateFare(baseFare, seatClass);

    const newReservation: Reservation = {
      pnrNumber: generateUniquePnr(list),
      passengerName: payload.passengerName!.trim(),
      trainNumber,
      trainName: payload.trainName!.trim(),
      journeyDate: payload.journeyDate!.trim(),
      source: payload.source!.trim(),
      destination: payload.destination!.trim(),
      seatClass,
      fare,
      bookedByUsername: (payload.bookedByUsername ?? 'guest').trim() || 'guest',
      bookedAt: new Date().toISOString(),
      status: 'CONFIRMED',
      cancelledAt: null,
    };

    list.push(newReservation);
    saveReservations(list);

    res.status(201).json({ reservation: newReservation });
  });

  // 6. Cancel reservation by PNR
  app.post('/api/reservations/:pnr/cancel', (req, res) => {
    const pnr = String(req.params.pnr ?? '').trim().toUpperCase();
    if (!/^PNR\d{7}$/.test(pnr)) {
      res.status(400).json({
        error: 'Invalid PNR format. PNR must start with "PNR" followed by 7 digits (e.g. PNR1004521).',
      });
      return;
    }

    const list = ensureStoreInitialized();
    const index = list.findIndex((r) => r.pnrNumber.toUpperCase() === pnr);
    if (index === -1) {
      res.status(404).json({ error: `No reservation found with PNR ${pnr}.` });
      return;
    }

    if (list[index].status === 'CANCELLED') {
      res.status(409).json({
        error: `Reservation ${pnr} is already cancelled.`,
        reservation: list[index],
      });
      return;
    }

    const updated: Reservation = {
      ...list[index],
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
    };
    list[index] = updated;
    saveReservations(list);

    res.json({ reservation: updated });
  });

  // 7. Serve Java console source code files
  app.get('/api/java-sources', (_req, res) => {
    res.json({ files: readJavaSources() });
  });

  // Mount Vite middleware in dev, or serve static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Oasis Rail server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
