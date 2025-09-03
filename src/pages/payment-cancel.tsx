import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function PaymentCancel() {
  const router = useRouter();
  const [paymentId, setPaymentId] = useState<string>('');

  useEffect(() => {
    if (router.isReady) {
      const { payment_id } = router.query;
      if (payment_id) {
        setPaymentId(payment_id as string);
      }
    }
  }, [router.isReady, router.query]);

  return (
    <>
      <Head>
        <title>Payment Cancelled - Crypto Lottery</title>
        <meta name="description" content="Payment was cancelled" />
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
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Payment Cancelled</h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
            Your payment was cancelled. No charges have been made.
          </p>
          {paymentId && (
            <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '2rem' }}>
              Payment ID: {paymentId}
            </p>
          )}
          <div style={{ 
            background: 'rgba(255, 193, 7, 0.2)', 
            padding: '1rem', 
            borderRadius: '10px',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            marginBottom: '2rem'
          }}>
            <p style={{ margin: 0 }}>
              💡 <strong>Want to try again?</strong> Go back to Discord and use the <code>/buy-tickets</code> command.
            </p>
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
