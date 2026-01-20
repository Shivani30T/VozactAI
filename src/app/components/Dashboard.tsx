import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Phone, 
  PhoneOff, 
  PhoneMissed, 
  PhoneForwarded,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Tag,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  XCircle,
  DollarSign,
  Share2,
  Target,
  TrendingDown,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { CallStats, CallRecord, Campaign, Category, PaymentCollection, ReportSummary } from '../types';
import { categoryOptions } from '../data/mockData';
import { ComparisonCharts } from './ComparisonCharts';

interface DashboardProps {
  stats: CallStats;
  calls?: CallRecord[];
  campaigns?: Campaign[];
  payments?: PaymentCollection[];
  // New API-based props
  reportSummary?: ReportSummary | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function Dashboard({ stats, calls = [], campaigns = [], payments = [], reportSummary, isLoading = false, onRefresh }: DashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all');

  // Filter calls based on category, campaign and time range
  const filteredCalls = useMemo(() => {
    let filtered = [...calls];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(call => call.category === selectedCategory);
    }

    // Filter by campaign
    if (selectedCampaign !== 'all') {
      filtered = filtered.filter(call => call.campaignId === selectedCampaign);
    }

    // Filter by time range
    if (selectedTimeRange !== 'all') {
      const now = Date.now();
      const timeRanges: Record<string, number> = {
        '1day': 24 * 60 * 60 * 1000,
        '7days': 7 * 24 * 60 * 60 * 1000,
        '15days': 15 * 24 * 60 * 60 * 1000,
        '30days': 30 * 24 * 60 * 60 * 1000,
      };

      const cutoff = now - timeRanges[selectedTimeRange];
      filtered = filtered.filter(call => new Date(call.callDate).getTime() >= cutoff);
    }

    return filtered;
  }, [calls, selectedCategory, selectedCampaign, selectedTimeRange]);

  // Recalculate stats based on filtered calls
  const filteredStats = useMemo(() => {
    return {
      totalCalls: filteredCalls.length,
      rnr: filteredCalls.filter(c => c.status === 'RNR').length,
      notReachable: filteredCalls.filter(c => c.status === 'Not Reachable').length,
      wrongNumber: filteredCalls.filter(c => c.status === 'Wrong Number').length,
      answeredByFamily: filteredCalls.filter(c => c.status === 'Answered by Family').length,
      answeredByCustomer: filteredCalls.filter(c => c.status === 'Answered by Customer').length,
      answeredByOthers: filteredCalls.filter(c => c.status === 'Answered by Others').length,
      promisedToPay: filteredCalls.filter(c => c.responseTag === 'Promised to Pay').length,
      requestedTime: filteredCalls.filter(c => c.responseTag === 'Requested Time').length,
      deniedToPay: filteredCalls.filter(c => c.responseTag === 'Denied to Pay').length,
      askedToCallBack: filteredCalls.filter(c => c.responseTag === 'Asked to call back').length,
      othersTag: filteredCalls.filter(c => c.responseTag === 'Others').length,
      // Disbursement Verification specific stats
      dvConfirmed: filteredCalls.filter(c => c.category === 'Disbursement Verification' && c.disbursementData?.response === 'Confirmed').length,
      dvDenied: filteredCalls.filter(c => c.category === 'Disbursement Verification' && c.disbursementData?.response === 'Denied').length,
      dvWithCommission: filteredCalls.filter(c => c.category === 'Disbursement Verification' && c.disbursementData?.commission === true).length,
      dvWithoutCommission: filteredCalls.filter(c => c.category === 'Disbursement Verification' && c.disbursementData?.commission === false).length,
      dvLoanSharing: filteredCalls.filter(c => c.category === 'Disbursement Verification' && c.disbursementData?.loanSharing === true).length,
      dvNoLoanSharing: filteredCalls.filter(c => c.category === 'Disbursement Verification' && c.disbursementData?.loanSharing === false).length,
    };
  }, [filteredCalls]);

  // KPI Card - Dynamic based on category
  const kpiRate = selectedCategory === 'Disbursement Verification'
    ? (filteredStats.dvConfirmed + filteredStats.dvDenied) > 0
      ? ((filteredStats.dvConfirmed / (filteredStats.dvConfirmed + filteredStats.dvDenied)) * 100).toFixed(1)
      : '0.0'
    : filteredStats.totalCalls > 0
      ? ((filteredStats.answeredByCustomer / filteredStats.totalCalls) * 100).toFixed(1)
      : '0.0';

