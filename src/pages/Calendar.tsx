import { CalendarView } from "@/components/dashboard/CalendarView";

const Calendar = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendar & Deadlines</h1>
        <p className="text-muted-foreground">Manage deadlines and view your calendar</p>
      </div>
      
      <CalendarView />
    </div>
  );
};

export default Calendar;
