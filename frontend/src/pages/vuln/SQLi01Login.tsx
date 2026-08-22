import { useState } from 'react';

export default function SQLi01Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('http://localhost:3000/api/sims/sqli/lab1/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setSuccess(true);
        // Dispatch event to VulnLayout to mark lab as solved
        if (data.injected) {
          window.dispatchEvent(new CustomEvent('lab-solved'));
        }
      } else {
        setError(data.message || data.error || 'Invalid username or password');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="min-h-full flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center border border-slate-100">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome, Administrator</h2>
          <p className="text-slate-500 mb-6">You have successfully bypassed the authentication portal.</p>
          <p className="text-xs text-slate-400">Flag: CSA{'{'}SQLi_Byp4ss_M4st3r{'}'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col justify-center items-center p-6 bg-[#0f1115] relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="w-full max-w-md p-10 bg-white/5 backdrop-blur-2xl shadow-2xl rounded-3xl border border-white/10 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="mb-10 text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Acme Corp</h1>
          <p className="text-sm text-slate-400 font-medium">Secure Employee Gateway</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex animate-in slide-in-from-top-2">
              <svg className="h-5 w-5 text-red-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm text-red-200 font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-300 ml-1" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all hover:bg-black/60"
              placeholder="Enter your username"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between ml-1">
              <label className="text-sm font-semibold text-slate-300" htmlFor="password">
                Password
              </label>
              <a href="#" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                Forgot password?
              </a>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all hover:bg-black/60"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f1115] focus:ring-indigo-500 transition-all active:scale-[0.98]"
          >
            Authenticate
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-[11px] text-slate-500 tracking-wide uppercase font-semibold">
            Internal Use Only. Access is monitored.
          </p>
        </div>
      </div>
    </div>
  );
}
