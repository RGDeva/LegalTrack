import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Users, Calendar, DollarSign } from "lucide-react";
import { API_URL } from "@/lib/api-url";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: "case" | "time" | "contact" | "invoice";
  icon: any;
  title: string;
  description: string;
  time: string;
  color: string;
  createdAt: Date;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentActivity();
  }, []);

  const loadRecentActivity = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        console.log('No auth token found, skipping activity load');
        setLoading(false);
        return;
      }
      
      // Fetch recent cases, contacts, time entries, and invoices
      const [casesRes, contactsRes, timeEntriesRes, invoicesRes] = await Promise.all([
        fetch(`${API_URL}/cases`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/contacts`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/time-entries`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/invoices`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      // Parse responses with error handling - check for 401 and handle gracefully
      const cases = casesRes.ok ? await casesRes.json() : [];
      const contacts = contactsRes.ok ? await contactsRes.json() : [];
      const timeEntries = timeEntriesRes.ok ? await timeEntriesRes.json() : [];
      const invoices = invoicesRes.ok ? await invoicesRes.json() : [];
      
      // If all requests failed with 401, token might be invalid
      if (!casesRes.ok && !contactsRes.ok && !timeEntriesRes.ok && !invoicesRes.ok) {
        if (casesRes.status === 401) {
          console.log('Authentication failed - token may be invalid');
          // Clear invalid token
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
        }
        setLoading(false);
        return;
      }

      const recentActivities: Activity[] = [];

      // Add recent cases (last 5)
      cases.slice(0, 5).forEach((c: any) => {
        recentActivities.push({
          id: `case-${c.id}`,
          type: "case",
          icon: FileText,
          title: "New case opened",
          description: `${c.title} - ${c.type}`,
          time: formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }),
          color: "text-blue-500",
          createdAt: new Date(c.createdAt)
        });
      });

      // Add recent contacts (last 5)
      contacts.slice(0, 5).forEach((contact: any) => {
        recentActivities.push({
          id: `contact-${contact.id}`,
          type: "contact",
          icon: Users,
          title: "New contact added",
          description: `${contact.name}${contact.organization ? ` - ${contact.organization}` : ''}`,
          time: formatDistanceToNow(new Date(contact.createdAt), { addSuffix: true }),
          color: "text-purple-500",
          createdAt: new Date(contact.createdAt)
        });
      });

      // Add recent time entries (last 5)
      timeEntries.slice(0, 5).forEach((entry: any) => {
        const hours = (entry.durationMinutesBilled || 0) / 60;
        recentActivities.push({
          id: `time-${entry.id}`,
          type: "time",
          icon: Clock,
          title: "Time entry added",
          description: `${hours.toFixed(1)} hours - ${entry.description || 'No description'}`,
          time: formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true }),
          color: "text-green-500",
          createdAt: new Date(entry.createdAt)
        });
      });

      // Add recent invoices (last 5)
      invoices.slice(0, 5).forEach((invoice: any) => {
        recentActivities.push({
          id: `invoice-${invoice.id}`,
          type: "invoice",
          icon: DollarSign,
          title: "Invoice created",
          description: `${invoice.invoiceNumber} - $${(invoice.amount || 0).toFixed(2)}`,
          time: formatDistanceToNow(new Date(invoice.createdAt), { addSuffix: true }),
          color: "text-orange-500",
          createdAt: new Date(invoice.createdAt)
        });
      });

      // Sort by most recent and take top 8
      recentActivities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setActivities(recentActivities.slice(0, 8));
    } catch (error) {
      console.error('Error loading recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start gap-4">
                <div className={`p-2 rounded-lg bg-muted ${activity.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {activity.time}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}