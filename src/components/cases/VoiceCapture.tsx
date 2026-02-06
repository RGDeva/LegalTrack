import { useState, useRef } from 'react';
import { Mic, MicOff, Send, X, Check, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { API_URL } from '@/lib/api-url';
import { toast } from 'sonner';

interface ProposedAction {
  type: string;
  title?: string;
  description?: string;
  text?: string;
  durationMinutes?: number;
  caseId?: string;
  taskId?: string;
  rejected?: boolean;
}

interface VoiceCaptureProps {
  caseId: string;
  onActionCompleted?: () => void;
}

export function VoiceCapture({ caseId, onActionCompleted }: VoiceCaptureProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [proposedActions, setProposedActions] = useState<ProposedAction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        // For now, we rely on the text transcript input
        // In production, we'd send the audio blob to the transcribe endpoint
      };

      mediaRecorder.start();
      setIsRecording(true);
      setShowPanel(true);
      toast.info('Recording started. Speak your notes...');
    } catch (err) {
      console.error('Microphone access denied:', err);
      toast.error('Microphone access denied. You can type your notes instead.');
      setShowPanel(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.info('Recording stopped. Edit transcript if needed, then submit.');
    }
  };

  const processTranscript = async () => {
    if (!transcript.trim()) {
      toast.error('Please enter or dictate some text first');
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/voice-capture/propose-actions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transcript, caseId })
      });

      if (res.ok) {
        const data = await res.json();
        setProposedActions(data.proposedActions || []);
        if (data.proposedActions?.length === 0) {
          toast.info('No actions detected. Try being more specific.');
        }
      } else {
        toast.error('Failed to process transcript');
      }
    } catch (error) {
      console.error('Error processing transcript:', error);
      toast.error('Failed to process transcript');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleAction = (index: number) => {
    setProposedActions(prev =>
      prev.map((a, i) => i === index ? { ...a, rejected: !a.rejected } : a)
    );
  };

  const confirmActions = async () => {
    const activeActions = proposedActions.filter(a => !a.rejected);
    if (activeActions.length === 0) {
      toast.info('No actions to execute');
      return;
    }

    setIsConfirming(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/voice-capture/confirm-actions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ actions: proposedActions, caseId })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.totalExecuted} action(s) executed successfully`);
        setTranscript('');
        setProposedActions([]);
        setShowPanel(false);
        onActionCompleted?.();
      } else {
        toast.error('Failed to execute actions');
      }
    } catch (error) {
      console.error('Error confirming actions:', error);
      toast.error('Failed to execute actions');
    } finally {
      setIsConfirming(false);
    }
  };

  const getActionBadgeColor = (type: string) => {
    switch (type) {
      case 'time_entry': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'task': return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'subtask': return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400';
      case 'comment': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'runsheet_entry': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (!showPanel) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Voice Capture</p>
              <p className="text-sm text-muted-foreground">
                Dictate or type notes → auto-create entries, tasks, and comments
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPanel(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Type
              </Button>
              <Button size="sm" onClick={startRecording}>
                <Mic className="h-4 w-4 mr-2" />
                Record
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Capture
          </CardTitle>
          <div className="flex items-center gap-2">
            {isRecording ? (
              <Button variant="destructive" size="sm" onClick={stopRecording}>
                <MicOff className="h-4 w-4 mr-2" />
                Stop Recording
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={startRecording}>
                <Mic className="h-4 w-4 mr-2" />
                Record
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => {
              setShowPanel(false);
              setTranscript('');
              setProposedActions([]);
            }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRecording && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
            <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-medium">Recording... Speak now</span>
          </div>
        )}

        <div>
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Type or dictate your notes here. Examples:&#10;• 'Spent 30 minutes reviewing contract documents'&#10;• 'Create task: File motion for summary judgment'&#10;• 'Add comment: Client confirmed settlement terms'"
            rows={4}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={processTranscript}
            disabled={isProcessing || !transcript.trim()}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Propose Actions
              </>
            )}
          </Button>
        </div>

        {proposedActions.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-3">
                Proposed Actions — Review and confirm:
              </p>
              <div className="space-y-2">
                {proposedActions.map((action, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      action.rejected
                        ? 'bg-muted/30 opacity-50 border-muted'
                        : 'bg-card border-border'
                    }`}
                  >
                    <button
                      onClick={() => toggleAction(index)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {action.rejected ? (
                        <X className="h-4 w-4 text-destructive" />
                      ) : (
                        <Check className="h-4 w-4 text-success" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getActionBadgeColor(action.type)}>
                          {action.type.replace(/_/g, ' ')}
                        </Badge>
                        {action.durationMinutes && (
                          <span className="text-xs text-muted-foreground">
                            {action.durationMinutes} min
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${action.rejected ? 'line-through' : ''}`}>
                        {action.title || action.text || action.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setProposedActions([]);
                  setEditMode(true);
                }}
              >
                Edit Transcript
              </Button>
              <Button
                onClick={confirmActions}
                disabled={isConfirming || proposedActions.every(a => a.rejected)}
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirm & Execute ({proposedActions.filter(a => !a.rejected).length})
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
