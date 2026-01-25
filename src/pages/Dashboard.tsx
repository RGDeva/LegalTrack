import { useState, useEffect } from "react";
import { Briefcase, Users, Clock, DollarSign, FileText, Calendar, Timer } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { CaseList } from "@/components/cases/CaseList";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api-url";

interface DashboardStats {
  activeCases: number;
  totalClients: number;
  monthlyBillableHours: number;
  amountReadyToInvoice: number;
  pendingInvoicesAmount: number;
  activeTimers: number;
}

interface Deadline {
  id: string;
  title: string;
  description: string;
  date: Date;
  type: 'hearing' | 'task' | 'deadline';
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeCases: 0,
    totalClients: 0,
    monthlyBillableHours: 0,
    amountReadyToInvoice: 0,
    pendingInvoicesAmount: 0,
    activeTimers: 0
  });
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch all data in parallel
      const [casesRes, contactsRes, timeEntriesRes, invoicesRes] = await Promise.all([
        fetch(`${API_URL}/cases`, { headers }),
        fetch(`${API_URL}/contacts`, { headers }),
        fetch(`${API_URL}/time-entries`, { headers }),
        fetch(`${API_URL}/invoices`, { headers })
      ]);

      const cases = casesRes.ok ? await casesRes.json() : [];
      const contacts = contactsRes.ok ? await contactsRes.json() : [];
      const timeEntries = timeEntriesRes.ok ? await timeEntriesRes.json() : [];
      const invoices = invoicesRes.ok ? await invoicesRes.json() : [];

      // Calculate active cases (status is Active or In Progress)
      const activeCases = cases.filter((c: any) => 
        c.status === 'Active' || c.status === 'In Progress' || c.status === 'Open'
      ).length;

      // Total clients (contacts that are clients)
      const totalClients = contacts.filter((c: any) => 
        c.type === 'Client' || c.type === 'client'
      ).length || contacts.length;

      // Calculate billable hours for current month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyBillableHours = timeEntries
        .filter((entry: any) => {
          if (!entry.createdAt) return false;
          const entryDate = new Date(entry.createdAt);
          return entryDate.getMonth() === currentMonth && 
                 entryDate.getFullYear() === currentYear &&
                 entry.durationMinutesBilled > 0;
        })
        .reduce((total: number, entry: any) => {
          const minutes = entry.durationMinutesBilled || 0;
          return total + (minutes / 60);
        }, 0);

      // Calculate amount ready to invoice (unbilled time entries with billed minutes)
      const amountReadyToInvoice = timeEntries
        .filter((entry: any) => 
          !entry.invoiceId && 
          entry.durationMinutesBilled > 0 &&
          entry.amountCents > 0
        )
        .reduce((total: number, entry: any) => {
          const amountDollars = (entry.amountCents || 0) / 100;
          return total + amountDollars;
        }, 0);

      // Calculate pending invoices (unpaid)
      const pendingInvoicesAmount = invoices
        .filter((inv: any) => inv.status === 'Pending' || inv.status === 'Sent' || inv.status === 'Overdue')
        .reduce((total: number, inv: any) => total + (inv.amount || inv.total || 0), 0);

      // Count active timers (entries with startedAt but no endedAt)
      const activeTimers = timeEntries.filter((entry: any) => 
        entry.startedAt && !entry.endedAt
      ).length;

      setStats({
        activeCases,
        totalClients,
        monthlyBillableHours,
        amountReadyToInvoice,
        pendingInvoicesAmount,
        activeTimers
      });

      // Extract upcoming deadlines from cases with nextHearing dates
      const upcomingDeadlines: Deadline[] = [];
      const nowDate = new Date();
      
      cases.forEach((c: any) => {
        if (c.nextHearing) {
          const hearingDate = new Date(c.nextHearing);
          if (hearingDate.getTime() >= nowDate.getTime()) {
            upcomingDeadlines.push({
              id: `hearing-${c.id}`,
              title: 'Court Hearing',
              description: `${c.title}`,
              date: hearingDate,
              type: 'hearing'
            });
          }
        }
      });

      // Also fetch tasks for deadlines
      try {
        const tasksRes = await fetch(`${API_URL}/tasks`, { headers });
        if (tasksRes.ok) {
          const tasks = await tasksRes.json();
          tasks.forEach((task: any) => {
            if (task.dueDate && task.status !== 'completed') {
              const dueDate = new Date(task.dueDate);
              if (dueDate.getTime() >= nowDate.getTime()) {
                upcomingDeadlines.push({
                  id: `task-${task.id}`,
                  title: task.title || 'Task Due',
                  description: task.description || task.caseName || '',
                  date: dueDate,
                  type: 'task'
                });
              }
            }
          });
        }
      } catch (e) {
        console.log('Tasks fetch optional:', e);
      }

      // Sort by date and take first 5
      upcomingDeadlines.sort((a, b) => a.date.getTime() - b.date.getTime());
      setDeadlines(upcomingDeadlines.slice(0, 5));

    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to LegalTrack Pro</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Cases"
          value={loading ? "..." : stats.activeCases}
          subtitle={stats.activeCases > 0 ? `${stats.activeCases} case${stats.activeCases > 1 ? 's' : ''} in progress` : "No active cases"}
          icon={Briefcase}
        />
        <StatCard
          title="Billable Hours (Month)"
          value={loading ? "..." : stats.monthlyBillableHours.toFixed(1)}
          subtitle="Current month"
          icon={Clock}
        />
        <StatCard
          title="Ready to Invoice"
          value={loading ? "..." : `$${stats.amountReadyToInvoice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Unbilled time"
          icon={DollarSign}
        />
        {user?.role === 'Admin' && (
          <StatCard
            title="Active Timers"
            value={loading ? "..." : stats.activeTimers}
            subtitle="Last 24 hours"
            icon={Timer}
          />
        )}
        {user?.role !== 'Admin' && (
          <StatCard
            title="Pending Invoices"
            value={loading ? "..." : `$${stats.pendingInvoicesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle={stats.pendingInvoicesAmount > 0 ? "Awaiting payment" : "All invoices paid"}
            icon={DollarSign}
          />
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Active Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <CaseList />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <RecentActivity />
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Deadlines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {loading ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : deadlines.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                    ) : (
                      deadlines.map((deadline) => (
                        <div key={deadline.id} className="flex items-start gap-3">
                          <Calendar className={`h-5 w-5 mt-0.5 ${
                            deadline.type === 'hearing' ? 'text-destructive' : 
                            deadline.type === 'task' ? 'text-warning' : 'text-info'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{deadline.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {deadline.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {deadline.description}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;