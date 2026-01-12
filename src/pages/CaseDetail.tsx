import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, DollarSign, User, Phone, Mail, MapPin, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Runsheet from "@/components/cases/Runsheet";
import Timesheet from "@/components/cases/Timesheet";
import ContactSelector from "@/components/cases/ContactSelector";
import Documents from "@/components/cases/Documents";
import Team from "@/components/cases/Team";
import { CaseTimer } from "@/components/cases/CaseTimer";
import { TimeEntriesRunsheet } from "@/components/time/TimeEntriesRunsheet";
import { ManualTimeEntryDialog } from "@/components/time/ManualTimeEntryDialog";
import { Contact, TimeEntry, Case } from "@/types";
import { API_URL } from "@/lib/api-url";
import { toast } from "sonner";

const CaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>(undefined);
  const caseEvents: any[] = [];
  const unbilledTime: any[] = [];

  // Fetch case data from API
  useEffect(() => {
    const fetchCase = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_URL}/cases`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const cases = await res.json();
        const foundCase = cases.find((c: Case) => c.id === id);
        if (foundCase) {
          setCaseData(foundCase);
        }
      } catch (error) {
        console.error('Error fetching case:', error);
        toast.error('Failed to load case');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchCase();
    }
  }, [id]);
  
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleTimeEntryCreated = (entry: TimeEntry) => {
    // Refresh the runsheet when a new entry is created
    console.log('New time entry created:', entry);
    setRefreshKey(prev => prev + 1);
  };
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Loading case...</h2>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Case not found</h2>
          <Button onClick={() => navigate('/cases')} className="mt-4">
            Back to Cases
          </Button>
        </div>
      </div>
    );
  }

  const unbilledAmount = unbilledTime.reduce((total, entry) => total + entry.amount, 0);
  const retainerAmount = caseData.billingType === 'flat-fee' ? (caseData.flatFee || 0) : 0;
  const remainingRetainer = retainerAmount > 0 ? retainerAmount - caseData.totalBilled : 0;

  const getStatusBadge = (status: typeof caseData.status) => {
    const variants = {
      active: "bg-success text-success-foreground",
      pending: "bg-warning text-warning-foreground",
      closed: "bg-muted text-muted-foreground",
      'on-hold': "bg-info text-info-foreground",
    };
    return <Badge className={variants[status]}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: typeof caseData.priority) => {
    const variants = {
      low: "bg-muted text-muted-foreground",
      medium: "bg-info text-info-foreground",
      high: "bg-warning text-warning-foreground",
      urgent: "bg-destructive text-destructive-foreground",
    };
    return <Badge className={variants[priority]}>{priority}</Badge>;
  };

  // Mock outstanding tasks - in real app, this would come from database
  const outstandingTasks = [
    { id: '1', title: 'Review discovery documents', dueDate: '2024-02-15', priority: 'high' },
    { id: '2', title: 'Prepare witness list', dueDate: '2024-02-18', priority: 'medium' },
    { id: '3', title: 'File motion for summary judgment', dueDate: '2024-02-22', priority: 'urgent' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/cases')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{caseData.title}</h1>
                {getStatusBadge(caseData.status)}
                {getPriorityBadge(caseData.priority)}
              </div>
              <p className="text-muted-foreground">Case #{caseData.caseNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CaseTimer 
              caseId={id || ''} 
              caseNumber={caseData.caseNumber}
              onTimeEntryCreated={handleTimeEntryCreated}
            />
            <Button variant="gradient">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

      {/* Tabs */}
      <Tabs defaultValue="home" className="space-y-6">
        <TabsList className="grid w-full max-w-[900px] grid-cols-5">
          <TabsTrigger value="home">Home</TabsTrigger>
          <TabsTrigger value="runsheet">Runsheet</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
        </TabsList>

        {/* Home Tab */}
        <TabsContent value="home" className="space-y-6">
          {/* Case Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Case Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p>{caseData.description}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{caseData.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date Opened</p>
                  <p className="font-medium">{caseData.dateOpened}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assigned To</p>
                  <p className="font-medium">{caseData.assignedTo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Billing Type</p>
                  <p className="font-medium capitalize">{caseData.billingType}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Financial Summary */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Billed Amount</span>
                    <span className="font-semibold text-lg">${caseData.totalBilled.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Amount Paid</span>
                    <span className="font-semibold text-lg text-success">${caseData.totalPaid.toLocaleString()}</span>
                  </div>
                  <Separator />
                  {caseData.billingType === 'flat-fee' && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Flat Fee</span>
                        <span className="font-semibold">${caseData.flatFee?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Remaining Retainer</span>
                        <span className="font-semibold text-info">${remainingRetainer.toLocaleString()}</span>
                      </div>
                      <Separator />
                    </>
                  )}
                  {caseData.billingType === 'hourly' && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Hourly Rate</span>
                        <span className="font-semibold">${caseData.hourlyRate}/hr</span>
                      </div>
                      <Separator />
                    </>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Unbilled Amount</span>
                    <span className="font-semibold text-warning">${unbilledAmount.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Outstanding Balance</span>
                    <span className="font-bold text-lg text-destructive">
                      ${(caseData.totalBilled - caseData.totalPaid).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client Information
                </CardTitle>
                <CardDescription>Primary contact for this case</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ContactSelector 
                    selectedContact={selectedContact}
                    onContactSelect={(contact) => {
                      setSelectedContact(contact);
                      // In a real app, you would update the case with the new contact ID here
                    }}
                    onContactAdd={(contact) => {
                      // In a real app, you would save the new contact to the database here
                      console.log('New contact added:', contact);
                    }}
                  />
                  
                  {selectedContact && (
                    <div className="space-y-4 mt-4 pt-4 border-t">
                      <div>
                        <h3 className="font-semibold text-lg">{selectedContact.name}</h3>
                        {selectedContact.title && <p className="text-sm text-muted-foreground">{selectedContact.title}</p>}
                        {selectedContact.organization && <p className="text-muted-foreground">{selectedContact.organization}</p>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${selectedContact.email}`} className="text-primary hover:underline">
                            {selectedContact.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${selectedContact.phone}`} className="text-primary hover:underline">
                            {selectedContact.phone}
                          </a>
                        </div>
                        {selectedContact.mobile && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${selectedContact.mobile}`} className="text-primary hover:underline">
                              {selectedContact.mobile} (Mobile)
                            </a>
                          </div>
                        )}
                        {selectedContact.address && (
                          <div className="flex items-center gap-2 md:col-span-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {selectedContact.address}
                            </span>
                          </div>
                        )}
                      </div>
                      {selectedContact.notes && (
                        <div className="pt-2">
                          <p className="text-sm text-muted-foreground">Notes</p>
                          <p className="text-sm mt-1">{selectedContact.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Events
                </CardTitle>
                <CardDescription>Scheduled hearings, meetings, and deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {caseEvents.length > 0 ? (
                    caseEvents.map(event => (
                      <div key={event.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                        <div className="space-y-1">
                          <p className="font-medium">{event.title}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{event.date}</span>
                            <span>{event.time}</span>
                            {event.location && <span>{event.location}</span>}
                          </div>
                        </div>
                        <Badge variant="outline">{event.type}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No upcoming events</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Outstanding Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Outstanding Tasks
                </CardTitle>
                <CardDescription>Tasks that need to be completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {outstandingTasks.map(task => (
                    <div key={task.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                      <div className="space-y-1">
                        <p className="font-medium">{task.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Due: {task.dueDate}</span>
                        </div>
                      </div>
                      <Badge 
                        variant="outline"
                        className={
                          task.priority === 'urgent' ? 'border-destructive text-destructive' :
                          task.priority === 'high' ? 'border-warning text-warning' :
                          'border-muted-foreground'
                        }
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time Tracking Section */}
          <div className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Time Tracking</h2>
              <ManualTimeEntryDialog 
                matterId={id || ''} 
                onEntrySaved={() => setRefreshKey(prev => prev + 1)}
              />
            </div>
            
            <CaseTimer 
              caseId={id || ''} 
              caseNumber={caseData.caseNumber}
              onTimeEntryCreated={handleTimeEntryCreated}
            />
            
            <TimeEntriesRunsheet 
              key={refreshKey}
              matterId={id || ''}
              onEntryUpdated={() => setRefreshKey(prev => prev + 1)}
            />
          </div>
        </TabsContent>

        {/* Runsheet Tab */}
        <TabsContent value="runsheet">
          <Runsheet caseId={id || ''} />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Documents caseId={id || ''} />
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <Team caseId={id || ''} />
        </TabsContent>

        {/* Timesheet Tab */}
        <TabsContent value="timesheet">
          <Timesheet caseId={id || ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CaseDetail;