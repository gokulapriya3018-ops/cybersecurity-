import { useState, useEffect } from 'react';
import { Search, Terminal, CheckCircle } from 'lucide-react';

export default function XSS01Reflected() {
  const [query, setQuery] = useState('');
  const [iframeUrl, setIframeUrl] = useState('http://localhost:3000/api/sims/xss/lab1');
  const [success, setSuccess] = useState(false);

  const authToken = localStorage.getItem('token');

  useEffect(() => {
    // Listen for XSS execution message from the vulnerable iframe
    const handleMessage = async (event: MessageEvent) => {
      if (
        event.data?.type === 'xss-complete' || 
        event.data === 'xss-complete' ||
        (typeof event.data === 'string' && event.data.includes('xss-complete'))
      ) {
        setSuccess(true);
        window.dispatchEvent(new CustomEvent('lab-solved'));

        if (authToken) {
          try {
            await fetch('http://localhost:3000/api/progress/complete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify({ labSlug: 'xss-reflected' })
            });
          } catch (err) {
            console.error(err);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [authToken]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setIframeUrl(`http://localhost:3000/api/sims/xss/lab1?search=${encodeURIComponent(query)}&_t=${Date.now()}`);
  };

  return (
    <div className="min-h-full bg-slate-50 font-sans p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Lab Panel (Left) */}
        <div className="space-y-6">
          <header className="border-b border-slate-200 pb-4">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Lab 1: Reflected XSS</h1>
            <p className="text-sm text-slate-500 mt-1">Difficulty: Beginner • Search query context</p>
          </header>

          {success && (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-4 shadow-sm animate-in zoom-in duration-300">
              <CheckCircle className="w-8 h-8 text-emerald-500 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-emerald-800 mb-1">XSS Execution Successful!</h3>
                <p className="text-emerald-700 mb-2">Your injected script successfully ran in the context of the vulnerable page and communicated with the portal.</p>
                <p className="text-xs font-mono text-emerald-600 bg-emerald-100/60 px-2 py-1 rounded inline-block">Flag: CSA{'{'}R3FL3CT3D_XS5_M4ST3R{'}'}</p>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <form onSubmit={handleSearch} className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Search Input</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Enter search query..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl text-sm shadow-md transition-colors">
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Iframe View (Right) */}
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
              title="Vulnerable Reflected XSS Sandbox"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
