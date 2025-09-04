import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface SessionData {
  userId: string;
  ticketCount: number;
  totalAmount: number;
  timeRemaining: number;
}

export default function SelectNumbersPage() {
  const router = useRouter();
  const { paymentId, token } = router.query;
  
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [powerball, setPowerball] = useState<number>(0);
  const [currentTicket, setCurrentTicket] = useState(1);
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [mode, setMode] = useState<'manual' | 'quickpick'>('manual');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.push('/');
      return;
    }

    // Validate session token
    const validateSession = async () => {
      try {
        const response = await fetch('/api/session/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        const data = await response.json();
        
        if (data.success) {
          setSessionData(data.session);
          setLoading(false);
        } else {
          setError(data.error || 'Invalid session');
          setLoading(false);
        }
      } catch (err) {
        setError('Failed to validate session');
        setLoading(false);
      }
    };

    validateSession();
  }, [token, router]);

  const generateQuickPick = () => {
    const numbers: number[] = [];
    
    // Generate 5 unique numbers between 1-69
    while (numbers.length < 5) {
      const num = Math.floor(Math.random() * 69) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    
    numbers.sort((a, b) => a - b);
    
    // Generate powerball between 1-25
    const powerballNum = Math.floor(Math.random() * 25) + 1;
    
    setSelectedNumbers(numbers);
    setPowerball(powerballNum);
    setMode('quickpick');
  };

  const selectNumber = (number: number) => {
    if (selectedNumbers.includes(number)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== number));
    } else if (selectedNumbers.length < 5) {
      setSelectedNumbers([...selectedNumbers, number].sort((a, b) => a - b));
    }
  };

  const selectPowerball = (number: number) => {
    setPowerball(number);
  };

  const submitTicket = () => {
    if (selectedNumbers.length !== 5 || powerball === 0) {
      alert('Please select 5 main numbers and 1 powerball number');
      return;
    }

    const ticket = {
      numbers: selectedNumbers,
      powerball: powerball,
      type: mode,
      ticketNumber: currentTicket
    };

    const newTickets = [...allTickets, ticket];
    setAllTickets(newTickets);

    if (currentTicket < (sessionData?.ticketCount || 1)) {
      // Move to next ticket
      setCurrentTicket(currentTicket + 1);
      setSelectedNumbers([]);
      setPowerball(0);
      setMode('manual');
    } else {
      // All tickets completed, submit to backend
      submitAllTickets(newTickets);
    }
  };

  const submitAllTickets = async (ticketsToSubmit: any[]) => {
    if (!sessionData) return;
    
    try {
      const response = await fetch('/api/lottery/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discord_id: sessionData.userId,
          tickets: ticketsToSubmit.map(t => ({
            numbers: t.numbers,
            powerball: t.powerball,
            type: t.type
          })),
          payment_id: paymentId,
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('🎉 All tickets submitted and saved to database successfully!\n\n✅ Payment completed\n✅ Numbers selected\n✅ Data saved to database\n\nYou can now view your tickets using /my-tickets command in Discord!');
        router.push('/');
      } else {
        alert('Error submitting tickets: ' + data.error);
      }
    } catch (error) {
      console.error('Error submitting tickets:', error);
      alert('Error submitting tickets. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#17191C] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Validating session...</p>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen bg-[#17191C] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-white text-2xl font-bold mb-2">Session Error</h1>
          <p className="text-gray-300 mb-4">{error || 'Invalid session'}</p>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isComplete = selectedNumbers.length === 5 && powerball > 0;

  return (
    <>
      <Head>
        <title>Select Numbers - Crypto Lottery</title>
        <meta name="description" content="Select your lottery numbers" />
      </Head>
      
      <main className="min-h-screen p-8" style={{backgroundColor: '#17191C'}}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2 text-center">Select Your Numbers</h1>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-2 border border-white/20">
            <div className="text-center space-y-2">
              <p className="text-2xl font-semibold text-white">Ticket {currentTicket} of {sessionData.ticketCount}</p>
              {/* <p className="text-gray-300 font-mono text-sm">Payment ID: {paymentId}</p> */}
            </div>
          </div>

        <div className="bg-green-500/20 backdrop-blur-lg rounded-2xl p-6 mb-2 border border-green-400/30">
          <h3 className="text-2xl font-semibold text-white mb-4">Mode Selection</h3>
          <div className="flex gap-4 justify-center">
            <button
              onClick={generateQuickPick}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg"
            >
              🎲 Quick Pick
            </button>
            <button
              onClick={() => {
                setSelectedNumbers([]);
                setPowerball(0);
                setMode('manual');
              }}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg"
            >
              ✖ Clear All
            </button>
          </div>
        </div>

        {mode === 'manual' && (
          <>
            <div className="bg-yellow-500/20 backdrop-blur-lg rounded-2xl p-6 mb-2 border border-yellow-400/30">
              <h3 className="text-2xl font-semibold text-white mb-4">Select 5 Main Numbers (1-69)</h3>
              <p className="text-gray-200 mb-6">
                Selected: <span className="text-yellow-300 font-semibold">{selectedNumbers.join(', ') || 'None'}</span> 
                <span className="text-gray-400 ml-2">({selectedNumbers.length}/5)</span>
              </p>
              
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                {Array.from({ length: 69 }, (_, i) => i + 1).map(number => (
                  <button
                    key={number}
                    onClick={() => selectNumber(number)}
                    className={`p-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      selectedNumbers.includes(number) 
                        ? 'bg-green-500 text-black shadow-lg scale-105' 
                        : 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600'
                    }`}
                  >
                    {number}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-red-500/20 backdrop-blur-lg rounded-2xl p-6 mb-2 border border-red-400/30">
              <h3 className="text-2xl font-semibold text-white mb-4">Select Powerball (1-25)</h3>
              <p className="text-gray-200 mb-6">
                Selected: <span className="text-red-300 font-semibold">{powerball || 'None'}</span>
              </p>
              
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {Array.from({ length: 25 }, (_, i) => i + 1).map(number => (
                  <button
                    key={number}
                    onClick={() => selectPowerball(number)}
                    className={`p-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      powerball === number 
                        ? 'bg-green-500 text-black shadow-lg scale-105' 
                        : 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600'
                    }`}
                  >
                    {number}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {mode === 'quickpick' && (
            <div className="bg-green-500/20 backdrop-blur-lg rounded-2xl p-8 mb-2 border border-green-400/30 text-center">
            <h3 className="text-3xl font-bold text-white mb-6">🎲 Quick Pick Generated!</h3>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-200 mb-2">Main Numbers:</p>
                <div className="flex justify-center gap-2 flex-wrap">
                  {selectedNumbers.map(num => (
                    <span key={num} className="bg-green-500 text-black px-4 py-2 rounded-lg font-semibold text-lg">
                      {num}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-gray-200 mb-2">Powerball:</p>
                <span className="bg-green-500 text-black px-4 py-2 rounded-lg font-semibold text-lg">
                  {powerball}
                </span>
              </div>
            </div>
            <button
              onClick={() => setMode('manual')}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all duration-200"
            >
              Customize Numbers
            </button>
          </div>
        )}

        {isComplete && (
          <div className="bg-green-500/20 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-green-400/30 text-center">
            <h3 className="text-3xl font-bold text-white mb-6"> Ticket Ready!</h3>
            <div className="space-y-4 mb-6">
              <div>
                {/* <p className="text-gray-200 mb-2">Main Numbers:</p> */}
                <div className="flex justify-center gap-2 flex-wrap">
                  {selectedNumbers.map(num => (
                    <span key={num} className="bg-green-500 text-black px-3 py-2 rounded-lg font-semibold">
                      {num}
                    </span>
                  ))}
                <p className="text-white mt-2 font-semibold">Powerball:</p>
                <span className="bg-green-500 text-black px-3 py-2 rounded-lg font-semibold">
                  {powerball}
                </span>
                </div>
              </div>
              <div>
              </div>
              {/* <p className="text-yellow-300 font-semibold">Type: {mode}</p> */}
            </div>
            
            <button
              onClick={submitTicket}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/25"
            >
              {currentTicket < (sessionData?.ticketCount || 1) ? 'Submit & Next Ticket' : 'Submit All Tickets'}
            </button>
          </div>
        )}

        {allTickets.length > 0 && (
          <div className="bg-gray-500/20 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-gray-400/30">
            <h3 className="text-2xl font-semibold text-white mb-4">Submitted Tickets</h3>
            <div className="space-y-3">
              {allTickets.map((ticket, index) => (
                <div key={index} className="bg-white/10 border border-gray-600 p-4 rounded-lg backdrop-blur-sm">
                  <p className="text-white">
                    <span className="font-semibold">Ticket {ticket.ticketNumber}:</span>{' '}
                    <span className="text-blue-300 font-mono">{ticket.numbers.join(', ')}</span> |{' '}
                    Powerball: <span className="text-red-300 font-mono">{ticket.powerball}</span>{' '}
                    (<span className="text-yellow-300">{ticket.type}</span>)
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </main>
    </>
  );
}
