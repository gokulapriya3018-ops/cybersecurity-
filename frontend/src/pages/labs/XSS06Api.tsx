import { useState, useEffect } from 'react';
import { ShieldAlert, Terminal, Send } from 'lucide-react';

export default function XSS06Api() {
  const [message, setMessage] = useState('');
  const [solveToken, setSolveToken] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [iframeKey, setIframeKey] = useState(0);

  const authToken = localStorage.getItem('token');

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/progress/token?labSlug=xss-api', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (data.ok) {
          setSolveToken(data.token);
        }
      } catch (err) {
        setError('Failed to fetch verification token.');
      }
    };
    fetchToken();
  }, [authToken]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'xss-complete' && event.data?.token === solveToken) {
        try {
          const res = await fetch('http://localhost:3000/api/progress/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ token: solveToken })
          });
          const data = await res.json();
          if (data.ok) {
            setSuccess(true);
            window.dispatchEvent(new CustomEvent('lab-solved'));
          } else {
            setError(data.message || 'Verification failed.');
          }
        } catch (err) {
          setError('Failed to submit completion token.');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [solveToken, authToken]);

  const handlePostLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:3000/api/sims/xss/lab6/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      if (data.ok) {
        setMessage('');
        setIframeKey(prev => prev + 1);
      } else {
        setError(data.message || 'Failed to submit log.');
      }
    } catch (err) {
      setError('Connection error.');
    }
  };

  return (
    <div className="min-h-full bg-slate-50 font-sans p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="space-y-6">
          <header className="border-b border-slate-200 pb-4">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Lab 6: REST API XSS</h1>
            <p className="text-sm text-slate-500 mt-1">Difficulty: Intermediate • API log injection</p>
          </header>

          {success && (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-4 shadow-sm animate-in zoom-in duration-300">
              <ShieldAlert className="w-8 h-8 text-emerald-500 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-emerald-800 mb-1">XSS Execution Successful!</h3>
                <p className="text-emerald-700 mb-2">Your payload was saved via a JSON API call and executed unsafely when loaded in the administrative dashboard.</p>
                <p className="text-xs font-mono text-emerald-600">Flag: CSA{'{'}JSON_AP1_XS5_M4ST3R{'}'}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            {solveToken && (
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl">
                <span className="text-xs font-semibold text-slate-500">Your Verification Token:</span>
                <code className="text-xs font-mono font-bold text-indigo-600 select-all bg-white px-2 py-0.5 rounded border border-slate-200">{solveToken}</code>
              </div>
            )}

            <form onSubmit={handlePostLog} className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Log Message (JSON payload)</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Log event details..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-sm shadow-md transition-colors flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Send API Log Request
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden min-h-[450px]">
          <div className="bg-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-700">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-300 font-mono">Sandbox Browser Iframe Context (Admin)</span>
            <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded ml-auto">VULNERABLE</span>
          </div>
          <div className="flex-1 bg-white relative">
            <iframe
              key={iframeKey}
              src="http://localhost:3000/api/sims/xss/lab6/admin/view"
              className="w-full h-full border-none absolute inset-0"
              title="Vulnerable JSON API Sandbox"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
