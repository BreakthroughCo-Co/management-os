import { useIncidentsQuery, useResolveIncidentMutation } from "@/data/repositories/IncidentRepository";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";

export function Incidents() {
  const { data: incidents = [], isLoading, error } = useIncidentsQuery();
  const resolveMutation = useResolveIncidentMutation();

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading incidents...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading incidents.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Compliance & Incidents</h2>
        <p className="text-muted-foreground">Manage and track incidents.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incidents.map(incident => (
              <div key={incident.id} className="p-4 border rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{incident.title}</h3>
                  <p className="text-sm text-muted-foreground">Type: {incident.type} | Date: {incident.dateLogged}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={incident.severity === "Critical" ? "destructive" : "default"}>{incident.severity}</Badge>
                  <Badge variant="outline">{incident.status}</Badge>
                  {incident.status !== "Resolved" && (
                    <Button variant="outline" size="sm" onClick={() => resolveMutation.mutate(incident.id)} disabled={resolveMutation.isPending}>
                      Resolve
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {incidents.length === 0 && <p className="text-sm text-muted-foreground">No incidents found.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
