import React, { useState } from 'react';
import { 
  Search, 
  GitBranch, 
  Save,
  CheckCircle2
} from 'lucide-react';
import { cn } from "../../../lib/utils";

export const RootCauseAnalysis = () => {
  const [incidentTitle, setIncidentTitle] = useState('');
  const [whys, setWhys] = useState<string[]>(['', '', '', '', '']);
  const [saved, setSaved] = useState(false);

  const handleWhyChange = (index: number, value: string) => {
    const newWhys = [...whys];
    newWhys[index] = value;
    setWhys(newWhys);
  };

  const handleSave = () => {
    // In a real app, this would save to Firestore
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-primary" />
            Root Cause Analysis
          </h1>
          <p className="text-muted-foreground mt-1">5 Whys Analysis for Incident Investigation</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Incident / Problem Description</label>
          <input
            type="text"
            placeholder="E.g., Client absconded from the facility during transition."
            className="w-full p-3 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={incidentTitle}
            onChange={(e) => setIncidentTitle(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium">The 5 Whys</label>
          {whys.map((why, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 text-primary font-bold rounded-full flex items-center justify-center text-lg">
                {index + 1}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={`Why did ${index === 0 ? 'the problem occur' : 'that happen'}?`}
                  className="w-full p-3 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={why}
                  onChange={(e) => handleWhyChange(index, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saved}
            className={cn(
              "px-6 py-2 rounded-lg transition flex items-center gap-2",
              saved 
                ? "bg-emerald-500 text-white" 
                : "bg-primary text-primary-foreground hover:opacity-90"
            )}
          >
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Analysis'}
          </button>
        </div>
      </div>
    </div>
  );
};
