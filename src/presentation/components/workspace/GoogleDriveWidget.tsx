import { useState, useEffect } from "react";
import { GoogleWorkspaceService, DriveFile } from "@/core/services/GoogleWorkspaceService";
import { FileText, ExternalLink } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export function GoogleDriveWidget() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { googleAccessToken } = useAuthStore();

  useEffect(() => {
    async function fetchFiles() {
      if (!googleAccessToken) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const data = await GoogleWorkspaceService.fetchDriveFiles(googleAccessToken);
        setFiles(data.slice(0, 5));
      } catch (e) {
        console.error(e);
      }
      setIsLoading(false);
    }
    fetchFiles();
  }, [googleAccessToken]);

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col h-full">
      <div className="flex flex-col space-y-1.5 p-6 border-b border-border/40">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-500" />
          <h3 className="font-semibold leading-none tracking-tight">Recent Documents</h3>
        </div>
        <p className="text-sm text-muted-foreground">Recently modified files from Google Drive.</p>
      </div>
      <div className="p-6 flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-muted flex-shrink-0"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 bg-muted rounded"></div>
                  <div className="h-3 w-1/4 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
            <p className="text-sm">No recent documents found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map(file => {
              const fileDate = new Date(file.createdTime).toLocaleDateString();
              return (
                <a 
                  key={file.id} 
                  href={file.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
                >
                  <div className="h-10 w-10 flex-shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md flex items-center justify-center">
                    {file.iconLink ? (
                      <img src={file.iconLink} alt="" className="h-5 w-5 opacity-80" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none mb-1 truncate group-hover:underline">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Added {fileDate}</p>
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
