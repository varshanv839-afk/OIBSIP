import { CheckCircle2, Printer, XCircle } from 'lucide-react';
import { SEAT_CLASS_INFO } from '../constants/sampleData';
import type { Reservation } from '../types/reservation';

interface TicketCardProps {
  reservation: Reservation;
  actionSlot?: React.ReactNode;
  showPrint?: boolean;
}

export function TicketCard({
  reservation,
  actionSlot,
  showPrint = true,
}: TicketCardProps) {
  const isConfirmed = reservation.status === 'CONFIRMED';
  const classLabel = SEAT_CLASS_INFO[reservation.seatClass]?.label ?? reservation.seatClass;

  const formatTimestamp = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Ticket Header */}
      <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-300">Electronic Reservation Slip</div>
          <div className="font-mono text-xl font-semibold tracking-wide tabular-nums mt-0.5">
            {reservation.pnrNumber}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              isConfirmed
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/60'
                : 'bg-red-950/60 text-red-300 border border-red-700/60'
            }`}
          >
            {isConfirmed ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <XCircle className="w-3.5 h-3.5" />
            )}
            <span>{reservation.status}</span>
          </div>

          {showPrint && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          )}
        </div>
      </div>

      {/* Route Banner */}
      <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        <div>
          <div className="text-xs text-slate-500">Origin Station</div>
          <div className="text-lg font-semibold text-slate-900 mt-0.5">{reservation.source}</div>
        </div>

        <div className="sm:text-center">
          <div className="font-mono text-xs text-slate-500 tabular-nums">
            Train #{reservation.trainNumber}
          </div>
          <div className="text-sm font-semibold text-blue-700 mt-0.5">{reservation.trainName}</div>
        </div>

        <div className="sm:text-right">
          <div className="text-xs text-slate-500">Destination Station</div>
          <div className="text-lg font-semibold text-slate-900 mt-0.5">
            {reservation.destination}
          </div>
        </div>
      </div>

      {/* Passenger & Journey Details */}
      <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
        <div>
          <div className="text-xs text-slate-500">Passenger Name</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">
            {reservation.passengerName}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500">Journey Date</div>
          <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums mt-1">
            {reservation.journeyDate}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500">Travel Class</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">{classLabel}</div>
        </div>

        <div>
          <div className="text-xs text-slate-500">Total Fare</div>
          <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums mt-1">
            INR {reservation.fare.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Audit Metadata Footer */}
      <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Booked by {reservation.bookedByUsername}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">Issued {formatTimestamp(reservation.bookedAt)}</span>
          {reservation.cancelledAt && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-red-700 font-medium tabular-nums">
                Cancelled {formatTimestamp(reservation.cancelledAt)}
              </span>
            </>
          )}
        </div>

        {actionSlot && <div className="shrink-0">{actionSlot}</div>}
      </div>
    </div>
  );
}
