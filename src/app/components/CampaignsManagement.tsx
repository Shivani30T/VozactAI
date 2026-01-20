import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { 
  FolderKanban, 
  Play, 
  Pause, 
  Trash2, 
  RefreshCw, 
  Loader2, 
  Users, 
  CheckCircle, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { Campaign } from '../types';
import { api } from '../services/api';

interface CampaignsManagementProps {
  campaigns: Campaign[];
  onRefresh: () => void;
}

export function CampaignsManagement({ campaigns, onRefresh }: CampaignsManagementProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleStartCampaign = async (campaignId: string, dryRun: boolean = false) => {
    setLoadingAction(`start-${campaignId}`);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await api.campaigns.start(campaignId, dryRun);
      if (dryRun) {
        setSuccess(`Dry run: ${response.queued_contacts} contacts would be queued`);
      } else {
        setSuccess(`Campaign started! ${response.queued_contacts} contacts queued for dialing`);
        onRefresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start campaign');
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    setLoadingAction(`pause-${campaignId}`);
    setError(null);
    setSuccess(null);
    
    try {
      await api.campaigns.pause(campaignId);
      setSuccess('Campaign paused successfully');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause campaign');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResumeCampaign = async (campaignId: string) => {
    setLoadingAction(`resume-${campaignId}`);
    setError(null);
    setSuccess(null);
    
    try {
      await api.campaigns.resume(campaignId);
      setSuccess('Campaign resumed successfully');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume campaign');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    setLoadingAction(`delete-${campaignId}`);
    setError(null);
    setSuccess(null);
    
    try {
      await api.campaigns.delete(campaignId);
      setSuccess('Campaign deleted successfully');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete campaign');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteCampaignContacts = async (campaignId: string) => {
    setLoadingAction(`delete-contacts-${campaignId}`);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await api.campaigns.deleteContacts(campaignId);
      setSuccess(`${response.deleted} contacts deleted from campaign`);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contacts');
    } finally {
      setLoadingAction(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Paused</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Completed</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Pending</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl text-blue-900 mb-1">Campaigns Management</h2>
          <p className="text-blue-700">Manage your calling campaigns</p>
        </div>
        <Button 
          onClick={onRefresh} 
          variant="outline" 
          className="border-blue-500 text-blue-900"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <Card className="border-blue-200 shadow-lg">
          <CardContent className="pt-6 text-center">
            <FolderKanban className="h-12 w-12 text-blue-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">No Campaigns Yet</h3>
            <p className="text-blue-700">
              Upload contacts to create your first campaign
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const totalContacts = campaign.total_contacts || campaign.totalContacts || 0;
            const completed = campaign.completed || campaign.callsMade || 0;
            const inProgress = campaign.in_progress || 0;
            const progress = totalContacts > 0 ? Math.round((completed / totalContacts) * 100) : 0;

            return (
              <Card key={campaign.id} className="border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-blue-900 flex items-center gap-2">
                        <FolderKanban className="h-5 w-5" />
                        {campaign.name}
                      </CardTitle>
                      <CardDescription className="text-blue-700 mt-1">
                        {campaign.category} • Created {formatDate(campaign.created_at || campaign.createdAt || '')}
                      </CardDescription>
                    </div>
                    {getStatusBadge(campaign.status)}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-2 text-blue-700 mb-1">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">Total</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{totalContacts}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-2 text-green-700 mb-1">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Completed</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">{completed}</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-2 text-yellow-700 mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">In Progress</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-900">{inProgress}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-blue-700 mb-1">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-2">
                      <div 
                        className="bg-blue-900 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {campaign.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleStartCampaign(campaign.id, true)}
                          disabled={loadingAction === `start-${campaign.id}`}
                          variant="outline"
                          className="border-blue-500 text-blue-900"
                        >
                          {loadingAction === `start-${campaign.id}` ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-2" />
                          )}
                          Dry Run
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStartCampaign(campaign.id, false)}
                          disabled={loadingAction === `start-${campaign.id}`}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {loadingAction === `start-${campaign.id}` ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-2" />
                          )}
                          Start Campaign
                        </Button>
                      </>
                    )}

                    {campaign.status === 'active' && (
                      <Button
                        size="sm"
                        onClick={() => handlePauseCampaign(campaign.id)}
                        disabled={loadingAction === `pause-${campaign.id}`}
                        variant="outline"
                        className="border-yellow-500 text-yellow-700"
                      >
                        {loadingAction === `pause-${campaign.id}` ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Pause className="h-4 w-4 mr-2" />
                        )}
                        Pause
                      </Button>
                    )}

                    {campaign.status === 'paused' && (
                      <Button
                        size="sm"
                        onClick={() => handleResumeCampaign(campaign.id)}
                        disabled={loadingAction === `resume-${campaign.id}`}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {loadingAction === `resume-${campaign.id}` ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Resume
                      </Button>
                    )}

                    {/* Delete Contacts */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-orange-500 text-orange-700"
                          disabled={loadingAction === `delete-contacts-${campaign.id}`}
                        >
                          {loadingAction === `delete-contacts-${campaign.id}` ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Delete Contacts
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Campaign Contacts?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will delete all contacts from "{campaign.name}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCampaignContacts(campaign.id)}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Delete Contacts
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Delete Campaign */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-700"
                          disabled={loadingAction === `delete-${campaign.id}`}
                        >
                          {loadingAction === `delete-${campaign.id}` ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Delete Campaign
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{campaign.name}" and all associated data. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Campaign
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
