import { useState } from "react";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs";
import { Badge } from "@/presentation/components/ui/badge";
import { Save, Building2, Bell, User, CheckCircle2, Network, Plus } from "lucide-react";

export function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "System Administrator",
    email: "admin@breakthroughconsult.com.au",
    role: "Administrator"
  });

  const [org, setOrg] = useState({
    businessName: "Breakthrough Coaching & Consulting",
    providerType: "NDIS Registered Behaviour Support Provider",
    abn: "45 123 456 789",
    ndisRegNumber: "405001234",
    address: "Suite 4, 12 Broadmeadow Rd, Broadmeadow NSW 2292"
  });

  const [notifications, setNotifications] = useState({
    complianceAlerts: true,
    planReviewReminders: true,
    fundingWarnings: true
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your workspace configuration, NDIS credentials, and preferences.</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg text-sm font-medium animate-pulse">
            <CheckCircle2 className="h-4 w-4" />
            Changes saved successfully
          </div>
        )}
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="org" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Organization
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="franchise" className="flex items-center gap-2">
            <Network className="h-4 w-4" /> Franchises
          </TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile">
          <form onSubmit={handleSave}>
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your personal identity profile details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prof-name">Full Name</Label>
                  <Input 
                    id="prof-name" 
                    value={profile.name} 
                    onChange={e => setProfile({...profile, name: e.target.value})} 
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="prof-email">Email Address</Label>
                    <Input 
                      id="prof-email" 
                      type="email" 
                      value={profile.email} 
                      onChange={e => setProfile({...profile, email: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prof-role">Work Role</Label>
                    <Input 
                      id="prof-role" 
                      value={profile.role} 
                      disabled 
                      className="bg-slate-50 cursor-not-allowed text-muted-foreground"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4 flex justify-end bg-slate-50/50">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <Save className="h-4 w-4" /> Save Profile
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* ORGANIZATION TAB */}
        <TabsContent value="org">
          <form onSubmit={handleSave}>
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>Business credentials mapping NDIS provider registration metadata.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Business Name</Label>
                    <Input 
                      id="org-name" 
                      value={org.businessName} 
                      onChange={e => setOrg({...org, businessName: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-type">Provider Registration Profile</Label>
                    <Input 
                      id="org-type" 
                      value={org.providerType} 
                      onChange={e => setOrg({...org, providerType: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="org-abn">ABN</Label>
                    <Input 
                      id="org-abn" 
                      value={org.abn} 
                      onChange={e => setOrg({...org, abn: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-reg">NDIS Registration Number</Label>
                    <Input 
                      id="org-reg" 
                      value={org.ndisRegNumber} 
                      onChange={e => setOrg({...org, ndisRegNumber: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-address">Business Address</Label>
                  <Input 
                    id="org-address" 
                    value={org.address} 
                    onChange={e => setOrg({...org, address: e.target.value})} 
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4 flex justify-end bg-slate-50/50">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <Save className="h-4 w-4" /> Save Credentials
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications">
          <form onSubmit={handleSave}>
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose the warnings and alerts you want to remain informed about.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start justify-between border-b pb-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Compliance Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified about upcoming clinician compliance, WWCC audits, and training deadlines.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                    checked={notifications.complianceAlerts} 
                    onChange={e => setNotifications({...notifications, complianceAlerts: e.target.checked})}
                  />
                </div>

                <div className="flex items-start justify-between border-b pb-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Plan Review Reminders</Label>
                    <p className="text-sm text-muted-foreground">Receive dashboard alerts when client service agreements and plan dates are within 30 days of expiry.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                    checked={notifications.planReviewReminders} 
                    onChange={e => setNotifications({...notifications, planReviewReminders: e.target.checked})}
                  />
                </div>

                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Funding Utilization Warnings</Label>
                    <p className="text-sm text-muted-foreground">Alert when participant NDIS plan utilization crosses safety targets or over-utilization rules.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                    checked={notifications.fundingWarnings} 
                    onChange={e => setNotifications({...notifications, fundingWarnings: e.target.checked})}
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4 flex justify-end bg-slate-50/50">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <Save className="h-4 w-4" /> Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
        {/* FRANCHISE MANAGEMENT TAB */}
        <TabsContent value="franchise">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Franchise Management</CardTitle>
                <CardDescription>Manage sub-accounts, clinics, and multi-tenant billing.</CardDescription>
              </div>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-xs h-8">
                <Plus className="h-4 w-4 mr-1" /> Add Location
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center rounded-lg font-bold">HQ</div>
                  <div>
                    <h4 className="font-semibold text-sm">Main Branch - Melbourne</h4>
                    <p className="text-xs text-muted-foreground">Admin Access • 12 Practitioners • Billing Active</p>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Primary</Badge>
              </div>
              
              <div className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center rounded-lg font-bold">SYD</div>
                  <div>
                    <h4 className="font-semibold text-sm">Sydney Clinic</h4>
                    <p className="text-xs text-muted-foreground">Sub-Tenant • 5 Practitioners • Independent Billing</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs">Manage</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
