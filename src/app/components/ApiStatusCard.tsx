import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Activity, RefreshCw } from 'lucide-react';

export function ApiStatusCard() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkApiStatus = async () => {
    setStatus('checking');
    try {
      // Try to ping a health check endpoint on your FastAPI backend
      // Replace '/health' with your actual health check endpoint
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
      });
      
      if (response.ok) {
        setStatus('online');
      } else {
        setStatus('offline');
      }
    } catch (error) {
      setStatus('offline');
    } finally {
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkApiStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      default:
        return 'Checking...';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>FastAPI Backend Status</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkApiStatus}
            disabled={status === 'checking'}
          >
            <RefreshCw className={`h-4 w-4 ${status === 'checking' ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>Backend URL: {API_BASE_URL}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${getStatusColor()}`} />
            <span>{getStatusText()}</span>
          </div>
          {lastChecked && (
            <span className="text-sm text-gray-500">
              Last checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}
        </div>
        
        {status === 'offline' && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              <strong>Backend not accessible.</strong> Please ensure:
            </p>
            <ul className="text-sm text-amber-800 mt-2 ml-4 list-disc">
              <li>FastAPI server is running</li>
              <li>CORS is properly configured</li>
              <li>Backend URL is correct in .env file</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
