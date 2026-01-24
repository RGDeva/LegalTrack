import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Clock, Play, Pause, Plus, X, Save, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/api-url";

interface Timer {
  id: string;
  caseId: string;
  caseName: string;
  billingCodeId: string;
  description: string;
  startTime: number;
  elapsedTime: number;
  isRunning: boolean;
}

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

export function TimerWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [timers, setTimers] = useState<Timer[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [billingCodes, setBillingCodes] = useState<BillingCode[]>([]);

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
          setBillingCodes(data.filter((bc: BillingCode) => bc.active));
        }
      } catch (error) {
        console.error('Failed to fetch billing codes:', error);
      }
    };
    
    fetchBillingCodes();
  }, []);

  // Update elapsed time for running timers
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prevTimers => 
        prevTimers.map(timer => {
          if (timer.isRunning) {
            return {
              ...timer,
              elapsedTime: Date.now() - timer.startTime
            };
          }
          return timer;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const addTimer = () => {
    const newTimer: Timer = {
      id: Date.now().toString(),
      caseId: '',
      caseName: '',
      billingCodeId: '',
      description: '',
      startTime: Date.now(),
      elapsedTime: 0,
      isRunning: false,
    };
    setTimers([...timers, newTimer]);
  };

  const removeTimer = (id: string) => {
    setTimers(timers.filter(t => t.id !== id));
  };

  const toggleTimer = (id: string) => {
    setTimers(timers.map(timer => {
      if (timer.id === id) {
        if (timer.isRunning) {
          return { ...timer, isRunning: false };
        } else {
          return { 
            ...timer, 
            isRunning: true,
            startTime: Date.now() - timer.elapsedTime
          };
        }
      }
      return timer;
    }));
  };

  const saveTimer = async (timer: Timer) => {
    if (!timer.caseId || timer.elapsedTime === 0) {
      toast.error("Please select a case and log some time.");
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Please log in to save time entry');
        return;
      }

      const durationMinutes = Math.ceil(timer.elapsedTime / 1000 / 60);
      
      const res = await fetch(`${API_URL}/time-entries/manual`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matterId: timer.caseId,
          billingCodeId: timer.billingCodeId || undefined,
          description: timer.description,
          durationMinutesRaw: durationMinutes
        })
      });

      if (res.ok) {
        toast.success(`Time entry saved - ${formatTime(timer.elapsedTime)}`);
        removeTimer(timer.id);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save time entry');
      }
    } catch (error) {
      console.error('Save time entry error:', error);
      toast.error('Failed to save time entry');
    }
  };

  const updateTimer = (id: string, updates: Partial<Timer>) => {
    setTimers(timers.map(timer => 
      timer.id === id ? { ...timer, ...updates } : timer
    ));
  };

  const activeTimerCount = timers.filter(t => t.isRunning).length;
  const totalElapsed = timers.reduce((acc, t) => acc + t.elapsedTime, 0);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={cn(
            "relative gap-2",
            activeTimerCount > 0 && "text-primary"
          )}
        >
          <Clock className="h-4 w-4" />
          {activeTimerCount > 0 ? (
            <>
              <span className="font-mono text-sm">
                {formatTime(totalElapsed)}
              </span>
              <Badge variant="secondary" className="h-5 px-1 text-xs">
                {activeTimerCount}
              </Badge>
            </>
          ) : (
            <span className="text-sm">Timer</span>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="font-semibold text-sm">Time Tracking</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={addTimer}
            disabled={timers.length >= 5}
            className="h-8 gap-1"
          >
            <Plus className="h-3 w-3" />
            Add Timer
          </Button>
        </div>
        
        <Separator />
        
        <ScrollArea className="max-h-96">
          {timers.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No active timers. Click "Add Timer" to start tracking time.
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {timers.map((timer) => (
                <div
                  key={timer.id}
                  className="rounded-lg border bg-card p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <Select
                        value={timer.caseId}
                        onValueChange={(value) => {
                          const selectedCase = cases.find(c => c.id === value);
                          updateTimer(timer.id, { 
                            caseId: value,
                            caseName: selectedCase?.title || ''
                          });
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select case..." />
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

                      <Select
                        value={timer.billingCodeId}
                        onValueChange={(value) => updateTimer(timer.id, { billingCodeId: value })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Billing code..." />
                        </SelectTrigger>
                        <SelectContent>
                          {billingCodes.map((code) => (
                            <SelectItem key={code.id} value={code.id}>
                              {code.code} - {code.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Input
                        placeholder="Description..."
                        value={timer.description}
                        onChange={(e) => updateTimer(timer.id, { description: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeTimer(timer.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "font-mono text-lg",
                      timer.isRunning && "text-primary"
                    )}>
                      {formatTime(timer.elapsedTime)}
                    </span>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveTimer(timer)}
                        disabled={!timer.caseId || timer.elapsedTime === 0}
                        className="h-7 gap-1"
                      >
                        <Save className="h-3 w-3" />
                        Save
                      </Button>
                      
                      <Button
                        variant={timer.isRunning ? "secondary" : "default"}
                        size="sm"
                        onClick={() => toggleTimer(timer.id)}
                        disabled={!timer.caseId}
                        className="h-7 gap-1"
                      >
                        {timer.isRunning ? (
                          <>
                            <Pause className="h-3 w-3" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3" />
                            Start
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {timers.length > 0 && (
          <>
            <Separator />
            <div className="p-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{timers.length}/5 timers</span>
              <span>{activeTimerCount} active</span>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
