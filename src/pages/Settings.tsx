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
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [syncDirection, setSyncDirection] = useState<string>('one_way');
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    emailNotifications: true,
    notifyInvoices: true,
    notifyDeadlines: true,
    notifyTasks: true
  });

  useEffect(() => {
    if (user?.role === 'Admin' || user?.role === 'Developer') {
      loadRoleRates();
    }
    loadNotificationPreferences();
    loadGoogleStatus();

    // Handle Google OAuth redirect callback
    const params = new URLSearchParams(window.location.search);
    const googleStatus = params.get('google');
    if (googleStatus === 'connected') {
      toast.success('Google account connected! Contacts have been synced.');
      setGoogleConnected(true);
      // Clean up URL
      window.history.replaceState({}, '', '/settings');
    } else if (googleStatus === 'error') {
      const errorMsg = params.get('msg');
      toast.error(`Failed to connect: ${errorMsg || 'Unknown error. Please try again.'}`);
      window.history.replaceState({}, '', '/settings');
    }
  }, [user]);

  const loadGoogleStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_URL}/google-contacts/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGoogleConnected(data.isConnected);
      }
    } catch (error) {
      console.error('Error loading Google status:', error);
    }
  };

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
          {(user?.role === 'Admin' || user?.role === 'Developer') && (
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable 2FA</Label>
                  <p className="text-sm text-muted-foreground">
                    Use an authenticator app for additional login security
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={(checked) => {
                    setTwoFactorEnabled(checked);
                    toast.info(checked ? '2FA setup will be available in a future update' : '2FA disabled');
                  }}
                />
              </div>
              {twoFactorEnabled && (
                <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  Two-factor authentication is enabled. You will be prompted for a verification code on your next login.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Google Integration
              </CardTitle>
              <CardDescription>Connect your Google account for Contacts and Drive sync</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Google Account</Label>
                  <p className="text-sm text-muted-foreground">
                    {googleConnected
                      ? 'Your Google account is connected'
                      : 'Connect to sync contacts and access Google Drive'}
                  </p>
                </div>
                <Button
                  variant={googleConnected ? 'outline' : 'default'}
                  onClick={async () => {
                    if (googleConnected) {
                      try {
                        const token = localStorage.getItem('authToken');
                        await fetch(`${API_URL}/google-contacts/disconnect`, {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        setGoogleConnected(false);
                        toast.success('Google account disconnected');
                      } catch {
                        toast.error('Failed to disconnect');
                      }
                    } else {
                      try {
                        const token = localStorage.getItem('authToken');
                        const res = await fetch(`${API_URL}/google-contacts/auth-url`, {
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.ok) {
                          const data = await res.json();
                          window.location.href = data.url;
                        } else {
                          toast.error('Failed to start Google connection. Check server configuration.');
                        }
                      } catch {
                        toast.error('Failed to connect to Google');
                      }
                    }
                  }}
                >
                  {googleConnected ? 'Disconnect' : 'Connect Google'}
                </Button>
              </div>

              {googleConnected && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Contacts Sync Direction</Label>
                      <p className="text-sm text-muted-foreground">
                        Choose how contacts sync between LegalTrack and Google
                      </p>
                    </div>
                    <Select value={syncDirection} onValueChange={setSyncDirection}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one_way">One-way (Google → App)</SelectItem>
                        <SelectItem value="two_way">Two-way Sync</SelectItem>
                        <SelectItem value="manual">Manual Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Sync Contacts Now</Label>
                      <p className="text-sm text-muted-foreground">
                        Pull contacts from Google and apply sync direction setting
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('authToken');
                          const res = await fetch(`${API_URL}/google-contacts/sync`, {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ syncDirection })
                          });
                          if (res.ok) {
                            const data = await res.json();
                            toast.success(`Synced: ${data.imported} imported, ${data.updated} updated, ${data.skipped} skipped`);
                          } else {
                            toast.error('Sync failed');
                          }
                        } catch {
                          toast.error('Failed to sync contacts');
                        }
                      }}
                    >
                      Sync Now
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Rates (Admin / Developer) */}
        {(user?.role === 'Admin' || user?.role === 'Developer') && (
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
                    currentRateCents={rr.rateCents}
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

        {/* System Settings (Admin / Developer) */}
        {(user?.role === 'Admin' || user?.role === 'Developer') && (
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
