'use client';

// Global error boundary for errors outside the layout tree
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    console.error('🚨 GLOBAL ERROR:', error);
    return (
        <html>
            <body style={{ margin: 0, background: '#0a0905', color: '#eee', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
                <div style={{ maxWidth: '500px', textAlign: 'center' }}>
                    <h1 style={{ color: '#ef4444', fontSize: '1.5rem', marginBottom: '1rem' }}>Application Error</h1>
                    <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error.message || 'An unexpected client-side error occurred'}</p>
                    {error.digest && <p style={{ color: '#666', fontSize: '0.75rem', fontFamily: 'monospace' }}>ID: {error.digest}</p>}
                    <button onClick={reset} style={{ background: '#0891b2', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>Try Again</button>
                    <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#555' }}>Try refreshing or using a different browser</p>
                </div>
            </body>
        </html>
    );
}
