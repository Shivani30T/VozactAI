import { CallStats, CallRecord, Campaign, PaymentCollection, ReportSummary } from '../types';
import { Dashboard } from './Dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Building2, Users, BarChart3, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface AdminDashboardProps {
  stats: CallStats;
  organizationName: string;
  calls?: CallRecord[];
  campaigns?: Campaign[];
  payments?: PaymentCollection[];
  // New API-based props
  reportSummary?: ReportSummary | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function AdminDashboard({ stats, organizationName, calls = [], campaigns = [], payments = [], reportSummary, isLoading = false, onRefresh }: AdminDashboardProps) {
  // Mock data for organization-wide metrics
  const orgMetrics = {
    totalUsers: 12,
    activeUsers: 8,
    totalCampaigns: 5,
    avgSuccessRate: 45.2,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl text-blue-900 mb-1">Admin Dashboard</h2>
          <p className="text-blue-700">Organization-wide analytics and insights</p>
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

      {/* Organization overview */}
      <Card className="border-blue-300 bg-gradient-to-r from-blue-900 to-blue-800 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-white" />
            <CardTitle className="text-white">{organizationName}</CardTitle>
          </div>
          <CardDescription className="text-blue-200">Organization Overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-blue-200">Total Users</div>
              <div className="text-2xl text-white">{orgMetrics.totalUsers}</div>
            </div>
            <div>
              <div className="text-sm text-blue-200">Active Users</div>
              <div className="text-2xl text-white">{orgMetrics.activeUsers}</div>
            </div>
            <div>
              <div className="text-sm text-blue-200">Total Campaigns</div>
              <div className="text-2xl text-white">{orgMetrics.totalCampaigns}</div>
            </div>
            <div>
              <div className="text-sm text-blue-200">Avg Success Rate</div>
              <div className="text-2xl text-white">{orgMetrics.avgSuccessRate}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team performance */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Users className="h-5 w-5" />
            Team Performance
          </CardTitle>
          <CardDescription className="text-blue-700">Top performing team members</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {[
              { name: 'Sarah Johnson', calls: 156, success: 72, rate: 46.2 },
              { name: 'Mike Chen', calls: 142, success: 65, rate: 45.8 },
              { name: 'Emily Davis', calls: 128, success: 58, rate: 45.3 },
              { name: 'James Wilson', calls: 115, success: 51, rate: 44.3 },
              { name: 'Lisa Anderson', calls: 98, success: 42, rate: 42.9 },
            ].map((member, index) => (
              <div key={member.name} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-900 text-white rounded-full w-8 h-8 flex items-center justify-center">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-blue-900">{member.name}</div>
                    <div className="text-sm text-blue-700">
                      {member.calls} calls · {member.success} successful
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-blue-900">
                    {member.rate}%
                  </div>
                  <div className="text-xs text-blue-600">Success rate</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campaign performance */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <BarChart3 className="h-5 w-5" />
            Active Campaigns
          </CardTitle>
          <CardDescription className="text-blue-700">Current calling campaigns status</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[
              { 
                name: 'Q4 Product Launch', 
                totalContacts: 500, 
                called: 342, 
                pending: 158,
                successRate: 48.5,
                status: 'active'
              },
              { 
                name: 'Customer Retention', 
                totalContacts: 300, 
                called: 245, 
                pending: 55,
                successRate: 52.1,
                status: 'active'
              },
              { 
                name: 'New Service Promotion', 
                totalContacts: 450, 
                called: 180, 
                pending: 270,
                successRate: 44.8,
                status: 'active'
              },
            ].map((campaign) => (
              <div key={campaign.name} className="border border-blue-200 rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-blue-900">{campaign.name}</h4>
                    <p className="text-sm text-blue-700">
                      {campaign.called} / {campaign.totalContacts} contacts called
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-blue-900">
                      {campaign.successRate}%
                    </div>
                    <div className="text-xs text-blue-600">Success</div>
                  </div>
                </div>
                
                <div className="w-full bg-blue-100 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-900 h-2 rounded-full"
                    style={{ width: `${(campaign.called / campaign.totalContacts) * 100}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-sm text-blue-700">
                  <span>{campaign.pending} pending</span>
                  <span>{((campaign.called / campaign.totalContacts) * 100).toFixed(1)}% complete</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overall statistics - reuse the user dashboard component */}
      <div className="border-t-2 border-blue-200 pt-6">
        <h3 className="text-xl text-blue-900 mb-4">Organization-Wide Call Statistics</h3>
        <Dashboard 
          stats={stats} 
          calls={calls} 
          campaigns={campaigns} 
          payments={payments}
          reportSummary={reportSummary}
          isLoading={isLoading}
          onRefresh={onRefresh}
        />
      </div>
    </div>
  );
}