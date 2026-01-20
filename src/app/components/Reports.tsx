import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { FileDown, FileSpreadsheet, Filter, Table as TableIcon, RefreshCw, Loader2, BarChart3, Download } from 'lucide-react';
import { CallRecord, Category, ReportSummary } from '../types';
import { categoryOptions } from '../data/mockData';
import { api } from '../services/api';
import * as XLSX from 'xlsx';

interface ReportsProps {
  calls: CallRecord[];
  campaigns: Array<{ id: string; name: string }>;
  // New API-based props
  reportSummary?: ReportSummary | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function Reports({ calls, campaigns, reportSummary, isLoading = false, onRefresh }: ReportsProps) {
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [timeRangeFilter, setTimeRangeFilter] = useState<number>(30); // days
  const [isExporting, setIsExporting] = useState(false);

  // Filter calls based on selected filters
  const filteredCalls = useMemo(() => {
    const now = new Date();
    const timeRangeMs = timeRangeFilter * 24 * 60 * 60 * 1000;

    return calls.filter(call => {
      const matchesCategory = categoryFilter === 'all' || call.category === categoryFilter;
      const matchesCampaign = campaignFilter === 'all' || call.campaignId === campaignFilter;
      
      const callDate = new Date(call.callDate);
      const matchesTimeRange = (now.getTime() - callDate.getTime()) <= timeRangeMs;
      
      return matchesCategory && matchesCampaign && matchesTimeRange;
    });
  }, [calls, categoryFilter, campaignFilter, timeRangeFilter]);

  // Prepare data for export
  const prepareExportData = () => {
    return filteredCalls.map(call => ({
      'Call ID': call.id,
      'Contact Name': call.contactName,
      'Phone Number': call.phoneNumber,
      'Call Date': new Date(call.callDate).toLocaleString('en-IN'),
      'Duration (seconds)': call.duration,
      'Status': call.status,
      'Category': call.category,
      'Campaign': call.campaignName || 'N/A',
      'Response Tag': call.responseTag || 'N/A',
      'Credits Used': call.creditsUsed || 0,
      'State': call.state || 'N/A',
      'Product Type': call.productType || 'N/A',
      'Notes': call.notes || 'N/A',
      // Disbursement Verification fields
      'DV Response': call.disbursementData?.response || 'N/A',
      'DV Commission': call.disbursementData?.commission !== undefined 
        ? (call.disbursementData.commission ? 'Yes' : 'No') 
        : 'N/A',
      'DV Loan Sharing': call.disbursementData?.loanSharing !== undefined 
        ? (call.disbursementData.loanSharing ? 'Yes' : 'No') 
        : 'N/A',
      'DV LUC Purpose': call.disbursementData?.lucPurpose || 'N/A',
      'DV Income Source': call.disbursementData?.incomeSource || 'N/A',
    }));
  };

  // Download as Excel
  const downloadExcel = () => {
    const data = prepareExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Call Records');
    
    // Set column widths
    const wscols = [
      { wch: 10 }, // Call ID
      { wch: 20 }, // Contact Name
      { wch: 15 }, // Phone Number
      { wch: 20 }, // Call Date
      { wch: 15 }, // Duration
      { wch: 20 }, // Status
      { wch: 25 }, // Category
      { wch: 20 }, // Campaign
      { wch: 20 }, // Response Tag
      { wch: 12 }, // Credits Used
      { wch: 15 }, // State
      { wch: 15 }, // Product Type
      { wch: 30 }, // Notes
      { wch: 15 }, // DV Response
      { wch: 15 }, // DV Commission
      { wch: 15 }, // DV Loan Sharing
      { wch: 25 }, // DV LUC Purpose
      { wch: 30 }, // DV Income Source
    ];
    worksheet['!cols'] = wscols;
    
    const fileName = `Vozact.AI_Call_Records_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Download as CSV
  const downloadCSV = () => {
    const data = prepareExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Vozact.AI_Call_Records_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export from API
  const handleApiExport = useCallback(async () => {
    try {
      setIsExporting(true);
      const blob = await api.reports.export(campaignFilter !== 'all' ? campaignFilter : undefined);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Voizmatic_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [campaignFilter]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl text-blue-900 mb-1">Reports & Export</h2>
          <p className="text-blue-700">Download call records in Excel or CSV format</p>
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

      {/* API Report Summary */}
      {reportSummary && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 border-b border-green-200">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <BarChart3 className="h-5 w-5" />
              API Report Summary
            </CardTitle>
            <CardDescription className="text-green-700">
              Real-time summary from Voizmatic API
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-lg border border-green-200 text-center">
                <p className="text-sm text-green-600">Total Contacts</p>
                <p className="text-2xl font-bold text-green-900">{reportSummary.total_contacts || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200 text-center">
                <p className="text-sm text-green-600">Completed</p>
                <p className="text-2xl font-bold text-green-900">{reportSummary.completed_calls || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200 text-center">
                <p className="text-sm text-green-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{reportSummary.pending_calls || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200 text-center">
                <p className="text-sm text-green-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{reportSummary.failed_calls || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-green-200 text-center">
                <p className="text-sm text-green-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-900">{reportSummary.success_rate?.toFixed(1) || 0}%</p>
              </div>
            </div>
            
            {/* API Export Button */}
            <div className="mt-4 flex gap-4">
              <Button
                onClick={handleApiExport}
                disabled={isExporting}
                className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export from API
                  </>
                )}
              </Button>
              <p className="text-sm text-green-600 flex items-center">
                Export reports directly from Voizmatic backend
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
          <CardDescription className="text-blue-700">
            Select filters to customize your report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium text-blue-900 mb-2 block">
                Category
              </label>
              <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as Category | 'all')}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
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

            {/* Campaign Filter */}
            <div>
              <label className="text-sm font-medium text-blue-900 mb-2 block">
                Campaign
              </label>
              <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
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

            {/* Time Range Filter */}
            <div>
              <label className="text-sm font-medium text-blue-900 mb-2 block">
                Time Range
              </label>
              <Select value={timeRangeFilter.toString()} onValueChange={(value) => setTimeRangeFilter(Number(value))}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 1 Day</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="15">Last 15 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <p className="text-sm text-blue-700">Total Calls</p>
              <p className="text-2xl text-blue-900">{filteredCalls.length}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Total Duration</p>
              <p className="text-2xl text-blue-900">
                {Math.floor(filteredCalls.reduce((sum, call) => sum + call.duration, 0) / 60)} min
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Credits Used</p>
              <p className="text-2xl text-blue-900">
                {filteredCalls.reduce((sum, call) => sum + (call.creditsUsed || 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Answered Calls</p>
              <p className="text-2xl text-blue-900">
                {filteredCalls.filter(call => call.status === 'Answered by Customer').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Buttons */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <FileDown className="h-5 w-5" />
            Download Reports
          </CardTitle>
          <CardDescription className="text-blue-700">
            Export your filtered data in Excel or CSV format
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={downloadExcel}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
              size="lg"
            >
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Download as Excel (.xlsx)
            </Button>
            <Button
              onClick={downloadCSV}
              variant="outline"
              className="border-blue-300 text-blue-900 hover:bg-blue-50"
              size="lg"
            >
              <FileDown className="h-5 w-5 mr-2" />
              Download as CSV
            </Button>
          </div>
          <p className="text-sm text-blue-600 mt-4">
            📊 {filteredCalls.length} call{filteredCalls.length !== 1 ? 's' : ''} will be exported with all details including disbursement verification data.
          </p>
        </CardContent>
      </Card>

      {/* Preview Table */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <TableIcon className="h-5 w-5" />
            Data Preview
          </CardTitle>
          <CardDescription className="text-blue-700">
            Preview of the first 10 records that will be exported
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-100 border-b border-blue-200">
                  <th className="px-4 py-3 text-left text-blue-900">Contact Name</th>
                  <th className="px-4 py-3 text-left text-blue-900">Phone</th>
                  <th className="px-4 py-3 text-left text-blue-900">Date</th>
                  <th className="px-4 py-3 text-left text-blue-900">Duration</th>
                  <th className="px-4 py-3 text-left text-blue-900">Status</th>
                  <th className="px-4 py-3 text-left text-blue-900">Category</th>
                  <th className="px-4 py-3 text-left text-blue-900">Credits</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalls.slice(0, 10).map((call, idx) => {
                  // Format duration
                  const formatDuration = (seconds: number): string => {
                    const mins = Math.floor(seconds / 60);
                    const secs = seconds % 60;
                    return `${mins}:${secs.toString().padStart(2, '0')}`;
                  };

                  return (
                    <tr key={call.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                      <td className="px-4 py-3 text-blue-900">{call.contactName}</td>
                      <td className="px-4 py-3 text-blue-700">{call.phoneNumber}</td>
                      <td className="px-4 py-3 text-blue-700">
                        {new Date(call.callDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-blue-700 font-medium">{formatDuration(call.duration)}</td>
                      <td className="px-4 py-3 text-blue-700">{call.status}</td>
                      <td className="px-4 py-3 text-blue-700">{call.category}</td>
                      <td className="px-4 py-3 text-blue-700">{call.creditsUsed || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredCalls.length === 0 && (
              <div className="text-center py-12 text-blue-600">
                No records match the selected filters
              </div>
            )}
            {filteredCalls.length > 10 && (
              <div className="text-center py-4 text-sm text-blue-600 border-t border-blue-200">
                ... and {filteredCalls.length - 10} more record{filteredCalls.length - 10 !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}