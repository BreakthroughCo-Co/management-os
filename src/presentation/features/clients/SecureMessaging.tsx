import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Send, UserCircle, Bot, Paperclip, MoreVertical, Loader2, Mail, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessagesQuery, useCreateMessageMutation } from "../../../data/repositories/MessageRepository";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/presentation/components/ui/tabs";
import { useAuthStore } from "@/store/useAuthStore";
import { useSmartInbox } from "@/presentation/hooks/useSmartInbox";

const CONTACTS = [
  { name: "Alice Vance (Care Team)", role: "Group Chat", unread: 2, active: true },
  { name: "Charlie Davis (Family)", role: "Family Channel", unread: 0, active: false },
  { name: "Dr. Robert Smith", role: "Direct Message", unread: 0, active: false },
];

export function SecureMessaging() {
  const { data: messages = [], isLoading } = useMessagesQuery();
  const createMessage = useCreateMessageMutation();
  const { googleAccessToken } = useAuthStore();
  const [inputText, setInputText] = useState("");
  const [activeChat, setActiveChat] = useState(0);

  const {
    emails,
    activeEmail,
    setActiveEmail,
    fetchingEmails,
    drafting,
    aiDraft,
    setAiDraft,
    gmailConnected,
    connectGmail,
    draftReply
  } = useSmartInbox();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    createMessage.mutate({
      sender: "Dr. Emily Chen",
      senderId: "test-practitioner-id",
      role: "Practitioner",
      content: inputText,
      timestamp: new Date().toISOString()
    });

    setInputText("");
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Practitioner": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Family": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "Participant": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)]">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Secure Messaging</h2>
        <p className="text-muted-foreground">End-to-end encrypted communication between practitioners, participants, and families.</p>
      </div>

      <Tabs defaultValue="chat" className="h-full flex flex-col">
        <TabsList className="w-fit mb-4">
          <TabsTrigger value="chat">Internal Secure Chat</TabsTrigger>
          <TabsTrigger value="inbox" className="gap-2"><Mail className="h-4 w-4"/> Smart Inbox (External)</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full pb-10">
            {/* Contacts Sidebar */}
            <Card className="md:col-span-1 flex flex-col overflow-hidden border-border/40">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-sm">Conversations</CardTitle>
                <Input placeholder="Search messages..." className="h-8 mt-2 text-xs" />
              </CardHeader>
              <div className="flex-1">
                <div className="p-2 space-y-1">
                  {CONTACTS.map((contact, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveChat(i)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors",
                        activeChat === i ? "bg-accent text-accent-foreground" : "hover:bg-accent/50 text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <UserCircle className="h-8 w-8 flex-shrink-0 opacity-70" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate text-foreground">{contact.name}</p>
                          <p className="text-xs truncate">{contact.role}</p>
                        </div>
                      </div>
                      {contact.unread > 0 && (
                        <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                          {contact.unread}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Chat Area */}
            <Card className="md:col-span-3 flex flex-col overflow-hidden border-border/40 relative">
              {/* Chat Header */}
              <div className="h-16 border-b border-border/40 flex items-center justify-between px-6 bg-card shrink-0">
                <div>
                  <h3 className="font-semibold">{CONTACTS[activeChat].name}</h3>
                  <p className="text-xs text-muted-foreground">3 Members • End-to-End Encrypted</p>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-6">
                  {isLoading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary h-6 w-6" /></div>
                  ) : messages.map((msg) => {
                    const isMe = msg.senderId === "test-practitioner-id";
                    const displayTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return msg.role === "System" ? (
                      <div key={msg.id} className="flex justify-center">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider bg-accent/50 px-3 py-1 rounded-full">
                          {msg.content}
                        </span>
                      </div>
                    ) : (
                      <div key={msg.id} className={cn("flex flex-col max-w-[75%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-semibold text-foreground">{msg.sender}</span>
                          <span className="text-[10px] text-muted-foreground">{displayTime}</span>
                          {!isMe && (
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium", getRoleColor(msg.role))}>
                              {msg.role}
                            </span>
                          )}
                        </div>
                        <div 
                          className={cn(
                            "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                            isMe 
                              ? "bg-primary text-primary-foreground rounded-tr-sm" 
                              : "bg-accent/80 text-foreground rounded-tl-sm border border-border/40"
                          )}
                        >
                          {msg.content}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-border/40 bg-card shrink-0">
                <form onSubmit={handleSend} className="flex items-end gap-2">
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <textarea 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type a secure message..."
                      className="w-full bg-accent/50 border border-border/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px] max-h-[120px] resize-none"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e);
                        }
                      }}
                    />
                  </div>
                  <Button type="submit" disabled={!inputText.trim()} size="icon" className="shrink-0 h-11 w-11 rounded-xl bg-primary hover:opacity-90">
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inbox" className="flex-1 mt-0">
          {!gmailConnected ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center h-full">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle>Connect your Gmail Inbox</CardTitle>
              <CardDescription className="max-w-md mt-2 mb-6">
                Integrate your external practice email to automatically triage incoming messages and generate AI-powered draft replies using Gemini.
              </CardDescription>
              <Button onClick={connectGmail} disabled={fetchingEmails}>
                {fetchingEmails ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                Connect Inbox (Incremental Auth)
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full pb-10">
              <Card className="md:col-span-1 flex flex-col overflow-hidden">
                <CardHeader className="p-4 border-b bg-muted/30">
                  <CardTitle className="text-sm">Inbox (Recent)</CardTitle>
                </CardHeader>
                <div className="flex-1 overflow-auto p-2 space-y-1">
                  {emails.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-4 text-center">No emails found.</p>
                  ) : emails.map((email, i) => {
                    const subjectHeader = email.payload?.headers?.find((h:any) => h.name === 'Subject');
                    const subject = subjectHeader ? subjectHeader.value : "No Subject";
                    const fromHeader = email.payload?.headers?.find((h:any) => h.name === 'From');
                    const from = fromHeader ? fromHeader.value : "Unknown";
                    
                    return (
                      <button
                        key={i}
                        onClick={() => { setActiveEmail(email); setAiDraft(""); }}
                        className={cn(
                          "w-full p-3 rounded-lg text-left transition-colors text-sm",
                          activeEmail?.id === email.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50 text-muted-foreground"
                        )}
                      >
                        <p className="font-semibold truncate text-foreground">{from}</p>
                        <p className="truncate font-medium">{subject}</p>
                        <p className="text-xs truncate opacity-70 mt-1">{email.snippet}</p>
                      </button>
                    )
                  })}
                </div>
              </Card>

              <Card className="md:col-span-3 flex flex-col overflow-hidden relative">
                {activeEmail ? (
                  <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <div className="p-6 border-b flex-1 overflow-auto">
                      <h3 className="font-semibold text-lg mb-4">
                        {activeEmail.payload?.headers?.find((h:any) => h.name === 'Subject')?.value}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        From: {activeEmail.payload?.headers?.find((h:any) => h.name === 'From')?.value}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{activeEmail.snippet}...</p>
                      <p className="text-xs text-muted-foreground mt-4 italic">(Full body extraction requires base64 decoding)</p>
                    </div>
                    
                    <div className="p-6 bg-muted/30 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Bot className="h-4 w-4 text-indigo-500"/> AI Draft Reply
                        </h4>
                        <Button size="sm" variant="outline" onClick={draftReply} disabled={drafting}>
                          {drafting ? "Drafting..." : <><Sparkles className="h-3 w-3 mr-2" /> Draft with Gemini</>}
                        </Button>
                      </div>
                      
                      {aiDraft ? (
                        <div className="space-y-4">
                          <textarea 
                            className="w-full min-h-[150px] p-3 text-sm rounded-md border bg-card" 
                            defaultValue={aiDraft}
                          />
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline">Discard</Button>
                            <Button size="sm">Send Reply</Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-4">Click "Draft with Gemini" to generate a smart response.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Select an email to view and reply.
                  </div>
                )}
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
