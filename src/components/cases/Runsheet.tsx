import { useState } from "react";
import { Clock, Plus, FileText, Phone, Mail, Calendar, User, Briefcase, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { parseLogCommand, calculateBillableMinutes, formatDuration } from "@/lib/time-utils";
import { TimeEntry, Tag as TagType } from "@/types";
import { toast } from "sonner";

interface Activity {
  id: string;
  type: 'note' | 'phone' | 'email' | 'meeting' | 'court' | 'document' | 'research' | 'time-entry';
  title: string;
  description: string;
  date: string;
  time?: string;
  duration?: number; // in minutes
  billable?: boolean;
  createdBy: string;
  timestamp: string;
  tags?: TagType[];
}

interface RunsheetProps {
  caseId: string;
}

const Runsheet = ({ caseId }: RunsheetProps) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);

  const [showNewActivity, setShowNewActivity] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'note' as Activity['type'],
    title: '',
    description: '',
    duration: '',
    billable: true
  });
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);
  const [isLogPreview, setIsLogPreview] = useState(false);
  const [logPreview, setLogPreview] = useState<{ duration: number; description: string } | null>(null);

  // Convert minutes to 6-minute increments
  const roundToSixMinutes = (minutes: number): number => {
    return Math.ceil(minutes / 6) * 6;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getActivityIcon = (type: Activity['type']) => {
    const icons = {
      'note': <FileText className="h-4 w-4" />,
      'phone': <Phone className="h-4 w-4" />,
      'email': <Mail className="h-4 w-4" />,
      'meeting': <User className="h-4 w-4" />,
      'court': <Briefcase className="h-4 w-4" />,
      'document': <FileText className="h-4 w-4" />,
      'research': <FileText className="h-4 w-4" />,
      'time-entry': <Clock className="h-4 w-4" />
    };
    return icons[type];
  };

  const getActivityTypeColor = (type: Activity['type']) => {
    const colors = {
      'note': 'bg-muted text-muted-foreground',
      'phone': 'bg-info text-info-foreground',
      'email': 'bg-primary text-primary-foreground',
      'meeting': 'bg-success text-success-foreground',
      'court': 'bg-warning text-warning-foreground',
      'document': 'bg-accent text-accent-foreground',
      'research': 'bg-secondary text-secondary-foreground',
      'time-entry': 'bg-destructive text-destructive-foreground'
    };
    return colors[type];
  };

  // Check for /log command in description
  const checkForLogCommand = (text: string) => {
    const logResult = parseLogCommand(text);
    if (logResult) {
      setIsLogPreview(true);
      setLogPreview(logResult);
    } else {
      setIsLogPreview(false);
      setLogPreview(null);
    }
  };

  const handleAddActivity = () => {
    if (!newActivity.title || !newActivity.description) return;

    const duration = newActivity.duration ? roundToSixMinutes(parseInt(newActivity.duration)) : undefined;
    
    const activity: Activity = {
      id: Date.now().toString(),
      type: newActivity.type,
      title: newActivity.title,
      description: newActivity.description,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'h:mm a'),
      duration: duration,
      billable: newActivity.billable && duration !== undefined,
      createdBy: user?.name || 'Current User',
      timestamp: new Date().toISOString(),
      tags: selectedTags
    };

    setActivities([activity, ...activities]);

    // If it's a /log command, also create a time entry
    const logResult = parseLogCommand(newActivity.description);
    if (logResult && user) {
      const billableMinutes = calculateBillableMinutes(logResult.duration * 60);
      const timeEntry: TimeEntry = {
        id: Date.now().toString() + '_log',
        caseId,
        userId: user.id,
        startedAt: new Date().toISOString(),
        stoppedAt: new Date().toISOString(),
        rawSeconds: logResult.duration * 60,
        billableMinutes,
        description: logResult.description,
        createdAt: new Date().toISOString()
      };

      // Save to localStorage
      const existingEntries = JSON.parse(localStorage.getItem('timeEntries') || '[]');
      existingEntries.push(timeEntry);
      localStorage.setItem('timeEntries', JSON.stringify(existingEntries));

      toast.success(`Time entry created: ${formatDuration(billableMinutes)} logged`);
    }

    setNewActivity({
      type: 'note',
      title: '',
      description: '',
      duration: '',
      billable: true
    });
    setSelectedTags([]);
    setIsLogPreview(false);
    setLogPreview(null);
    setShowNewActivity(false);
  };

  const addTag = (tag: TagType) => {
    if (!selectedTags.find(t => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter(t => t.id !== tagId));
  };

  return (
    <div className="space-y-6">
      {/* Add Activity Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Activity Log</h2>
        <Button
          onClick={() => setShowNewActivity(!showNewActivity)}
          variant="gradient"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Log Activity
        </Button>
      </div>

      {/* New Activity Form */}
      {showNewActivity && (
        <Card>
          <CardHeader>
            <CardTitle>Log New Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="activity-type">Activity Type</Label>
                <Select
                  value={newActivity.type}
                  onValueChange={(value) => setNewActivity({ ...newActivity, type: value as Activity['type'] })}
                >
                  <SelectTrigger id="activity-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="court">Court Appearance</SelectItem>
                    <SelectItem value="document">Document Filing</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="time-entry">Time Entry Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="duration"
                    type="number"
                    placeholder="e.g., 15"
                    value={newActivity.duration}
                    onChange={(e) => setNewActivity({ ...newActivity, duration: e.target.value })}
                  />
                  {newActivity.duration && (
                    <span className="text-sm text-muted-foreground">
                      = {formatDuration(roundToSixMinutes(parseInt(newActivity.duration)))} billed
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Time automatically rounds up to 6-minute increments
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Brief description of the activity"
                value={newActivity.title}
                onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed notes about this activity... (Use /log 11m description for quick time entry)"
                rows={4}
                value={newActivity.description}
                onChange={(e) => {
                  setNewActivity({ ...newActivity, description: e.target.value });
                  checkForLogCommand(e.target.value);
                }}
              />
              {isLogPreview && logPreview && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Time Entry Preview:</span>
                    <span>{logPreview.duration}m</span>
                    <span>•</span>
                    <span>{logPreview.description}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="flex items-center gap-1"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    <Tag className="h-3 w-3" />
                    {tag.name}
                    <button
                      onClick={() => removeTag(tag.id)}
                      className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Tag className="h-4 w-4" />
                    Add Tag
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Available Tags</h4>
                    <div className="space-y-1">
                      {[].map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => addTag(tag)}
                          disabled={selectedTags.find(t => t.id === tag.id) !== undefined}
                          className="w-full flex items-center gap-2 p-2 text-left hover:bg-muted rounded-md disabled:opacity-50"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-sm">{tag.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {newActivity.duration && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="billable"
                  checked={newActivity.billable}
                  onChange={(e) => setNewActivity({ ...newActivity, billable: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="billable" className="cursor-pointer">
                  Mark as billable time
                </Label>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleAddActivity} variant="gradient">
                Add Activity
              </Button>
              <Button onClick={() => setShowNewActivity(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id}>
                <div className="flex gap-4">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-full ${getActivityTypeColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    {index < activities.length - 1 && (
                      <div className="w-0.5 h-full bg-muted mt-2" />
                    )}
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{activity.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span>{activity.date}</span>
                          {activity.time && <span>{activity.time}</span>}
                          <span>by {activity.createdBy}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {activity.billable && (
                          <Badge variant="outline" className="text-success border-success">
                            Billable
                          </Badge>
                        )}
                        {activity.duration && (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDuration(activity.duration)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    {activity.tags && activity.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {activity.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="text-xs"
                            style={{ backgroundColor: tag.color + '20', color: tag.color }}
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Runsheet;