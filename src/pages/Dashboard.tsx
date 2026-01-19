import { useState } from "react";
import { Briefcase, Users, Clock, DollarSign, FileText, Calendar, Timer } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { CaseList } from "@/components/cases/CaseList";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { TimeEntry } from "@/types";
import { calculateEffectiveRate } from "@/lib/time-utils";

const Dashboard = () => {
  const { user } = useAuth();
  const activeCases = 0; // Will be loaded from API
  const totalClients = 0; // Will be loaded from API
  const unbilledHours = 0; // Will be calculated from time entries
  const pendingInvoices = 0; // Will be loaded from API

  // New metrics for time tracking
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Get time entries from localStorage
  const timeEntriesJson = localStorage.getItem('timeEntries') || '[]';
  const allTimeEntries: TimeEntry[] = JSON.parse(timeEntriesJson);
  
  // Calculate billable hours for current month
  const monthlyBillableHours = allTimeEntries
    .filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    })
    .reduce((total, entry) => total + (entry.billableMinutes / 60), 0);
  
  // Calculate amount ready to invoice (unbilled time)
  const amountReadyToInvoice = 0; // Will be calculated when we have user and billing code data
  
  // Count active timers (timers running in last 24 hours)
  const activeTimers = allTimeEntries.filter(entry => {
    const entryTime = new Date(entry.createdAt).getTime();
    const now = Date.now();
    return (now - entryTime) < 24 * 60 * 60 * 1000; // Last 24 hours
  }).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to LegalTrack Pro</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Cases"
          value={activeCases}
          subtitle={activeCases > 0 ? "Loading details..." : "No active cases"}
          icon={Briefcase}
        />
        <StatCard
          title="Billable Hours (Month)"
          value={monthlyBillableHours.toFixed(1)}
          subtitle="Current month"
          icon={Clock}
        />
        <StatCard
          title="Ready to Invoice"
          value={`$${amountReadyToInvoice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Unbilled time"
          icon={DollarSign}
        />
        {user?.role === 'Admin' && (
          <StatCard
            title="Active Timers"
            value={activeTimers}
            subtitle="Last 24 hours"
            icon={Timer}
          />
        )}
        {user?.role !== 'Admin' && (
          <StatCard
            title="Pending Invoices"
            value={`$${pendingInvoices.toLocaleString()}`}
            subtitle={pendingInvoices > 0 ? "Loading details..." : "No pending invoices"}
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
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-warning mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Discovery Deadline</p>
                        <p className="text-xs text-muted-foreground">Feb 25 - Johnson v. Smith</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-info mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Client Meeting</p>
                        <p className="text-xs text-muted-foreground">Feb 15 - Margaret Green</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-destructive mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Court Hearing</p>
                        <p className="text-xs text-muted-foreground">Feb 20 - Johnson v. Smith</p>
                      </div>
                    </div>
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