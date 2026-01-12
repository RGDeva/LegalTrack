import { useState, useEffect, useRef } from "react";
import { Clock, Play, Pause, X, Plus, ChevronDown, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Timer {
  id: string;
  caseId: string;
  caseName: string;
  description: string;
  startTime: number;
  elapsedTime: number;
  isRunning: boolean;
}

export function TimerWidget() {
  const [timers, setTimers] = useState<Timer[]>(() => {
    const saved = localStorage.getItem('timers');
    return saved ? JSON.parse(saved) : [];
  });
  const [isOpen, setIsOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('timers', JSON.stringify(timers));
  }, [timers]);

  useEffect(() => {
    if (timers.some(t => t.isRunning)) {
      intervalRef.current = setInterval(() => {
        setTimers(prev => prev.map(timer => 
          timer.isRunning 
            ? { ...timer, elapsedTime: Date.now() - timer.startTime }
            : timer
        ));
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
  }, [timers]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addTimer = () => {
    if (timers.length >= 5) return;
    
    const newTimer: Timer = {
      id: Date.now().toString(),
      caseId: '',
      caseName: '',
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
          // Pausing
          return { ...timer, isRunning: false };
        } else {
          // Resuming
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

  const saveTimer = (timer: Timer) => {
    if (!timer.caseId || !timer.description || timer.elapsedTime === 0) {
      toast({
        title: "Cannot save timer",
        description: "Please select a case, add a description, and log some time.",
        variant: "destructive",
      });
      return;
    }

    // Calculate duration in 6-minute increments
    const seconds = Math.floor(timer.elapsedTime / 1000);
    const minutes = seconds / 60;
    const increments = Math.ceil(minutes / 6);
    
    // Create time entry
    const timeEntry = {
      id: Date.now().toString(),
      caseId: timer.caseId,
      caseNumber: [].find(c => c.id === timer.caseId)?.caseNumber || '',
      clientName: [].find(c => c.id === timer.caseId)?.clientName || '',
      date: new Date().toISOString().split('T')[0],
      startTime: new Date(timer.startTime).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      endTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      duration: increments,
      description: timer.description,
      billable: true,
      billed: false,
      rate: [].find(c => c.id === timer.caseId)?.hourlyRate || 250,
      amount: increments * (([].find(c => c.id === timer.caseId)?.hourlyRate || 250) / 10),
      attorney: 'Current User',
      billingCode: 'TIME',
    };

    // Save to localStorage (in a real app, this would be an API call)
    const existingEntries = JSON.parse(localStorage.getItem('timeEntries') || '[]');
    existingEntries.push(timeEntry);
    localStorage.setItem('timeEntries', JSON.stringify(existingEntries));

    // Remove the timer
    removeTimer(timer.id);

    toast({
      title: "Time entry saved",
      description: `${increments * 6} minutes logged to ${timer.caseName}`,
    });
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
          {activeTimerCount > 0 && (
            <>
              <span className="font-mono text-sm">
                {formatTime(totalElapsed)}
              </span>
              <Badge variant="secondary" className="h-5 px-1 text-xs">
                {activeTimerCount}
              </Badge>
            </>
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
                          const selectedCase = [].find(c => c.id === value);
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
                          {[].map((case_) => (
                            <SelectItem key={case_.id} value={case_.id}>
                              {case_.caseNumber} - {case_.title}
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
                    <span className="font-mono text-lg">
                      {formatTime(timer.elapsedTime)}
                    </span>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveTimer(timer)}
                        disabled={!timer.caseId || !timer.description || timer.elapsedTime === 0}
                        className="h-7 gap-1"
                      >
                        <Save className="h-3 w-3" />
                        Save
                      </Button>
                      
                      <Button
                        variant={timer.isRunning ? "secondary" : "default"}
                        size="sm"
                        onClick={() => toggleTimer(timer.id)}
                        disabled={!timer.caseId || !timer.description}
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