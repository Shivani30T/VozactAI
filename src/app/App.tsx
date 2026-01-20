import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { UserManagement } from './components/UserManagement';
import { BuyCredits } from './components/BuyCredits';
import { Collections } from './components/Collections';
import { Reports } from './components/Reports';
import { UploadContacts } from './components/UploadContacts';
import { CallRecordings } from './components/CallRecordings';
import { CampaignsManagement } from './components/CampaignsManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { LayoutDashboard, Upload, Headphones, Users as UsersIcon, CreditCard, IndianRupee, FileText, FolderKanban, Loader2 } from 'lucide-react';
import { calculateCallStats, mockPaymentCollections } from './data/mockData';
import { Campaign, CallRecord, Contact } from './types';
import { api, CampaignSchema, ContactSchema, RecordingSchema, ReportSummary } from './services/api';

function AppContent() {
  const { user, isAuthenticated, isLoading: authLoading, updateUserCredits, refreshProfile } = useAuth();
  
  // State for API data
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [recordings, setRecordings] = useState<RecordingSchema[]>([]);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [callRecords, setCallRecords] = useState<CallRecord[]>([]);
  const [paymentCollections] = useState(mockPaymentCollections);
  
  // Loading states
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingRecordings, setLoadingRecordings] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);

  // Convert API CampaignSchema to local Campaign type
  const mapCampaign = (c: CampaignSchema): Campaign => ({
    id: c.id,
    name: c.name,
    category: c.category,
    status: c.status,
    created_at: c.created_at,
    total_contacts: c.total_contacts,
    completed: c.completed,
    in_progress: c.in_progress,
    createdAt: c.created_at,
    totalContacts: c.total_contacts,
    callsMade: c.completed,
  });

  // Convert API ContactSchema to local Contact type
  const mapContact = (c: ContactSchema): Contact => ({
    id: c.id,
    campaign_id: c.campaign_id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    status: c.status,
    verification_status: c.verification_status,
    category: c.category,
    notes: c.notes,
    age: c.age,
    lender_name: c.lender_name,
    date_of_disbursement: c.date_of_disbursement,
    loan_amount: c.loan_amount,
    spouse_or_son_name: c.spouse_or_son_name,
    language: c.language,
    disbursed_by_agent: c.disbursed_by_agent,
    branch: c.branch,
    village: c.village,
    district: c.district,
    state: c.state,
    phoneNumber: c.phone,
    campaignId: c.campaign_id,
  });

  // Convert contacts and recordings to CallRecord format for legacy components
  const buildCallRecords = useCallback((contactList: Contact[], recordingList: RecordingSchema[]): CallRecord[] => {
    const recordingMap = new Map<string, RecordingSchema>();
    recordingList.forEach(r => recordingMap.set(r.contact_id, r));

    return contactList.map(contact => {
      const recording = recordingMap.get(contact.id);
      return {
        id: contact.id,
        contactName: contact.name,
        phoneNumber: contact.phone || contact.phoneNumber || '',
        callDate: recording?.created_at || new Date().toISOString(),
        duration: recording?.duration_seconds || 0,
        status: mapContactStatusToCallStatus(contact.status),
        category: (contact.category as any) || 'Others',
        recordingUrl: recording?.url,
        notes: contact.notes,
        userId: 'current-user',
        campaignId: contact.campaign_id || contact.campaignId,
        state: contact.state,
        contact_id: contact.id,
        recording_id: recording?.id,
      };
    });
  }, []);

  // Map contact status to CallStatus
  const mapContactStatusToCallStatus = (status: string): any => {
    const statusMap: Record<string, string> = {
      'completed': 'Answered by Customer',
      'failed': 'Not Reachable',
      'pending': 'RNR',
      'queued': 'RNR',
      'in_progress': 'RNR',
    };
    return statusMap[status] || 'RNR';
  };

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingCampaigns(true);
    try {
      const response = await api.campaigns.list(100, 0);
      setCampaigns(response.campaigns.map(mapCampaign));
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  }, [isAuthenticated]);

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingContacts(true);
    try {
      const response = await api.contacts.list({ limit: 200 });
      const mappedContacts = response.items.map(mapContact);
      setContacts(mappedContacts);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    } finally {
      setLoadingContacts(false);
    }
  }, [isAuthenticated]);

  // Fetch recordings
  const fetchRecordings = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingRecordings(true);
    try {
      const response = await api.recordings.list({ limit: 200 });
      setRecordings(response.items);
    } catch (err) {
      console.error('Failed to fetch recordings:', err);
    } finally {
      setLoadingRecordings(false);
    }
  }, [isAuthenticated]);

  // Fetch report summary
  const fetchReportSummary = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingReports(true);
    try {
      const summary = await api.reports.getSummary();
      setReportSummary(summary);
    } catch (err) {
      console.error('Failed to fetch report summary:', err);
    } finally {
      setLoadingReports(false);
    }
  }, [isAuthenticated]);

  // Fetch all data on authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchCampaigns();
      fetchContacts();
      fetchRecordings();
      fetchReportSummary();
    }
  }, [isAuthenticated, fetchCampaigns, fetchContacts, fetchRecordings, fetchReportSummary]);

  // Build call records when contacts or recordings change
  useEffect(() => {
    const records = buildCallRecords(contacts, recordings);
    setCallRecords(records);
  }, [contacts, recordings, buildCallRecords]);

  // Calculate statistics from call records
  const stats = calculateCallStats(callRecords);

  // Handle campaign created from upload
  const handleCampaignCreated = (newCampaign: Campaign) => {
    setCampaigns([newCampaign, ...campaigns]);
  };

  // Handle data refresh after upload
  const handleUploadSuccess = () => {
    fetchCampaigns();
    fetchContacts();
    refreshProfile();
  };

  const handleCreditsPurchased = (amount: number) => {
    updateUserCredits(amount);
  };

  // Show loading screen during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-blue-100">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginScreen />;
  }

  const isLoading = loadingCampaigns || loadingContacts || loadingRecordings || loadingReports;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === 'admin' ? (
          // Admin view - Organization-wide dashboard + User Management
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-7 max-w-6xl bg-blue-100 border border-blue-200">
              <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
                <FolderKanban className="h-4 w-4" />
                Campaigns
              </TabsTrigger>
              <TabsTrigger value="collections" className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
                <IndianRupee className="h-4 w-4" />
                Collections
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
                <UsersIcon className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="credits" className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
                <CreditCard className="h-4 w-4" />
                Buy Credits
              </TabsTrigger>
              <TabsTrigger value="recordings" className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
                <Headphones className="h-4 w-4" />
                Recordings
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
                <FileText className="h-4 w-4" />
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-6">
              <AdminDashboard 
                stats={stats} 
                organizationName="Vozact.AI Organization" 
                calls={callRecords} 
                campaigns={campaigns}
                payments={paymentCollections}
                reportSummary={reportSummary}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="campaigns" className="mt-6">
              <CampaignsManagement 
                campaigns={campaigns}
                onRefresh={fetchCampaigns}
              />
            </TabsContent>

            <TabsContent value="collections" className="mt-6">
              <Collections payments={paymentCollections} />
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <UserManagement organizationName="Vozact.AI Organization" />
            </TabsContent>

            <TabsContent value="credits" className="mt-6">
              <BuyCredits currentUser={user} onCreditsPurchased={handleCreditsPurchased} />
            </TabsContent>

            <TabsContent value="recordings" className="mt-6">
              <CallRecordings 
                calls={callRecords} 
                recordings={recordings}
                onRefresh={fetchRecordings}
              />
            </TabsContent>

            <TabsContent value="reports" className="mt-6">
              <Reports 
                calls={callRecords} 
                campaigns={campaigns}
                reportSummary={reportSummary}
              />
            </TabsContent>
          </Tabs>
        ) : (
          // User view - Individual work access
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-6 max-w-5xl bg-blue-100 border border-blue-200">
              <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
                <FolderKanban className="h-4 w-4" />
                Campaigns
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
                <Upload className="h-4 w-4" />
                Upload List
              </TabsTrigger>
              <TabsTrigger value="collections" className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
                <IndianRupee className="h-4 w-4" />
                Collections
              </TabsTrigger>
              <TabsTrigger value="recordings" className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
                <Headphones className="h-4 w-4" />
                Recordings
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
                <FileText className="h-4 w-4" />
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-6">
              <Dashboard 
                stats={stats} 
                calls={callRecords} 
                campaigns={campaigns} 
                payments={paymentCollections}
                reportSummary={reportSummary}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="campaigns" className="mt-6">
              <CampaignsManagement 
                campaigns={campaigns}
                onRefresh={fetchCampaigns}
              />
            </TabsContent>

            <TabsContent value="upload" className="mt-6">
              <UploadContacts 
                campaigns={campaigns} 
                onCampaignCreated={handleCampaignCreated}
                onUploadSuccess={handleUploadSuccess}
              />
            </TabsContent>

            <TabsContent value="collections" className="mt-6">
              <Collections payments={paymentCollections} />
            </TabsContent>

            <TabsContent value="recordings" className="mt-6">
              <CallRecordings 
                calls={callRecords}
                recordings={recordings}
                onRefresh={fetchRecordings}
              />
            </TabsContent>

            <TabsContent value="reports" className="mt-6">
              <Reports 
                calls={callRecords} 
                campaigns={campaigns}
                reportSummary={reportSummary}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;