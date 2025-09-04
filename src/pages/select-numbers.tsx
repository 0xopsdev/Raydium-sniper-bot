import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function SelectNumbersPage() {
  const router = useRouter();
  const { paymentId, user, tickets, wallet } = router.query;
  
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [powerball, setPowerball] = useState<number>(0);
  const [currentTicket, setCurrentTicket] = useState(1);
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [mode, setMode] = useState<'manual' | 'quickpick'>('manual');

  useEffect(() => {
    if (!paymentId || !user || !tickets) {
      router.push('/');
    }
  }, [paymentId, user, tickets, router]);

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

    if (currentTicket < parseInt(tickets as string)) {
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
    try {
      const response = await fetch('/api/lottery/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: (wallet as string) || '',
          discord_id: user,
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

  if (!paymentId || !user || !tickets) {
    return <div>Loading...</div>;
  }

  const isComplete = selectedNumbers.length === 5 && powerball > 0;

  return (
    <>
      <Head>
        <title>Select Numbers - Crypto Lottery</title>
        <meta name="description" content="Select your lottery numbers" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">🎫 Select Your Numbers</h1>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
            <div className="text-center space-y-2">
              <p className="text-2xl font-semibold text-white">Ticket {currentTicket} of {tickets}</p>
              <p className="text-gray-300 font-mono text-sm">Payment ID: {paymentId}</p>
            </div>
          </div>

        <div className="bg-green-500/20 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-green-400/30">
          <h3 className="text-2xl font-semibold text-white mb-4">Mode Selection</h3>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setMode('manual')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                mode === 'manual' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Manual Selection
            </button>
            <button
              onClick={generateQuickPick}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg"
            >
              🎲 Quick Pick
            </button>
          </div>
        </div>

        {mode === 'manual' && (
          <>
            <div className="bg-yellow-500/20 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-yellow-400/30">
              <h3 className="text-2xl font-semibold text-white mb-4">Select 5 Main Numbers (1-69)</h3>
              <p className="text-gray-200 mb-6">
                Selected: <span className="text-yellow-300 font-semibold">{selectedNumbers.join(', ') || 'None'}</span> 
                <span className="text-gray-400 ml-2">({selectedNumbers.length}/5)</span>
              </p>
              
              <div className="grid grid-cols-10 gap-2">
                {Array.from({ length: 69 }, (_, i) => i + 1).map(number => (
                  <button
                    key={number}
                    onClick={() => selectNumber(number)}
                    className={`p-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      selectedNumbers.includes(number) 
                        ? 'bg-blue-600 text-white shadow-lg scale-105' 
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-gray-600'
                    }`}
                  >
                    {number}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-red-500/20 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-red-400/30">
              <h3 className="text-2xl font-semibold text-white mb-4">Select Powerball (1-25)</h3>
              <p className="text-gray-200 mb-6">
                Selected: <span className="text-red-300 font-semibold">{powerball || 'None'}</span>
              </p>
              
              <div className="grid grid-cols-10 gap-2">
                {Array.from({ length: 25 }, (_, i) => i + 1).map(number => (
                  <button
                    key={number}
                    onClick={() => selectPowerball(number)}
                    className={`p-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      powerball === number 
                        ? 'bg-red-600 text-white shadow-lg scale-105' 
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-gray-600'
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
          <div className="bg-green-500/20 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-green-400/30 text-center">
            <h3 className="text-3xl font-bold text-white mb-6">🎲 Quick Pick Generated!</h3>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-200 mb-2">Main Numbers:</p>
                <div className="flex justify-center gap-2 flex-wrap">
                  {selectedNumbers.map(num => (
                    <span key={num} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-lg">
                      {num}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-gray-200 mb-2">Powerball:</p>
                <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-lg">
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
          <div style={{ 
            background: '#d4edda', 
            padding: '1.5rem', 
            borderRadius: '8px',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <h3>✅ Ticket Ready!</h3>
            <p><strong>Main Numbers:</strong> {selectedNumbers.join(', ')}</p>
            <p><strong>Powerball:</strong> {powerball}</p>
            <p><strong>Type:</strong> {mode}</p>
            
            <button
              onClick={submitTicket}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                marginTop: '1rem'
              }}
            >
              {currentTicket < parseInt(tickets as string) ? 'Submit & Next Ticket' : 'Submit All Tickets'}
            </button>
          </div>
        )}

        {allTickets.length > 0 && (
          <div style={{ 
            background: '#f8f9fa', 
            padding: '1.5rem', 
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <h3>📋 Submitted Tickets</h3>
            {allTickets.map((ticket, index) => (
              <div key={index} style={{ 
                border: '1px solid #dee2e6', 
                padding: '1rem', 
                margin: '0.5rem 0',
                borderRadius: '4px',
                backgroundColor: 'white'
              }}>
                <p><strong>Ticket {ticket.ticketNumber}:</strong> {ticket.numbers.join(', ')} | Powerball: {ticket.powerball} ({ticket.type})</p>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>
    </>
  );
}
