import { useState, useEffect } from "react";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLES, Role } from "@/shared/constants/roles";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs";
import { Badge } from "@/presentation/components/ui/badge";
import { Save, Building2, Bell, User, CheckCircle2, Network, Plus, Shield, Loader2, AlertCircle } from "lucide-react";

interface ManagedUser {
  id: string;
  email?: string;
  role: Role;
}

export function SettingsPage() {
  const { user, role: currentRole } = useAuthStore();
  const isAdmin = currentRole === "Admin";

  // ── Profile tab ─────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    name: user?.name ?? "System Administrator",
    email: user?.email ?? "admin@breakthroughconsult.com.au",
  });

  // ── Role tab: Admin user-management state ────────────────────────────────
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [pendingRoles, setPendingRoles] = useState<Record<string, Role>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [savedUserId, setSavedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    setUsersLoading(true);
    setUsersError("");
    getDocs(collection(db, "users"))
      .then((snapshot) => {
        const users = snapshot.docs.map((d) => ({
          id: d.id,
          email: d.data().email as string | undefined,
          role: (d.data().role as Role) ?? "Viewer",
        }));
        setManagedUsers(users);
      })
      .catch((err) => setUsersError(err.message ?? "Failed to load users."))
      .finally(() => setUsersLoading(false));
  }, [isAdmin]);

  const handleUserRoleSave = async (userId: string) => {
    const newRole = pendingRoles[userId];
    if (!newRole) return;
    setSavingUserId(userId);
    try {
      await setDoc(
        doc(db, "users", userId),
        { role: newRole, roleChangedBy: user?.id ?? "unknown" },
        { merge: true }
      );
      setManagedUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      setSavedUserId(userId);
      setTimeout(() => setSavedUserId(null), 3000);
    } catch (err: any) {
      setUsersError(err.message ?? "Failed to update role. Check Firestore permissions.");
    } finally {
      setSavingUserId(null);
    }
  };

  // ── Org tab ──────────────────────────────────────────────────────────────
  const [org, setOrg] = useState({
    businessName: "Breakthrough Coaching & Consulting",
    providerType: "NDIS Registered Behaviour Support Provider",
    abn: "45 123 456 789",
    ndisRegNumber: "405001234",
    address: "Suite 4, 12 Broadmeadow Rd, Broadmeadow NSW 2292",
  });

  // ── Notifications tab ────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState({
    complianceAlerts: true,
    planReviewReminders: true,
    fundingWarnings: true,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const roleMeta: Record<Role, { color: string; description: string }> = {
    Admin: {
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      description: "Full system access — all modules, Firestore rules, CI/CD deploys.",
    },
    "Practice Manager": {
      color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
      description: "Operations Hub, HR & workforce, finance overview, compliance.",
    },
    Coordinator: {
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      description: "NDIS plans, billing, client intake, practitioner management.",
    },
    Practitioner: {
      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      description: "Clinical tools, case notes, clients, interventions, telehealth.",
    },
    Viewer: {
      color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
      description: "Read-only access to portal messaging and shared calendar.",
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your workspace configuration, NDIS credentials, and preferences.
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg text-sm font-medium animate-pulse">
            <CheckCircle2 className="h-4 w-4" />
            Changes saved successfully
          </div>
        )}
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-[560px]">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="role" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Role
          </TabsTrigger>
          <TabsTrigger value="org" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Organization
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
        </TabsList>

        {/* ── PROFILE TAB ─────────────────────────────────────────────────── */}
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
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="prof-email">Email Address</Label>
                    <Input
                      id="prof-email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Role</Label>
                    <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted/30">
                      <Badge className={roleMeta[currentRole ?? "Practitioner"].color}>
                        {currentRole ?? "Practitioner"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Change in the Role tab →
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4 flex justify-end bg-slate-50/50 dark:bg-slate-900/20">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <Save className="h-4 w-4" /> Save Profile
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* ── ROLE TAB ────────────────────────────────────────────────────── */}
        <TabsContent value="role">
          <Card>
            <CardHeader>
              <CardTitle>{isAdmin ? "User & Role Management" : "System Role"}</CardTitle>
              <CardDescription>
                {isAdmin
                  ? "As an Admin, you can view every user and change their role. Role changes take effect immediately for that user — no sign-out required."
                  : "Your role controls which modules and data you can access. Only an Admin can change it."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current role badge (everyone sees their own) */}
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Your current role (live from Firestore)
                  </p>
                  <Badge className={`mt-1 ${roleMeta[currentRole ?? "Practitioner"].color}`}>
                    {currentRole ?? "Practitioner"}
                  </Badge>
                </div>
              </div>

              {!isAdmin && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  If you need a different role, ask an Admin to update it from this same screen.
                </div>
              )}

              {isAdmin && (
                <div className="space-y-3">
                  <Label>All Users</Label>

                  {usersLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
                    </div>
                  )}

                  {usersError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-400">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {usersError}
                    </div>
                  )}

                  {!usersLoading && managedUsers.map((u) => {
                    const pending = pendingRoles[u.id] ?? u.role;
                    const isDirty = pending !== u.role;
                    return (
                      <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{u.email ?? u.id}</p>
                          <Badge className={`mt-1 ${roleMeta[u.role].color}`}>{u.role}</Badge>
                        </div>
                        <select
                          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                          value={pending}
                          onChange={(e) =>
                            setPendingRoles((prev) => ({ ...prev, [u.id]: e.target.value as Role }))
                          }
                        >
                          {(ROLES as readonly Role[]).map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          disabled={!isDirty || savingUserId === u.id}
                          onClick={() => handleUserRoleSave(u.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                        >
                          {savingUserId === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : savedUserId === u.id ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            "Save"
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ORGANIZATION TAB ─────────────────────────────────────────────── */}
        <TabsContent value="org">
          <form onSubmit={handleSave}>
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>
                  Business credentials mapping NDIS provider registration metadata.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Business Name</Label>
                    <Input
                      id="org-name"
                      value={org.businessName}
                      onChange={(e) => setOrg({ ...org, businessName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-type">Provider Registration Profile</Label>
                    <Input
                      id="org-type"
                      value={org.providerType}
                      onChange={(e) => setOrg({ ...org, providerType: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="org-abn">ABN</Label>
                    <Input
                      id="org-abn"
                      value={org.abn}
                      onChange={(e) => setOrg({ ...org, abn: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-reg">NDIS Registration Number</Label>
                    <Input
                      id="org-reg"
                      value={org.ndisRegNumber}
                      onChange={(e) => setOrg({ ...org, ndisRegNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-address">Business Address</Label>
                  <Input
                    id="org-address"
                    value={org.address}
                    onChange={(e) => setOrg({ ...org, address: e.target.value })}
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4 flex justify-end bg-slate-50/50 dark:bg-slate-900/20">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <Save className="h-4 w-4" /> Save Credentials
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* ── NOTIFICATIONS TAB ────────────────────────────────────────────── */}
        <TabsContent value="notifications">
          <form onSubmit={handleSave}>
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose the warnings and alerts you want to remain informed about.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start justify-between border-b pb-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Compliance Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about upcoming clinician compliance, WWCC audits, and training
                      deadlines.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                    checked={notifications.complianceAlerts}
                    onChange={(e) =>
                      setNotifications({ ...notifications, complianceAlerts: e.target.checked })
                    }
                  />
                </div>

                <div className="flex items-start justify-between border-b pb-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Plan Review Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive dashboard alerts when client service agreements and plan dates are
                      within 30 days of expiry.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                    checked={notifications.planReviewReminders}
                    onChange={(e) =>
                      setNotifications({ ...notifications, planReviewReminders: e.target.checked })
                    }
                  />
                </div>

                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Funding Utilization Warnings</Label>
                    <p className="text-sm text-muted-foreground">
                      Alert when participant NDIS plan utilization crosses safety targets or
                      over-utilization rules.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                    checked={notifications.fundingWarnings}
                    onChange={(e) =>
                      setNotifications({ ...notifications, fundingWarnings: e.target.checked })
                    }
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4 flex justify-end bg-slate-50/50 dark:bg-slate-900/20">
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
                  <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center rounded-lg font-bold">
                    HQ
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Main Branch - Melbourne</h4>
                    <p className="text-xs text-muted-foreground">
                      Admin Access • 12 Practitioners • Billing Active
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Primary
                </Badge>
              </div>

              <div className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center rounded-lg font-bold">
                    SYD
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Sydney Clinic</h4>
                    <p className="text-xs text-muted-foreground">
                      Sub-Tenant • 5 Practitioners • Independent Billing
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
