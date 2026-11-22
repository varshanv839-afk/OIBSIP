import { Check, Copy, Download, RotateCcw, Terminal } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  getTodayLocalISO,
  validateBookingFields,
  validatePnrInput,
} from '../constants/sampleData';
import type { JavaSourceFile, Reservation, SeatClass, Train, UserAccount } from '../types/reservation';

interface JavaConsolePageProps {
  trains: Train[];
  onReservationsChanged: () => void;
}

type ConsoleStep =
  | 'LOGIN_USERNAME'
  | 'LOGIN_PASSWORD'
  | 'MAIN_MENU'
  | 'BOOK_NAME'
  | 'BOOK_TRAIN_NUM'
  | 'BOOK_CUSTOM_TRAIN_NAME'
  | 'BOOK_CUSTOM_SOURCE'
  | 'BOOK_CUSTOM_DEST'
  | 'BOOK_DATE'
  | 'BOOK_CLASS'
  | 'LOOKUP_PNR'
  | 'CANCEL_PNR'
  | 'CANCEL_CONFIRM'
  | 'EXITED';

interface DraftBooking {
  passengerName: string;
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  journeyDate: string;
  allowedClasses: SeatClass[];
}

const INITIAL_BANNER: string[] = [
  '============================================================',
  '         OASIS INFOBYTE - ONLINE RESERVATION SYSTEM         ',
  '                Railway Ticket Booking Console              ',
  '============================================================',
  'Sample Credentials for Testing:',
  '  1) admin        / admin123',
  '  2) passenger1   / rail2026',
  '  3) oasis_intern / java123',
  'Sample PNRs for Lookup/Cancel: PNR1004521, PNR1004522',
  '------------------------------------------------------------',
  '',
  '--- User Login (Attempt 1 of 3) ---',
];

function formatAsciiTicket(res: Reservation): string[] {
  const pad = (val: string, len: number) =>
    val.length > len ? val.slice(0, len - 1) + '…' : val.padEnd(len, ' ');

  const lines = [
    '+----------------------------------------------------------+',
    `| ${pad('RAILWAY RESERVATION TICKET', 26)} PNR: ${pad(res.pnrNumber, 24)} |`,
    '+----------------------------------------------------------+',
    `| Status         : ${pad(res.status, 39)} |`,
    `| Passenger Name : ${pad(res.passengerName, 39)} |`,
    `| Train          : ${pad(`${res.trainNumber} - ${res.trainName}`, 39)} |`,
    `| Route          : ${pad(`${res.source} -> ${res.destination}`, 39)} |`,
    `| Journey Date   : ${pad(res.journeyDate, 39)} |`,
    `| Class          : ${pad(res.seatClass, 39)} |`,
    `| Total Fare     : INR ${pad(res.fare.toFixed(2), 35)} |`,
    `| Booked By      : ${pad(res.bookedByUsername, 39)} |`,
  ];
  if (res.cancelledAt) {
    lines.push(`| Cancelled At   : ${pad(res.cancelledAt.slice(0, 16).replace('T', ' '), 39)} |`);
  }
  lines.push('+----------------------------------------------------------+');
  return lines;
}

function getMenuLines(user: UserAccount): string[] {
  return [
    '',
    '======================== MAIN MENU =========================',
    `Logged in as: ${user.fullName} (${user.username})`,
    '  1. Book New Reservation',
    '  2. View Reservation by PNR',
    '  3. Cancel Reservation by PNR',
    '  4. View Sample Train Schedule',
    '  5. View All Reservations',
    '  6. Logout',
    '  7. Exit Application',
  ];
}

