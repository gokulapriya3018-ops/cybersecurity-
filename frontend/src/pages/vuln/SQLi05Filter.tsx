import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Filter, 
  DollarSign, 
  ShoppingBag, 
  ShoppingCart, 
  Search, 
  Star, 
  Terminal, 
  Package, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function SQLi05Filter() {
  const [maxPrice, setMaxPrice] = useState('20');
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [queryExecuted, setQueryExecuted] = useState('');
  const [success, setSuccess] = useState(false);
  const [cartCount, setCartCount] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchFilteredProducts('20');
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
        const hasExfiltrated = (data.products || []).some(
          (p: any) => p.category === 'Administrator' || p.name === 'admin' || p.category === 'Operator'
        );
        if (data.injected || hasExfiltrated) {
          setSuccess(true);
          window.dispatchEvent(new CustomEvent('lab-solved'));
        }
      } else {
        setError(data.error || 'Database error occurred.');
        setProducts([]);
      }
    } catch (err) {
      setError('Connection error. Please ensure backend is running.');
    }
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFilteredProducts(maxPrice);
  };

  const isCredentialLeaked = products.some(
    p => p.category === 'Administrator' || p.name === 'admin' || p.category === 'Operator'
  );

  return (
    <div className="min-h-full bg-slate-50 font-sans text-slate-900 pb-16">
      
      {/* Top E-Commerce Header Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-black text-xl shadow-lg">
              ⚡
            </div>
            <div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                TechVault Pro
              </span>
              <span className="text-[10px] text-cyan-400 font-mono block tracking-widest uppercase">
                Enterprise Hardware & Security Catalog
              </span>
            </div>
          </div>

          <div className="flex-1 max-w-md w-full relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search components, SDRs, bypass tools..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-5 text-sm font-medium text-slate-300">
            <span className="hidden lg:inline hover:text-white cursor-pointer transition-colors">Catalog</span>
            <span className="hidden lg:inline hover:text-white cursor-pointer transition-colors">Deals</span>
            <div className="relative cursor-pointer hover:text-white transition-colors flex items-center gap-1.5" onClick={() => setCartCount(c => c + 1)}>
              <ShoppingCart className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-bold text-white bg-indigo-600 px-1.5 py-0.5 rounded-full">
                {cartCount}
              </span>
            </div>
            <div className="text-xs font-mono bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              PORT: 15432
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb banner */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Home</span>
            <span>/</span>
            <span className="text-slate-400">Hardware Catalog</span>
            <span>/</span>
            <span className="text-slate-800 font-bold">Numeric Filter Sandpit (Lab 5)</span>
          </div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Target: Unquoted Integer Context SQLi</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Success Banner */}
        {success && (
          <div className="mb-8 p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/50 rounded-3xl flex items-start gap-5 shadow-2xl text-white relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-black text-emerald-300 tracking-tight">
                  {isCredentialLeaked ? '🔓 Numeric UNION Data Exfiltration Successful!' : '🎯 Numeric SQL Injection Successful!'}
                </h3>
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                  SOLVED
                </span>
              </div>
              <p className="text-slate-300 text-sm mb-3 leading-relaxed">
                {isCredentialLeaked 
                  ? 'You injected a numeric UNION query directly without any single quotes, extracting hidden user credentials from `vuln_users`!'
                  : 'You successfully broke out of the unquoted integer `price < ...` clause using boolean logic without needing quotes!'}
              </p>
              <div className="inline-flex items-center gap-2 bg-slate-950/80 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl font-mono text-xs text-emerald-400 font-bold shadow-inner">
                <span>FLAG:</span>
                <span className="tracking-widest">CSA{'{'}NUM3R1C_Byp4ss{'}'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar Filter (Vulnerable Target Input) */}
          <div className="w-full lg:w-72 shrink-0 space-y-6">
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-600" /> Filter Catalog
                </h3>
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-mono">
                  {products.length} Items
                </span>
              </div>

              {/* Price Filter Form */}
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Max Price ($)
                  </label>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" 
                      value={maxPrice}
                      onChange={e => setMaxPrice(e.target.value)}
                      placeholder="e.g. 50" 
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold py-2.5 px-4 rounded-xl transition-all text-xs flex items-center justify-center gap-2 shadow-md shadow-slate-900/10"
                >
                  <span>Apply Filter</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Quick Normal Price Presets */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Quick Price Presets:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {['15', '30', '50'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setMaxPrice(val);
                        fetchFilteredProducts(val);
                      }}
                      className={`text-xs font-semibold py-1.5 px-2 rounded-lg border text-center transition-all ${
                        maxPrice === val 
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      &lt; ${val}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Live Executed Query Inspector */}
            {queryExecuted && (
              <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
                <div className="bg-slate-900 px-3.5 py-2 flex justify-between items-center border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Database Query Inspector</span>
                  </div>
                  <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-1.5 py-0.2 rounded font-mono">
                    Live SQL
                  </span>
                </div>
                <div className="p-3.5 overflow-x-auto">
                  <code className="text-emerald-400 text-xs whitespace-pre-wrap font-mono leading-relaxed">
                    {queryExecuted}
                  </code>
                </div>
              </div>
            )}

          </div>

          {/* Right Product Grid Display */}
          <div className="flex-1 space-y-6">

            {/* Category Filter Pills & Sort Options */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {['All', 'Books', 'Apparel', 'Accessories'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all ${
                      selectedCategory === cat 
                        ? 'bg-slate-900 text-white shadow-sm' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="text-xs text-slate-500 font-medium self-end sm:self-center flex items-center gap-2">
                <span>Showing:</span>
                <span className="font-bold text-slate-800 font-mono">{products.length} products</span>
              </div>
            </div>

            {/* Error Message if query errors */}
            {error && (
              <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-200 font-mono text-xs shadow-sm">
                <span className="font-bold">Database Error: </span>{error}
              </div>
            )}

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products
                .filter(p => selectedCategory === 'All' || p.category === selectedCategory || p.category === 'Administrator' || p.category === 'Operator')
                .map((product, i) => {
                  const isLeaked = product.category === 'Administrator' || product.category === 'Operator' || product.category === 'Viewer' || product.name === 'admin';

                  return (
                    <div 
                      key={i} 
                      className={`group rounded-3xl p-5 border transition-all duration-300 relative flex flex-col justify-between ${
                        isLeaked 
                          ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400 shadow-lg shadow-rose-900/10' 
                          : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-900/5'
                      }`}
                    >
                      {/* Leaked or Regular Badge */}
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          isLeaked 
                            ? 'bg-rose-600 text-white shadow-sm' 
                            : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                        }`}>
                          {isLeaked ? '🚨 LEAKED RECORD' : product.category}
                        </span>

                        {!isLeaked && (
                          <div className="flex items-center text-amber-400 text-xs">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-[11px] font-bold text-slate-600 ml-1">4.9</span>
                          </div>
                        )}
                      </div>

                      {/* Image / Icon container */}
                      <div className={`aspect-video rounded-2xl mb-4 flex items-center justify-center transition-transform group-hover:scale-[1.02] ${
                        isLeaked ? 'bg-rose-100 text-rose-500' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'
                      }`}>
                        {isLeaked ? (
                          <ShieldAlert className="w-12 h-12 animate-pulse" />
                        ) : (
                          <Package className="w-12 h-12" />
                        )}
                      </div>

                      {/* Product Content */}
                      <div className="space-y-1.5 flex-1">
                        <h4 className="font-black text-slate-900 text-base leading-snug">
                          {isLeaked ? `Account: ${product.name}` : product.name}
                        </h4>
                        <p className={`text-xs leading-relaxed ${
                          isLeaked 
                            ? 'font-mono text-rose-800 bg-rose-100/90 p-2 rounded-lg font-bold break-all' 
                            : 'text-slate-500 line-clamp-2'
                        }`}>
                          {isLeaked ? `Password: ${product.description}` : product.description}
                        </p>
                      </div>

                      {/* Price and Cart Footer */}
                      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Price</span>
                          <span className={`text-lg font-black ${isLeaked ? 'text-rose-600 font-mono' : 'text-slate-900'}`}>
                            {isLeaked ? 'COMPROMISED' : `$${product.price}`}
                          </span>
                        </div>

                        <button 
                          onClick={() => setCartCount(c => c + 1)}
                          className={`p-2.5 rounded-xl transition-all shadow-sm ${
                            isLeaked 
                              ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                              : 'bg-slate-900 hover:bg-indigo-600 text-white'
                          }`}
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })}
            </div>

            {/* Empty state when price filter returns 0 products */}
            {!error && products.length === 0 && (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 border-dashed p-8 space-y-3">
                <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-xl">
                  🔍
                </div>
                <h4 className="text-base font-bold text-slate-800">No Hardware Found Under ${maxPrice}</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try increasing your price filter, or test <code className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-mono">0 OR 1=1</code> to bypass this price check!
                </p>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
