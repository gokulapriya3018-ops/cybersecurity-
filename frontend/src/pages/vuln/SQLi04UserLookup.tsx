import { useState } from 'react';
import { Search, ShieldAlert, Users } from 'lucide-react';

export default function SQLi04UserLookup() {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [queryExecuted, setQueryExecuted] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus(null);
    setQueryExecuted('');
    
    try {
      const res = await fetch('http://localhost:3000/api/sims/sqli/lab4/user-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      
      setQueryExecuted(data.query || '');
      
      if (data.ok) {
        setStatus(data.exists);
        if (data.injected) {
          setSuccess(true);
          window.dispatchEvent(new CustomEvent('lab-solved'));
        }
      } else {
        // Blind SQLi shouldn't normally expose errors to UI, 
        // but if it does, it's just a generic message.
        setStatus(false);
      }
    } catch (err) {
      setError('Connection error.');
    }
  };

  return (
    <div className="min-h-full bg-[#f8fafc] font-sans flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        
        {success && (
          <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-4 shadow-sm">
            <ShieldAlert className="w-8 h-8 text-emerald-500 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-emerald-800 mb-1">Boolean Injection Successful</h3>
              <p className="text-emerald-700 mb-2">You successfully injected a condition to manipulate the True/False outcome.</p>
              <p className="text-xs font-mono text-emerald-600">Flag: CSA{'{'}B00L34N_BL1ND{'}'}</p>
            </div>
          </div>
        )}

        <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 mb-8">
          <div className="flex justify-center mb-6 text-indigo-500">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">User Directory</h1>
          <p className="text-slate-500 mb-8 text-center text-sm">Check if a username exists in our system.</p>
          
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. admin" 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  required
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl transition-colors text-sm shadow-md">
              Verify Availability
            </button>
          </form>

          {status !== null && (
            <div className={`mt-6 p-4 rounded-xl text-center font-bold text-sm ${status ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
              {status ? '✗ Username is already taken' : '✓ Username is available'}
            </div>
          )}

          {error && (
            <div className="mt-6 text-center text-red-500 text-sm font-medium">
              {error}
            </div>
          )}
        </div>

        {queryExecuted && (
          <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl">
            <div className="bg-slate-800 px-4 py-2 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Executed Query</span>
              <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">Debug</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <code className="text-emerald-400 text-sm whitespace-pre-wrap font-mono">
                {queryExecuted}
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
