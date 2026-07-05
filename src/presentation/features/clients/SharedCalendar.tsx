import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { ChevronLeft, ChevronRight, Video, MapPin, Clock, Calendar as CalendarIcon, Users, Loader2, Plus, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCalendarEventsQuery, CalendarEvent as SystemEvent } from "../../../data/repositories/CalendarEventRepository";
import { useAuthStore } from "@/store/useAuthStore";
import { GoogleWorkspaceService, CalendarEvent as GCalendarEvent } from "@/core/services/GoogleWorkspaceService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function SharedCalendar() {
  const { googleAccessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: systemEvents = [], isLoading: isSystemLoading } = useCalendarEventsQuery();
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: gcalEvents = [], isLoading: isGcalLoading } = useQuery({
    queryKey: ['gcalEvents', googleAccessToken],
    queryFn: () => {
      if (!googleAccessToken) return Promise.resolve([]);
      const timeMin = new Date();
      timeMin.setMonth(timeMin.getMonth() - 1); // fetch a bit of history
      return GoogleWorkspaceService.fetchCalendarEvents(googleAccessToken, timeMin.toISOString());
    },
    enabled: !!googleAccessToken,
  });

  const createGcalEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
       if (!googleAccessToken) throw new Error("Not connected to Google Workspace");
       return GoogleWorkspaceService.createCalendarEventWithMeet(
         googleAccessToken,
         eventData.summary,
         eventData.startIso,
         eventData.endIso,
         eventData.description
       );
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['gcalEvents'] });
       alert("Event created in Google Calendar!");
    },
    onError: (err: any) => alert(err.message)
  });

  const isLoading = isSystemLoading || isGcalLoading;

  // Normalize Gcal events to match SystemEvent structure for rendering
  const normalizedGcalEvents: SystemEvent[] = gcalEvents.map((ge: GCalendarEvent) => {
    const startDate = ge.start.dateTime ? new Date(ge.start.dateTime) : (ge.start.date ? new Date(ge.start.date) : new Date());
    return {
      id: ge.id,
      title: ge.summary || "Busy",
      date: startDate.toISOString(),
      time: startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      type: ge.hangoutLink ? 'telehealth' : 'in-person', // Default to telehealth if meet link exists
      practitioner: "Google Calendar",
      location: ge.hangoutLink || "See Google Calendar",
      participants: []
    };
  });

  const allEvents = [...systemEvents, ...normalizedGcalEvents];

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));

  const handleCreateTestEvent = () => {
    if (!googleAccessToken) {
      alert("Please sign in with Google Workspace first.");
      return;
    }
    const start = new Date();
    start.setHours(start.getHours() + 1);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);
    
    createGcalEventMutation.mutate({
      summary: "Telehealth Consultation (Test)",
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      description: "Automatically created from Management OS"
    });
  };

  // Generate calendar grid
  const blanks = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalSlots = [...blanks, ...days];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Shared Family Calendar</h2>
          <p className="text-muted-foreground">Coordinate sessions, telehealth appointments, and plan reviews across the care team.</p>
        </div>
        <Button onClick={handleCreateTestEvent} disabled={!googleAccessToken || createGcalEventMutation.isPending}>
          {createGcalEventMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          {googleAccessToken ? "Create Telehealth Session" : "Connect Google to Create Sessions"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2 overflow-hidden border-border/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-accent/30 border-b border-border/40">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {monthName} {year}
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-border/40 bg-muted/20">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-[100px]">
              {totalSlots.map((day, idx) => {
                const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                
                // Find events for this day
                const dayEvents = day ? allEvents.filter(e => {
                  const d = new Date(e.date);
                  return d.getDate() === day && 
                  d.getMonth() === currentDate.getMonth() && 
                  d.getFullYear() === currentDate.getFullYear();
                }) : [];

                return (
                  <div 
                    key={idx} 
                    className={cn(
                      "border-b border-r border-border/40 p-1.5 transition-colors",
                      !day ? "bg-muted/10" : "hover:bg-accent/20 cursor-pointer",
                      isToday && "bg-primary/5"
                    )}
                  >
                    {day && (
                      <div className="h-full flex flex-col">
                        <span className={cn(
                          "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1",
                          isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                        )}>
                          {day}
                        </span>
                        <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                          {dayEvents.map(event => (
                            <div 
                              key={event.id}
                              className={cn(
                                "text-[9px] font-medium p-1 rounded border leading-tight truncate",
                                event.type === 'telehealth' ? "bg-blue-100/50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400" :
                                event.type === 'in-person' ? "bg-emerald-100/50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400" :
                                "bg-purple-100/50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400"
                              )}
                            >
                              {event.time.split(' ')[0]} {event.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events List */}
        <Card className="border-border/40 flex flex-col h-[500px] lg:h-auto">
          <CardHeader>
            <CardTitle className="text-sm">Upcoming Appointments</CardTitle>
            <CardDescription>Your schedule for the next 7 days</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto space-y-4">
            {isLoading ? (
               <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary h-6 w-6" /></div>
            ) : allEvents.length === 0 ? (
               <p className="text-muted-foreground text-sm p-4 text-center">No upcoming appointments.</p>
            ) : allEvents.slice(0, 10).map(event => {
              const d = new Date(event.date);
              return (
              <div key={event.id} className="relative pl-4 border-l-2 border-primary/40 space-y-2">
                <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <h4 className="text-sm font-semibold">{event.title}</h4>
                  <p className="text-xs font-medium text-primary mt-0.5">
                    {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground bg-accent/30 p-2.5 rounded-lg border border-border/40">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" /> <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" /> <span>{event.practitioner}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.type === 'telehealth' ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                    <span className="truncate">
                      {event.location.startsWith('http') ? (
                         <a href={event.location} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                           Google Meet <ExternalLink className="h-3 w-3" />
                         </a>
                      ) : event.location}
                    </span>
                  </div>
                </div>
                {event.type === 'telehealth' && !event.location.startsWith('http') && (
                  <Button size="sm" className="w-full text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white">
                    <Video className="h-3.5 w-3.5 mr-2" /> Join Telehealth Room
                  </Button>
                )}
              </div>
            )})}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
