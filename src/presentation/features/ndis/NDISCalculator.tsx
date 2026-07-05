import { useState } from "react";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Badge } from "@/presentation/components/ui/badge";
import { Plus, Trash2, Calculator } from "lucide-react";
import { calculateItemTotal } from "./utils";

interface SupportItem {
  id: string;
  code: string;
  name: string;
  rateLimit: number;
  quantity: number;
  frequency: "weekly" | "fortnightly" | "monthly" | "once";
  weeks: number;
  total: number;
}

const standardCatalog = [
  { code: "15_056_0128_1_3", name: "Assessment Recommendation Therapy - Psychology", rateLimit: 234.83 },
  { code: "15_056_0128_1_3_OT", name: "Assessment Recommendation Therapy - OT / Speech", rateLimit: 193.99 },
  { code: "01_799_0115_1_1", name: "Access Community Social and Rec Activ - Standard - Weekday", rateLimit: 65.47 },
  { code: "01_011_0107_1_1", name: "Assistance With Self-Care Activities - Standard - Weekday", rateLimit: 65.47 }
];

export function NDISCalculator() {
  const [items, setItems] = useState<SupportItem[]>([
    { id: "1", code: "15_056_0128_1_3_OT", name: "Assessment Recommendation Therapy - OT / Speech", rateLimit: 193.99, quantity: 2, frequency: "weekly", weeks: 48, total: 193.99 * 2 * 48 }
  ]);

  const [selectedCatalogIdx, setSelectedCatalogIdx] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [frequency, setFrequency] = useState<SupportItem["frequency"]>("weekly");
  const [customRate, setCustomRate] = useState("");
  const [planWeeks, setPlanWeeks] = useState(48);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCatalogIdx === "") return;

    const catalogItem = standardCatalog[parseInt(selectedCatalogIdx)];
    const rate = customRate !== "" ? parseFloat(customRate) : catalogItem.rateLimit;
    const itemTotal = calculateItemTotal(rate, quantity, frequency, planWeeks);

    const newItem: SupportItem = {
      id: Date.now().toString(),
      code: catalogItem.code,
      name: catalogItem.name,
      rateLimit: rate,
      quantity,
      frequency,
      weeks: frequency === "once" ? 1 : planWeeks,
      total: itemTotal
    };

    setItems([...items, newItem]);
    setSelectedCatalogIdx("");
    setQuantity(1);
    setCustomRate("");
  };



  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const grandTotal = items.reduce((acc, item) => acc + item.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">NDIS Budget Calculator</h2>
        <p className="text-muted-foreground">Calculate plan allocations based on support codes and maximum price caps.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Add Budget Item</CardTitle>
            <CardDescription>Select support item and configure quantities.</CardDescription>
          </CardHeader>
          <form onSubmit={handleAddItem}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Support Code / Description</Label>
                <Select value={selectedCatalogIdx} onValueChange={setSelectedCatalogIdx}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select NDIS code" />
                  </SelectTrigger>
                  <SelectContent>
                    {standardCatalog.map((c, i) => (
                      <SelectItem key={c.code} value={i.toString()}>{c.code} - {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qty">Hours / Units</Label>
                  <Input id="qty" type="number" step="0.5" value={quantity} onChange={(e) => setQuantity(parseFloat(e.target.value))} required min="0.5" />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={frequency} onValueChange={(val: any) => setFrequency(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="fortnightly">Fortnightly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="once">One-off / Total</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Custom Rate (leave blank for cap limit)</Label>
                <Input id="rate" type="number" step="0.01" value={customRate} onChange={(e) => setCustomRate(e.target.value)} placeholder={selectedCatalogIdx !== "" ? `$${standardCatalog[parseInt(selectedCatalogIdx)].rateLimit.toFixed(2)} cap` : ""} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weeks">Plan Weeks (usually 48 or 52)</Label>
                <Input id="weeks" type="number" value={planWeeks} onChange={(e) => setPlanWeeks(parseInt(e.target.value))} required min="1" />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={selectedCatalogIdx === ""}>
                <Plus className="mr-2 h-4 w-4" /> Add to Budget
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle>Plan Budget Summary</CardTitle>
                <CardDescription>Estimated total value of all allocated support items.</CardDescription>
              </div>
              <Badge className="text-md px-3 py-1 flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700">
                <Calculator className="h-4 w-4" /> Total: ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Support Details</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Weeks</TableHead>
                    <TableHead>Total Allocation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-[200px]">
                        <div className="font-semibold truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-1">{item.code}</div>
                      </TableCell>
                      <TableCell>${item.rateLimit.toFixed(2)}</TableCell>
                      <TableCell className="capitalize">{item.quantity} hr ({item.frequency})</TableCell>
                      <TableCell>{item.weeks}</TableCell>
                      <TableCell className="font-semibold">${item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
