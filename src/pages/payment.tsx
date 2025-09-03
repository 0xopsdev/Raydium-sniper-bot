import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function PaymentPage() {
  const router = useRouter();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (router.isReady) {
      const { token, amount, user, payment } = router.query;
      
      if (payment === 'true' && token && amount && user) {
        setPaymentData({
          token,
          amount,
          user,
          payment
        });
      }
      setLoading(false);
    }
  }, [router.isReady, router.query]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Loading payment...</h2>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Invalid payment link</h2>
          <p>This payment link is not valid.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Payment - Crypto Lottery</title>
        <meta name="description" content="Complete your lottery ticket payment" />
      </Head>
      
      <main style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: 'white'
      }}>
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎫</div>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Crypto Lottery Payment</h1>
          
          <div style={{ 
            background: 'rgba(0, 255, 136, 0.2)', 
            padding: '1.5rem', 
            borderRadius: '15px',
            border: '1px solid rgba(0, 255, 136, 0.3)',
            marginBottom: '2rem'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#00ff88' }}>
              ${paymentData.amount} USDC
            </h2>
            <p style={{ margin: 0, opacity: 0.9 }}>
              For lottery tickets via Discord bot
            </p>
          </div>

          <div style={{ 
            background: 'rgba(0, 191, 255, 0.2)', 
            padding: '1rem', 
            borderRadius: '10px',
            border: '1px solid rgba(0, 191, 255, 0.3)',
            marginBottom: '2rem'
          }}>
            <p style={{ margin: 0 }}>
              💡 <strong>How to pay:</strong><br/>
              1. Use your crypto wallet to send USDC<br/>
              2. Send to: <code>EPnmEdiLyv38zZ2Fq9ma3NvejjzsDh8YJnUQwf98i3MY</code><br/>
              3. Include payment ID: <code>{paymentData.token}</code>
            </p>
          </div>

                     <div style={{ 
             background: 'rgba(255, 193, 7, 0.2)', 
             padding: '1rem', 
             borderRadius: '10px',
             border: '1px solid rgba(255, 193, 7, 0.3)',
             marginBottom: '2rem'
           }}>
             <p style={{ margin: 0 }}>
               ⚠️ <strong>Important:</strong> After payment, return to Discord to select your lottery numbers!
             </p>
           </div>

           <div style={{ 
             background: 'rgba(0, 255, 136, 0.2)', 
             padding: '1rem', 
             borderRadius: '10px',
             border: '1px solid rgba(0, 255, 136, 0.3)',
             marginBottom: '2rem'
           }}>
             <p style={{ margin: '0 0 1rem 0' }}>
               🧪 <strong>Testing Mode:</strong> Click the button below to simulate payment completion.
             </p>
             <button
               onClick={async () => {
                 try {
                   // Simulate payment completion
                   await fetch('/api/webhooks/helio', {
                     method: 'POST',
                     headers: {
                       'Content-Type': 'application/json',
                       'x-helio-signature': 'mock-signature'
                     },
                     body: JSON.stringify({
                       id: paymentData.token,
                       status: 'completed',
                       metadata: {
                         discordId: paymentData.user,
                         ticketCount: Math.floor(parseInt(paymentData.amount) / 5) // Assuming $5 per ticket
                       }
                     })
                   });
                   
                   // Redirect to success page
                   window.location.href = `/payment-success?payment_id=${paymentData.token}`;
                 } catch (error) {
                   console.error('Error simulating payment:', error);
                   alert('Error simulating payment. Please try again.');
                 }
               }}
               style={{
                 padding: '0.8rem 1.5rem',
                 background: 'linear-gradient(45deg, #00ff88, #00bfff)',
                 color: 'white',
                 border: 'none',
                 borderRadius: '20px',
                 fontSize: '0.9rem',
                 cursor: 'pointer',
                 fontWeight: 'bold',
                 marginRight: '1rem'
               }}
             >
               🎭 Simulate Payment
             </button>
           </div>

           <button
             onClick={() => window.close()}
             style={{
               padding: '0.8rem 2rem',
               background: 'linear-gradient(45deg, #ff6b6b, #ffa500)',
               color: 'white',
               border: 'none',
               borderRadius: '25px',
               fontSize: '1rem',
               cursor: 'pointer',
               fontWeight: 'bold'
             }}
           >
             Close Window
           </button>
        </div>
      </main>
    </>
  );
}