export function JavaConsolePage({ trains, onReservationsChanged }: JavaConsolePageProps) {
  const [activeTab, setActiveTab] = useState<'simulator' | 'source'>('simulator');

  // Java Source Explorer State
  const [javaFiles, setJavaFiles] = useState<JavaSourceFile[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copiedName, setCopiedName] = useState<string | null>(null);

  // Console Simulator State
  const [lines, setLines] = useState<string[]>(INITIAL_BANNER);
  const [step, setStep] = useState<ConsoleStep>('LOGIN_USERNAME');
  const [inputValue, setInputValue] = useState('');
  const [loginAttempt, setLoginAttempt] = useState(1);
  const [pendingUsername, setPendingUsername] = useState('');
  const [consoleUser, setConsoleUser] = useState<UserAccount | null>(null);
  const [draft, setDraft] = useState<DraftBooking>({
    passengerName: '',
    trainNumber: '',
    trainName: '',
    source: '',
    destination: '',
    journeyDate: '',
    allowedClasses: ['1AC', '2AC', '3AC', 'SL', 'CC', 'EC'],
  });
  const [cancelCandidate, setCancelCandidate] = useState<Reservation | null>(null);
  const [busy, setBusy] = useState(false);

  const outputRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch('/api/java-sources')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.files)) {
          setJavaFiles(data.files);
        }
      })
      .catch(() => {
        // Ignore silently; UI handles empty state
      });
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  const appendLines = (newLines: string[]) => {
    setLines((prev) => [...prev, ...newLines]);
  };

  const resetConsole = () => {
    setLines(INITIAL_BANNER);
    setStep('LOGIN_USERNAME');
    setInputValue('');
    setLoginAttempt(1);
    setPendingUsername('');
    setConsoleUser(null);
    setCancelCandidate(null);
    inputRef.current?.focus();
  };

  const getCurrentPrompt = (): string => {
    switch (step) {
      case 'LOGIN_USERNAME':
        return "Username (or type 'exit' to quit): ";
      case 'LOGIN_PASSWORD':
        return 'Password: ';
      case 'MAIN_MENU':
        return 'Choose an option (1-7): ';
      case 'BOOK_NAME':
        return 'Passenger Full Name: ';
      case 'BOOK_TRAIN_NUM':
        return 'Train Number (5 digits, e.g. 12951): ';
      case 'BOOK_CUSTOM_TRAIN_NAME':
        return 'Train Name: ';
      case 'BOOK_CUSTOM_SOURCE':
        return 'Source Station: ';
      case 'BOOK_CUSTOM_DEST':
        return 'Destination Station: ';
      case 'BOOK_DATE':
        return 'Journey Date (YYYY-MM-DD): ';
      case 'BOOK_CLASS':
        return `Travel Class (${draft.allowedClasses.join('/')}): `;
      case 'LOOKUP_PNR':
        return 'Enter PNR Number (e.g. PNR1004521): ';
      case 'CANCEL_PNR':
        return 'Enter PNR Number to Cancel: ';
      case 'CANCEL_CONFIRM':
        return `Confirm cancellation of PNR ${cancelCandidate?.pnrNumber ?? ''}? (Y/N): `;
      case 'EXITED':
        return 'Process exited. Click Restart Console to run again.';
    }
  };

  const processCommand = async (rawInput: string) => {
    if (step === 'EXITED' || busy) return;

    const prompt = getCurrentPrompt();
    const displayVal = step === 'LOGIN_PASSWORD' ? '*'.repeat(rawInput.length) : rawInput;
    appendLines([`${prompt}${displayVal}`]);

    const trimmed = rawInput.trim();

    if (step === 'LOGIN_USERNAME') {
      if (trimmed.toLowerCase() === 'exit') {
        appendLines(['', 'Exiting Online Reservation System. Goodbye!']);
        setStep('EXITED');
        return;
      }
      if (!trimmed) {
        appendLines(['Error: Username cannot be empty.']);
        return;
      }
      setPendingUsername(trimmed);
      setStep('LOGIN_PASSWORD');
      return;
    }

    if (step === 'LOGIN_PASSWORD') {
      if (!trimmed) {
        appendLines(['Error: Password cannot be empty.']);
        setStep('LOGIN_USERNAME');
        return;
      }
      setBusy(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: pendingUsername, password: rawInput }),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          setConsoleUser(data.user);
          appendLines([
            '',
            `Login successful! Welcome, ${data.user.fullName}.`,
            ...getMenuLines(data.user),
          ]);
          setStep('MAIN_MENU');
        } else {
          const nextAttempt = loginAttempt + 1;
          if (nextAttempt > 3) {
            appendLines([
              'Error: Invalid username or password.',
              'Too many failed login attempts. Exiting Online Reservation System.',
            ]);
            setStep('EXITED');
          } else {
            setLoginAttempt(nextAttempt);
            appendLines([
              'Error: Invalid username or password. Please try again.',
              '',
              `--- User Login (Attempt ${nextAttempt} of 3) ---`,
            ]);
            setStep('LOGIN_USERNAME');
          }
        }
      } finally {
        setBusy(false);
      }
      return;
    }

    if (step === 'MAIN_MENU' && consoleUser) {
      switch (trimmed) {
        case '1':
          appendLines([
            '',
            '------------------- BOOK A RESERVATION ---------------------',
            '(Tip: Choose Option 4 from Main Menu anytime to see train numbers)',
          ]);
          setStep('BOOK_NAME');
          return;
        case '2':
          appendLines(['', '------------------ LOOKUP RESERVATION ----------------------']);
          setStep('LOOKUP_PNR');
          return;
        case '3':
          appendLines(['', '------------------ CANCEL RESERVATION ----------------------']);
          setStep('CANCEL_PNR');
          return;
        case '4': {
          const table = [
            '',
            '---------------------- SAMPLE TRAIN SCHEDULE -------------------------',
            'Train#   Train Name                   Source            Destination       Classes',
            '----------------------------------------------------------------------',
            ...trains.map(
              (t) =>
                `${t.trainNumber.padEnd(8)} ${t.trainName.padEnd(28)} ${t.source.padEnd(17)} ${t.destination.padEnd(17)} ${t.availableClasses.join(',')}`
            ),
            ...getMenuLines(consoleUser),
          ];
          appendLines(table);
          return;
        }
        case '5': {
          setBusy(true);
          try {
            const res = await fetch('/api/reservations');
            const data = await res.json();
            const list: Reservation[] = data.reservations ?? [];
            if (list.length === 0) {
              appendLines(['No reservations recorded yet.', ...getMenuLines(consoleUser)]);
            } else {
              appendLines([
                '',
                '---------------------- ALL RESERVATIONS ------------------------------',
                'PNR          Passenger          Train#   Date         Class  Status',
                '----------------------------------------------------------------------',
                ...list.map(
                  (r) =>
                    `${r.pnrNumber.padEnd(12)} ${r.passengerName.slice(0, 17).padEnd(18)} ${r.trainNumber.padEnd(8)} ${r.journeyDate.padEnd(12)} ${r.seatClass.padEnd(6)} ${r.status}`
                ),
                ...getMenuLines(consoleUser),
              ]);
            }
          } finally {
            setBusy(false);
          }
          return;
        }
        case '6':
          appendLines([
            '',
            'Logged out successfully.',
            '',
            '--- User Login (Attempt 1 of 3) ---',
          ]);
          setConsoleUser(null);
          setLoginAttempt(1);
          setStep('LOGIN_USERNAME');
          return;
        case '7':
          appendLines([
            '',
            'Thank you for using Oasis Railway Reservation System. Safe travels!',
          ]);
          setStep('EXITED');
          return;
        default:
          appendLines(['Error: Please enter a valid menu option between 1 and 7.']);
          return;
      }
    }

    if (step === 'BOOK_NAME') {
      const errs = validateBookingFields({
        passengerName: trimmed,
        trainNumber: '12951',
        trainName: 'Sample',
        journeyDate: getTodayLocalISO(),
        source: 'Delhi',
        destination: 'Mumbai',
        seatClass: '2AC',
      });
      if (errs.passengerName) {
        appendLines([`Error: ${errs.passengerName}`]);
        return;
      }
      setDraft((prev) => ({ ...prev, passengerName: trimmed }));
      setStep('BOOK_TRAIN_NUM');
      return;
    }

    if (step === 'BOOK_TRAIN_NUM') {
      if (!/^\d{5}$/.test(trimmed)) {
        appendLines(['Error: Train number must be exactly 5 digits (for example: 12951).']);
        return;
      }
      const match = trains.find((t) => t.trainNumber === trimmed);
      if (match) {
        setDraft((prev) => ({
          ...prev,
          trainNumber: match.trainNumber,
          trainName: match.trainName,
          source: match.source,
          destination: match.destination,
          allowedClasses: match.availableClasses,
        }));
        appendLines([
          `Train Found: ${match.trainName} (${match.source} -> ${match.destination})`,
          `Available Classes: ${match.availableClasses.join(', ')}`,
        ]);
        setStep('BOOK_DATE');
      } else {
        setDraft((prev) => ({
          ...prev,
          trainNumber: trimmed,
          allowedClasses: ['1AC', '2AC', '3AC', 'SL', 'CC', 'EC'],
        }));
        appendLines(['Custom train number entered. Please provide route details:']);
        setStep('BOOK_CUSTOM_TRAIN_NAME');
      }
      return;
    }

    if (step === 'BOOK_CUSTOM_TRAIN_NAME') {
      if (trimmed.length < 3) {
        appendLines(['Error: Train name must be at least 3 characters long.']);
        return;
      }
      setDraft((prev) => ({ ...prev, trainName: trimmed }));
      setStep('BOOK_CUSTOM_SOURCE');
      return;
    }

    if (step === 'BOOK_CUSTOM_SOURCE') {
      if (trimmed.length < 2 || !/^[A-Za-z][A-Za-z .()-]*$/.test(trimmed)) {
        appendLines(['Error: Enter a valid source station name.']);
        return;
      }
      setDraft((prev) => ({ ...prev, source: trimmed }));
      setStep('BOOK_CUSTOM_DEST');
      return;
    }

    if (step === 'BOOK_CUSTOM_DEST') {
      if (trimmed.length < 2 || !/^[A-Za-z][A-Za-z .()-]*$/.test(trimmed)) {
        appendLines(['Error: Enter a valid destination station name.']);
        return;
      }
      if (trimmed.toLowerCase() === draft.source.toLowerCase()) {
        appendLines(['Error: Destination station must be different from the source station.']);
        return;
      }
      setDraft((prev) => ({ ...prev, destination: trimmed }));
      setStep('BOOK_DATE');
      return;
    }

    if (step === 'BOOK_DATE') {
      const errs = validateBookingFields({
        passengerName: draft.passengerName,
        trainNumber: draft.trainNumber,
        trainName: draft.trainName,
        journeyDate: trimmed,
        source: draft.source,
        destination: draft.destination,
        seatClass: '2AC',
      });
      if (errs.journeyDate) {
        appendLines([`Error: ${errs.journeyDate}`]);
        return;
      }
      setDraft((prev) => ({ ...prev, journeyDate: trimmed }));
      setStep('BOOK_CLASS');
      return;
    }

    if (step === 'BOOK_CLASS' && consoleUser) {
      const upper = trimmed.toUpperCase() as SeatClass;
      if (!draft.allowedClasses.includes(upper)) {
        appendLines([
          `Error: Invalid class. Please choose one of: ${draft.allowedClasses.join(', ')}`,
        ]);
        return;
      }

      setBusy(true);
      try {
        const res = await fetch('/api/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            passengerName: draft.passengerName,
            trainNumber: draft.trainNumber,
            trainName: draft.trainName,
            journeyDate: draft.journeyDate,
            source: draft.source,
            destination: draft.destination,
            seatClass: upper,
            bookedByUsername: consoleUser.username,
          }),
        });
        const data = await res.json();
        if (res.ok && data.reservation) {
          onReservationsChanged();
          appendLines([
            '',
            'Reservation Confirmed! Save your PNR for lookup or cancellation.',
            ...formatAsciiTicket(data.reservation),
            ...getMenuLines(consoleUser),
          ]);
        } else {
          appendLines([
            `Error: ${data.error || 'Could not create reservation.'}`,
            ...getMenuLines(consoleUser),
          ]);
        }
      } finally {
        setBusy(false);
        setStep('MAIN_MENU');
      }
      return;
    }

    if (step === 'LOOKUP_PNR' && consoleUser) {
      const err = validatePnrInput(trimmed);
      if (err) {
        appendLines([`Error: ${err}`]);
        return;
      }
      setBusy(true);
      try {
        const res = await fetch(`/api/reservations/${encodeURIComponent(trimmed.toUpperCase())}`);
        const data = await res.json();
        if (res.ok && data.reservation) {
          appendLines([
            '',
            'Reservation Found:',
            ...formatAsciiTicket(data.reservation),
            ...getMenuLines(consoleUser),
          ]);
        } else {
          appendLines([
            `No reservation found with PNR: ${trimmed.toUpperCase()}`,
            ...getMenuLines(consoleUser),
          ]);
        }
      } finally {
        setBusy(false);
        setStep('MAIN_MENU');
      }
      return;
    }

    if (step === 'CANCEL_PNR' && consoleUser) {
      const err = validatePnrInput(trimmed);
      if (err) {
        appendLines([`Error: ${err}`]);
        return;
      }
      setBusy(true);
      try {
        const res = await fetch(`/api/reservations/${encodeURIComponent(trimmed.toUpperCase())}`);
        const data = await res.json();
        if (!res.ok || !data.reservation) {
          appendLines([
            `Error: No reservation found for PNR ${trimmed.toUpperCase()}.`,
            ...getMenuLines(consoleUser),
          ]);
          setStep('MAIN_MENU');
          return;
        }
        const ticket: Reservation = data.reservation;
        if (ticket.status === 'CANCELLED') {
          appendLines([
            ...formatAsciiTicket(ticket),
            'Notice: This reservation is already cancelled.',
            ...getMenuLines(consoleUser),
          ]);
          setStep('MAIN_MENU');
          return;
        }
        setCancelCandidate(ticket);
        appendLines(formatAsciiTicket(ticket));
        setStep('CANCEL_CONFIRM');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (step === 'CANCEL_CONFIRM' && consoleUser && cancelCandidate) {
      if (trimmed.toUpperCase() === 'Y' || trimmed.toUpperCase() === 'YES') {
        setBusy(true);
        try {
          const res = await fetch(
            `/api/reservations/${encodeURIComponent(cancelCandidate.pnrNumber)}/cancel`,
            { method: 'POST' }
          );
          const data = await res.json();
          if (res.ok && data.reservation) {
            onReservationsChanged();
            appendLines([
              '',
              'Reservation cancelled successfully.',
              ...formatAsciiTicket(data.reservation),
              ...getMenuLines(consoleUser),
            ]);
          } else {
            appendLines([
              `Error: ${data.error || 'Unable to cancel reservation.'}`,
              ...getMenuLines(consoleUser),
            ]);
          }
        } finally {
          setBusy(false);
          setCancelCandidate(null);
          setStep('MAIN_MENU');
        }
      } else {
        appendLines([
          'Cancellation aborted. Ticket remains CONFIRMED.',
          ...getMenuLines(consoleUser),
        ]);
        setCancelCandidate(null);
        setStep('MAIN_MENU');
      }
    }
  };

  const handleConsoleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const val = inputValue;
    setInputValue('');
    void processCommand(val);
  };

  const selectedFile = javaFiles[selectedFileIndex] ?? null;

  const handleCopyCode = async () => {
    if (!selectedFile) return;
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopiedName(selectedFile.name);
      setTimeout(() => setCopiedName(null), 1800);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleDownloadFile = () => {
    if (!selectedFile) return;
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getQuickHints = (): string[] => {
    switch (step) {
      case 'LOGIN_USERNAME':
        return ['passenger1', 'admin', 'oasis_intern'];
      case 'LOGIN_PASSWORD':
        return pendingUsername.toLowerCase() === 'admin'
          ? ['admin123']
          : pendingUsername.toLowerCase() === 'oasis_intern'
            ? ['java123']
            : ['rail2026'];
      case 'MAIN_MENU':
        return ['1', '2', '3', '4', '5', '6'];
      case 'BOOK_TRAIN_NUM':
        return ['12951', '12002', '12627'];
      case 'BOOK_DATE': {
        const d = new Date();
        d.setDate(d.getDate() + 5);
        return [d.toISOString().slice(0, 10)];
      }
      case 'BOOK_CLASS':
        return draft.allowedClasses;
      case 'LOOKUP_PNR':
      case 'CANCEL_PNR':
        return ['PNR1004521', 'PNR1004522'];
      case 'CANCEL_CONFIRM':
        return ['Y', 'N'];
      default:
        return [];
    }
  };

  const quickHints = getQuickHints();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Java Console App & Source Code
          </h1>
          <p className="text-sm text-slate-600 mt-1.5">
            Run the interactive console workflow directly below or inspect and download the complete
            runnable Java source files.
          </p>
        </div>

        {/* Segmented Control Tabs */}
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Interactive Console
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('source')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'source'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Java Source Files ({javaFiles.length})
          </button>
        </div>
      </div>

      {activeTab === 'simulator' ? (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden text-slate-100">
          {/* Terminal Title Bar */}
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>java -cp out com.oasis.reservation.OnlineReservationApp</span>
            </div>
            <button
              type="button"
              onClick={resetConsole}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart Console</span>
            </button>
          </div>

          {/* Scrollable Console Output */}
          <div
            ref={outputRef}
            onClick={() => inputRef.current?.focus()}
            className="p-5 h-[430px] overflow-y-auto font-mono text-xs sm:text-sm leading-relaxed space-y-0.5 whitespace-pre-wrap"
          >
            {lines.map((line, i) => {
              const isError = line.startsWith('Error:');
              const isSuccess =
                line.startsWith('Login successful!') ||
                line.startsWith('Reservation Confirmed!') ||
                line.startsWith('Reservation cancelled successfully.');
              return (
                <div
                  key={i}
                  className={
                    isError
                      ? 'text-red-400'
                      : isSuccess
                        ? 'text-emerald-400 font-semibold'
                        : 'text-slate-200'
                  }
                >
                  {line || '\u00A0'}
                </div>
              );
            })}
          </div>

          {/* Interactive Prompt Bar */}
          <div className="border-t border-slate-800 bg-slate-900/90 p-4 space-y-3">
            <form onSubmit={handleConsoleSubmit} className="flex items-center gap-2">
              <label
                htmlFor="console-stdin"
                className="font-mono text-xs sm:text-sm text-blue-400 shrink-0"
              >
                {getCurrentPrompt()}
              </label>
              <input
                ref={inputRef}
                id="console-stdin"
                type={step === 'LOGIN_PASSWORD' ? 'password' : 'text'}
                value={inputValue}
                disabled={step === 'EXITED' || busy}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={step === 'EXITED' ? 'Session ended' : 'Type input and press Enter...'}
                className="flex-1 bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-md px-3 py-2 text-xs sm:text-sm font-mono text-white focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={step === 'EXITED' || busy}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-600 disabled:opacity-50 rounded-md transition-colors cursor-pointer"
              >
                Send
              </button>
            </form>

            {quickHints.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400">Quick inputs:</span>
                {quickHints.map((hint) => (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => void processCommand(hint)}
                    className="px-2.5 py-1 font-mono text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors cursor-pointer"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* File Sidebar */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-200 bg-slate-50">
              <div className="text-xs font-semibold text-slate-700">Project Structure</div>
              <div className="font-mono text-xs text-slate-500 mt-0.5">
                java-console-app/src/com/oasis/reservation/
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {javaFiles.map((file, idx) => {
                const isSelected = idx === selectedFileIndex;
                return (
                  <button
                    key={file.name}
                    type="button"
                    onClick={() => setSelectedFileIndex(idx)}
                    className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="font-mono text-xs font-semibold">{file.name}</div>
                    <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {file.description}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
              <div className="text-xs font-semibold text-slate-700">Compile & Run Commands</div>
              <pre className="p-2.5 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed">
{`cd java-console-app
javac -d out src/com/oasis/reservation/*.java
java -cp out com.oasis.reservation.OnlineReservationApp`}
              </pre>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            {selectedFile ? (
              <>
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-sm font-semibold text-slate-900">
                      {selectedFile.relativePath}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{selectedFile.description}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-md transition-colors cursor-pointer"
                    >
                      {copiedName === selectedFile.name ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadFile}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 text-slate-100 p-5 overflow-x-auto max-h-[620px] overflow-y-auto">
                  <pre className="font-mono text-xs leading-relaxed">
                    {selectedFile.content.split('\n').map((line, lineIdx) => (
                      <div key={lineIdx} className="table-row">
                        <span className="table-cell pr-4 text-right text-slate-600 select-none tabular-nums w-10">
                          {lineIdx + 1}
                        </span>
                        <span className="table-cell whitespace-pre">{line}</span>
                      </div>
                    ))}
                  </pre>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-sm text-slate-500">
                Loading Java source files...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
