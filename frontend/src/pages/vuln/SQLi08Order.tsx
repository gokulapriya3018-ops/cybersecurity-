import { useState } from 'react';
import { ShieldAlert, Clock, PackageSearch } from 'lucide-react';

export default function SQLi08Order() {
  const [orderId, setOrderId] = useState('');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [queryExecuted, setQueryExecuted] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setData(null);
    setQueryExecuted('');
    setResponseTime(null);
    setIsLoading(true);
    
    const startTime = Date.now();
    
    try {
      const res = await fetch('http://localhost:3000/api/sims/sqli/lab8/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      const responseData = await res.json();
      
      const endTime = Date.now();
      const timeTaken = endTime - startTime;
      setResponseTime(timeTaken);
      
      setQueryExecuted(responseData.query || '');
      
      if (responseData.ok) {
        setData(responseData.order);
        if (responseData.injected && timeTaken > 3000) {
          // Verify time-based success if it took more than 3s (assuming pg_sleep(>3))
          setSuccess(true);
          window.dispatchEvent(new CustomEvent('lab-solved'));
        }
      } else {
        // Blind SQLi hides errors
        setError('Order not found or system error.');
      }
    } catch (err) {
      setError('Connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-100 font-sans p-8">
      <div className="max-w-3xl mx-auto">
        
        {success && (
          <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-4 shadow-sm">
            <ShieldAlert className="w-8 h-8 text-emerald-500 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-emerald-800 mb-1">Time-Based Injection Successful</h3>
              <p className="text-emerald-700 mb-2">The server took significantly longer to respond, confirming your pg_sleep() payload executed.</p>
              <p className="text-xs font-mono text-emerald-600">Flag: CSA{'{'}T1M3_L0RD{'}'}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-8">
          <div className="bg-indigo-600 p-8 text-white text-center">
            <PackageSearch className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
            <p className="text-indigo-200">Enter your order ID below to check its current status.</p>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleSearch} className="mb-8">
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Order ID</label>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={orderId}
                  onChange={e => {
                    const val = e.target.value;
                    if (/[^a-zA-Z0-9-]/.test(val)) {
                      alert('🛑 Client-Side Security: Order ID can only contain alphanumeric characters and dashes.');
                      return;
                    }
                    setOrderId(val);
                  }}
                  placeholder="e.g. ORD-1234"
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-mono"
                />
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold px-8 py-3 rounded-xl transition-colors flex items-center justify-center min-w-[120px]"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Track'}
                </button>
              </div>
            </form>

            {responseTime !== null && (
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100 w-max">
                <Clock className="w-4 h-4" />
                Response time: <span className="font-mono font-bold">{responseTime}ms</span>
              </div>
            )}

            {error && (
              <div className="text-center text-slate-500 font-medium py-8 border-t border-slate-100">
                {error}
              </div>
            )}

            {!error && data && (
              <div className="border-t border-slate-100 pt-8">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</div>
                    <div className="text-xl font-bold text-emerald-600 flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                      {data.status}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total</div>
                    <div className="text-xl font-bold text-slate-800">${data.total}</div>
                  </div>
                </div>
              </div>
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
