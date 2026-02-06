import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Play, Pause, Save, Clock } from "lucide-react";
import { toast } from "sonner";
import { API_URL } from "@/lib/api-url";

interface Case {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
}

interface BillingCode {
  id: string;
  code: string;
  label: string;
  active: boolean;
}

export function TimeTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const [selectedCase, setSelectedCase] = useState("");
  const [selectedBillingCode, setSelectedBillingCode] = useState("");
  const [description, setDescription] = useState("");
  const [billable, setBillable] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [billingCodes, setBillingCodes] = useState<BillingCode[]>([]);
  const [runningTimerId, setRunningTimerId] = useState<string | null>(null);

  // Fetch cases from API
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        const res = await fetch(`${API_URL}/cases`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log('Fetched cases:', data);
          setCases(data);
        }
      } catch (error) {
        console.error('Failed to fetch cases:', error);
      }
    };
    
    fetchCases();
  }, []);

  // Fetch billing codes from API
  useEffect(() => {
    const fetchBillingCodes = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        const res = await fetch(`${API_URL}/billing-codes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          const safe = Array.isArray(data) ? data : [];
          setBillingCodes(safe.filter((bc: BillingCode) => bc.active));
        }
      } catch (error) {
        console.error('Failed to fetch billing codes:', error);
      }
    };
    
    fetchBillingCodes();
  }, []);

  // Elapsed time counter
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isTracking && timerStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - timerStartTime.getTime()) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, timerStartTime]);

  // Format elapsed time as HH:MM:SS
  const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTracking = async () => {
    if (!selectedCase) {
      toast.error('Please select a case first');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Please log in to track time');
        return;
      }

      const res = await fetch(`${API_URL}/time-entries/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matterId: selectedCase,
          billingCodeId: selectedBillingCode || undefined,
          description: description || ''
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRunningTimerId(data.id);
        setTimerStartTime(new Date());
        setElapsedSeconds(0);
        setIsTracking(true);
        toast.success('Timer started');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to start timer');
      }
    } catch (error) {
      console.error('Start timer error:', error);
      toast.error('Failed to start timer');
    }
  };

  const handleStopTracking = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token || !runningTimerId) {
        setIsTracking(false);
        return;
      }

      const res = await fetch(`${API_URL}/time-entries/stop/${runningTimerId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        setIsTracking(false);
        setTimerStartTime(null);
        toast.success(`Timer stopped - ${formatElapsedTime(elapsedSeconds)}`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to stop timer');
      }
    } catch (error) {
      console.error('Stop timer error:', error);
      toast.error('Failed to stop timer');
    }
  };

  const handleSave = async () => {
    if (!selectedCase) {
      toast.error('Please select a case');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Please log in to save time entry');
        return;
      }

      const durationMinutes = Math.ceil(elapsedSeconds / 60);
      
      const res = await fetch(`${API_URL}/time-entries/manual`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matterId: selectedCase,
          billingCodeId: selectedBillingCode || undefined,
          description: description,
          durationMinutesRaw: durationMinutes
        })
      });

      if (res.ok) {
        toast.success('Time entry saved');
        // Reset form
        setSelectedCase("");
        setSelectedBillingCode("");
        setDescription("");
        setBillable(true);
        setRunningTimerId(null);
        setElapsedSeconds(0);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save time entry');
      }
    } catch (error) {
      console.error('Save time entry error:', error);
      toast.error('Failed to save time entry');
    }
  };

  // Get selected case name for display
  const selectedCaseName = cases.find(c => c.id === selectedCase);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Live Timer Display - Always Visible */}
        <div className={`p-6 rounded-lg text-center border-2 ${isTracking ? 'bg-primary/10 border-primary animate-pulse' : 'bg-muted border-muted-foreground/20'}`}>
          <p className="text-sm text-muted-foreground mb-2">
            {isTracking ? '⏱️ Timer Running' : '⏱️ Timer Stopped'}
          </p>
          <p className={`text-5xl font-mono font-bold ${isTracking ? 'text-primary' : 'text-muted-foreground'}`}>
            {formatElapsedTime(elapsedSeconds)}
          </p>
          {selectedCaseName && (
            <p className="text-sm text-muted-foreground mt-2">
              {selectedCaseName.caseNumber} - {selectedCaseName.title}
            </p>
          )}
        </div>

        {/* Timer Controls */}
        <div className="flex justify-center gap-4">
          {!isTracking ? (
            <Button
              onClick={handleStartTracking}
              disabled={!selectedCase}
              size="lg"
              className="gap-2 px-8"
            >
              <Play className="h-5 w-5" />
              Start Timer
            </Button>
          ) : (
            <Button
              onClick={handleStopTracking}
              variant="destructive"
              size="lg"
              className="gap-2 px-8"
            >
              <Pause className="h-5 w-5" />
              Stop Timer
            </Button>
          )}
        </div>

        {/* Case Selection */}
        <div className="space-y-2">
          <Label htmlFor="case">Select Case</Label>
          <Select value={selectedCase} onValueChange={setSelectedCase}>
            <SelectTrigger id="case">
              <SelectValue placeholder="Choose a case" />
            </SelectTrigger>
            <SelectContent>
              {cases.length === 0 ? (
                <SelectItem value="__none__" disabled>No cases available</SelectItem>
              ) : (
                cases.map((case_) => (
                  <SelectItem key={case_.id} value={case_.id}>
                    {case_.caseNumber} - {case_.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Billing Code Selection */}
        <div className="space-y-2">
          <Label htmlFor="billing-code">Billing Code</Label>
          <Select value={selectedBillingCode} onValueChange={setSelectedBillingCode}>
            <SelectTrigger id="billing-code">
              <SelectValue placeholder="Select billing code" />
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

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the work performed..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Billable Toggle & Save */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="billable"
              checked={billable}
              onCheckedChange={setBillable}
            />
            <Label htmlFor="billable">Billable</Label>
          </div>
          <Button
            onClick={handleSave}
            disabled={!selectedCase || elapsedSeconds === 0}
            variant="default"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save Entry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
