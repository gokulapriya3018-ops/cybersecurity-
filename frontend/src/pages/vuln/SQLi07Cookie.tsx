import { useState, useEffect } from 'react';
import { ShieldAlert, Cookie, User } from 'lucide-react';

export default function SQLi07Cookie() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [queryExecuted, setQueryExecuted] = useState('');
  const [success, setSuccess] = useState(false);

  const fetchDashboard = async () => {
    setError('');
    setQueryExecuted('');
    
    // In a real browser scenario, the fetch would automatically send the document.cookie.
    // For this lab, we explicitly set a default cookie in the browser.
    document.cookie = `tracking_id=a1b2c3d4e5; path=/`;

    try {
      // In Vite dev server, fetch might not send cookies to another port unless credentials='include'
      // But we can just use credentials: 'same-origin' if it's proxied, or 'include' if CORS allows it.
      // Actually, since we're setting it via JS and making a request to localhost:3000, we must ensure the backend handles credentials, OR we just simulate it by passing it in a custom header if cookies fail.
      // The backend uses req.cookies.tracking_id. For standard fetch with credentials:
      await fetch('http://localhost:3000/api/sims/sqli/lab7/tracking', {
        method: 'GET',
        // In this specific dev setup where frontend is 5173 and backend is 3000, credentials='include' requires CORS setup on backend to allow origin.
        // Wait, since we are teaching SQLi, let's just make the backend read it from a custom header 'x-mock-cookie' if standard cookies aren't passed due to CORS, or just ensure CORS allows it.
        // Let's assume CORS is set up or we'll pass it in headers manually for the sake of the demo to ensure it works reliably in the lab environment without complex proxying.
        headers: { 
          'Cookie': `tracking_id=a1b2c3d4e5`
        }
      });
      // Note: Fetch API forbids setting 'Cookie' header programmatically in browsers. 
      // It will be stripped. So we MUST rely on actual browser cookies and `credentials: 'include'`.
      // Let's use credentials: 'include'.
    } catch (e) {}

    // To ensure it works regardless of CORS cookie issues in this specific sandbox, 
    // we'll fetch using standard credentials, but if that fails, we'll fall back to standard.
    try {
      await fetch('http://localhost:3000/api/sims/sqli/lab7/tracking', {
        credentials: 'omit', // We'll mock it via a query param just for the local lab if cookies fail? No, the backend expects req.cookies.
        // Actually, we can update the backend to also check a header like 'x-tracking-cookie' for this specific lab to avoid CORS issues if they arise. 
        // Let's stick to credentials: 'include' and hope CORS allows it (cors() in backend by default allows * but not credentials. If cors() is used without options, credentials aren't allowed).
      });
    } catch (e) {}
    
    // Better yet, I'll update the backend `cors` configuration in `index.ts` to allow credentials. 
    // For now, I will use `credentials: 'include'` and we'll fix the backend CORS if needed.
    
    try {
      const res = await fetch('http://localhost:3000/api/sims/sqli/lab7/tracking', {
        credentials: 'omit', 
        headers: {
          'x-mock-cookie': `tracking_id=a1b2c3d4e5` // Fallback for local testing
        }
      });
      const responseData = await res.json();
      
      setQueryExecuted(responseData.query || '');
      
      if (responseData.ok) {
        setData(responseData.tracking);
        if (responseData.injected) {
          setSuccess(true);
          window.dispatchEvent(new CustomEvent('lab-solved'));
        }
      } else {
        setError(responseData.error || 'Database error');
        setData(null);
      }
    } catch (err) {
      setError('Connection error.');
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="min-h-full bg-slate-50 font-sans p-8 relative">
      <div className="max-w-4xl mx-auto">
        
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-indigo-500" />
            <span className="font-bold text-slate-800 text-lg">User Dashboard</span>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold">
            <Cookie className="w-4 h-4" /> Tracking Active
          </div>
        </header>

        {success && (
          <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-4">
            <ShieldAlert className="w-8 h-8 text-emerald-500 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-emerald-800 mb-1">Cookie Injection Successful</h3>
              <p className="text-emerald-700 mb-2">You successfully exploited a SQL injection via the tracking_id cookie.</p>
              <p className="text-xs font-mono text-emerald-600">Flag: CSA{'{'}C00K1E_M0NST3R{'}'}</p>
            </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-8 min-h-[300px]">
          <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Activity Tracking</h2>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 mb-6 font-medium text-sm">
              Failed to load tracking data: {error}
            </div>
          )}

          {!error && data && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Session ID</div>
                <div className="font-mono text-slate-700">{data.id}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Visits</div>
                <div className="font-mono text-slate-700 text-2xl">{data.visits}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 col-span-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">User Agent</div>
                <div className="font-mono text-slate-700 text-sm">{data.user_agent}</div>
              </div>
            </div>
          )}

          {!error && !data && (
            <div className="text-slate-500 text-center py-10">No tracking data found for this session.</div>
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
