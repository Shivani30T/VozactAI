import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { CallRecord, PaymentCollection } from '../types';
import { MapPin, Package, TrendingUp, BarChart3, Table as TableIcon } from 'lucide-react';

interface ComparisonChartsProps {
  calls: CallRecord[];
  payments?: PaymentCollection[];
  selectedCategory?: string;
}

type KPIMetric = 
  | 'totalCalls'
  | 'answeredCalls'
  | 'successRate'
  | 'promisedToPay'
  | 'requestedTime'
  | 'deniedToPay'
  | 'askedToCallBack'
  | 'rnr'
  | 'avgDuration'
  | 'totalCollection'
  | 'avgCollection'
  | 'customersCollected'
  | 'dvConfirmed'
  | 'dvDenied'
  | 'dvConfirmationRate'
  | 'dvWithCommission'
  | 'dvWithoutCommission'
  | 'dvLoanSharing'
  | 'dvNoLoanSharing';

export function ComparisonCharts({ calls, payments = [], selectedCategory }: ComparisonChartsProps) {
  const [selectedStateKPI, setSelectedStateKPI] = useState<KPIMetric>('totalCalls');
  const [selectedProductKPI, setSelectedProductKPI] = useState<KPIMetric>('totalCalls');
  const [tableSelectedState, setTableSelectedState] = useState<string>('all');
  const [tableSelectedProduct, setTableSelectedProduct] = useState<string>('all');

  // Get unique states and products
  const uniqueStates = useMemo(() => {
    const states = new Set(calls.filter(c => c.state).map(c => c.state!));
    return Array.from(states).sort();
  }, [calls]);

  const uniqueProducts = useMemo(() => {
    const products = new Set(calls.filter(c => c.productType).map(c => c.productType!));
    return Array.from(products).sort();
  }, [calls]);

  // Calculate comprehensive stats by state
  const stateStats = useMemo(() => {
    return calls.reduce((acc, call) => {
      if (!call.state) return acc;
      
      if (!acc[call.state]) {
        acc[call.state] = {
          totalCalls: 0,
          answeredCalls: 0,
          promisedToPay: 0,
          requestedTime: 0,
          deniedToPay: 0,
          askedToCallBack: 0,
          others: 0,
          rnr: 0,
          totalDuration: 0,
          dvConfirmed: 0,
          dvDenied: 0,
          dvWithCommission: 0,
          dvWithoutCommission: 0,
          dvLoanSharing: 0,
          dvNoLoanSharing: 0,
        };
      }
      
      acc[call.state].totalCalls++;
      
      if (call.status.includes('Answered')) {
        acc[call.state].answeredCalls++;
      }
      
      if (call.status === 'RNR') acc[call.state].rnr++;
      
      if (call.responseTag === 'Promised to Pay') acc[call.state].promisedToPay++;
      else if (call.responseTag === 'Requested Time') acc[call.state].requestedTime++;
      else if (call.responseTag === 'Denied to Pay') acc[call.state].deniedToPay++;
      else if (call.responseTag === 'Asked to call back') acc[call.state].askedToCallBack++;
      else if (call.responseTag === 'Others') acc[call.state].others++;
      
      // Disbursement Verification stats
      if (call.disbursementData) {
        if (call.disbursementData.response === 'Confirmed') acc[call.state].dvConfirmed++;
        if (call.disbursementData.response === 'Denied') acc[call.state].dvDenied++;
        if (call.disbursementData.commission === true) acc[call.state].dvWithCommission++;
        if (call.disbursementData.commission === false) acc[call.state].dvWithoutCommission++;
        if (call.disbursementData.loanSharing === true) acc[call.state].dvLoanSharing++;
        if (call.disbursementData.loanSharing === false) acc[call.state].dvNoLoanSharing++;
      }
      
      acc[call.state].totalDuration += call.duration;
      
      return acc;
    }, {} as Record<string, any>);
  }, [calls]);

  // Calculate payment stats by state
  const statePaymentStats = useMemo(() => {
    return payments.reduce((acc, payment) => {
      if (!payment.state) return acc;
      
      if (!acc[payment.state]) {
        acc[payment.state] = {
          totalCollection: 0,
          customersCollected: new Set(),
        };
      }
      
      acc[payment.state].totalCollection += payment.amount;
      acc[payment.state].customersCollected.add(payment.phoneNumber);
      
      return acc;
    }, {} as Record<string, any>);
  }, [payments]);

  // Calculate comprehensive stats by product
  const productStats = useMemo(() => {
    return calls.reduce((acc, call) => {
      if (!call.productType) return acc;
      
      if (!acc[call.productType]) {
        acc[call.productType] = {
          totalCalls: 0,
          answeredCalls: 0,
          promisedToPay: 0,
          requestedTime: 0,
          deniedToPay: 0,
          askedToCallBack: 0,
          others: 0,
          rnr: 0,
          totalDuration: 0,
          dvConfirmed: 0,
          dvDenied: 0,
          dvWithCommission: 0,
          dvWithoutCommission: 0,
          dvLoanSharing: 0,
          dvNoLoanSharing: 0,
        };
      }
      
      acc[call.productType].totalCalls++;
      
      if (call.status.includes('Answered')) {
        acc[call.productType].answeredCalls++;
      }
      
      if (call.status === 'RNR') acc[call.productType].rnr++;
      
      if (call.responseTag === 'Promised to Pay') acc[call.productType].promisedToPay++;
      else if (call.responseTag === 'Requested Time') acc[call.productType].requestedTime++;
      else if (call.responseTag === 'Denied to Pay') acc[call.productType].deniedToPay++;
      else if (call.responseTag === 'Asked to call back') acc[call.productType].askedToCallBack++;
      else if (call.responseTag === 'Others') acc[call.productType].others++;
      
      // Disbursement Verification stats
      if (call.disbursementData) {
        if (call.disbursementData.response === 'Confirmed') acc[call.productType].dvConfirmed++;
        if (call.disbursementData.response === 'Denied') acc[call.productType].dvDenied++;
        if (call.disbursementData.commission === true) acc[call.productType].dvWithCommission++;
        if (call.disbursementData.commission === false) acc[call.productType].dvWithoutCommission++;
        if (call.disbursementData.loanSharing === true) acc[call.productType].dvLoanSharing++;
        if (call.disbursementData.loanSharing === false) acc[call.productType].dvNoLoanSharing++;
      }
      
      acc[call.productType].totalDuration += call.duration;
      
      return acc;
    }, {} as Record<string, any>);
  }, [calls]);

  // Calculate payment stats by product
  const productPaymentStats = useMemo(() => {
    return payments.reduce((acc, payment) => {
      if (!payment.productType) return acc;
      
      if (!acc[payment.productType]) {
        acc[payment.productType] = {
          totalCollection: 0,
          customersCollected: new Set(),
        };
      }
      
      acc[payment.productType].totalCollection += payment.amount;
      acc[payment.productType].customersCollected.add(payment.phoneNumber);
      
      return acc;
    }, {} as Record<string, any>);
  }, [payments]);

  const getKPIValue = (stats: any, paymentStats: any, kpi: KPIMetric) => {
    const total = stats?.totalCalls || 0;
    const answered = stats?.answeredCalls || 0;
    const dvConfirmed = stats?.dvConfirmed || 0;
    const dvDenied = stats?.dvDenied || 0;
    
    switch (kpi) {
      case 'totalCalls':
        return total;
      case 'answeredCalls':
        return answered;
      case 'successRate':
        return total > 0 ? Math.round((answered / total) * 100) : 0;
      case 'promisedToPay':
        return stats?.promisedToPay || 0;
      case 'requestedTime':
        return stats?.requestedTime || 0;
      case 'deniedToPay':
        return stats?.deniedToPay || 0;
      case 'askedToCallBack':
        return stats?.askedToCallBack || 0;
      case 'rnr':
        return stats?.rnr || 0;
      case 'avgDuration':
        return total > 0 ? Math.round((stats?.totalDuration || 0) / total) : 0;
      case 'totalCollection':
        return paymentStats?.totalCollection || 0;
      case 'avgCollection':
        const customers = paymentStats?.customersCollected?.size || 0;
        return customers > 0 ? Math.round((paymentStats?.totalCollection || 0) / customers) : 0;
      case 'customersCollected':
        return paymentStats?.customersCollected?.size || 0;
      case 'dvConfirmed':
        return dvConfirmed;
      case 'dvDenied':
        return dvDenied;
      case 'dvConfirmationRate':
        return (dvConfirmed + dvDenied) > 0 ? Math.round((dvConfirmed / (dvConfirmed + dvDenied)) * 100) : 0;
      case 'dvWithCommission':
        return stats?.dvWithCommission || 0;
      case 'dvWithoutCommission':
        return stats?.dvWithoutCommission || 0;
      case 'dvLoanSharing':
        return stats?.dvLoanSharing || 0;
      case 'dvNoLoanSharing':
        return stats?.dvNoLoanSharing || 0;
      default:
        return 0;
    }
  };

  const getKPILabel = (kpi: KPIMetric) => {
    switch (kpi) {
      case 'totalCalls': return 'Total Calls';
      case 'answeredCalls': return 'Answered Calls';
      case 'successRate': return 'Success Rate (%)';
      case 'promisedToPay': return 'Promised to Pay';
      case 'requestedTime': return 'Requested Time';
      case 'deniedToPay': return 'Denied to Pay';
      case 'askedToCallBack': return 'Asked to Call Back';
      case 'rnr': return 'RNR Count';
      case 'avgDuration': return 'Avg Duration (sec)';
      case 'totalCollection': return 'Total Collection (₹)';
      case 'avgCollection': return 'Avg Collection (₹)';
      case 'customersCollected': return 'Customers Collected';
      case 'dvConfirmed': return 'DV Confirmed';
      case 'dvDenied': return 'DV Denied';
      case 'dvConfirmationRate': return 'DV Confirmation Rate (%)';
      case 'dvWithCommission': return 'DV With Commission';
      case 'dvWithoutCommission': return 'DV Without Commission';
      case 'dvLoanSharing': return 'DV Loan Sharing';
      case 'dvNoLoanSharing': return 'DV No Loan Sharing';
      default: return '';
    }
  };

  const formatValue = (value: number, kpi: KPIMetric) => {
    if (kpi === 'totalCollection' || kpi === 'avgCollection') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(value);
    }
    if (kpi === 'successRate' || kpi === 'dvConfirmationRate') {
      return `${value}%`;
    }
    if (kpi === 'avgDuration') {
      return `${value}s`;
    }
    return value.toString();
  };

  const getPercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  // Calculate table data
  const tableData = useMemo(() => {
    let filteredCalls = calls;
    let filteredPayments = payments;

    if (tableSelectedState !== 'all') {
      filteredCalls = filteredCalls.filter(c => c.state === tableSelectedState);
      filteredPayments = filteredPayments.filter(p => p.state === tableSelectedState);
    }

    if (tableSelectedProduct !== 'all') {
      filteredCalls = filteredCalls.filter(c => c.productType === tableSelectedProduct);
      filteredPayments = filteredPayments.filter(p => p.productType === tableSelectedProduct);
    }

    const totalCalls = filteredCalls.length;
    const answeredCalls = filteredCalls.filter(c => c.status.includes('Answered')).length;
    const totalDuration = filteredCalls.reduce((sum, c) => sum + c.duration, 0);
    const totalCollection = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const customersCollected = new Set(filteredPayments.map(p => p.phoneNumber)).size;

    return {
      totalCalls,
      answeredCalls,
      successRate: totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0,
      promisedToPay: filteredCalls.filter(c => c.responseTag === 'Promised to Pay').length,
      requestedTime: filteredCalls.filter(c => c.responseTag === 'Requested Time').length,
      deniedToPay: filteredCalls.filter(c => c.responseTag === 'Denied to Pay').length,
      askedToCallBack: filteredCalls.filter(c => c.responseTag === 'Asked to call back').length,
      rnr: filteredCalls.filter(c => c.status === 'RNR').length,
      notReachable: filteredCalls.filter(c => c.status === 'Not Reachable').length,
      wrongNumber: filteredCalls.filter(c => c.status === 'Wrong Number').length,
      avgDuration: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0,
      totalCollection,
      avgCollection: customersCollected > 0 ? Math.round(totalCollection / customersCollected) : 0,
      customersCollected,
    };
  }, [calls, payments, tableSelectedState, tableSelectedProduct]);

  const kpiOptions: { value: KPIMetric; label: string }[] = [
    { value: 'totalCalls', label: 'Total Calls' },
    { value: 'answeredCalls', label: 'Answered Calls' },
    { value: 'successRate', label: 'Success Rate (%)' },
    { value: 'promisedToPay', label: 'Promised to Pay' },
    { value: 'requestedTime', label: 'Requested Time' },
    { value: 'deniedToPay', label: 'Denied to Pay' },
    { value: 'askedToCallBack', label: 'Asked to Call Back' },
    { value: 'rnr', label: 'RNR Count' },
    { value: 'avgDuration', label: 'Avg Duration' },
    { value: 'totalCollection', label: 'Total Collection' },
    { value: 'avgCollection', label: 'Avg Collection' },
    { value: 'customersCollected', label: 'Customers Collected' },
    { value: 'dvConfirmed', label: 'DV Confirmed' },
    { value: 'dvDenied', label: 'DV Denied' },
    { value: 'dvConfirmationRate', label: 'DV Confirmation Rate (%)' },
    { value: 'dvWithCommission', label: 'DV with Commission' },
    { value: 'dvWithoutCommission', label: 'DV without Commission' },
    { value: 'dvLoanSharing', label: 'DV Loan Sharing' },
    { value: 'dvNoLoanSharing', label: 'DV No Loan Sharing' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* State Comparison */}
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-blue-700" />
              <CardTitle className="text-blue-900">Performance by State</CardTitle>
            </div>
            <div className="space-y-2">
              <Label htmlFor="state-kpi" className="text-blue-900">Select KPI</Label>
              <Select value={selectedStateKPI} onValueChange={(value) => setSelectedStateKPI(value as KPIMetric)}>
                <SelectTrigger id="state-kpi" className="border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kpiOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {Object.keys(stateStats).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(stateStats)
                  .sort((a, b) => {
                    const aVal = getKPIValue(a[1], statePaymentStats[a[0]], selectedStateKPI);
                    const bVal = getKPIValue(b[1], statePaymentStats[b[0]], selectedStateKPI);
                    return bVal - aVal;
                  })
                  .map(([state, stats]) => {
                    const value = getKPIValue(stats, statePaymentStats[state], selectedStateKPI);
                    const maxValue = Math.max(...Object.entries(stateStats).map(([s, st]) => 
                      getKPIValue(st, statePaymentStats[s], selectedStateKPI)
                    ));
                    const percentage = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
                    
                    return (
                      <div key={state} className="border border-blue-200 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-blue-900">{state}</h4>
                          <div className="text-lg text-blue-700">
                            <strong>{formatValue(value, selectedStateKPI)}</strong>
                          </div>
                        </div>
                        <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          {stats.totalCalls} total calls
                        </p>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                <p className="text-blue-700">No state data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Type Comparison */}
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-blue-700" />
              <CardTitle className="text-blue-900">Performance by Product Type</CardTitle>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-kpi" className="text-blue-900">Select KPI</Label>
              <Select value={selectedProductKPI} onValueChange={(value) => setSelectedProductKPI(value as KPIMetric)}>
                <SelectTrigger id="product-kpi" className="border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kpiOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {Object.keys(productStats).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(productStats)
                  .sort((a, b) => {
                    const aVal = getKPIValue(a[1], productPaymentStats[a[0]], selectedProductKPI);
                    const bVal = getKPIValue(b[1], productPaymentStats[b[0]], selectedProductKPI);
                    return bVal - aVal;
                  })
                  .map(([product, stats]) => {
                    const value = getKPIValue(stats, productPaymentStats[product], selectedProductKPI);
                    const maxValue = Math.max(...Object.entries(productStats).map(([p, st]) => 
                      getKPIValue(st, productPaymentStats[p], selectedProductKPI)
                    ));
                    const percentage = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
                    
                    return (
                      <div key={product} className="border border-blue-200 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-blue-900">{product}</h4>
                          <div className="text-lg text-blue-700">
                            <strong>{formatValue(value, selectedProductKPI)}</strong>
                          </div>
                        </div>
                        <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          {stats.totalCalls} total calls
                        </p>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                <p className="text-blue-700">No product type data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive KPI Table */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
          <div className="flex items-center gap-2">
            <TableIcon className="h-5 w-5 text-blue-700" />
            <CardTitle className="text-blue-900">Comprehensive KPI View</CardTitle>
          </div>
          <CardDescription className="text-blue-700">
            All key performance indicators at a glance
          </CardDescription>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="table-state" className="text-blue-900">Filter by State</Label>
              <Select value={tableSelectedState} onValueChange={setTableSelectedState}>
                <SelectTrigger id="table-state" className="border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {uniqueStates.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="table-product" className="text-blue-900">Filter by Product Type</Label>
              <Select value={tableSelectedProduct} onValueChange={setTableSelectedProduct}>
                <SelectTrigger id="table-product" className="border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {uniqueProducts.map(product => (
                    <SelectItem key={product} value={product}>{product}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-50 border-b-2 border-blue-200">
                  <th className="text-left p-3 text-blue-900 font-semibold">KPI</th>
                  <th className="text-right p-3 text-blue-900 font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-blue-100 hover:bg-blue-50">
                  <td className="p-3 text-blue-800">Total Calls</td>
                  <td className="p-3 text-right text-blue-900 font-semibold">{tableData.totalCalls}</td>
                </tr>
                <tr className="border-b border-blue-100 hover:bg-blue-50">
                  <td className="p-3 text-blue-800">Answered Calls</td>
                  <td className="p-3 text-right text-blue-900 font-semibold">{tableData.answeredCalls}</td>
                </tr>
                <tr className="border-b border-blue-100 hover:bg-blue-50 bg-green-50">
                  <td className="p-3 text-green-800 font-semibold">Success Rate</td>
                  <td className="p-3 text-right text-green-900 font-bold text-lg">{tableData.successRate}%</td>
                </tr>
                <tr className="border-b border-blue-100 hover:bg-blue-50">
                  <td className="p-3 text-blue-800 pl-8">└ Promised to Pay</td>
                  <td className="p-3 text-right text-green-700 font-semibold">{tableData.promisedToPay}</td>
                </tr>
                <tr className="border-b border-blue-100 hover:bg-blue-50">
                  <td className="p-3 text-blue-800 pl-8">└ Requested Time</td>
                  <td className="p-3 text-right text-blue-700 font-semibold">{tableData.requestedTime}</td>
                </tr>
                <tr className="border-b border-blue-100 hover:bg-blue-50">
                  <td className="p-3 text-blue-800 pl-8">└ Denied to Pay</td>
                  <td className="p-3 text-right text-red-700 font-semibold">{tableData.deniedToPay}</td>
                </tr>
                <tr className="border-b border-blue-100 hover:bg-blue-50">
                  <td className="p-3 text-blue-800 pl-8">└ Asked to Call Back</td>
                  <td className="p-3 text-right text-purple-700 font-semibold">{tableData.askedToCallBack}</td>
                </tr>
                <tr className="border-b border-blue-100 hover:bg-blue-50">
                  <td className="p-3 text-blue-800">RNR (Ring No Response)</td>
                  <td className="p-3 text-right text-blue-900 font-semibold">{tableData.rnr}</td>
                </tr>
                <tr className="border-b border-blue-100 hover:bg-blue-50">
                  <td className="p-3 text-blue-800">Not Reachable</td>
                  <td className="p-3 text-right text-blue-900 font-semibold">{tableData.notReachable}</td>
                </tr>
                <tr className="border-b border-blue-100 hover:bg-blue-50">
                  <td className="p-3 text-blue-800">Wrong Number</td>
                  <td className="p-3 text-right text-blue-900 font-semibold">{tableData.wrongNumber}</td>
                </tr>
                <tr className="border-b border-blue-100 hover:bg-blue-50">
                  <td className="p-3 text-blue-800">Average Call Duration</td>
                  <td className="p-3 text-right text-blue-900 font-semibold">{tableData.avgDuration}s</td>
                </tr>
                <tr className="border-b-2 border-blue-200 bg-green-50 hover:bg-green-100">
                  <td className="p-3 text-green-900 font-bold">Total Collection</td>
                  <td className="p-3 text-right text-green-900 font-bold text-lg">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0,
                    }).format(tableData.totalCollection)}
                  </td>
                </tr>
                <tr className="border-b border-blue-100 hover:bg-blue-50">
                  <td className="p-3 text-blue-800">Customers Who Paid</td>
                  <td className="p-3 text-right text-blue-900 font-semibold">{tableData.customersCollected}</td>
                </tr>
                <tr className="hover:bg-blue-50">
                  <td className="p-3 text-blue-800">Average Collection per Customer</td>
                  <td className="p-3 text-right text-blue-900 font-semibold">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0,
                    }).format(tableData.avgCollection)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}