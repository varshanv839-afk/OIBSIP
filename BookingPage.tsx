import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import {
  calculateClassFare,
  getTodayLocalISO,
  SEAT_CLASS_INFO,
  validateBookingFields,
} from '../constants/sampleData';
import type { ActivePage, Reservation, SeatClass, Train, UserAccount } from '../types/reservation';
import { TicketCard } from './TicketCard';

interface BookingPageProps {
  trains: Train[];
  user: UserAccount | null;
  selectedTrain: Train | null;
  onOpenLogin: () => void;
  onBookingCreated: (reservation: Reservation) => void;
  onNavigate: (page: ActivePage) => void;
  onLookupCreatedPnr: (pnr: string) => void;
}

const ALL_CLASSES: SeatClass[] = ['1AC', '2AC', '3AC', 'SL', 'CC', 'EC'];

export function BookingPage({
  trains,
  user,
  selectedTrain,
  onOpenLogin,
  onBookingCreated,
  onNavigate,
  onLookupCreatedPnr,
}: BookingPageProps) {
  const [passengerName, setPassengerName] = useState('');
  const [trainNumber, setTrainNumber] = useState('');
  const [trainName, setTrainName] = useState('');
  const [journeyDate, setJourneyDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [seatClass, setSeatClass] = useState<SeatClass>('2AC');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookedTicket, setBookedTicket] = useState<Reservation | null>(null);

  useEffect(() => {
    if (selectedTrain) {
      setTrainNumber(selectedTrain.trainNumber);
      setTrainName(selectedTrain.trainName);
      setSource(selectedTrain.source);
      setDestination(selectedTrain.destination);
      if (selectedTrain.availableClasses.length > 0) {
        setSeatClass(selectedTrain.availableClasses[0]);
      }
      setFieldErrors({});
      setBookedTicket(null);
    }
  }, [selectedTrain]);

  const matchedTrain = trains.find((t) => t.trainNumber === trainNumber.trim());
  const availableClasses = matchedTrain ? matchedTrain.availableClasses : ALL_CLASSES;
  const estimatedFare = calculateClassFare(matchedTrain ? matchedTrain.baseFare : 950, seatClass);

  const handleSelectKnownTrain = (num: string) => {
    setTrainNumber(num);
    const found = trains.find((t) => t.trainNumber === num);
    if (found) {
      setTrainName(found.trainName);
      setSource(found.source);
      setDestination(found.destination);
      if (!found.availableClasses.includes(seatClass)) {
        setSeatClass(found.availableClasses[0]);
      }
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.trainNumber;
        delete next.trainName;
        delete next.source;
        delete next.destination;
        return next;
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!user) {
      onOpenLogin();
      return;
    }

    const errors = validateBookingFields({
      passengerName,
      trainNumber,
      trainName,
      journeyDate,
      source,
      destination,
      seatClass,
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError('Please fix the highlighted fields below.');
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passengerName: passengerName.trim(),
          trainNumber: trainNumber.trim(),
          trainName: trainName.trim(),
          journeyDate: journeyDate.trim(),
          source: source.trim(),
          destination: destination.trim(),
          seatClass,
          bookedByUsername: user.username,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }
        setSubmitError(data.error || 'Could not complete reservation.');
        return;
      }

      setBookedTicket(data.reservation);
      onBookingCreated(data.reservation);
    } catch {
      setSubmitError('Network error while saving reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForNewBooking = () => {
    setBookedTicket(null);
    setPassengerName('');
    setFieldErrors({});
    setSubmitError(null);
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Sign In Required to Book</h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Authentication ensures every ticket is linked to a verified user account. Sign in with
            any sample account (for example <span className="font-mono">passenger1 / rail2026</span>)
            to open the reservation form.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
            >
              Sign In to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Book Railway Reservation
        </h1>
        <p className="text-sm text-slate-600 mt-1.5">
          Fill out passenger and journey details. Selecting a scheduled train number automatically
          populates the route and available classes.
        </p>
      </div>

      {bookedTicket ? (
        <div className="space-y-6">
          <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold">
                Reservation Confirmed — Unique PNR Generated: {bookedTicket.pnrNumber}
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Save your PNR number to view or cancel this ticket anytime.
              </p>
            </div>
          </div>

          <TicketCard
            reservation={bookedTicket}
            actionSlot={
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onLookupCreatedPnr(bookedTicket.pnrNumber)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  Open in PNR Lookup
                </button>
                <button
                  type="button"
                  onClick={handleResetForNewBooking}
                  className="px-3.5 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
                >
                  Book Another Ticket
                </button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6"
          >
            {submitError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Quick Select Scheduled Train */}
            <div>
              <label
                htmlFor="quick-train-select"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Quick Fill from Scheduled Trains (Optional)
              </label>
              <select
                id="quick-train-select"
                value={matchedTrain ? matchedTrain.trainNumber : ''}
                onChange={(e) => handleSelectKnownTrain(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
              >
                <option value="">-- Choose a sample express train or enter manually below --</option>
                {trains.map((t) => (
                  <option key={t.trainNumber} value={t.trainNumber}>
                    {t.trainNumber} — {t.trainName} ({t.source} → {t.destination})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Passenger Name */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="passenger-name"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Passenger Full Name
                </label>
                <input
                  id="passenger-name"
                  type="text"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="e.g. Ananya Deshmukh"
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 ${
                    fieldErrors.passengerName ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {fieldErrors.passengerName && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.passengerName}</p>
                )}
              </div>

              {/* Train Number */}
              <div>
                <label
                  htmlFor="train-number"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Train Number (5 digits)
                </label>
                <input
                  id="train-number"
                  type="text"
                  maxLength={5}
                  value={trainNumber}
                  onChange={(e) => handleSelectKnownTrain(e.target.value)}
                  placeholder="e.g. 12951"
                  className={`w-full px-3.5 py-2.5 text-sm font-mono bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 ${
                    fieldErrors.trainNumber ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {fieldErrors.trainNumber && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.trainNumber}</p>
                )}
              </div>

              {/* Train Name */}
              <div>
                <label
                  htmlFor="train-name"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Train Name
                </label>
                <input
                  id="train-name"
                  type="text"
                  value={trainName}
                  onChange={(e) => setTrainName(e.target.value)}
                  placeholder="e.g. Mumbai Rajdhani Express"
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 ${
                    fieldErrors.trainName ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {fieldErrors.trainName && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.trainName}</p>
                )}
              </div>

              {/* Source Station */}
              <div>
                <label
                  htmlFor="source-station"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Source Station
                </label>
                <input
                  id="source-station"
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. New Delhi"
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 ${
                    fieldErrors.source ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {fieldErrors.source && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.source}</p>
                )}
              </div>

              {/* Destination Station */}
              <div>
                <label
                  htmlFor="destination-station"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Destination Station
                </label>
                <input
                  id="destination-station"
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Mumbai Central"
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 ${
                    fieldErrors.destination ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {fieldErrors.destination && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.destination}</p>
                )}
              </div>

              {/* Journey Date */}
              <div>
                <label
                  htmlFor="journey-date"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Journey Date
                </label>
                <input
                  id="journey-date"
                  type="date"
                  min={getTodayLocalISO()}
                  value={journeyDate}
                  onChange={(e) => setJourneyDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm font-mono bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 ${
                    fieldErrors.journeyDate ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {fieldErrors.journeyDate && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.journeyDate}</p>
                )}
              </div>

              {/* Travel Class */}
              <div>
                <label
                  htmlFor="seat-class"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Travel Class
                </label>
                <select
                  id="seat-class"
                  value={seatClass}
                  onChange={(e) => setSeatClass(e.target.value as SeatClass)}
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 ${
                    fieldErrors.seatClass ? 'border-red-500' : 'border-slate-300'
                  }`}
                >
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {SEAT_CLASS_INFO[cls]?.label ?? cls}
                    </option>
                  ))}
                </select>
                {fieldErrors.seatClass && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.seatClass}</p>
                )}
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                Booking as <span className="font-medium text-slate-800">{user.fullName}</span>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
              >
                {submitting ? 'Generating PNR...' : 'Confirm & Book Ticket'}
              </button>
            </div>
          </form>

          {/* Fare & Policy Summary Panel */}
          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Fare Estimate</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated dynamically from train base fare and selected coach class.
              </p>
            </div>

            <div className="space-y-3 py-4 border-y border-slate-200 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Train</span>
                <span className="font-mono font-medium text-slate-900 tabular-nums">
                  {trainNumber || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Class</span>
                <span className="font-medium text-slate-900">
                  {SEAT_CLASS_INFO[seatClass]?.label ?? seatClass}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Journey Date</span>
                <span className="font-mono text-slate-900 tabular-nums">
                  {journeyDate || '—'}
                </span>
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-slate-700">Total Payable</span>
              <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                INR {estimatedFare.toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="w-full py-2 px-3 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              View Full Train Timetable
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
