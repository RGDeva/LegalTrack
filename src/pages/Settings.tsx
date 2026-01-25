import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, DollarSign, Code, Bell, Shield, Database, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { API_URL } from '@/lib/api-url';

interface RoleRate {
  id: string;
  role: string;
  rateCents: number;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  notifyInvoices: boolean;
  notifyDeadlines: boolean;
  notifyTasks: boolean;
}

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [roleRates, setRoleRates] = useState<RoleRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    emailNotifications: true,
    notifyInvoices: true,
    notifyDeadlines: true,
    notifyTasks: true
  });

  useEffect(() => {
    if (user?.role === 'Admin') {
      loadRoleRates();
    }
    loadNotificationPreferences();
  }, [user]);

  const loadRoleRates = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/role-rates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setRoleRates(data);
    } catch (error) {
      console.error('Error loading role rates:', error);
      toast.error('Failed to load role rates');
    }
  };

  const loadNotificationPreferences = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/user/settings/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotificationPrefs(data);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const updateNotificationPreference = async (key: keyof NotificationPreferences, value: boolean) => {
    try {
      const token = localStorage.getItem('authToken');
      const newPrefs = { ...notificationPrefs, [key]: value };
      
      const res = await fetch(`${API_URL}/user/settings/notifications`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [key]: value })
      });

      if (res.ok) {
        setNotificationPrefs(newPrefs);
        toast.success('Notification preferences updated');
      } else {
        toast.error('Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    }
  };

  const updateRoleRate = async (role: string, rateDollars: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/role-rates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role,
          rateCents: Math.round(rateDollars * 100)
        })
      });

      if (res.ok) {
        toast.success(`${role} rate updated to $${rateDollars}/hr`);
        loadRoleRates();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update rate');
      }
    } catch (error) {
      console.error('Error updating rate:', error);
      toast.error('Failed to update rate');
    }
  };

  const RoleRateEditor = ({ role, currentRateCents }: { role: string; currentRateCents: number }) => {
    const [rate, setRate] = useState((currentRateCents / 100).toString());

    return (
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <p className="font-medium">{role}</p>
          <p className="text-sm text-muted-foreground">Default hourly rate</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">$</span>
          <Input
            type="number"
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">/hr</span>
          <Button
            size="sm"
            onClick={() => updateRoleRate(role, parseFloat(rate))}
            disabled={loading}
          >
            Update
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <SettingsIcon className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          {user?.role === 'Admin' && (
            <>
              <TabsTrigger value="billing">
                <DollarSign className="h-4 w-4 mr-2" />
                Billing Rates
              </TabsTrigger>
              <TabsTrigger value="system">
                <Database className="h-4 w-4 mr-2" />
                System
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how LegalTrack looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                </div>
                <Select value={theme} onValueChange={(value: any) => setTheme(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Time Tracking</CardTitle>
              <CardDescription>Configure time tracking preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>6-Minute Rounding</Label>
                  <p className="text-sm text-muted-foreground">Automatically round time entries</p>
                </div>
                <Switch checked disabled />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-save Timer</Label>
                  <p className="text-sm text-muted-foreground">Save timer entries automatically</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={user?.name || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={user?.role || ''} disabled />
              </div>
              <p className="text-sm text-muted-foreground">
                Contact your administrator to update your profile information.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Rates (Admin Only) */}
        {user?.role === 'Admin' && (
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Role Hourly Rates
                </CardTitle>
                <CardDescription>
                  Set default hourly rates for each role. These rates are used when billing codes don't specify a fixed rate.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {roleRates.map((rr) => (
                  <RoleRateEditor
                    key={rr.id}
                    role={rr.role}
                    currentRateCents={rr.hourlyRateCents}
                  />
                ))}
                {roleRates.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No role rates configured yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Billing Codes
                </CardTitle>
                <CardDescription>
                  Manage billing codes for time tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => window.location.href = '/billing-codes'}>
                  Go to Billing Codes Management
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* System Settings (Admin Only) */}
        {user?.role === 'Admin' && (
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security
                </CardTitle>
                <CardDescription>System security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database
                </CardTitle>
                <CardDescription>Database and backup settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Backup</Label>
                    <p className="text-sm text-muted-foreground">Daily database backups</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div>
                  <Button variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Backup Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoice Templates
                </CardTitle>
                <CardDescription>Manage invoice generation templates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Default Template</Label>
                    <p className="text-sm text-muted-foreground">EC Invoice Template 07.03.25</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Upload New
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Choose what emails you receive from LegalTrack</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>All Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Master switch for all email notifications</p>
                </div>
                <Switch 
                  checked={notificationPrefs.emailNotifications}
                  onCheckedChange={(checked) => updateNotificationPreference('emailNotifications', checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Invoice Reminders</Label>
                  <p className="text-sm text-muted-foreground">Overdue and upcoming invoice notifications</p>
                </div>
                <Switch 
                  checked={notificationPrefs.notifyInvoices}
                  onCheckedChange={(checked) => updateNotificationPreference('notifyInvoices', checked)}
                  disabled={!notificationPrefs.emailNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Deadline Alerts</Label>
                  <p className="text-sm text-muted-foreground">Upcoming task and hearing deadlines</p>
                </div>
                <Switch 
                  checked={notificationPrefs.notifyDeadlines}
                  onCheckedChange={(checked) => updateNotificationPreference('notifyDeadlines', checked)}
                  disabled={!notificationPrefs.emailNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Task Assignments</Label>
                  <p className="text-sm text-muted-foreground">Get notified when assigned to tasks</p>
                </div>
                <Switch 
                  checked={notificationPrefs.notifyTasks}
                  onCheckedChange={(checked) => updateNotificationPreference('notifyTasks', checked)}
                  disabled={!notificationPrefs.emailNotifications}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Schedule</CardTitle>
              <CardDescription>When automated emails are sent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="font-medium mb-2">Daily Notifications (9:00 AM EST)</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Overdue invoice reminders</li>
                  <li>Invoices due within 3 days</li>
                  <li>Tasks and hearings due within 7 days</li>
                </ul>
              </div>
              <Separator />
              <div className="text-sm">
                <p className="font-medium mb-2">Real-Time Notifications</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Task assignments (immediate)</li>
                  <li>Password reset requests (immediate)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
