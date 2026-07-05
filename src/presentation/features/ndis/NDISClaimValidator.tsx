import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { AlertCircle, CheckCircle2, ShieldCheck, FileSearch, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const SUPPORT_CATEGORIES = [
  "01_011_0107_1_1 - Assistance With Self-Care Activities",
  "07_001_0106_2_2 - Support Connection",
  "11_022_0110_7_3 - Specialised Supported Employment",
  "15_056_0128_1_3 - Assessment Recommendation Therapy",
  "15_035_0106_1_3 - Provision of Behaviour Support Plan",
];

export function NDISClaimValidator() {
  const [client, setClient] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("1");
  const [rate, setRate] = useState("193.99");
  
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<"idle" | "success" | "error">("idle");
  const [errorMsgs, setErrorMsgs] = useState<string[]>([]);

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !category || !date || !hours || !rate) return;
    
    setIsValidating(true);
    setResult("idle");
    setErrorMsgs([]);

    // Simulate PRODA API validation delay
    setTimeout(() => {
      const errors = [];
      const numHours = parseFloat(hours);
      const numRate = parseFloat(rate);

      // Simulated validation rules
      if (numRate > 214.41) {
        errors.push("Unit rate exceeds the current NDIS Price Guide limit for this item category.");
      }
      if (numHours > 8) {
        errors.push("Daily hours claimed exceed reasonable limits (8 hours). Manual justification required.");
      }
      if (new Date(date) > new Date()) {
        errors.push("Claim date cannot be in the future.");
      }
      
      // Simulate random budget issue for Charlie Davis
      if (client.toLowerCase().includes("charlie") && numHours * numRate > 500) {
        errors.push("Participant does not have sufficient remaining funds in this support category.");
      }

      if (errors.length > 0) {
        setErrorMsgs(errors);
        setResult("error");
      } else {
        setResult("success");
      }
      setIsValidating(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> NDIS Claim Validator
        </h2>
        <p className="text-muted-foreground">Pre-validate claims against NDIS pricing limits and participant budgets before PRODA submission.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Claim Details</CardTitle>
            <CardDescription>Enter support details to simulate PRODA validation.</CardDescription>
          </CardHeader>
          <form onSubmit={handleValidate}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Participant Name / NDIS Number</Label>
                <Input value={client} onChange={e => setClient(e.target.value)} placeholder="e.g. Charlie Davis" required />
              </div>
              <div className="space-y-2">
                <Label>Support Item Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger><SelectValue placeholder="Select NDIS item code..." /></SelectTrigger>
                  <SelectContent>
                    {SUPPORT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date of Support</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hours Claimed</Label>
                  <Input type="number" step="0.25" min="0.25" value={hours} onChange={e => setHours(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Unit Rate ($)</Label>
                  <Input type="number" step="0.01" min="0" value={rate} onChange={e => setRate(e.target.value)} required />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isValidating}>
                {isValidating ? (
                  <>
                    <div className="h-4 w-4 mr-2 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    Validating Claim...
                  </>
                ) : (
                  <>
                    <FileSearch className="mr-2 h-4 w-4" /> Run Pre-Claim Validation
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Validation Result Panel */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Validation Result</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center min-h-[200px]">
            {result === "idle" && !isValidating && (
              <div className="text-center text-muted-foreground space-y-3">
                <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <p className="text-sm max-w-[250px] mx-auto">Fill in the claim details and run the validator to check for NDIS compliance errors.</p>
              </div>
            )}

            {isValidating && (
              <div className="text-center space-y-4">
                <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                <p className="text-sm font-medium animate-pulse text-muted-foreground">Checking PRODA Simulator...</p>
              </div>
            )}

            {result === "success" && !isValidating && (
              <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-50 dark:border-emerald-950/20">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">Claim is Valid</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">This claim meets all NDIS pricing limits and the participant has sufficient budget allocated.</p>
                </div>
                <div className="pt-4">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Generate Final Invoice</Button>
                </div>
              </div>
            )}

            {result === "error" && !isValidating && (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-6 justify-center">
                  <div className="h-12 w-12 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center border-4 border-red-50 dark:border-red-950/20">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Validation Failed</h3>
                    <p className="text-sm opacity-90">PRODA submission will likely be rejected.</p>
                  </div>
                </div>
                
                <div className="space-y-2 bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800/50">
                  <p className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider mb-3">Identified Errors:</p>
                  {errorMsgs.map((msg, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-red-800 dark:text-red-300 leading-snug">{msg}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
