import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import LotteryTicket from '../components/LotteryTicket';

export default function Home() {
  const router = useRouter();
  const { discord_id } = router.query;
  
  const [discordId, setDiscordId] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoLoaded, setAutoLoaded] = useState(false);

  // Auto-load tickets if Discord ID is provided in URL
  useEffect(() => {
    if (discord_id && !autoLoaded) {
      setDiscordId(discord_id as string);
      setAutoLoaded(true);
      fetchTickets(discord_id as string);
    }
  }, [discord_id, autoLoaded]);

  const testWalletLink = async () => {
    if (!discordId || !walletAddress) {
      alert('Please enter both Discord ID and Wallet Address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/user/wallet?discord_id=${discordId}`);
      const data = await response.json();
      
      if (data.success) {
        alert(`Wallet found: ${data.user.walletAddress}`);
      } else {
        alert('Wallet not found or not linked');
      }
    } catch (error) {
      alert('Error testing wallet link');
    }
    setLoading(false);
  };

  const fetchTickets = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/tickets?discord_id=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setTickets(data.tickets);
      } else {
        console.error('Error fetching tickets:', data.error);
        setTickets([]);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    }
    setLoading(false);
  };

  const testTickets = async () => {
    if (!discordId) {
      alert('Please enter Discord ID');
      return;
    }
    await fetchTickets(discordId);
  };

  return (
    <>
      <Head>
        <title>Crypto Lottery Discord Bot - Admin Panel</title>
        <meta name="description" content="Admin panel for Crypto Lottery Discord Bot" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="min-h-screen p-8" style={{backgroundColor: '#17191C'}}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-12 text-center bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            🎲 Crypto Lottery Discord Bot
          </h1>


        {tickets.length > 0 ? (
          <div className="bg-green-500/20 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-green-400/30">

          
          {discord_id && (
            <div className="flex justify-between bg-green-500/20 backdrop-blur-lg rounded-xl p-4 mb-6 border border-green-400/30">
              <h3 className="text-2xl font-semibold text-green-600 mb-4"> Your Tickets : {tickets.length}</h3>
              <span className="text-green-200 text-center">
                ID: <span className="font-mono font-semibold">{discord_id}</span>
              </span>
            </div>
          )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {tickets.map((ticket: any, index) => (
                <LotteryTicket
                  key={index}
                  ticket={ticket}
                  index={index}
                  showTicketNumber={true}
                  className="transform hover:scale-105 transition-transform duration-300"
                />
              ))}
            </div>
          </div>
        ) : !loading && discordId && (
          <div className="bg-green-500/20 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-green-400/30">
            <h3 className="text-2xl font-semibold text-white mb-4">📭 No Tickets Found</h3>
            <p className="text-gray-200">No lottery tickets found for Discord ID: <span className="font-mono font-semibold">{discordId}</span></p>
            <p className="text-gray-300 mt-2">Use the /buy-tickets command in Discord to purchase tickets!</p>
          </div>
        )}

   

        <div className="bg-green-500/20 backdrop-blur-lg rounded-2xl p-6 border border-green-400/30">
          <h3 className="text-2xl font-semibold text-white mb-4"> Bot Invite Link</h3>
          <div className="text-center">
            <a 
              href="https://discord.com/oauth2/authorize?client_id=1412476966363463762"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-lg rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/25 hover:scale-105"
            >
              Invite Crypto Lottery Bot to Your Server
            </a>
          </div>
        </div>
        </div>
      </main>
    </>
  );
}
