export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  iconLink: string;
  size?: string;
  createdTime: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  htmlLink: string;
  hangoutLink?: string; // Google Meet link
}

export class GoogleWorkspaceService {
  
  static async fetchDriveFiles(accessToken: string, folderId?: string): Promise<DriveFile[]> {
    try {
      // By default, just fetch some files. If folderId is provided, scope to that folder.
      const q = folderId ? `"${folderId}" in parents and trashed = false` : `trashed = false`;
      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.append('q', q);
      url.searchParams.append('fields', 'files(id, name, mimeType, webViewLink, iconLink, size, createdTime)');
      url.searchParams.append('orderBy', 'createdTime desc');
      url.searchParams.append('pageSize', '50');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Drive API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error("Failed to fetch Google Drive files:", error);
      throw error;
    }
  }

  static async downloadDriveFile(accessToken: string, fileId: string): Promise<Blob> {
    try {
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Drive API Download Error: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error("Failed to download Google Drive file:", error);
      throw error;
    }
  }

  static async fetchCalendarEvents(accessToken: string, timeMin: string = new Date().toISOString()): Promise<CalendarEvent[]> {
    try {
      const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
      url.searchParams.append('timeMin', timeMin);
      url.searchParams.append('orderBy', 'startTime');
      url.searchParams.append('singleEvents', 'true');
      url.searchParams.append('maxResults', '50');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Calendar API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("Failed to fetch Google Calendar events:", error);
      throw error;
    }
  }

  static async createCalendarEventWithMeet(
    accessToken: string, 
    summary: string, 
    startIso: string, 
    endIso: string, 
    description?: string
  ): Promise<CalendarEvent> {
    try {
      const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1';
      
      const event = {
        summary,
        description,
        start: { dateTime: startIso },
        end: { dateTime: endIso },
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(), // Unique ID for conference creation
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        throw new Error(`Calendar API Create Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to create Google Calendar event:", error);
      throw error;
    }
  }

  // ==========================================
  // EXPORT FOLDER (DRIVE)
  // ==========================================
  static async getOrCreateExportFolder(accessToken: string, folderName: string = "Management OS Exports"): Promise<string> {
    try {
      // Check if folder exists
      const q = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
      const searchUrl = new URL('https://www.googleapis.com/drive/v3/files');
      searchUrl.searchParams.append('q', q);
      const searchRes = await fetch(searchUrl.toString(), { headers: { 'Authorization': `Bearer ${accessToken}` } });
      const searchData = await searchRes.json();

      if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
      }

      // Create if it doesn't exist
      const createUrl = 'https://www.googleapis.com/drive/v3/files';
      const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder' })
      });
      const createData = await createRes.json();
      return createData.id;
    } catch (error) {
      console.error("Failed to get/create export folder:", error);
      throw error;
    }
  }

  // ==========================================
  // GOOGLE TASKS (FIELD NOTES)
  // ==========================================
  static async fetchTasks(accessToken: string, tasklistId: string = '@default'): Promise<any[]> {
    try {
      const url = `https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("Failed to fetch Google Tasks:", error);
      throw error;
    }
  }

  // ==========================================
  // GOOGLE FORMS (INTAKE PIPELINE)
  // ==========================================
  static async fetchForms(accessToken: string): Promise<DriveFile[]> {
    try {
      // Find files in Drive that are forms
      const q = `mimeType='application/vnd.google-apps.form' and trashed=false`;
      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.append('q', q);
      const response = await fetch(url.toString(), { headers: { 'Authorization': `Bearer ${accessToken}` } });
      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error("Failed to fetch Google Forms:", error);
      throw error;
    }
  }

  static async fetchFormResponses(accessToken: string, formId: string): Promise<any[]> {
    try {
      const url = `https://forms.googleapis.com/v1/forms/${formId}/responses`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
      const data = await response.json();
      return data.responses || [];
    } catch (error) {
      console.error("Failed to fetch Google Form responses:", error);
      throw error;
    }
  }

  // ==========================================
  // GOOGLE DOCS (REPORTS)
  // ==========================================
  static async createDocument(accessToken: string, title: string, textContent: string, folderId?: string): Promise<string> {
    try {
      // 1. Create a blank doc
      const createUrl = 'https://docs.googleapis.com/v1/documents';
      const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      const docData = await createRes.json();
      const docId = docData.documentId;

      // 2. Insert text
      const updateUrl = `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`;
      await fetch(updateUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{ insertText: { location: { index: 1 }, text: textContent } }]
        })
      });

      // 3. Move to folder if specified
      if (folderId) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${docId}?addParents=${folderId}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
      }

      return docId;
    } catch (error) {
      console.error("Failed to create Google Doc:", error);
      throw error;
    }
  }

  // ==========================================
  // GOOGLE SHEETS (FINANCIALS)
  // ==========================================
  static async createSpreadsheet(accessToken: string, title: string, rows: any[][], folderId?: string): Promise<string> {
    try {
      const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
      const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties: { title } })
      });
      const sheetData = await createRes.json();
      const sheetId = sheetData.spreadsheetId;
      const sheetName = sheetData.sheets[0].properties.title;

      if (rows && rows.length > 0) {
        const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!A1:append?valueInputOption=USER_ENTERED`;
        await fetch(updateUrl, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: rows })
        });
      }

      if (folderId) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${sheetId}?addParents=${folderId}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
      }

      return sheetId;
    } catch (error) {
      console.error("Failed to create Google Sheet:", error);
      throw error;
    }
  }

  // ==========================================
  // GOOGLE SLIDES (REVIEW PRESENTATION)
  // ==========================================
  static async createPresentation(accessToken: string, title: string, slidesContent: any[], folderId?: string): Promise<string> {
    try {
      // 1. Create a blank presentation
      const createUrl = 'https://slides.googleapis.com/v1/presentations';
      const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      const presentationData = await createRes.json();
      const presentationId = presentationData.presentationId;

      // 2. Here you would normally send a batchUpdate to insert slides based on slidesContent.
      // For brevity, we just create the blank deck. A real implementation would parse the slidesContent array.

      // 3. Move to folder if specified
      if (folderId) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${presentationId}?addParents=${folderId}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
      }

      return presentationId;
    } catch (error) {
      console.error("Failed to create Google Slide:", error);
      throw error;
    }
  }

  // ==========================================
  // GMAIL (SMART INBOX)
  // ==========================================
  static async fetchEmails(accessToken: string, maxResults: number = 10): Promise<any[]> {
    try {
      const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=in:inbox`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
      const data = await response.json();
      
      if (!data.messages) return [];

      const detailedMessages = await Promise.all(data.messages.map(async (msg: any) => {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        return await detailRes.json();
      }));

      return detailedMessages;
    } catch (error) {
      console.error("Failed to fetch Gmails:", error);
      throw error;
    }
  }
}
