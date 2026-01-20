import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  IndianRupee,
  Users,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  Search,
  CreditCard,
  Smartphone,
  UserCheck,
  Building2,
} from 'lucide-react';
import { PaymentCollection, PaymentMode, DPDBucket } from '../types';
import { paymentModeOptions, dpdBucketOptions } from '../data/mockData';

interface CollectionsProps {
  payments: PaymentCollection[];
}

export function Collections({ payments }: CollectionsProps) {
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('all');
  const [selectedDPDBucket, setSelectedDPDBucket] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all');
  const [cutoffDate, setCutoffDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter payments
  const filteredPayments = useMemo(() => {
    let filtered = [...payments];

    // Filter by payment mode
    if (selectedPaymentMode !== 'all') {
      filtered = filtered.filter(p => p.paymentMode === selectedPaymentMode);
    }

    // Filter by DPD bucket
    if (selectedDPDBucket !== 'all') {
      filtered = filtered.filter(p => p.dpdBucket === selectedDPDBucket);
    }

    // Filter by time range
    if (selectedTimeRange !== 'all' && selectedTimeRange !== 'custom') {
      const now = Date.now();
      const timeRanges: Record<string, number> = {
        '1day': 24 * 60 * 60 * 1000,
        '1week': 7 * 24 * 60 * 60 * 1000,
        '1month': 30 * 24 * 60 * 60 * 1000,
      };

      const cutoff = now - timeRanges[selectedTimeRange];
      filtered = filtered.filter(p => new Date(p.paymentDate).getTime() >= cutoff);
    }

    // Filter by custom cutoff date
    if (selectedTimeRange === 'custom' && cutoffDate) {
      const cutoff = new Date(cutoffDate).getTime();
      filtered = filtered.filter(p => new Date(p.paymentDate).getTime() >= cutoff);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phoneNumber.includes(searchTerm) ||
        p.loanAccountNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [payments, selectedPaymentMode, selectedDPDBucket, selectedTimeRange, cutoffDate, searchTerm]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalCustomers = new Set(filteredPayments.map(p => p.phoneNumber)).size;
    const averageAmount = totalCustomers > 0 ? totalAmount / totalCustomers : 0;

    // DPD bucket breakdown
    const dpdBreakdown = dpdBucketOptions.reduce((acc, bucket) => {
      const bucketPayments = filteredPayments.filter(p => p.dpdBucket === bucket);
      acc[bucket] = {
        count: bucketPayments.length,
        amount: bucketPayments.reduce((sum, p) => sum + p.amount, 0),
      };
      return acc;
    }, {} as Record<DPDBucket, { count: number; amount: number }>);

    // Payment mode breakdown
    const paymentModeBreakdown = paymentModeOptions.reduce((acc, mode) => {
      const modePayments = filteredPayments.filter(p => p.paymentMode === mode);
      acc[mode] = {
        count: modePayments.length,
        amount: modePayments.reduce((sum, p) => sum + p.amount, 0),
      };
      return acc;
    }, {} as Record<PaymentMode, { count: number; amount: number }>);

    return {
      totalAmount,
      totalCustomers,
      averageAmount,
      totalPayments: filteredPayments.length,
      dpdBreakdown,
      paymentModeBreakdown,
    };
  }, [filteredPayments]);

  const formatCurrency = (amount: number) => {
    // Format with ₹ symbol explicitly for Indian Rupee
    const formatted = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount);
    return `₹${formatted}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const getDPDBucketColor = (bucket: DPDBucket) => {
    switch (bucket) {
      case '0-30 Days':
        return 'bg-green-100 text-green-800 border-green-300';
      case '31-60 Days':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case '61-90 Days':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case '91-180 Days':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case '180+ Days':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPaymentModeIcon = (mode: PaymentMode) => {
    switch (mode) {
      case 'UPI Collect Request':
        return <Smartphone className="h-4 w-4" />;
      case 'Agent':
        return <UserCheck className="h-4 w-4" />;
      case 'Paid via App':
        return <Smartphone className="h-4 w-4" />;
      case 'Paid via BBPS':
        return <Building2 className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const handleExport = () => {
    // Mock export functionality
    console.log('Exporting collection data:', filteredPayments);
    alert('Export functionality - Ready for CSV/Excel export');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-blue-900 mb-1">Collections Dashboard</h2>
        <p className="text-blue-700">Track and analyze payment collections</p>
      </div>

      {/* Filters */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-700" />
            <CardTitle className="text-blue-900">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Time Range Filter */}
            <div className="space-y-2">
              <Label htmlFor="time-range" className="text-blue-900">Time Range</Label>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger id="time-range" className="border-blue-200">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="1day">1 Day</SelectItem>
                  <SelectItem value="1week">1 Week</SelectItem>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Picker */}
            {selectedTimeRange === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="cutoff-date" className="text-blue-900">Since Date</Label>
                <Input
                  id="cutoff-date"
                  type="date"
                  value={cutoffDate}
                  onChange={(e) => setCutoffDate(e.target.value)}
                  className="border-blue-200"
                />
              </div>
            )}

            {/* Payment Mode Filter */}
            <div className="space-y-2">
              <Label htmlFor="payment-mode" className="text-blue-900">Payment Mode</Label>
              <Select value={selectedPaymentMode} onValueChange={setSelectedPaymentMode}>
                <SelectTrigger id="payment-mode" className="border-blue-200">
                  <SelectValue placeholder="All payment modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  {paymentModeOptions.map(mode => (
                    <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DPD Bucket Filter */}
            <div className="space-y-2">
              <Label htmlFor="dpd-bucket" className="text-blue-900">DPD Bucket</Label>
              <Select value={selectedDPDBucket} onValueChange={setSelectedDPDBucket}>
                <SelectTrigger id="dpd-bucket" className="border-blue-200">
                  <SelectValue placeholder="All DPD buckets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Buckets</SelectItem>
                  {dpdBucketOptions.map(bucket => (
                    <SelectItem key={bucket} value={bucket}>{bucket}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-blue-900">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
                <Input
                  id="search"
                  placeholder="Name, Phone, Account..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-blue-200"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={handleExport}
              variant="outline"
              className="border-blue-300 text-blue-900 hover:bg-blue-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200 shadow-lg bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Total Collected</p>
                <p className="text-2xl text-green-900 mt-1">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="bg-green-600 p-3 rounded-lg">
                <IndianRupee className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Total Customers</p>
                <p className="text-2xl text-blue-900 mt-1">{stats.totalCustomers}</p>
              </div>
              <div className="bg-blue-600 p-3 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 shadow-lg bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Total Payments</p>
                <p className="text-2xl text-purple-900 mt-1">{stats.totalPayments}</p>
              </div>
              <div className="bg-purple-600 p-3 rounded-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 shadow-lg bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Avg per Customer</p>
                <p className="text-2xl text-orange-900 mt-1">{formatCurrency(stats.averageAmount)}</p>
              </div>
              <div className="bg-orange-600 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DPD Bucket Analysis */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
          <CardTitle className="text-blue-900">Collection by DPD Bucket</CardTitle>
          <CardDescription className="text-blue-700">
            Distribution of collections across overdue periods
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {dpdBucketOptions.map(bucket => {
              const data = stats.dpdBreakdown[bucket];
              const percentage = stats.totalAmount > 0 
                ? Math.round((data.amount / stats.totalAmount) * 100) 
                : 0;
              
              return (
                <div key={bucket} className="border border-blue-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getDPDBucketColor(bucket)}>{bucket}</Badge>
                    <div className="flex gap-4 text-sm">
                      <span className="text-blue-700">
                        <strong>{data.count}</strong> payments
                      </span>
                      <span className="text-green-700">
                        <strong>{formatCurrency(data.amount)}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-600 mt-1">{percentage}% of total collections</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payment Mode Analysis */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
          <CardTitle className="text-blue-900">Collection by Payment Mode</CardTitle>
          <CardDescription className="text-blue-700">
            Distribution of collections across payment channels
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentModeOptions.map(mode => {
              const data = stats.paymentModeBreakdown[mode];
              const percentage = stats.totalAmount > 0 
                ? Math.round((data.amount / stats.totalAmount) * 100) 
                : 0;
              
              return (
                <Card key={mode} className="border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      {getPaymentModeIcon(mode)}
                      <p className="text-sm text-blue-900">{mode}</p>
                    </div>
                    <p className="text-xl text-blue-900 mb-1">{formatCurrency(data.amount)}</p>
                    <p className="text-xs text-blue-600">{data.count} payments ({percentage}%)</p>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Collections Table */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
          <CardTitle className="text-blue-900">Recent Collections</CardTitle>
          <CardDescription className="text-blue-700">
            Latest payment transactions ({filteredPayments.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {filteredPayments.length > 0 ? (
            <div className="space-y-3">
              {filteredPayments.slice(0, 10).map(payment => (
                <div
                  key={payment.id}
                  className="border border-blue-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-blue-900">{payment.customerName}</h4>
                        <Badge className={getDPDBucketColor(payment.dpdBucket)}>
                          {payment.dpdBucket}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-700">
                        <div>
                          <p className="text-xs text-blue-500">Loan Account</p>
                          <p>{payment.loanAccountNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-500">Payment Mode</p>
                          <div className="flex items-center gap-1">
                            {getPaymentModeIcon(payment.paymentMode)}
                            <p>{payment.paymentMode}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-blue-500">Transaction ID</p>
                          <p className="truncate">{payment.transactionId}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-500">Date</p>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <p>{formatDate(payment.paymentDate)}</p>
                          </div>
                        </div>
                      </div>
                      {payment.agentName && (
                        <p className="text-xs text-purple-700 mt-2">
                          <UserCheck className="h-3 w-3 inline mr-1" />
                          Agent: {payment.agentName}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-2xl text-green-900">{formatCurrency(payment.amount)}</p>
                      <div className="text-xs text-blue-600 mt-1 space-y-0.5">
                        <p>Principal: {formatCurrency(payment.principalAmount || 0)}</p>
                        <p>Interest: {formatCurrency(payment.interestAmount || 0)}</p>
                        {payment.penaltyAmount && payment.penaltyAmount > 0 && (
                          <p className="text-red-600">Penalty: {formatCurrency(payment.penaltyAmount)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <IndianRupee className="h-12 w-12 text-blue-300 mx-auto mb-4" />
              <h3 className="text-lg text-blue-800 mb-2">No collections found</h3>
              <p className="text-sm text-blue-600">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Integration Note */}
      <div className="bg-blue-50 border border-blue-300 p-4 rounded-md">
        <p className="text-sm text-blue-900">
          <strong>API Integration:</strong> GET /api/collections?timeRange=1week&paymentMode=UPI&dpdBucket=0-30
        </p>
        <p className="text-xs text-blue-700 mt-2">
          POST /api/collections for recording new payments
        </p>
      </div>
    </div>
  );
}