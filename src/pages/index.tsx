import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [discordId, setDiscordId] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const testTickets = async () => {
    if (!discordId) {
      alert('Please enter Discord ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/tickets?discord_id=${discordId}`);
      const data = await response.json();
      
      if (data.success) {
        setTickets(data.tickets);
      } else {
        alert('Error fetching tickets');
      }
    } catch (error) {
      alert('Error fetching tickets');
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Crypto Lottery Discord Bot - Admin Panel</title>
        <meta name="description" content="Admin panel for Crypto Lottery Discord Bot" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main style={{ 
        padding: '2rem', 
        maxWidth: '800px', 
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1> Crypto Lottery Discord Bot</h1>
        
        <div style={{ 
          background: '#f5f5f5', 
          padding: '1rem', 
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h2>🔧 API Testing</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Discord ID:
            </label>
            <input
              type="text"
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              placeholder="Enter Discord ID"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Wallet Address:
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter Wallet Address"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={testWalletLink}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Testing...' : 'Test Wallet Link'}
            </button>
            
            <button
              onClick={testTickets}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Loading...' : 'Fetch Tickets'}
            </button>
          </div>
        </div>

        {tickets.length > 0 && (
          <div style={{ 
            background: '#e8f5e8', 
            padding: '1rem', 
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <h3> User Tickets ({tickets.length})</h3>
            {tickets.map((ticket: any, index) => (
              <div key={index} style={{ 
                border: '1px solid #ccc', 
                padding: '0.5rem', 
                margin: '0.5rem 0',
                borderRadius: '4px',
                backgroundColor: 'white'
              }}>
                <strong>Ticket #{index + 1}</strong> ({ticket.ticketId})<br/>
                Numbers: {ticket.numbers.join(', ')} | Powerball: {ticket.powerball}<br/>
                Type: {ticket.type} | Draw: {new Date(ticket.drawDate).toLocaleDateString()}
              </div>
            ))}
          </div>
        )}

        <div style={{ 
          background: '#fff3cd', 
          padding: '1rem', 
          borderRadius: '8px',
          border: '1px solid #ffeaa7'
        }}>
          <h3> Bot Commands</h3>
          <ul>
            <li><code>/buy-tickets [number]</code> - Purchase lottery tickets</li>
            <li><code>/link-wallet [address]</code> - Link your crypto wallet</li>
            <li><code>/my-tickets</code> - View your recent tickets</li>
            <li><code>/quickpick</code> - Generate random numbers</li>
          </ul>
        </div>

        <div style={{ 
          background: '#d1ecf1', 
          padding: '1rem', 
          borderRadius: '8px',
          border: '1px solid #bee5eb',
          marginTop: '2rem'
        }}>
          <h3> Bot Invite Link</h3>
          <p>
            <a 
              href="https://discord.com/oauth2/authorize?client_id=1412476966363463762"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#007bff', textDecoration: 'none' }}
            >
              Invite Crypto Lottery Bot to Your Server
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
