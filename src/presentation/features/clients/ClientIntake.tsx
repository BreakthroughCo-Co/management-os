import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs";

export function ClientIntake() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/clients");
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Client Intake</h2>
        <p className="text-muted-foreground">Register a new participant into the system.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="ndis">NDIS Details</TabsTrigger>
            <TabsTrigger value="clinical">Clinical Needs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the participant's primary contact details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ndis">
            <Card>
              <CardHeader>
                <CardTitle>NDIS Information</CardTitle>
                <CardDescription>Enter the NDIS plan and funding details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ndisNumber">NDIS Number</Label>
                  <Input id="ndisNumber" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="planStart">Plan Start Date</Label>
                    <Input id="planStart" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planEnd">Plan End Date</Label>
                    <Input id="planEnd" type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Management Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select management type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ndia">NDIA Managed</SelectItem>
                      <SelectItem value="plan">Plan Managed</SelectItem>
                      <SelectItem value="self">Self Managed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clinical">
            <Card>
              <CardHeader>
                <CardTitle>Clinical Overview</CardTitle>
                <CardDescription>Initial assessment of clinical requirements and risks.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Primary Diagnosis</Label>
                  <Input placeholder="e.g. Autism Spectrum Disorder" />
                </div>
                <div className="space-y-2">
                  <Label>Risk Assessment Level</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select risk level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" type="button" onClick={() => navigate("/clients")}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Complete Intake"}</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
