import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldAlert, Package } from 'lucide-react';

export default function SQLi03Details() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [allData, setAllData] = useState<any[]>([]); // To show UNION results
  const [error, setError] = useState('');
  const [queryExecuted, setQueryExecuted] = useState('');
  const [success, setSuccess] = useState(false);
  const [inputId, setInputId] = useState(searchParams.get('id') || '1');

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      fetchProductDetails(id);
    }
  }, [searchParams]);

  const fetchProductDetails = async (id: string) => {
    setError('');
    setQueryExecuted('');
    
    try {
      const res = await fetch(`http://localhost:3000/api/sims/sqli/lab3/product/${encodeURIComponent(id)}`);
      const data = await res.json();
      
      setQueryExecuted(data.query || '');
      
      if (data.ok) {
        setProduct(data.product);
        setAllData(data.products || []);
        if (data.injected && data.products && data.products.length > 1) {
          setSuccess(true);
          window.dispatchEvent(new CustomEvent('lab-solved'));
        }
      } else {
        setError(data.error || 'Database error occurred.');
        setProduct(null);
        setAllData([]);
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }
  };

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ id: inputId });
  };

  return (
    <div className="min-h-full bg-slate-50 font-sans p-8">
      <div className="max-w-5xl mx-auto">
        
        <header className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
          <div className="text-2xl font-black text-slate-800 tracking-tighter">ShopMart Details</div>
          
          <form onSubmit={handleGo} className="flex gap-2">
            <span className="text-sm font-medium text-slate-500 self-center">Product ID:</span>
            <input 
              type="text" 
              value={inputId}
              onChange={e => setInputId(e.target.value)}
              className="px-3 py-1 border border-slate-300 rounded-lg text-sm w-48"
            />
            <button type="submit" className="bg-slate-800 text-white px-4 py-1 rounded-lg text-sm font-bold">Go</button>
          </form>
        </header>

        {success && (
          <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-4">
            <ShieldAlert className="w-8 h-8 text-emerald-500 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-emerald-800 mb-1">UNION Injection Successful</h3>
              <p className="text-emerald-700 mb-2">You successfully appended data to the result set using UNION.</p>
              <p className="text-xs font-mono text-emerald-600">Flag: CSA{'{'}UNI0N_EXTR4CT10N{'}'}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 mb-8 font-medium">
            Error: {error}
          </div>
        )}

        {!error && product && (
          <div>
            {allData.some(p => p.category === 'Administrator' || p.name === 'admin' || p.category === 'Operator') && (
              <div className="mb-6 flex items-center gap-3 text-rose-700 font-bold bg-rose-50 border border-rose-300 p-4 rounded-2xl shadow-sm">
                <span className="text-xl">🔓</span>
                <div>
                  <div className="text-sm font-black uppercase tracking-wider text-rose-800">WAF Bypass + Database Exfiltration Active!</div>
                  <div className="text-xs text-rose-600 font-normal">Firewall was bypassed using lowercase keywords. Extracted user accounts and passwords from `vuln_users` below:</div>
                </div>
              </div>
            )}

            <div className={`rounded-3xl p-8 shadow-sm border mb-8 flex flex-col md:flex-row gap-8 relative ${
              (product.category === 'Administrator' || product.name === 'admin' || product.category === 'Operator')
                ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400'
                : 'bg-white border-slate-200'
            }`}>
              {(product.category === 'Administrator' || product.name === 'admin' || product.category === 'Operator') && (
                <span className="absolute top-4 right-4 bg-rose-600 text-white text-xs font-black uppercase px-3 py-1 rounded-full shadow tracking-wider">
                  Leaked Account
                </span>
              )}
              <div className={`w-full md:w-1/3 aspect-square rounded-2xl flex items-center justify-center ${
                (product.category === 'Administrator' || product.name === 'admin') ? 'bg-rose-100' : 'bg-slate-100'
              }`}>
                <Package className={`w-24 h-24 ${
                  (product.category === 'Administrator' || product.name === 'admin') ? 'text-rose-400' : 'text-slate-300'
                }`} />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">
                  {(product.category === 'Administrator' || product.category === 'Operator') ? `ROLE: ${product.category}` : product.category}
                </div>
                <h1 className="text-3xl font-black text-slate-800 mb-2">
                  {(product.category === 'Administrator' || product.name === 'admin') ? `Username: ${product.name}` : product.name}
                </h1>
                <div className={`text-base mb-6 font-mono ${
                  (product.category === 'Administrator' || product.name === 'admin') 
                    ? 'bg-rose-100 text-rose-900 p-3 rounded-xl border border-rose-200 font-bold' 
                    : 'text-slate-500'
                }`}>
                  {(product.category === 'Administrator' || product.name === 'admin') 
                    ? `Password: ${product.description}` 
                    : product.description}
                </div>
                <div className="text-2xl font-black text-slate-800 mb-6">
                  {(product.category === 'Administrator' || product.name === 'admin') ? 'CLEARANCE: TOP-SECRET' : `$${product.price}`}
                </div>
              </div>
            </div>
          </div>
        )}

        {!error && !product && allData.length === 0 && (
          <div className="py-20 text-center text-slate-500 font-medium">
            No product found with this ID.
          </div>
        )}

        {/* UNION Data rendering */}
        {allData.length > 1 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>All Extracted Records from Database</span>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-mono">{allData.length} records</span>
            </h3>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Username / Product</th>
                    <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Password / Description</th>
                    <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Role / Category</th>
                    <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allData.map((row, idx) => {
                    const isCred = row.category === 'Administrator' || row.category === 'Operator' || row.category === 'Viewer' || row.name === 'admin';
                    return (
                      <tr key={idx} className={`hover:bg-slate-50 transition-colors ${isCred ? 'bg-rose-50/50' : ''}`}>
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{row.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {isCred ? <span className="text-rose-700 font-mono">👤 {row.name}</span> : row.name}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          {isCred ? (
                            <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded font-bold">
                              🔑 {row.description}
                            </span>
                          ) : (
                            <span className="text-slate-500">{row.description}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                            isCred ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {row.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {isCred ? (
                            <span className="text-rose-600 font-bold text-xs">EXFILTRATED</span>
                          ) : (
                            <span className="text-emerald-600 font-bold text-xs">${row.price}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {queryExecuted && (
          <div className="mt-12 bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
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
