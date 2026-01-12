import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Documents = () => {
  const driveFolderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;
  const isConfigured = driveFolderId && driveFolderId !== "YOUR_FOLDER_ID";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Case Files (Google Drive)</h1>
        <p className="text-muted-foreground">Access and manage shared case documents</p>
      </div>

      {!isConfigured && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Configuration Required:</strong> Please set your Google Drive folder ID in the .env file.
            <br />
            <code className="text-xs mt-2 block">VITE_GOOGLE_DRIVE_FOLDER_ID=your-folder-id</code>
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Access shared case documents. Files stay synced with Google Drive.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Document Library
          </CardTitle>
          <CardDescription>
            All case files and documents stored in Google Drive
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConfigured ? (
            <div className="w-full rounded-lg overflow-hidden border">
              <iframe 
                src={`https://drive.google.com/embeddedfolderview?id=${driveFolderId}#grid`}
                style={{ width: '100%', height: '600px', border: 0 }}
                title="Google Drive Documents"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Google Drive Not Configured</p>
              <p className="text-sm mt-2">
                Please configure your Google Drive folder ID in the .env file to view documents.
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg text-left max-w-md mx-auto">
                <p className="text-xs font-mono">
                  1. Open .env file<br />
                  2. Set VITE_GOOGLE_DRIVE_FOLDER_ID=1hKyMNrdjdqxt3I-yomaqyG8_LT6y7eCA<br />
                  3. Restart dev server<br />
                  <span className="text-muted-foreground">(Use only the folder ID, not the full URL)</span>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Documents;
