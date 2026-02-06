import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { TimeEntry, BillingCode } from '@/types';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api-url';

interface CaseTimerProps {
  caseId: string;
  caseNumber: string;
  onTimeEntryCreated?: (entry: TimeEntry) => void;
}

interface TimerState {
  isRunning: boolean;
  startTime: number;
  elapsedSeconds: number;
  description: string;
  billingCodeId?: string;
  entryId?: string;
}

interface RunningEntry {
  id: string;
  startedAt: string;
  description: string;
  billingCodeId?: string;
}

export function CaseTimer({ caseId, caseNumber, onTimeEntryCreated }: CaseTimerProps) {
  const { user } = useAuth();
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    startTime: 0,
    elapsedSeconds: 0,
    description: '',
    billingCodeId: undefined,
    entryId: undefined
  });
  const [billingCodes, setBillingCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout>();

  // Load billing codes
  useEffect(() => {
    loadBillingCodes();
    checkRunningTimer();
  }, []);

  const loadBillingCodes = async () => {
    try {
      const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/billing-codes/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setBillingCodes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading billing codes:', error);
    }
  };

  const checkRunningTimer = async () => {
    try {
      const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/time-entries/running`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.id) {
        const startTime = new Date(data.startedAt).getTime();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setTimer({
          isRunning: true,
          startTime,
          elapsedSeconds: elapsed,
          description: data.description || '',
          billingCodeId: data.billingCodeId,
          entryId: data.id
        });
      }
    } catch (error) {
      console.error('Error checking running timer:', error);
    }
  };

  useEffect(() => {
    if (timer.isRunning) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => ({
          ...prev,
          elapsedSeconds: Math.floor((Date.now() - prev.startTime) / 1000)
        }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timer.isRunning]);

  const startTimer = async () => {
    if (!user) {
      toast.error('Please log in to start timer');
      return;
    }

    if (!timer.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/time-entries/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matterId: caseId,
          description: timer.description,
          billingCodeId: timer.billingCodeId
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        const startTime = new Date(data.startedAt).getTime();
        setTimer(prev => ({
          ...prev,
          isRunning: true,
          startTime,
          entryId: data.id
        }));
        toast.success('Timer started');
      } else {
        toast.error(data.error || 'Failed to start timer');
      }
    } catch (error) {
      console.error('Error starting timer:', error);
      toast.error('Failed to start timer');
    } finally {
      setLoading(false);
    }
  };

  const pauseTimer = () => {
    setTimer(prev => ({
      ...prev,
      isRunning: false
    }));
  };

  const stopTimer = async () => {
    if (!user || !timer.entryId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/time-entries/stop/${timer.entryId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          billingCodeId: timer.billingCodeId
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        const billedMinutes = data.durationMinutesBilled;
        const amount = data.amountCents / 100;
        
        onTimeEntryCreated?.(data);
        
        // Reset timer
        setTimer({
          isRunning: false,
          startTime: 0,
          elapsedSeconds: 0,
          description: '',
          billingCodeId: undefined,
          entryId: undefined
        });

        toast.success(`Time entry created: ${billedMinutes} min logged (${formatDuration(billedMinutes)})`);
      } else {
        toast.error(data.error || 'Failed to stop timer');
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast.error('Failed to stop timer');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const billableMinutes = Math.ceil((timer.elapsedSeconds / 60) / 6) * 6;
  const selectedBillingCode = timer.billingCodeId 
    ? billingCodes.find(bc => bc.id === timer.billingCodeId)
    : null;

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-semibold">Case Timer</span>
            <Badge variant="outline">{caseNumber}</Badge>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono">
              {formatDuration(timer.elapsedSeconds / 60)}
            </div>
            <div className="text-sm text-muted-foreground">
              {billableMinutes > 0 && `${billableMinutes} min billable`}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Description of work performed..."
            value={timer.description}
            onChange={(e) => setTimer(prev => ({ ...prev, description: e.target.value }))}
            disabled={timer.isRunning}
          />

          <div className="flex items-center gap-2">
            <Select
              value={timer.billingCodeId || ''}
              onValueChange={(value) => setTimer(prev => ({ 
                ...prev, 
                billingCodeId: value || undefined 
              }))}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select billing code (optional)" />
              </SelectTrigger>
              <SelectContent>
                {billingCodes.map((code) => (
                  <SelectItem key={code.id} value={code.id}>
                    {code.code} - {code.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedBillingCode && (
            <div className="text-sm text-muted-foreground">
              Code: {selectedBillingCode.code} - {selectedBillingCode.label}
            </div>
          )}

          <div className="flex gap-2">
            {!timer.isRunning ? (
              <Button
                onClick={startTimer}
                disabled={!timer.description.trim() || loading}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                {loading ? 'Starting...' : 'Start'}
              </Button>
            ) : (
              <Button
                onClick={pauseTimer}
                variant="outline"
                className="flex-1"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            
            <Button
              onClick={stopTimer}
              variant="destructive"
              disabled={timer.elapsedSeconds === 0 || loading}
            >
              <Square className="h-4 w-4 mr-2" />
              {loading ? 'Stopping...' : 'Stop'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
