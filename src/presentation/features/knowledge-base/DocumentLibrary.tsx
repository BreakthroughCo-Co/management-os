import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/presentation/components/ui/card";
import { Button } from "@/presentation/components/ui/button";
import { FileText, Folder, Upload, Search, Lock, Download, Trash2, Tag, Info, Cloud } from 'lucide-react';
import { useDocumentsQuery, useDeleteDocumentMutation, useUploadDocumentMutation } from '@/data/repositories/DocumentRepository';
import { useAuthStore } from "@/store/useAuthStore";
import { GoogleWorkspaceService, DriveFile } from '@/core/services/GoogleWorkspaceService';
import { useQuery } from '@tanstack/react-query';

export function DocumentLibrary() {
  const { user, role, googleAccessToken } = useAuthStore();
  const { data: documents = [], isLoading } = useDocumentsQuery();
  const deleteMutation = useDeleteDocumentMutation();
  const uploadMutation = useUploadDocumentMutation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeSource, setActiveSource] = useState<'system' | 'drive'>('system');

  const { data: driveFiles = [], isLoading: isDriveLoading } = useQuery({
    queryKey: ['driveFiles', googleAccessToken],
    queryFn: () => googleAccessToken ? GoogleWorkspaceService.fetchDriveFiles(googleAccessToken) : Promise.resolve([]),
    enabled: !!googleAccessToken && activeSource === 'drive',
  });

  const categories = [
    { id: 'all', name: 'All Documents', icon: Folder },
    { id: 'financial', name: 'Financial', icon: FileText },
    { id: 'audit', name: 'Audits & Compliance', icon: FileText },
    { id: 'policy', name: 'Company Policies', icon: FileText },
    { id: 'ndis_participant', name: 'NDIS Participants', icon: FileText },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    uploadMutation.mutate({
      file,
      category: activeCategory !== 'all' ? (activeCategory as any) : 'general',
      allowedRoles: ['admin', 'practitioner'],
      tags: ['new'],
      uploadedBy: user?.email || 'unknown',
    });
  };

  const filteredDocuments = documents.filter(doc => {
    // RBAC Check: Ensure user role is allowed
    const hasAccess = doc.allowedRoles.includes('all') || (role && doc.allowedRoles.includes(role.toLowerCase()));
    if (!hasAccess) return false;

    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || doc.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || doc.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  const filteredDriveFiles = driveFiles.filter((file: DriveFile) => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatSizeStr = (sizeStr?: string) => {
    if (!sizeStr) return "Unknown size";
    return formatSize(parseInt(sizeStr, 10));
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      {/* Sidebar Categories */}
      <div className="w-full md:w-64 shrink-0 space-y-4">
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveSource('system')}
            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${activeSource === 'system' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Vault
          </button>
          <button 
            onClick={() => setActiveSource('drive')}
            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${activeSource === 'drive' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Google Drive
          </button>
        </div>

        {activeSource === 'system' && (
          <div className="flex flex-col space-y-1">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Icon className="h-4 w-4" />
                  {cat.name}
                </button>
              )
            })}
          </div>
        )}

        {activeSource === 'system' && (
          <Card className="bg-slate-50 dark:bg-slate-900/50 border-dashed">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-3">
              <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Upload File</p>
                <p className="text-xs text-muted-foreground mt-1">Drag and drop or browse</p>
              </div>
              <div className="relative w-full">
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploadMutation.isPending}
                />
                <Button size="sm" className="w-full" disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? 'Uploading...' : 'Select File'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documents by name or tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {activeSource === 'system' ? (
              <><Lock className="h-4 w-4" /> Secure Vault</>
            ) : (
              <><Cloud className="h-4 w-4 text-blue-500" /> Google Workspace</>
            )}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle>{activeSource === 'system' ? 'System Documents' : 'Google Drive'}</CardTitle>
            <CardDescription>
              {activeSource === 'system' ? 'Secure repository for organizational knowledge.' : 'Documents synced from your linked Google Drive account.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {activeSource === 'system' ? (
              // System Documents Rendering
              isLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Loading documents...</div>
              ) : filteredDocuments.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <FileText className="h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-slate-600 font-medium">No documents found</p>
                  <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or upload a new file.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredDocuments.map(doc => (
                    <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 h-8 w-8 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{doc.name}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{formatSize(doc.sizeBytes)}</span>
                            <span>•</span>
                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Info className="h-3 w-3" /> {doc.category}</span>
                          </div>
                          <div className="flex gap-1 mt-2">
                            {doc.tags.map(tag => (
                              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                                <Tag className="h-3 w-3" /> {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:text-red-600 hover:bg-red-50"
                          onClick={() => deleteMutation.mutate(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // Google Drive Rendering
              !googleAccessToken ? (
                 <div className="p-12 text-center flex flex-col items-center">
                  <Cloud className="h-12 w-12 text-blue-200 mb-4" />
                  <p className="text-slate-600 font-medium">Google Drive Not Connected</p>
                  <p className="text-sm text-slate-400 mt-1">Sign in with Google Workspace to access your Drive files.</p>
                </div>
              ) : isDriveLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Loading Drive files...</div>
              ) : filteredDriveFiles.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <FileText className="h-12 w-12 text-slate-300 mb-4" />
                  <p className="text-slate-600 font-medium">No files found in Google Drive</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredDriveFiles.map((file: DriveFile) => (
                    <div key={file.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 h-8 w-8 rounded flex items-center justify-center shrink-0">
                           <img src={file.iconLink} alt="icon" className="h-5 w-5" />
                        </div>
                        <div>
                          <a href={file.webViewLink} target="_blank" rel="noreferrer" className="font-medium text-sm text-blue-600 dark:text-blue-400 hover:underline">
                            {file.name}
                          </a>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{formatSizeStr(file.size)}</span>
                            <span>•</span>
                            <span>{new Date(file.createdTime).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                           <a href={file.webViewLink} target="_blank" rel="noreferrer">
                             <Download className="h-4 w-4 text-slate-500" />
                           </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
