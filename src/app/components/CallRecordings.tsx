import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Phone, Calendar, Clock, Play, Download, Search, Filter, Coins, RefreshCw, Loader2, Trash2 } from 'lucide-react';
import { CallRecord, CallStatus, Category, DisbursementResponse, IncomeSource, LUCPurpose, RecordingSchema } from '../types';
import { callStatusOptions, disbursementResponseOptions, incomeSourceOptions, lucPurposeOptions } from '../data/mockData';
import { CheckCircle2, Tag } from 'lucide-react';
import { api } from '../services/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface CallRecordingsProps {
  calls: CallRecord[];
  // New API-based props
  recordings?: RecordingSchema[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function CallRecordings({ calls, recordings = [], isLoading = false, onRefresh }: CallRecordingsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CallStatus | 'all'>('all');
  
  // Disbursement Verification Filters
  const [responseFilter, setResponseFilter] = useState<DisbursementResponse | 'all'>('all');
  const [commissionFilter, setCommissionFilter] = useState<string>('all'); // 'all' | 'yes' | 'no'
  const [loanSharingFilter, setLoanSharingFilter] = useState<string>('all'); // 'all' | 'yes' | 'no'
  const [incomeSourceFilter, setIncomeSourceFilter] = useState<IncomeSource | 'all'>('all');
  const [lucPurposeFilter, setLucPurposeFilter] = useState<LUCPurpose | 'all'>('all');
  
  // API recording playback state
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);
  const [downloadingRecordingId, setDownloadingRecordingId] = useState<string | null>(null);
  const [deleteRecordingId, setDeleteRecordingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Filter and search calls
  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      const matchesSearch = 
        call.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.phoneNumber.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || call.status === statusFilter;
      
      // Disbursement Verification filters
      let matchesDisbursement = true;
      if (call.category === 'Disbursement Verification' && call.disbursementData) {
        if (responseFilter !== 'all') {
          matchesDisbursement = matchesDisbursement && call.disbursementData.response === responseFilter;
        }
        if (commissionFilter !== 'all') {
          const commissionValue = commissionFilter === 'yes';
          matchesDisbursement = matchesDisbursement && call.disbursementData.commission === commissionValue;
        }
        if (loanSharingFilter !== 'all') {
          const loanSharingValue = loanSharingFilter === 'yes';
          matchesDisbursement = matchesDisbursement && call.disbursementData.loanSharing === loanSharingValue;
        }
        if (incomeSourceFilter !== 'all') {
          matchesDisbursement = matchesDisbursement && call.disbursementData.incomeSource === incomeSourceFilter;
        }
        if (lucPurposeFilter !== 'all') {
          matchesDisbursement = matchesDisbursement && call.disbursementData.lucPurpose === lucPurposeFilter;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDisbursement;
    });
  }, [calls, searchTerm, statusFilter, responseFilter, commissionFilter, loanSharingFilter, incomeSourceFilter, lucPurposeFilter]);

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get status badge color
  const getStatusColor = (status: CallStatus): string => {
    switch (status) {
      case 'Answered by Customer':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'RNR':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Not Reachable':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Wrong Number':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Answered by Family':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Answered by Others':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get category badge color
  const getCategoryColor = (category: Category) => {
    switch (category) {
      case 'Disbursement Verification':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Collection Calling':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Repayment Notices':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Legal Notices':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Consumer Durables':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Others':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get response tag color
  const getResponseTagColor = (responseTag: string) => {
    switch (responseTag) {
      case 'Positive':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Negative':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Handle play recording using API
  const handlePlayRecording = useCallback(async (recordingUrl: string, recordingId?: string) => {
    // If we have a recording ID from API, use the API to get streaming URL
    if (recordingId) {
      try {
        setPlayingRecordingId(recordingId);
        const result = await api.recordings.getUrl(recordingId);
        if (result.url) {
          setAudioUrl(result.url);
          // Open in new tab or use audio player
          window.open(result.url, '_blank');
        }
      } catch (error) {
        console.error('Error getting recording URL:', error);
        alert('Failed to get recording URL. Please try again.');
      } finally {
        setPlayingRecordingId(null);
      }
    } else if (recordingUrl) {
      // Fallback for legacy call records
      window.open(recordingUrl, '_blank');
    }
  }, []);

  // Handle download recording using API
  const handleDownloadRecording = useCallback(async (call: CallRecord, recordingId?: string) => {
    if (recordingId) {
      try {
        setDownloadingRecordingId(recordingId);
        const blob = await api.recordings.download(recordingId);
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `recording_${call.contactName}_${call.callDate}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading recording:', error);
        alert('Failed to download recording. Please try again.');
      } finally {
        setDownloadingRecordingId(null);
      }
    } else {
      // Legacy fallback
      console.log('Download recording:', call.id);
      alert(`Downloading recording for ${call.contactName}`);
    }
  }, []);

  // Handle delete recording
  const handleDeleteRecording = useCallback(async () => {
    if (!deleteRecordingId) return;
    
    try {
      setIsDeleting(true);
      await api.recordings.delete(deleteRecordingId);
      setDeleteRecordingId(null);
      
      // Refresh data
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting recording:', error);
      alert('Failed to delete recording. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteRecordingId, onRefresh]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl text-blue-900 mb-1">Call Recordings</h2>
          <p className="text-blue-700">View and filter all your call recordings</p>
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

      {/* API Recordings Section */}
      {recordings.length > 0 && (
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-100">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Phone className="h-5 w-5" />
              API Recordings ({recordings.length})
            </CardTitle>
            <CardDescription className="text-green-700">
              Recordings fetched from the Voizmatic API
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="flex items-center justify-between p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Phone className="h-4 w-4 text-green-800" />
                      </div>
                      <div>
                        <p className="font-medium text-green-900">Recording #{recording.id}</p>
                        <p className="text-sm text-green-600">
                          Contact: {recording.contact_id} | Campaign: {recording.campaign_id}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-green-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {recording.duration ? `${Math.floor(recording.duration / 60)}:${(recording.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
                          </span>
                          {recording.created_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(recording.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePlayRecording('', recording.id)}
                      disabled={playingRecordingId === recording.id}
                      className="border-green-300 text-green-800 hover:bg-green-100"
                    >
                      {playingRecordingId === recording.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadRecording({ id: recording.id, contactName: `Contact_${recording.contact_id}`, callDate: recording.created_at || new Date().toISOString() } as CallRecord, recording.id)}
                      disabled={downloadingRecordingId === recording.id}
                      className="border-green-300 text-green-800 hover:bg-green-100"
                    >
                      {downloadingRecordingId === recording.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteRecordingId(recording.id)}
                      className="border-red-300 text-red-800 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRecordingId} onOpenChange={(open) => !open && setDeleteRecordingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recording</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this recording? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRecording}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Filters */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription className="text-blue-700">
            Search and filter call recordings by status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
              <Input
                type="text"
                placeholder="Search by name or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CallStatus | 'all')}>
              <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {callStatusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Disbursement Verification Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Response filter */}
            <Select value={responseFilter} onValueChange={(value) => setResponseFilter(value as DisbursementResponse | 'all')}>
              <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Filter by response" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Responses</SelectItem>
                {disbursementResponseOptions.map((response) => (
                  <SelectItem key={response} value={response}>
                    {response}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Commission filter */}
            <Select value={commissionFilter} onValueChange={(value) => setCommissionFilter(value)}>
              <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Filter by commission" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>

            {/* Loan Sharing filter */}
            <Select value={loanSharingFilter} onValueChange={(value) => setLoanSharingFilter(value)}>
              <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Filter by loan sharing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>

            {/* Income Source filter */}
            <Select value={incomeSourceFilter} onValueChange={(value) => setIncomeSourceFilter(value as IncomeSource | 'all')}>
              <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Filter by income source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Income Sources</SelectItem>
                {incomeSourceOptions.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* LUC Purpose filter */}
            <Select value={lucPurposeFilter} onValueChange={(value) => setLucPurposeFilter(value as LUCPurpose | 'all')}>
              <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Filter by LUC purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All LUC Purposes</SelectItem>
                {lucPurposeOptions.map((purpose) => (
                  <SelectItem key={purpose} value={purpose}>
                    {purpose}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-md">
            Showing {filteredCalls.length} of {calls.length} calls
          </div>
        </CardContent>
      </Card>

      {/* Call records list */}
      <div className="space-y-4">
        {filteredCalls.length > 0 ? (
          filteredCalls.map((call) => (
            <Card key={call.id} className="hover:shadow-xl transition-shadow border-blue-200">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Call info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg mt-1">
                        <Phone className="h-5 w-5 text-blue-900" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-blue-900">{call.contactName}</h3>
                        <p className="text-blue-700">{call.phoneNumber}</p>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-blue-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(call.callDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDuration(call.duration)}
                          </span>
                          {call.campaignName && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              📊 {call.campaignName}
                            </span>
                          )}
                        </div>

                        {call.notes && (
                          <p className="text-sm text-blue-700 mt-2 italic bg-blue-50 p-2 rounded">
                            "{call.notes}"
                          </p>
                        )}

                        {/* Credits Used */}
                        {call.creditsUsed !== undefined && call.creditsUsed > 0 && (
                          <div className="flex items-center gap-2 mt-2 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-md w-fit">
                            <Coins className="h-4 w-4 text-orange-700" />
                            <span className="text-sm text-orange-800">
                              <strong>{call.creditsUsed}</strong> credit{call.creditsUsed !== 1 ? 's' : ''} used
                            </span>
                          </div>
                        )}

                        {/* Disbursement Verification Data */}
                        {call.category === 'Disbursement Verification' && call.disbursementData && (
                          <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg">
                            <h4 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              Disbursement Verification Details
                            </h4>
                            
                            {call.disbursementData.response === 'Denied' ? (
                              // Denied - Simple display
                              <div className="text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-purple-700 font-medium">Response:</span>
                                  <Badge className="bg-red-100 text-red-800 border-red-300">
                                    ❌ Denied
                                  </Badge>
                                </div>
                                <p className="text-purple-600 mt-2 italic">
                                  Customer denied the loan. No additional information collected.
                                </p>
                              </div>
                            ) : (
                              // Confirmed - Full details
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-purple-700 font-medium">Response:</span>
                                  <Badge className="ml-2 bg-green-100 text-green-800 border-green-300">
                                    ✓ Confirmed
                                  </Badge>
                                </div>
                                <div>
                                  <span className="text-purple-700 font-medium">Commission:</span>
                                  <Badge className={call.disbursementData.commission 
                                    ? 'ml-2 bg-red-100 text-red-800 border-red-300'
                                    : 'ml-2 bg-green-100 text-green-800 border-green-300'
                                  }>
                                    {call.disbursementData.commission ? 'Yes ⚠️' : 'No ✓'}
                                  </Badge>
                                </div>
                                <div>
                                  <span className="text-purple-700 font-medium">Loan Sharing:</span>
                                  <Badge className={call.disbursementData.loanSharing 
                                    ? 'ml-2 bg-yellow-100 text-yellow-800 border-yellow-300'
                                    : 'ml-2 bg-green-100 text-green-800 border-green-300'
                                  }>
                                    {call.disbursementData.loanSharing ? 'Yes ⚠️' : 'No ✓'}
                                  </Badge>
                                </div>
                                <div className="md:col-span-1">
                                  <span className="text-purple-700 font-medium">Income Source:</span>
                                  <p className="text-purple-900 mt-1">{call.disbursementData.incomeSource || 'Not provided'}</p>
                                </div>
                                <div className="md:col-span-2">
                                  <span className="text-purple-700 font-medium">LUC Purpose:</span>
                                  <p className="text-purple-900 mt-1">{call.disbursementData.lucPurpose || 'Not provided'}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Response Tag - Only for non-disbursement categories */}
                        {call.category !== 'Disbursement Verification' && call.responseTag && (
                          <div className="mt-2">
                            <span className="text-sm text-blue-700">Response: </span>
                            <Badge variant="outline" className={getResponseTagColor(call.responseTag)}>
                              <Tag className="h-3 w-3 mr-1" />
                              {call.responseTag}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status and actions */}
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex flex-wrap gap-2 justify-end">
                      <Badge className={getStatusColor(call.status)}>
                        {call.status}
                      </Badge>
                      {call.responseTag && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-300">
                          🏷️ {call.responseTag}
                        </Badge>
                      )}
                      <Badge variant="outline" className={getCategoryColor(call.category)}>
                        📂 {call.category}
                      </Badge>
                    </div>

                    {call.recordingUrl && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePlayRecording(call.recordingUrl!)}
                          className="border-blue-300 text-blue-900 hover:bg-blue-50"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Play
                          <span className="ml-2 text-xs font-semibold bg-blue-100 px-2 py-0.5 rounded">
                            {formatDuration(call.duration)}
                          </span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadRecording(call)}
                          className="border-blue-300 text-blue-900 hover:bg-blue-50"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-blue-200">
            <CardContent className="py-12 text-center">
              <Phone className="h-12 w-12 text-blue-300 mx-auto mb-4" />
              <h3 className="text-lg text-blue-800 mb-2">No calls found</h3>
              <p className="text-sm text-blue-600">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No call recordings available yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}