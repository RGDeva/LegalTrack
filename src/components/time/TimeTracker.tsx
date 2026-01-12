import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function TimeTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const [selectedCase, setSelectedCase] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [billable, setBillable] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const diffMinutes = endMinutes - startMinutes;
    
    // Round up to nearest 6-minute increment
    return Math.ceil(diffMinutes / 6);
  };

  const formatDuration = (increments: number) => {
    const hours = Math.floor(increments / 10);
    const remainingIncrements = increments % 10;
    const minutes = remainingIncrements * 6;
    
    if (hours === 0) {
      return `${minutes} minutes`;
    }
    return `${hours}h ${minutes}m (${increments} units)`;
  };

  const handleStartTracking = () => {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setStartTime(timeString);
    setIsTracking(true);
  };

  const handleStopTracking = () => {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setEndTime(timeString);
    setIsTracking(false);
  };

  const handleSave = () => {
    const duration = calculateDuration(startTime, endTime);
    console.log('Saving time entry:', {
      case: selectedCase,
      startTime,
      endTime,
      duration,
      description,
      billable
    });
    // Reset form
    setSelectedCase("");
    setStartTime("");
    setEndTime("");
    setDescription("");
    setBillable(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="case">Select Case</Label>
          <Select value={selectedCase} onValueChange={setSelectedCase}>
            <SelectTrigger id="case">
              <SelectValue placeholder="Choose a case" />
            </SelectTrigger>
            <SelectContent>
              {[].filter(c => c.status === 'active').map((case_) => (
                <SelectItem key={case_.id} value={case_.id}>
                  {case_.caseNumber} - {case_.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-time">Start Time</Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time">End Time</Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        {startTime && endTime && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="text-lg font-semibold">
              {formatDuration(calculateDuration(startTime, endTime))}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Billed in 6-minute increments
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the work performed..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="billable"
              checked={billable}
              onCheckedChange={setBillable}
            />
            <Label htmlFor="billable">Billable</Label>
          </div>
          <div className="flex gap-2">
            {!isTracking ? (
              <Button
                onClick={handleStartTracking}
                disabled={!selectedCase}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Start Timer
              </Button>
            ) : (
              <Button
                onClick={handleStopTracking}
                variant="destructive"
                className="gap-2"
              >
                <Pause className="h-4 w-4" />
                Stop Timer
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!selectedCase || !startTime || !endTime || !description}
              variant="gradient"
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Entry
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}