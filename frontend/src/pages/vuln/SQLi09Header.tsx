import { useState } from 'react';
import { ShieldAlert, Activity, Server } from 'lucide-react';

export default function SQLi09Header() {
  const [error, setError] = useState('');
  const [queryExecuted, setQueryExecuted] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const sendPing = async () => {
    setError('');
    setMessage('');
    setQueryExecuted('');
    setIsLoading(true);
    
    try {
      const res = await fetch('http://localhost:3000/api/sims/sqli/lab9/analytics', {
        method: 'GET'
      });
      const responseData = await res.json();
      
      setQueryExecuted(responseData.query || '');
      
      if (responseData.ok) {
        setMessage(responseData.message);
        if (responseData.injected) {
          setSuccess(true);
          window.dispatchEvent(new CustomEvent('lab-solved'));
        }
      } else {
        setError(responseData.error || 'Server error');
      }
    } catch (err) {
      setError('Connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-900 font-sans p-8 flex flex-col items-center">
      <div className="max-w-3xl w-full">
        
        {success && (
          <div className="mb-8 p-6 bg-emerald-900/30 border border-emerald-500/50 rounded-2xl flex items-start gap-4 shadow-lg">
            <ShieldAlert className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-emerald-400 mb-1">Header Injection Successful</h3>
              <p className="text-emerald-200/80 mb-2">You successfully bypassed the frontend and injected a payload into the User-Agent header!</p>
              <p className="text-xs font-mono text-emerald-300">Flag: CSA{'{'}H34D3R_M4ST3R{'}'}</p>
            </div>
          </div>
        )}

        <div className="bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden mb-8">
          <div className="p-8 text-center border-b border-slate-700 bg-slate-800/50">
            <Activity className="w-16 h-16 mx-auto mb-4 text-sky-400 opacity-80" />
            <h1 className="text-3xl font-bold mb-2 text-white">System Analytics</h1>
            <p className="text-slate-400">Our backend automatically logs device and browser telemetry for analytics purposes.</p>
          </div>
          
          <div className="p-12 flex flex-col items-center justify-center bg-slate-800">
            <p className="text-slate-300 text-center mb-8 max-w-lg">
              Click the button below to manually ping the analytics server. Note: Telemetry data (like your IP address and User-Agent) is automatically sent in the request headers.
            </p>
            
            <button 
              onClick={sendPing}
              disabled={isLoading}
              className="bg-sky-500 hover:bg-sky-400 disabled:bg-sky-800 text-white font-bold px-10 py-4 rounded-full transition-all flex items-center justify-center min-w-[200px] shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] transform hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="flex items-center gap-2"><Server className="w-5 h-5" /> Send Telemetry Ping</span>
              )}
            </button>
            
            {message && !error && (
              <div className="mt-8 text-emerald-400 font-mono text-sm bg-emerald-900/20 px-4 py-2 rounded-lg border border-emerald-900/50">
                {message}
              </div>
            )}
            
            {error && (
              <div className="mt-8 text-rose-400 font-mono text-sm bg-rose-900/20 px-4 py-2 rounded-lg border border-rose-900/50">
                {error}
              </div>
            )}
          </div>
        </div>

        {queryExecuted && (
          <div className="bg-[#0A0A0F] rounded-xl overflow-hidden border border-white/10 shadow-xl">
            <div className="bg-[#12121A] px-4 py-3 flex justify-between items-center border-b border-white/5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Executed Database Query</span>
              <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20">Backend Telemetry Log</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <code className="text-rose-400 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {queryExecuted}
              </code>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
