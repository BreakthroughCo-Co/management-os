import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Badge } from "@/presentation/components/ui/badge";
import { 
  Video, VideoOff, Mic, MicOff, Monitor, PhoneOff, 
  FileText, Sparkles, Send, CheckCircle2, User, Play, Calendar, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { GoogleWorkspaceService, CalendarEvent } from "@/core/services/GoogleWorkspaceService";
import { useQuery } from "@tanstack/react-query";

interface ActiveCall {
  clientName: string;
  duration: number;
  status: "idle" | "connecting" | "connected" | "ended";
}

export function Telehealth() {
  const { googleAccessToken } = useAuthStore();
  
  const { data: gcalEvents = [], isLoading: isGcalLoading } = useQuery({
    queryKey: ['gcalTelehealthEvents', googleAccessToken],
    queryFn: () => {
      if (!googleAccessToken) return Promise.resolve([]);
      // Fetch upcoming events from now
      return GoogleWorkspaceService.fetchCalendarEvents(googleAccessToken, new Date().toISOString());
    },
    enabled: !!googleAccessToken,
  });

  // Filter for upcoming events with a Meet link
  const upcomingTelehealthEvents = gcalEvents.filter((e: CalendarEvent) => e.hangoutLink);
  const nextEvent = upcomingTelehealthEvents.length > 0 ? upcomingTelehealthEvents[0] : null;

  const [call, setCall] = useState<ActiveCall>({
    clientName: "Charlie Davis",
    duration: 0,
    status: "idle",
  });

  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  
  // Clinical Notes & Chat
  const [sessionNotes, setSessionNotes] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [chatLog, setChatLog] = useState<{ sender: "practitioner" | "client"; text: string; time: string }[]>([
    { sender: "client", text: "Hi, I'm ready for the session.", time: "10:00 AM" }
  ]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (call.status === "connected") {
      interval = setInterval(() => {
        setCall(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [call.status]);

  const startCall = () => {
    setCall(prev => ({ ...prev, status: "connecting" }));
    setTimeout(() => {
      setCall(prev => ({ ...prev, status: "connected" }));
    }, 1500);
  };

  const endCall = () => {
    setCall(prev => ({ ...prev, status: "ended" }));
  };

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setChatLog(prev => [...prev, {
      sender: "practitioner",
      text: chatMessage,
      time: new Date().toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })
    }]);
    setChatMessage("");
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Telehealth Clinical Room</h2>
          <p className="text-muted-foreground">Secure, NDIS-compliant videoconferencing and screen-sharing.</p>
        </div>
        {call.status === "connected" && (
          <Badge className="bg-red-500 text-white animate-pulse flex gap-1.5 items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            LIVE: {formatTime(call.duration)}
          </Badge>
        )}
      </div>

      {call.status === "idle" || call.status === "ended" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed">
            <div className="h-16 w-16 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
              <Video className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold">Native Telehealth Session</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-2">
              Participant: <strong>{call.clientName}</strong><br />
              Use our built-in WebRTC platform for integrated notes and chat.
            </p>
            {call.status === "ended" && (
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs">
                Session successfully saved. Draft notes have been synced to the client history.
              </div>
            )}
            <Button onClick={startCall} className="mt-6 bg-primary hover:opacity-90">
              <Play className="h-4 w-4 mr-2" /> Start Native Session
            </Button>
          </Card>

          <Card className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed">
             <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold">Google Meet Telehealth</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-2">
              Join sessions scheduled via your Google Calendar with Meet links.
            </p>
            
            {!googleAccessToken ? (
              <div className="mt-6 p-3 bg-slate-100 text-sm rounded-lg text-slate-600">
                Please sign in with Google Workspace on the Login page to see upcoming Meet links.
              </div>
            ) : isGcalLoading ? (
               <p className="text-sm mt-6 animate-pulse">Loading upcoming sessions...</p>
            ) : nextEvent ? (
               <div className="mt-6 w-full max-w-sm">
                 <div className="bg-slate-50 border p-3 rounded-lg mb-4 text-left">
                   <p className="font-semibold text-sm truncate">{nextEvent.summary}</p>
                   <p className="text-xs text-muted-foreground mt-1">
                     {new Date(nextEvent.start.dateTime || nextEvent.start.date || '').toLocaleString()}
                   </p>
                 </div>
                 <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <a href={nextEvent.hangoutLink} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" /> Join Google Meet Room
                    </a>
                 </Button>
               </div>
            ) : (
               <p className="text-sm mt-6 text-muted-foreground">No upcoming Google Meet sessions found.</p>
            )}
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* WebRTC Video Feeds */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-slate-900 border-none relative overflow-hidden flex flex-col justify-between" style={{ height: "480px" }}>
              {/* Remote feed */}
              <div className="absolute inset-0 flex items-center justify-center">
                {call.status === "connecting" ? (
                  <div className="text-center space-y-3">
                    <div className="h-8 w-8 border-4 border-t-transparent border-white rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-white/70">Connecting to {call.clientName}...</p>
                  </div>
                ) : (
                  /* Client Simulation Feed */
                  <div className="w-full h-full relative">
                    <svg className="w-full h-full opacity-35" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <rect width="100" height="100" fill="#1e293b" />
                      <circle cx="50" cy="40" r="15" fill="#475569" />
                      <path d="M20 90 C 20 65, 80 65, 80 90 Z" fill="#475569" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <div className="h-20 w-20 rounded-full bg-slate-700/50 flex items-center justify-center border-2 border-white/20 mb-2">
                        <User className="h-10 w-10 text-white/70" />
                      </div>
                      <p className="text-sm font-semibold">{call.clientName}</p>
                      <p className="text-xs text-white/50">Remote Feed</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Local mini feed */}
              {videoOn && call.status === "connected" && (
                <div className="absolute bottom-4 right-4 w-36 h-24 rounded-lg border border-white/20 bg-slate-800 overflow-hidden shadow-2xl">
                  <svg className="w-full h-full opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <circle cx="50" cy="40" r="15" fill="#94a3b8" />
                    <path d="M20 90 C 20 65, 80 65, 80 90 Z" fill="#94a3b8" />
                  </svg>
                  <div className="absolute bottom-1 left-2 text-[10px] text-white/80 font-semibold bg-black/40 px-1 rounded">
                    You
                  </div>
                </div>
              )}

              {/* Screen Share simulation banner */}
              {screenSharing && (
                <div className="absolute top-4 left-4 bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow">
                  <Monitor className="h-3.5 w-3.5" /> Sharing your screen
                </div>
              )}

              {/* Bottom controls panel */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur border border-white/10 rounded-full px-6 py-2 flex items-center gap-4 z-10">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setMicOn(!micOn)} 
                  className={cn("rounded-full h-10 w-10 text-white hover:bg-white/10", !micOn && "bg-red-500/20 text-red-400 hover:bg-red-500/30")}
                >
                  {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setVideoOn(!videoOn)} 
                  className={cn("rounded-full h-10 w-10 text-white hover:bg-white/10", !videoOn && "bg-red-500/20 text-red-400 hover:bg-red-500/30")}
                >
                  {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setScreenSharing(!screenSharing)} 
                  className={cn("rounded-full h-10 w-10 text-white hover:bg-white/10", screenSharing && "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30")}
                >
                  <Monitor className="h-5 w-5" />
                </Button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <Button 
                  onClick={endCall} 
                  variant="destructive" 
                  size="icon" 
                  className="rounded-full h-10 w-10 bg-red-600 hover:bg-red-700"
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </div>
            </Card>

            {/* Chat Box */}
            <Card>
              <CardHeader className="py-3 border-b">
                <CardTitle className="text-sm">In-Call Room Chat</CardTitle>
              </CardHeader>
              <CardContent className="h-44 overflow-auto p-4 space-y-3">
                {chatLog.map((c, i) => (
                  <div key={i} className={cn("flex flex-col text-xs", c.sender === "practitioner" ? "items-end" : "items-start")}>
                    <div className={cn("px-3 py-2 rounded-xl max-w-[80%]", c.sender === "practitioner" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none")}>
                      {c.text}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{c.time}</span>
                  </div>
                ))}
              </CardContent>
              <form onSubmit={sendChat} className="p-3 border-t flex gap-2">
                <Input value={chatMessage} onChange={e => setChatMessage(e.target.value)} placeholder="Type a message to participant..." className="text-xs h-8 flex-1" />
                <Button type="submit" size="sm" className="h-8">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </Card>
          </div>

          {/* Concurrent Clinical Notes Panel */}
          <div className="space-y-4">
            <Card className="flex flex-col justify-between" style={{ minHeight: "480px" }}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  Concurrent Session Notes
                </CardTitle>
                <CardDescription>Draft progress notes live during the session.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <textarea
                  value={sessionNotes}
                  onChange={e => setSessionNotes(e.target.value)}
                  placeholder="Record observations, responses to interventions, and strategies applied here..."
                  className="w-full text-xs bg-transparent rounded-lg border border-border p-3 min-h-[300px] outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button onClick={endCall} className="w-full">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Complete & Save Session
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
