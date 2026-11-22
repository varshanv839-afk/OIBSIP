import { useCallback, useEffect, useState } from 'react';
import { BookingPage } from './components/BookingPage';
import { CancelPage } from './components/CancelPage';
import { HomePage } from './components/HomePage';
import { JavaConsolePage } from './components/JavaConsolePage';
import { LoginModal } from './components/LoginModal';
import { LookupPage } from './components/LookupPage';
import { Navbar } from './components/Navbar';
import type { ActivePage, Reservation, Train, UserAccount } from './types/reservation';

const SESSION_STORAGE_KEY = 'oasis_rail_user';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [user, setUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as UserAccount) : null;
    } catch {
      return null;
    }
  });
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const [trains, setTrains] = useState<Train[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedTrainForBooking, setSelectedTrainForBooking] = useState<Train | null>(null);
  const [lookupPnr, setLookupPnr] = useState<string | null>(null);
  const [cancelPnr, setCancelPnr] = useState<string | null>(null);

  const loadTrains = useCallback(async () => {
    try {
      const res = await fetch('/api/trains');
      const data = await res.json();
      if (Array.isArray(data.trains)) {
        setTrains(data.trains);
      }
    } catch {
      // Network failure handled gracefully
    }
  }, []);

  const loadReservations = useCallback(async () => {
    try {
      const res = await fetch('/api/reservations');
      const data = await res.json();
      if (Array.isArray(data.reservations)) {
        setReservations(data.reservations);
      }
    } catch {
      // Network failure handled gracefully
    }
  }, []);

  useEffect(() => {
    void loadTrains();
    void loadReservations();
  }, [loadTrains, loadReservations]);

  const handleLoginSuccess = (loggedInUser: UserAccount) => {
    setUser(loggedInUser);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(loggedInUser));
    } catch {
      // Ignore storage quota errors
    }
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  const handleSelectTrainForBooking = (train: Train) => {
    setSelectedTrainForBooking(train);
    setActivePage('book');
  };

  const handleQuickLookupPnr = (pnr: string) => {
    setLookupPnr(pnr);
    setActivePage('lookup');
  };

  const handleProceedToCancel = (pnr: string) => {
    setCancelPnr(pnr);
    setActivePage('cancel');
  };

  const handleBookingCreated = (created: Reservation) => {
    setReservations((prev) => [created, ...prev]);
  };

  const handleReservationCancelled = (updated: Reservation) => {
    setReservations((prev) =>
      prev.map((item) => (item.pnrNumber === updated.pnrNumber ? updated : item))
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        activePage={activePage}
        onNavigate={setActivePage}
        user={user}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {activePage === 'home' && (
          <HomePage
            trains={trains}
            reservations={reservations}
            user={user}
            onNavigate={setActivePage}
            onSelectTrainForBooking={handleSelectTrainForBooking}
            onQuickLookupPnr={handleQuickLookupPnr}
            onOpenLogin={() => setLoginModalOpen(true)}
          />
        )}

        {activePage === 'book' && (
          <BookingPage
            trains={trains}
            user={user}
            selectedTrain={selectedTrainForBooking}
            onOpenLogin={() => setLoginModalOpen(true)}
            onBookingCreated={handleBookingCreated}
            onNavigate={setActivePage}
            onLookupCreatedPnr={handleQuickLookupPnr}
          />
        )}

        {activePage === 'lookup' && (
          <LookupPage
            initialPnr={lookupPnr}
            reservations={reservations}
            onProceedToCancel={handleProceedToCancel}
          />
        )}

        {activePage === 'cancel' && (
          <CancelPage
            initialPnr={cancelPnr}
            reservations={reservations}
            onReservationCancelled={handleReservationCancelled}
          />
        )}

        {activePage === 'java' && (
          <JavaConsolePage
            trains={trains}
            onReservationsChanged={() => void loadReservations()}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Oasis Rail · Online Reservation System (Oasis Infobyte Java Development Project)
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setActivePage('home')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Train Schedule
            </button>
            <button
              type="button"
              onClick={() => setActivePage('book')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Book Ticket
            </button>
            <button
              type="button"
              onClick={() => setActivePage('lookup')}
              className="hover:text-slate-900 cursor-pointer"
            >
              PNR Lookup
            </button>
            <button
              type="button"
              onClick={() => setActivePage('java')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Java Source
            </button>
          </div>
        </div>
      </footer>

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
