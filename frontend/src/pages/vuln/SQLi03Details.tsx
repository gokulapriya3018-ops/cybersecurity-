import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldAlert, Package, ShoppingCart } from 'lucide-react';

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
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 aspect-square bg-slate-100 rounded-2xl flex items-center justify-center">
              <Package className="w-24 h-24 text-slate-300" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-2">{product.category}</div>
              <h1 className="text-4xl font-black text-slate-800 mb-4">{product.name}</h1>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">{product.description}</p>
              <div className="text-3xl font-black text-slate-800 mb-8">${product.price}</div>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-2xl transition-colors w-max flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Add to Cart
              </button>
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
            <h3 className="text-lg font-bold text-slate-800 mb-4">Additional Records Returned (Due to UNION)</h3>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Col 1 (id)</th>
                    <th className="px-6 py-3 font-medium">Col 2 (name)</th>
                    <th className="px-6 py-3 font-medium">Col 3 (description)</th>
                    <th className="px-6 py-3 font-medium">Col 4 (category)</th>
                    <th className="px-6 py-3 font-medium">Col 5 (price)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allData.slice(1).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono text-xs">{JSON.stringify(Object.values(row)[0])}</td>
                      <td className="px-6 py-4 font-mono text-xs">{JSON.stringify(Object.values(row)[1])}</td>
                      <td className="px-6 py-4 font-mono text-xs">{JSON.stringify(Object.values(row)[2])}</td>
                      <td className="px-6 py-4 font-mono text-xs">{JSON.stringify(Object.values(row)[3])}</td>
                      <td className="px-6 py-4 font-mono text-xs">{JSON.stringify(Object.values(row)[4])}</td>
                    </tr>
                  ))}
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
