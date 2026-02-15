import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { FileSpreadsheet, Upload, Download, CheckCircle2, AlertCircle, Tag, Loader2 } from 'lucide-react';
import { Campaign, Category } from '../types';
import { categoryOptions } from '../data/mockData';
import { api } from '../services/api';

interface UploadContactsProps {
  campaigns: Campaign[];
  onCampaignCreated?: (campaign: Campaign) => void;
  onUploadSuccess?: () => void;
}

export function UploadContacts({ campaigns, onCampaignCreated, onUploadSuccess }: UploadContactsProps) {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [uploadResult, setUploadResult] = useState<{
    campaignId: string;
    processedRows: number;
    duplicates: number;
    accepted: number;
  } | null>(null);
  const [campaignName, setCampaignName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Collection Calling');
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!campaignName.trim()) {
      setError('Please enter a campaign name before uploading');
      return;
    }

    if (!selectedCategory) {
      setError('Please select a category before uploading');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess(false);
    setUploadResult(null);

    try {
      // Call the real API
      const response = await api.contacts.upload(file, campaignName, selectedCategory);

      // Store upload result
      setUploadResult({
        campaignId: response.campaign_id,
        processedRows: response.processed_rows,
        duplicates: response.duplicates,
        accepted: response.accepted,
      });

      // Create campaign object for callback
      if (onCampaignCreated) {
        const newCampaign: Campaign = {
          id: response.campaign_id,
          name: campaignName,
          category: selectedCategory,
          status: 'pending',
          created_at: new Date().toISOString(),
          total_contacts: response.accepted,
          completed: 0,
          in_progress: 0,
        };
        onCampaignCreated(newCampaign);
      }

      setSuccess(true);

      // Reset form
      setCampaignName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Notify parent of successful upload
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file. Please try again.';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await api.contacts.downloadTemplate();
    } catch (err) {
      // Fallback to creating a local template if API fails
      const csvContent = `Name,Phone Number,Email,Address
John Doe,+1-555-0101,john@example.com,"123 Main St, City, State"
Jane Smith,+1-555-0102,jane@example.com,"456 Oak Ave, City, State"
Bob Johnson,+1-555-0103,bob@example.com,"789 Pine Rd, City, State"`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contacts_template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-blue-900 mb-1">Upload Calling List</h2>
        <p className="text-blue-700">Import contacts from Excel or CSV file</p>
      </div>

      {/* Category Selection */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Tag className="h-5 w-5" />
            Select Category
          </CardTitle>
          <CardDescription className="text-blue-700">
            Choose the category for this upload
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categoryOptions.map((category) => (
              <Button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                variant={
                  selectedCategory === category ? 'default' : 'outline'
                }
                className="justify-start text-left p-4 rounded-lg"
              >
                <div className="font-semibold text-sm">{category}</div>
              </Button>
            ))}
          </div>
          
          {selectedCategory && (
            <div className="mt-4 bg-blue-50 border border-blue-300 p-3 rounded-md">
              <p className="text-sm text-blue-900">
                <strong>Selected Category:</strong> {selectedCategory}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Name Input */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
          <CardTitle className="text-blue-900">Campaign Name</CardTitle>
          <CardDescription className="text-blue-700">
            Enter a name for this campaign (with timestamp)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name" className="text-blue-900">Campaign Name *</Label>
            <Input
              id="campaign-name"
              type="text"
              placeholder="e.g., Q1 2025 Collection Drive"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="border-blue-200"
            />
            <p className="text-xs text-blue-600">
              Campaign will be created with timestamp: {new Date().toLocaleString()}
            </p>
          </div>
          
          {campaignName && (
            <div className="bg-blue-50 border border-blue-300 p-3 rounded-md">
              <p className="text-sm text-blue-900">
                <strong>Campaign Preview:</strong> {campaignName}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Created: {new Date().toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload File */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
          <CardTitle className="text-blue-900">Upload File</CardTitle>
          <CardDescription className="text-blue-700">
            Upload an Excel (.xlsx, .xls) or CSV file with your contacts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {/* Upload area */}
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all">
            <FileSpreadsheet className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg text-blue-900 mb-2">
              Drag and drop your file here
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-blue-900 hover:bg-blue-800 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </>
              )}
            </Button>
          </div>

          {/* Success message */}
          {success && uploadResult && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div>
                  <strong>Upload successful!</strong>
                  <ul className="mt-2 text-sm space-y-1">
                    <li>• Campaign ID: {uploadResult.campaignId}</li>
                    <li>• Processed rows: {uploadResult.processedRows}</li>
                    <li>• Accepted contacts: {uploadResult.accepted}</li>
                    {uploadResult.duplicates > 0 && (
                      <li>• Duplicates skipped: {uploadResult.duplicates}</li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Template download */}
          <div className="bg-blue-50 border border-blue-300 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              Need a template?
            </h4>
            <p className="text-sm text-blue-800 mb-3">
              Download our sample template to see the required format
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              disabled={downloadingTemplate}
              className="border-blue-500 text-blue-900 hover:bg-blue-100"
            >
              {downloadingTemplate ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </>
              )}
            </Button>
          </div>

          {/* File format requirements */}
          <div className="bg-white border border-blue-200 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              File Requirements
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Required columns: Name, Phone Number</li>
              <li>• Optional columns: Email, Address, Age, State, etc.</li>
              <li>• Phone numbers should include country code (e.g., +1-555-0101)</li>
              <li>• Maximum file size: 10MB</li>
              <li>• Supported formats: .xlsx, .xls, .csv</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Existing Campaigns */}
      {campaigns.length > 0 && (
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
            <CardTitle className="text-blue-900">Existing Campaigns</CardTitle>
            <CardDescription className="text-blue-700">
              Your previously created campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {campaigns.slice(0, 5).map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div>
                    <div className="font-medium text-blue-900">{campaign.name}</div>
                    <div className="text-sm text-blue-700">
                      {campaign.category} • {campaign.total_contacts || campaign.totalContacts || 0} contacts
                    </div>
                  </div>
                  <div className="text-sm text-blue-600">
                    {new Date(campaign.created_at || campaign.createdAt || '').toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}