import { AlertCircle, Search } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { validatePnrInput } from '../constants/sampleData';
import type { Reservation } from '../types/reservation';
import { TicketCard } from './TicketCard';

interface LookupPageProps {
  initialPnr?: string | null;
  reservations: Reservation[];
  onProceedToCancel: (pnr: string) => void;
}

export function LookupPage({
  initialPnr,
  reservations,
  onProceedToCancel,
}: LookupPageProps) {
  const [pnrInput, setPnrInput] = useState(initialPnr ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundReservation, setFoundReservation] = useState<Reservation | null>(null);

  const performLookup = async (rawPnr: string) => {
    const normalized = rawPnr.trim().toUpperCase();
    const validationError = validatePnrInput(normalized);
    if (validationError) {
      setError(validationError);
      setFoundReservation(null);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/reservations/${encodeURIComponent(normalized)}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || `No reservation found for ${normalized}.`);
        setFoundReservation(null);
        return;
      }
      setFoundReservation(data.reservation);
    } catch {
      setError('Unable to reach server while looking up PNR.');
      setFoundReservation(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPnr) {
      setPnrInput(initialPnr);
      void performLookup(initialPnr);
    }
  }, [initialPnr]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void performLookup(pnrInput);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          PNR Reservation Lookup
        </h1>
        <p className="text-sm text-slate-600 mt-1.5">
          Enter a 10-character PNR number (for example <span className="font-mono">PNR1004521</span>)
          to inspect live booking details and current status.
        </p>
      </div>

      {/* Search Form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <label htmlFor="lookup-pnr" className="block text-sm font-medium text-slate-700">
          PNR Number
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="lookup-pnr"
              type="text"
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value.toUpperCase())}
              placeholder="PNR1004521"
              className="w-full pl-10 pr-4 py-2.5 text-sm font-mono uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {loading ? 'Searching...' : 'Check PNR Status'}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {reservations.length > 0 && (
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Available PNRs:</span>
            {reservations.slice(0, 6).map((res) => (
              <button
                key={res.pnrNumber}
                type="button"
                onClick={() => {
                  setPnrInput(res.pnrNumber);
                  void performLookup(res.pnrNumber);
                }}
                className="px-2.5 py-1 text-xs font-mono text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors cursor-pointer"
              >
                {res.pnrNumber}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Result Ticket */}
      {foundReservation && (
        <TicketCard
          reservation={foundReservation}
          actionSlot={
            foundReservation.status === 'CONFIRMED' ? (
              <button
                type="button"
                onClick={() => onProceedToCancel(foundReservation.pnrNumber)}
                className="px-3.5 py-1.5 text-xs font-medium text-red-700 hover:text-white bg-red-50 hover:bg-red-700 border border-red-200 hover:border-red-700 rounded-lg transition-colors cursor-pointer"
              >
                Cancel This Reservation
              </button>
            ) : null
          }
        />
      )}
    </div>
  );
}
