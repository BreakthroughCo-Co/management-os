import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Input } from "@/presentation/components/ui/input";
import { Progress } from "@/presentation/components/ui/progress";
import { Search, Mail, Phone, MapPin, CheckSquare, Square, Star, Award } from "lucide-react";
import { cn } from "@/lib/utils";

import { usePractitionersQuery, useToggleTaskMutation } from "@/data/repositories/PractitionerRepository";

export function PractitionerDirectory() {
  const [search, setSearch] = useState("");
  const { data: practitioners = [], isLoading, error } = usePractitionersQuery();
  const toggleMutation = useToggleTaskMutation();

  const toggleTask = (practitionerId: string, taskId: string) => {
    toggleMutation.mutate({ practitionerId, taskId });
  };

  const filtered = practitioners.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    p.specialties.some(s => s.toLowerCase().includes(search.toLowerCase())) ||
    p.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Practitioner Hub</h2>
          <p className="text-muted-foreground">View clinical staff, manage NDIS credential levels, and track onboarding milestones.</p>
        </div>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name, role, or specialty..."
          className="pl-8"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && <div className="p-8 text-muted-foreground animate-pulse col-span-full">Loading directory...</div>}
        {filtered.map((practitioner) => {
          const completed = practitioner.onboardingTasks.filter(t => t.done).length;
          const total = practitioner.onboardingTasks.length;
          const pct = Math.round((completed / total) * 100);

          return (
            <Card key={practitioner.id} className="overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{practitioner.firstName} {practitioner.lastName}</CardTitle>
                      <p className="text-xs text-primary font-medium mt-0.5">{practitioner.role}</p>
                    </div>
                    <Badge className={cn("text-white text-[10px]", practitioner.tier === "Core" ? "bg-slate-500" : practitioner.tier === "Proficient" ? "bg-blue-500" : practitioner.tier === "Advanced" ? "bg-purple-500" : "bg-amber-500")}>
                      {practitioner.tier}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {practitioner.specialties.map(s => (
                      <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>

                  {/* Onboarding Checklist progress */}
                  <div className="space-y-2 pt-3 border-t">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-muted-foreground flex items-center gap-1">
                        <Award className="h-3.5 w-3.5" /> Onboarding Checklist
                      </span>
                      <span className="font-mono text-muted-foreground">{completed}/{total} ({pct}%)</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                    <div className="space-y-1.5 pt-1.5">
                      {practitioner.onboardingTasks.map(t => (
                        <button
                          key={t.id}
                          onClick={() => toggleTask(practitioner.id, t.id)}
                          className="flex items-start gap-2 text-left w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {t.done ? (
                            <CheckSquare className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Square className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={cn(t.done && "line-through opacity-75")}>{t.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="px-6 py-4 border-t bg-muted/20 text-xs text-muted-foreground space-y-1.5">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {practitioner.location}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {practitioner.firstName.toLowerCase()}{practitioner.lastName.toLowerCase()}@breakthroughconsult.com.au
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
