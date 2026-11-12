import { useState, useEffect } from 'react';
import { ShieldAlert, Search, Terminal } from 'lucide-react';

export default function XSS05Blacklist() {
  const [query, setQuery] = useState('');
  const [iframeUrl, setIframeUrl] = useState('http://localhost:3000/api/sims/xss/lab5');
  const [solveToken, setSolveToken] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const authToken = localStorage.getItem('token');

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/progress/token?labSlug=xss-blacklist', {
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIframeUrl(`http://localhost:3000/api/sims/xss/lab5?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-full bg-slate-50 font-sans p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="space-y-6">
          <header className="border-b border-slate-200 pb-4">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Lab 5: Blacklist Filter Bypass</h1>
            <p className="text-sm text-slate-500 mt-1">Difficulty: Intermediate • Script-stripping filter bypass</p>
          </header>

          {success && (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-4 shadow-sm animate-in zoom-in duration-300">
              <ShieldAlert className="w-8 h-8 text-emerald-500 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-emerald-800 mb-1">XSS Execution Successful!</h3>
                <p className="text-emerald-700 mb-2">You successfully bypassed the blacklist script-stripper using nested script tags or alternate HTML elements.</p>
                <p className="text-xs font-mono text-emerald-600">Flag: CSA{'{'}F1LT3R_XS5_BYP4SS{'}'}</p>
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

            <form onSubmit={handleSearch} className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Filtered Search Input</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Enter search term..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl text-sm shadow-md transition-colors">
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="flex flex-col bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden min-h-[450px]">
          <div className="bg-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-700">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-300 font-mono">Sandbox Browser Iframe Context</span>
            <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded ml-auto">VULNERABLE</span>
          </div>
          <div className="flex-1 bg-white relative">
            <iframe
              src={iframeUrl}
              className="w-full h-full border-none absolute inset-0"
              title="Vulnerable Blacklist XSS Sandbox"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
