import { CalendarView } from "@/components/dashboard/CalendarView";
import { MonthlyCalendar } from "@/components/calendar/MonthlyCalendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Globe } from "lucide-react";

const Calendar = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendar & Deadlines</h1>
        <p className="text-muted-foreground">Manage events, deadlines, and hearings</p>
      </div>

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="google">
            <Globe className="h-4 w-4 mr-2" />
            Google Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <MonthlyCalendar />
        </TabsContent>

        <TabsContent value="google">
          <CalendarView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Calendar;
