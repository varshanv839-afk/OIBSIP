import { AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { validatePnrInput } from '../constants/sampleData';
import type { Reservation } from '../types/reservation';
import { TicketCard } from './TicketCard';

interface CancelPageProps {
  initialPnr?: string | null;
  reservations: Reservation[];
  onReservationCancelled: (updated: Reservation) => void;
}

export function CancelPage({
  initialPnr,
  reservations,
  onReservationCancelled,
}: CancelPageProps) {
  const [pnrInput, setPnrInput] = useState(initialPnr ?? '');
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [targetReservation, setTargetReservation] = useState<Reservation | null>(null);

  const fetchTicketForCancellation = async (rawPnr: string) => {
    const normalized = rawPnr.trim().toUpperCase();
    const validationError = validatePnrInput(normalized);
    if (validationError) {
      setError(validationError);
      setTargetReservation(null);
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/reservations/${encodeURIComponent(normalized)}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || `No reservation found with PNR ${normalized}.`);
        setTargetReservation(null);
        return;
      }
      setTargetReservation(data.reservation);
    } catch {
      setError('Unable to reach server while retrieving reservation.');
      setTargetReservation(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPnr) {
      setPnrInput(initialPnr);
      void fetchTicketForCancellation(initialPnr);
    }
  }, [initialPnr]);

  const handleLookupSubmit = (e: FormEvent) => {
    e.preventDefault();
    void fetchTicketForCancellation(pnrInput);
  };

  const handleConfirmCancel = async () => {
    if (!targetReservation) return;
    setError(null);
    setSuccessMessage(null);
    setCancelling(true);

    try {
      const response = await fetch(
        `/api/reservations/${encodeURIComponent(targetReservation.pnrNumber)}/cancel`,
        { method: 'POST' }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Could not cancel reservation.');
        if (data.reservation) {
          setTargetReservation(data.reservation);
        }
        return;
      }

      setTargetReservation(data.reservation);
      onReservationCancelled(data.reservation);
      setSuccessMessage(
        `Reservation ${data.reservation.pnrNumber} has been cancelled and updated in the registry.`
      );
    } catch {
      setError('Network error while cancelling reservation. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const confirmedReservations = reservations.filter((r) => r.status === 'CONFIRMED');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Cancel Railway Reservation
        </h1>
        <p className="text-sm text-slate-600 mt-1.5">
          Verify the ticket details using the PNR number first, then confirm cancellation.
        </p>
      </div>

      {/* Step 1: Lookup PNR */}
      <form
        onSubmit={handleLookupSubmit}
        noValidate
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <label htmlFor="cancel-pnr" className="block text-sm font-medium text-slate-700">
          Enter PNR Number to Cancel
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="cancel-pnr"
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
            className="px-6 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {loading ? 'Checking...' : 'Find Ticket'}
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

        {successMessage && (
          <div
            role="status"
            className="flex items-start gap-2.5 p-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {confirmedReservations.length > 0 && (
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Active confirmed PNRs:</span>
            {confirmedReservations.slice(0, 6).map((res) => (
              <button
                key={res.pnrNumber}
                type="button"
                onClick={() => {
                  setPnrInput(res.pnrNumber);
                  void fetchTicketForCancellation(res.pnrNumber);
                }}
                className="px-2.5 py-1 text-xs font-mono text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors cursor-pointer"
              >
                {res.pnrNumber}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Step 2: Review & Confirm Cancellation */}
      {targetReservation && (
        <div className="space-y-4">
          <TicketCard
            reservation={targetReservation}
            showPrint={false}
            actionSlot={
              targetReservation.status === 'CONFIRMED' ? (
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={cancelling}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              ) : (
                <span className="text-xs font-medium text-red-700">
                  Already Cancelled
                </span>
              )
            }
          />
        </div>
      )}
    </div>
  );
}
