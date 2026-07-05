import React from 'react';
import { 
  ShieldAlert, 
  Plus, 
  Search,
  Filter
} from 'lucide-react';

const mockPractices = [
  { id: 1, client: "John Doe", type: "Environmental Restraint", status: "Active", reviewDate: "2026-08-15" },
  { id: 2, client: "Jane Smith", type: "Chemical Restraint (PRN)", status: "Fading", reviewDate: "2026-07-20" },
];

export const RestrictivePractices = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            Restrictive Practices Register
          </h1>
          <p className="text-muted-foreground mt-1">Track, review, and fade NDIS restrictive practices.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Log New Practice
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search client or practice type..."
              className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button className="px-4 py-2 border border-input rounded-md flex items-center gap-2 text-sm hover:bg-accent transition">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Client</th>
                <th className="px-6 py-3 font-medium">Practice Type</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Next Review</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockPractices.map((practice) => (
                <tr key={practice.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{practice.client}</td>
                  <td className="px-6 py-4">{practice.type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      practice.status === 'Active' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {practice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{practice.reviewDate}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary hover:underline text-xs font-medium">View Plan</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
