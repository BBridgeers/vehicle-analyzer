'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export default function DiagnosticError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [showDetails, setShowDetails] = useState(false);
    const [browserInfo, setBrowserInfo] = useState<string>('');

    useEffect(() => {
        // Collect diagnostic info
        const info = {
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack?.substring(0, 1500),
            errorDigest: error.digest,
        };
        setBrowserInfo(JSON.stringify(info, null, 2));

        // Log to console for debugging
        console.error('🚨 VERACAR ERROR BOUNDARY:', info);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#0a0905] text-gray-200 flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-[#1a1816] border border-[#262420] rounded-xl p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-red-400">Application Error</h1>
                        <p className="text-sm text-gray-500">Something went wrong loading this page</p>
                    </div>
                </div>

                <div className="bg-[#11100e] border border-[#2a2825] rounded-lg p-4 mb-6">
                    <p className="text-sm font-semibold text-gray-200 mb-1">{error.name || 'Error'}</p>
                    <p className="text-sm text-gray-400 break-words">{error.message || 'An unexpected client-side error occurred'}</p>
                    {error.digest && (
                        <p className="text-xs text-gray-600 mt-2 font-mono">ID: {error.digest}</p>
                    )}
                </div>

                <div className="mb-6">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-[#11100e] border border-[#2a2825] rounded-lg text-sm text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        <span>Technical Details</span>
                        {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showDetails && (
                        <pre className="mt-2 bg-[#0a0905] border border-[#2a2825] rounded-lg p-3 text-xs text-gray-400 overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap font-mono">
                            {browserInfo || 'Loading diagnostics...'}
                        </pre>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={reset}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="flex-1 px-4 py-2.5 bg-[#2a2825] hover:bg-[#3a3730] text-gray-300 rounded-lg font-medium transition-colors"
                    >
                        Go Home
                    </button>
                </div>

                <p className="mt-6 text-xs text-gray-600 text-center">
                    If this persists, try a different browser or clear your cache.<br />
                    This error has been logged for the engineering team.
                </p>
            </div>
        </div>
    );
}