  const kpiTitle = selectedCategory === 'Disbursement Verification' 
    ? 'Confirmation Rate' 
    : 'Success Rate';
  
  const kpiDescription = selectedCategory === 'Disbursement Verification'
    ? 'Percentage of verifications confirmed'
    : 'Percentage of calls answered by customer';

  const kpiDetails = selectedCategory === 'Disbursement Verification'
    ? `${filteredStats.dvConfirmed} out of ${filteredStats.dvConfirmed + filteredStats.dvDenied} verifications`
    : `${filteredStats.answeredByCustomer} out of ${filteredStats.totalCalls} calls`;

  // Stat Cards - Dynamic based on category
  const statCards = selectedCategory === 'Disbursement Verification'
    ? [
        { title: 'Confirmed', value: filteredStats.dvConfirmed, icon: CheckCircle, bgColor: 'bg-green-50', textColor: 'text-green-700' },
        { title: 'Denied', value: filteredStats.dvDenied, icon: XCircle, bgColor: 'bg-red-50', textColor: 'text-red-700' },
        { title: 'With Commission', value: filteredStats.dvWithCommission, icon: DollarSign, bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
        { title: 'Without Commission', value: filteredStats.dvWithoutCommission, icon: Target, bgColor: 'bg-gray-50', textColor: 'text-gray-700' },
        { title: 'Loan Sharing: Yes', value: filteredStats.dvLoanSharing, icon: Share2, bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
        { title: 'Loan Sharing: No', value: filteredStats.dvNoLoanSharing, icon: UserX, bgColor: 'bg-gray-50', textColor: 'text-gray-600' },
      ]
    : [
        { title: 'Ring No Response', value: filteredStats.rnr, icon: PhoneMissed, bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
        { title: 'Not Reachable', value: filteredStats.notReachable, icon: PhoneOff, bgColor: 'bg-red-50', textColor: 'text-red-700' },
        { title: 'Wrong Number', value: filteredStats.wrongNumber, icon: PhoneForwarded, bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
        { title: 'Answered by Family', value: filteredStats.answeredByFamily, icon: Users, bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
        { title: 'Answered by Customer', value: filteredStats.answeredByCustomer, icon: UserCheck, bgColor: 'bg-green-50', textColor: 'text-green-700' },
        { title: 'Answered by Others', value: filteredStats.answeredByOthers, icon: UserX, bgColor: 'bg-indigo-50', textColor: 'text-indigo-700' },
      ];

  const responseTagStats = [
    { label: 'Promised to Pay', value: filteredStats.promisedToPay || 0, color: 'bg-emerald-500' },
    { label: 'Requested Time', value: filteredStats.requestedTime || 0, color: 'bg-blue-500' },
    { label: 'Denied to Pay', value: filteredStats.deniedToPay || 0, color: 'bg-red-500' },
    { label: 'Asked to call back', value: filteredStats.askedToCallBack || 0, color: 'bg-amber-500' },
    { label: 'Others', value: filteredStats.othersTag || 0, color: 'bg-gray-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl text-blue-900 mb-1">Dashboard</h2>
          <p className="text-blue-700">Overview of your calling campaign performance</p>
        </div>
        {onRefresh && (
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
            className="border-blue-300 text-blue-900 hover:bg-blue-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        )}
      </div>

      {/* API Report Summary Section */}
      {reportSummary && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              API Report Summary
            </CardTitle>
            <CardDescription className="text-green-700">
              Real-time data from Voizmatic API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-600">Total Contacts</p>
                <p className="text-2xl font-bold text-green-900">{reportSummary.total_contacts || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-600">Completed Calls</p>
                <p className="text-2xl font-bold text-green-900">{reportSummary.completed_calls || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-600">Pending Calls</p>
                <p className="text-2xl font-bold text-green-900">{reportSummary.pending_calls || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-600">Failed Calls</p>
                <p className="text-2xl font-bold text-green-900">{reportSummary.failed_calls || 0}</p>
              </div>
            </div>
            {reportSummary.success_rate !== undefined && (
              <div className="mt-4 bg-white p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-green-600">Success Rate</span>
                  <span className="text-lg font-bold text-green-900">{reportSummary.success_rate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${reportSummary.success_rate}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Category, Campaign and Time Filters */}
      <Card className="border-blue-200 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category-filter" className="text-blue-900">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category-filter" className="border-blue-200">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-filter" className="text-blue-900">Campaign</Label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger id="campaign-filter" className="border-blue-200">
                  <SelectValue placeholder="All Campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-filter" className="text-blue-900">Time Range</Label>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger id="time-filter" className="border-blue-200">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="1day">Last 1 Day</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="15days">Last 15 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(selectedCategory !== 'all' || selectedCampaign !== 'all' || selectedTimeRange !== 'all') && (
            <div className="mt-4 bg-blue-50 border border-blue-300 p-3 rounded-md">
              <p className="text-sm text-blue-900">
                <strong>Active Filters:</strong>{' '}
                {selectedCategory !== 'all' && `Category: ${selectedCategory}`}
                {selectedCategory !== 'all' && (selectedCampaign !== 'all' || selectedTimeRange !== 'all') && ' | '}
                {selectedCampaign !== 'all' && `Campaign: ${campaigns.find(c => c.id === selectedCampaign)?.name}`}
                {selectedCampaign !== 'all' && selectedTimeRange !== 'all' && ' | '}
                {selectedTimeRange !== 'all' && `Time: ${selectedTimeRange === '1day' ? 'Last 1 Day' : 
                  selectedTimeRange === '7days' ? 'Last 7 Days' : 
                  selectedTimeRange === '15days' ? 'Last 15 Days' : 'Last 30 Days'}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success rate card */}
      <Card className="border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg">
        <CardHeader>
          <CardTitle className="text-blue-900">{kpiTitle}</CardTitle>
          <CardDescription className="text-blue-700">{kpiDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2">
            <div className="text-4xl text-blue-900">
              {kpiRate}%
            </div>
            <TrendingUp className="h-6 w-6 text-green-600 mb-1" />
          </div>
          <p className="text-sm text-blue-700 mt-2">
            {kpiDetails}
          </p>
        </CardContent>
      </Card>

      {/* Dashboard Section Tabs */}
      <Tabs defaultValue="call-stats" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-blue-100 border border-blue-200">
          <TabsTrigger value="call-stats" className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
            <Activity className="h-4 w-4" />
            Call Statistics
          </TabsTrigger>
          <TabsTrigger value="response-breakdown" className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
            <PieChart className="h-4 w-4" />
            Response Breakdown
          </TabsTrigger>
          <TabsTrigger value="comparisons" className="flex items-center gap-2 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4" />
            Comparisons
          </TabsTrigger>
        </TabsList>

        {/* Call Statistics Tab */}
        <TabsContent value="call-stats" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="border-blue-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800">
                      {stat.title}
                    </CardTitle>
                    <div className={`${stat.bgColor} p-2 rounded-lg`}>
                      <Icon className={`h-4 w-4 ${stat.textColor}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl ${stat.textColor}`}>
                      {stat.value}
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      {filteredStats.totalCalls > 0 
                        ? `${((stat.value / filteredStats.totalCalls) * 100).toFixed(1)}% of total`
                        : 'No calls yet'}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Response Breakdown Tab */}
        <TabsContent value="response-breakdown" className="mt-6 space-y-6">
          {/* Response breakdown chart */}
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
              <CardTitle className="text-blue-900">Call Outcome Distribution</CardTitle>
              <CardDescription className="text-blue-700">Distribution of call outcomes</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {[
                  { label: 'Answered by Customer', value: filteredStats.answeredByCustomer, color: 'bg-green-500' },
                  { label: 'Ring No Response', value: filteredStats.rnr, color: 'bg-yellow-500' },
                  { label: 'Answered by Family', value: filteredStats.answeredByFamily, color: 'bg-purple-500' },
                  { label: 'Answered by Others', value: filteredStats.answeredByOthers, color: 'bg-indigo-500' },
                  { label: 'Not Reachable', value: filteredStats.notReachable, color: 'bg-red-500' },
                  { label: 'Wrong Number', value: filteredStats.wrongNumber, color: 'bg-orange-500' },
                ].map((item) => {
                  const percentage = filteredStats.totalCalls > 0 
                    ? (item.value / filteredStats.totalCalls) * 100 
                    : 0;
                  
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-blue-900">{item.label}</span>
                        <span className="text-blue-900">{item.value} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-blue-100 rounded-full h-2">
                        <div
                          className={`${item.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Response Tags (only for answered calls) */}
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
              <CardTitle className="text-blue-900">
                {selectedCategory === 'Disbursement Verification' 
                  ? 'Disbursement Verification Response' 
                  : 'Customer Response Tags'}
              </CardTitle>
              <CardDescription className="text-blue-700">
                {selectedCategory === 'Disbursement Verification' 
                  ? 'Verification outcomes and details' 
                  : 'Tags for calls answered by customers'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {selectedCategory === 'Disbursement Verification' ? (
                // Disbursement Verification specific breakdown
                <div className="space-y-6">
                  {/* Verification Response */}
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-3">Verification Response</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Confirmed', value: filteredStats.dvConfirmed, color: 'bg-green-500' },
                        { label: 'Denied', value: filteredStats.dvDenied, color: 'bg-red-500' },
                      ].map((item) => {
                        const total = filteredStats.dvConfirmed + filteredStats.dvDenied;
                        const percentage = total > 0 ? (item.value / total) * 100 : 0;
                        
                        return (
                          <div key={item.label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-blue-900">{item.label}</span>
                              <span className="text-blue-900">{item.value} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-blue-100 rounded-full h-2">
                              <div
                                className={`${item.color} h-2 rounded-full transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Commission */}
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-3">Commission</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'With Commission', value: filteredStats.dvWithCommission, color: 'bg-blue-500' },
                        { label: 'Without Commission', value: filteredStats.dvWithoutCommission, color: 'bg-gray-500' },
                      ].map((item) => {
                        const total = filteredStats.dvWithCommission + filteredStats.dvWithoutCommission;
                        const percentage = total > 0 ? (item.value / total) * 100 : 0;
                        
                        return (
                          <div key={item.label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-blue-900">{item.label}</span>
                              <span className="text-blue-900">{item.value} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-blue-100 rounded-full h-2">
                              <div
                                className={`${item.color} h-2 rounded-full transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Loan Sharing */}
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-3">Loan Sharing</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Loan Sharing: Yes', value: filteredStats.dvLoanSharing, color: 'bg-amber-500' },
                        { label: 'Loan Sharing: No', value: filteredStats.dvNoLoanSharing, color: 'bg-gray-500' },
                      ].map((item) => {
                        const total = filteredStats.dvLoanSharing + filteredStats.dvNoLoanSharing;
                        const percentage = total > 0 ? (item.value / total) * 100 : 0;
                        
                        return (
                          <div key={item.label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-blue-900">{item.label}</span>
                              <span className="text-blue-900">{item.value} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-blue-100 rounded-full h-2">
                              <div
                                className={`${item.color} h-2 rounded-full transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {(filteredStats.dvConfirmed + filteredStats.dvDenied) === 0 && (
                    <p className="text-center text-blue-600 py-4">
                      No disbursement verification data recorded yet
                    </p>
                  )}
                </div>
              ) : (
                // Collection/Repayment/Other categories - show regular response tags
                <div className="space-y-3">
                  {responseTagStats.map((item) => {
                    const total = responseTagStats.reduce((sum, tag) => sum + tag.value, 0);
                    const percentage = total > 0 ? (item.value / total) * 100 : 0;
                    
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-blue-900">{item.label}</span>
                          <span className="text-blue-900">{item.value} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-blue-100 rounded-full h-2">
                          <div
                            className={`${item.color} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {responseTagStats.reduce((sum, tag) => sum + tag.value, 0) === 0 && (
                    <p className="text-center text-blue-600 py-4">
                      No response tags recorded yet
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparisons Tab */}
        <TabsContent value="comparisons" className="mt-6">
          <ComparisonCharts calls={filteredCalls} payments={payments} selectedCategory={selectedCategory} />
        </TabsContent>
      </Tabs>
    </div>
  );
}