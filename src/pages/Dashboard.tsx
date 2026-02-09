import { useState, useEffect } from "react";
import { Briefcase, Users, Clock, DollarSign, FileText, Calendar, Timer, AlertTriangle, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { CaseList } from "@/components/cases/CaseList";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api-url";

interface DashboardStats {
  activeCases: number;
  totalCases: number;
  totalContacts: number;
  monthlyBillableHours: number;
  monthlyRevenue: number;
  amountReadyToInvoice: number;
  unbilledEntriesCount: number;
  pendingInvoicesAmount: number;
  pendingInvoicesCount: number;
  activeTimers: number;
  overdueTasks: number;
}

interface Deadline {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'hearing' | 'task' | 'deadline';
  priority?: string;
  assignedTo?: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeCases: 0,
    totalCases: 0,
    totalContacts: 0,
    monthlyBillableHours: 0,
    monthlyRevenue: 0,
    amountReadyToInvoice: 0,
    unbilledEntriesCount: 0,
    pendingInvoicesAmount: 0,
    pendingInvoicesCount: 0,
    activeTimers: 0,
    overdueTasks: 0
  });
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };

      const [statsRes, deadlinesRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/stats`, { headers }),
        fetch(`${API_URL}/dashboard/deadlines`, { headers })
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (deadlinesRes.ok) {
        const data = await deadlinesRes.json();
        setDeadlines(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
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
          subtitle={`${stats.totalCases} total cases`}
          icon={Briefcase}
        />
        <StatCard
          title="Billable Hours (Month)"
          value={loading ? "..." : stats.monthlyBillableHours.toFixed(1)}
          subtitle={`$${stats.monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} revenue`}
          icon={Clock}
        />
        <StatCard
          title="Ready to Invoice"
          value={loading ? "..." : `$${stats.amountReadyToInvoice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${stats.unbilledEntriesCount} unbilled entries`}
          icon={DollarSign}
        />
        <StatCard
          title="Pending Invoices"
          value={loading ? "..." : `$${stats.pendingInvoicesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={stats.pendingInvoicesCount > 0 ? `${stats.pendingInvoicesCount} awaiting payment` : "All invoices paid"}
          icon={FileText}
        />
      </div>

      {(stats.overdueTasks > 0 || stats.activeTimers > 0) && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.overdueTasks > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium">{stats.overdueTasks} Overdue Task{stats.overdueTasks > 1 ? 's' : ''}</p>
                  <p className="text-xs text-muted-foreground">Requires attention</p>
                </div>
              </CardContent>
            </Card>
          )}
          {stats.activeTimers > 0 && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Timer className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{stats.activeTimers} Active Timer{stats.activeTimers > 1 ? 's' : ''}</p>
                  <p className="text-xs text-muted-foreground">Currently running</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
                              {new Date(deadline.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {deadline.description}
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