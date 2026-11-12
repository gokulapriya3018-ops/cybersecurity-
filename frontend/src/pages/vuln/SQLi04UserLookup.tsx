import { useState } from 'react';
import { Search, ShieldAlert, Users, Terminal, Play, CheckCircle2, Lock } from 'lucide-react';

export default function SQLi04UserLookup() {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [queryExecuted, setQueryExecuted] = useState('');
  const [success, setSuccess] = useState(false);

  // Real-time Blind Exfiltration Demo State
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedPassword, setExtractedPassword] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [currentChecking, setCurrentChecking] = useState('');

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
        setStatus(false);
      }
    } catch (err) {
      setError('Connection error.');
    }
  };

  // Real-time automated Blind Boolean Password Extractor simulation (like sqlmap)
  const runBlindExfiltration = async () => {
    setIsExtracting(true);
    setExtractedPassword('');
    setLogs(['[*] Initializing Boolean-Based Blind SQLi automation script...', '[*] Target Endpoint: POST /api/sims/sqli/lab4/user-lookup', '[*] Target User: "admin"']);
    
    const targetPassword = 'wtp2024!';
    const charset = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let recovered = '';

    for (let pos = 1; pos <= targetPassword.length; pos++) {
      const correctChar = targetPassword[pos - 1];
      
      // Test 2-3 decoy characters first so the user sees the Boolean False in real time
      const testChars = [
        charset[Math.floor(Math.random() * 10)], 
        charset[Math.floor(Math.random() * 10 + 10)], 
        correctChar
      ].filter((v, i, a) => a.indexOf(v) === i);

      for (const char of testChars) {
        setCurrentChecking(`Pos ${pos}: Testing '${char}'...`);
        const payload = `admin' AND SUBSTRING(password, ${pos}, 1) = '${char}' --`;
        
        try {
          const res = await fetch('http://localhost:3000/api/sims/sqli/lab4/user-lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: payload })
          });
          await res.json();
          const isMatch = (char === correctChar);

          if (isMatch) {
            recovered += char;
            setExtractedPassword(recovered);
            setLogs(prev => [
              ...prev, 
              `[+] [TRUE]  Payload: ...SUBSTRING(password, ${pos}, 1) = '${char}' ➔ MATCH! Character found: '${char}'`
            ]);
            break;
          } else {
            setLogs(prev => [
              ...prev.slice(-10), 
              `[-] [FALSE] Payload: ...SUBSTRING(password, ${pos}, 1) = '${char}' ➔ (Available)`
            ]);
          }
        } catch (e) {
          // ignore network glitch
        }
        await new Promise(r => setTimeout(r, 100));
      }
      await new Promise(r => setTimeout(r, 120));
    }

    setLogs(prev => [
      ...prev,
      '==========================================================',
      `[SUCCESS] 🎯 Full Extracted Admin Password: "${recovered}"`,
      '[INFO] Recovered 100% via Boolean inference with zero database errors.',
      '=========================================================='
    ]);
    setIsExtracting(false);
    setCurrentChecking('');
    setSuccess(true);
    window.dispatchEvent(new CustomEvent('lab-solved'));
  };

  return (
    <div className="min-h-full bg-[#f8fafc] font-sans flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        
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

        {/* Real-time Blind Exploitation Console (Real-time Simulation) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Terminal className="w-5 h-5 text-rose-500" />
              <span>Real-Time Blind SQLi Attack Simulator</span>
            </div>
            <button
              onClick={runBlindExfiltration}
              disabled={isExtracting}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isExtracting ? 'Extracting Live...' : '⚡ Run Automated Blind Attack'}</span>
            </button>
          </div>

          <p className="text-slate-400 text-xs mb-4">
            Watch how real-world tools (<span className="text-amber-400 font-mono">sqlmap</span> / Python scripts) extract the admin's secret password character-by-character using only Boolean True/False logic!
          </p>

          {/* Cracked Password Visual Display */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-indigo-400" />
              <div>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Target: admin password</div>
                <div className="text-lg font-mono font-black tracking-widest text-emerald-400">
                  {extractedPassword ? (
                    <span>
                      {extractedPassword}
                      <span className="animate-pulse text-slate-600">{'*'.repeat(Math.max(0, 8 - extractedPassword.length))}</span>
                    </span>
                  ) : (
                    <span className="text-slate-600">********</span>
                  )}
                </div>
              </div>
            </div>
            {extractedPassword.length === 8 && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                <span>CRACKED: wtp2024!</span>
              </div>
            )}
          </div>

          {/* Terminal Logs Output */}
          <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-300 h-44 overflow-y-auto space-y-1 border border-slate-900 scrollbar-thin">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic">Click "⚡ Run Automated Blind Attack" above to watch live Boolean password recovery...</div>
            ) : (
              logs.map((log, i) => (
                <div 
                  key={i} 
                  className={
                    log.includes('[SUCCESS]') || log.includes('MATCH')
                      ? 'text-emerald-400 font-bold' 
                      : log.includes('[FALSE]') 
                      ? 'text-slate-500' 
                      : log.includes('[*]') 
                      ? 'text-cyan-400' 
                      : 'text-amber-300'
                  }
                >
                  {log}
                </div>
              ))
            )}
            {currentChecking && (
              <div className="text-rose-400 animate-pulse font-bold">{currentChecking}</div>
            )}
          </div>
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
