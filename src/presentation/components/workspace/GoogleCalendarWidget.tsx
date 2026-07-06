import { useState, useEffect } from "react";
import { GoogleWorkspaceService, CalendarEvent } from "@/core/services/GoogleWorkspaceService";
import { Calendar, Clock, ExternalLink } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export function GoogleCalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { googleAccessToken } = useAuthStore();

  useEffect(() => {
    async function fetchEvents() {
      if (!googleAccessToken) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const data = await GoogleWorkspaceService.fetchCalendarEvents(googleAccessToken);
        setEvents(data.slice(0, 5));
      } catch (e) {
        console.error(e);
      }
      setIsLoading(false);
    }
    fetchEvents();
  }, [googleAccessToken]);

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col h-full">
      <div className="flex flex-col space-y-1.5 p-6 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold leading-none tracking-tight">Today's Schedule</h3>
        </div>
        <p className="text-sm text-muted-foreground">Upcoming events from Google Calendar.</p>
      </div>
      <div className="p-6 flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="h-10 w-1 rounded bg-muted"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 bg-muted rounded"></div>
                  <div className="h-3 w-1/2 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
            <p className="text-sm">No upcoming events found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => {
              const startDate = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date || "");
              const timeString = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <a 
                  key={event.id} 
                  href={event.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
                >
                  <div className="flex flex-col items-center justify-center min-w-[50px] bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md py-1 px-2">
                    <Clock className="h-4 w-4 mb-1" />
                    <span className="text-xs font-semibold">{timeString}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none mb-1 group-hover:underline truncate">{event.summary}</p>
                    {event.description && <p className="text-xs text-muted-foreground line-clamp-1">{event.description}</p>}
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
