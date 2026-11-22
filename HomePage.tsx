import { ArrowRight, Search, TrainFront } from 'lucide-react';
import { useState } from 'react';
import { SAMPLE_CREDENTIALS } from '../constants/sampleData';
import type { ActivePage, Reservation, Train, UserAccount } from '../types/reservation';

interface HomePageProps {
  trains: Train[];
  reservations: Reservation[];
  user: UserAccount | null;
  onNavigate: (page: ActivePage) => void;
  onSelectTrainForBooking: (train: Train) => void;
  onQuickLookupPnr: (pnr: string) => void;
  onOpenLogin: () => void;
}

export function HomePage({
  trains,
  reservations,
  user,
  onNavigate,
  onSelectTrainForBooking,
  onQuickLookupPnr,
  onOpenLogin,
}: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [heroImageError, setHeroImageError] = useState(false);

  const filteredTrains = trains.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      t.trainNumber.toLowerCase().includes(q) ||
      t.trainName.toLowerCase().includes(q) ||
      t.source.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q)
    );
  });

  const confirmedCount = reservations.filter((r) => r.status === 'CONFIRMED').length;

  return (
    <div className="space-y-14 pb-16">
      {/* Hero Section: Balanced 2-Column Split */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between py-2">
            <div className="space-y-5">
              <div className="text-xs font-medium text-blue-700 tracking-wide">
                Oasis Infobyte · Java Development Project
              </div>

              <h1
                className="font-bold tracking-tight text-slate-900 leading-[1.08] text-balance"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)' }}
              >
                Railway reservations built with clarity and precision.
              </h1>

              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                Book express train journeys, generate unique PNR numbers, inspect ticket
                status, and process cancellations through a unified railway booking portal
                paired with complete, runnable Java console source code.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('book')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Book a Ticket</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('java')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Open Java Console</span>
                </button>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
              <span>
                {user
                  ? `Signed in as ${user.fullName} (${user.username})`
                  : 'Sign in with sample credentials to book tickets'}
              </span>
              {!user && (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="text-blue-700 hover:underline font-medium cursor-pointer"
                >
                  Sign In Now
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[280px] lg:min-h-[380px] rounded-xl overflow-hidden border border-slate-200 bg-slate-900 relative">
              {!heroImageError ? (
                <img
                  src="/src/assets/images/hero_express_railway_1795332444391.jpg"
                  alt="Modern express passenger train stopped at an architectural sunlit railway platform"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImageError(true)}
                  className="w-full h-full lg:h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900 text-slate-200">
                  <TrainFront className="w-12 h-12 text-blue-400 mb-3" />
                  <div className="text-lg font-semibold">Oasis Express Network</div>
                  <div className="text-sm text-slate-400 mt-1">
                    Intercity Express Railway Terminal
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Operations Strip Below Hero */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="p-5">
            <div className="text-xs text-slate-500">Scheduled Express Trains</div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
              {trains.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Major intercity corridors</div>
          </div>
          <div className="p-5">
            <div className="text-xs text-slate-500">Travel Classes</div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">6</div>
            <div className="text-xs text-slate-500 mt-1">1AC · 2AC · 3AC · SL · CC · EC</div>
          </div>
          <div className="p-5">
            <div className="text-xs text-slate-500">Confirmed Bookings</div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
              {confirmedCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">Active PNR records</div>
          </div>
          <div className="p-5">
            <div className="text-xs text-slate-500">Java Source Modules</div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">6</div>
            <div className="text-xs text-slate-500 mt-1">Clean OOP console classes</div>
          </div>
        </div>
      </section>

      {/* Train Schedule Directory */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Sample Train Schedule
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Select any train below to auto-fill the reservation form with its route and fare.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by train # or station..."
              aria-label="Filter train schedule"
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3.5 px-5">Train #</th>
                  <th className="py-3.5 px-5">Train Name</th>
                  <th className="py-3.5 px-5">Route</th>
                  <th className="py-3.5 px-5">Timings</th>
                  <th className="py-3.5 px-5">Classes</th>
                  <th className="py-3.5 px-5 text-right">Base Fare</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredTrains.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 px-5 text-center text-slate-500">
                      No trains match "{searchQuery}". Clear the filter to see all sample trains.
                    </td>
                  </tr>
                ) : (
                  filteredTrains.map((train) => (
                    <tr key={train.trainNumber} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        {train.trainNumber}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-slate-900 whitespace-nowrap">
                        {train.trainName}
                      </td>
                      <td className="py-3.5 px-5 text-slate-700 whitespace-nowrap">
                        {train.source} → {train.destination}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {train.departureTime} – {train.arrivalTime} ({train.duration})
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {train.availableClasses.join(' · ')}
                      </td>
                      <td className="py-3.5 px-5 font-mono font-medium text-slate-900 text-right tabular-nums whitespace-nowrap">
                        INR {train.baseFare.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectTrainForBooking(train)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-700 border border-blue-200 hover:border-blue-700 rounded-md transition-colors cursor-pointer"
                        >
                          Book Now
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testing Reference: Sample Credentials & Sample PNRs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Sample Login Credentials
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Use these preconfigured test accounts in both the Web Portal and the Java Console
                application.
              </p>
            </div>

            <div className="divide-y divide-slate-200 border-t border-slate-200">
              {SAMPLE_CREDENTIALS.map((cred) => (
                <div
                  key={cred.username}
                  className="py-3 flex items-center justify-between gap-4 text-sm"
                >
                  <div>
                    <div className="font-medium text-slate-900">{cred.fullName}</div>
                    <div className="text-xs text-slate-500">{cred.role}</div>
                  </div>
                  <div className="font-mono text-xs text-slate-700 tabular-nums">
                    {cred.username} / {cred.password}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Recent & Sample PNR Records
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Click any PNR below to inspect full ticket details or test cancellation.
              </p>
            </div>

            <div className="divide-y divide-slate-200 border-t border-slate-200">
              {reservations.slice(0, 4).map((res) => (
                <div
                  key={res.pnrNumber}
                  className="py-3 flex items-center justify-between gap-4 text-sm"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {res.pnrNumber}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          res.status === 'CONFIRMED' ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {res.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {res.passengerName} · #{res.trainNumber} {res.trainName}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onQuickLookupPnr(res.pnrNumber)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Inspect PNR
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
