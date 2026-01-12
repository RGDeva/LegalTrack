import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Case } from '@/types';
import { API_URL } from '@/lib/api-url';

interface DeleteCaseDialogProps {
  case: Case;
  onCaseDeleted?: () => void;
}

export function DeleteCaseDialog({ case: caseData, onCaseDeleted }: DeleteCaseDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      // Delete case via API
      const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/cases/${caseData.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        toast.success(`Case ${caseData.caseNumber} deleted successfully`);
        
        // Callback to parent
        if (onCaseDeleted) {
          onCaseDeleted();
        }
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete case');
      }
    } catch (error) {
      console.error('Error deleting case:', error);
      toast.error('Failed to delete case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Case</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete case <strong>{caseData.caseNumber}</strong> - {caseData.title}?
            <br /><br />
            This action cannot be undone. All associated time entries, documents, and data will remain but will no longer be linked to this case.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Deleting...' : 'Delete Case'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
