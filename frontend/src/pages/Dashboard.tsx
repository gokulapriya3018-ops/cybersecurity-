import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Available Labs</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* SQL Injection Lab Card */}
        <Link 
          to="/labs/sql-injection"
          className="group relative rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
            </div>
            <div>
              <h3 className="font-semibold leading-none tracking-tight">SQL Injection</h3>
              <p className="text-sm text-muted-foreground mt-1">Web Application</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground line-clamp-2">
            Exploit SQL injection vulnerabilities in a simulated HMI web portal to bypass authentication and extract data.
          </div>
        </Link>
      </div>
    </div>
  );
}
