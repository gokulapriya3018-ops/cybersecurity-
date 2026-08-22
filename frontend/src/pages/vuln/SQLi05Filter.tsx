import { useState, useEffect } from 'react';
import { ShieldAlert, Filter, DollarSign } from 'lucide-react';

export default function SQLi05Filter() {
  const [maxPrice, setMaxPrice] = useState('50');
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [queryExecuted, setQueryExecuted] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchFilteredProducts('50');
  }, []);

  const fetchFilteredProducts = async (price: string) => {
    setError('');
    setQueryExecuted('');
    
    try {
      const res = await fetch(`http://localhost:3000/api/sims/sqli/lab5/filter?price=${encodeURIComponent(price)}`);
      const data = await res.json();
      
      setQueryExecuted(data.query || '');
      
      if (data.ok) {
        setProducts(data.products || []);
        if (data.injected) {
          setSuccess(true);
          window.dispatchEvent(new CustomEvent('lab-solved'));
        }
      } else {
        setError(data.error || 'Database error occurred.');
        setProducts([]);
      }
    } catch (err) {
      setError('Connection error.');
    }
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFilteredProducts(maxPrice);
  };

  return (
    <div className="min-h-full bg-white font-sans p-8">
      <div className="max-w-6xl mx-auto flex gap-8 flex-col md:flex-row">
        
        {/* Sidebar Filter */}
        <div className="w-full md:w-64 shrink-0">
          <div className="text-2xl font-black text-slate-800 tracking-tighter mb-8">GadgetStore</div>
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
              <Filter className="w-4 h-4" /> Filters
            </h3>
            
            <form onSubmit={handleApply}>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Max Price</label>
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                />
              </div>
              <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                Apply
              </button>
            </form>
          </div>

          {queryExecuted && (
            <div className="mt-8 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl">
              <div className="bg-slate-800 px-3 py-2 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Query Debug</span>
              </div>
              <div className="p-3 overflow-x-auto">
                <code className="text-emerald-400 text-xs whitespace-pre-wrap font-mono">
                  {queryExecuted}
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {success && (
            <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-4 shadow-sm">
              <ShieldAlert className="w-8 h-8 text-emerald-500 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-emerald-800 mb-1">Numeric SQLi Successful</h3>
                <p className="text-emerald-700 mb-2">You bypassed the numeric filter without using string quotes.</p>
                <p className="text-xs font-mono text-emerald-600">Flag: CSA{'{'}NUM3R1C_Byp4ss{'}'}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 mb-8 font-medium">
              Error: {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, i) => (
              <div key={i} className="group relative">
                <div className="aspect-square bg-slate-100 rounded-2xl mb-4 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-500">
                    🛍️
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 text-lg leading-tight">{product.name}</h3>
                <p className="text-slate-500 text-sm mt-1 mb-2 line-clamp-1">{product.description}</p>
                <div className="font-black text-slate-900">${product.price}</div>
              </div>
            ))}
          </div>

          {!error && products.length === 0 && (
            <div className="py-20 text-center text-slate-500 font-medium bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
              No products found under this price.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
