import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function PaymentSuccess() {
  const router = useRouter();
  const [paymentId, setPaymentId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (router.isReady) {
      const { payment_id } = router.query;
      if (payment_id) {
        setPaymentId(payment_id as string);
        
        // Simulate payment completion webhook
        setTimeout(async () => {
          try {
            // Call webhook to notify bot about payment completion
            await fetch('/api/webhooks/helio', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-helio-signature': 'mock-signature' // In production, this would be verified
              },
              body: JSON.stringify({
                id: payment_id,
                status: 'completed',
                metadata: {
                  discordId: 'mock-discord-id', // This would come from the payment metadata
                  ticketCount: 1
                }
              })
            });
          } catch (error) {
            console.error('Error notifying webhook:', error);
          }
        }, 2000);
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
          <h2>Processing payment...</h2>
          <p>Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Payment Successful - Crypto Lottery</title>
        <meta name="description" content="Payment completed successfully" />
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
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Payment Successful!</h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
            Your payment has been processed successfully.
          </p>
          {paymentId && (
            <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '2rem' }}>
              Payment ID: {paymentId}
            </p>
          )}
          <div style={{ 
            background: 'rgba(0, 255, 136, 0.2)', 
            padding: '1rem', 
            borderRadius: '10px',
            border: '1px solid rgba(0, 255, 136, 0.3)'
          }}>
            <p style={{ margin: 0 }}>
              🎫 <strong>Check your Discord!</strong> You should receive a message to select your lottery numbers.
            </p>
          </div>
          <button
            onClick={() => window.close()}
            style={{
              marginTop: '2rem',
              padding: '0.8rem 2rem',
              background: 'linear-gradient(45deg, #00ff88, #00bfff)',
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
