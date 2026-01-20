import { useState } from 'react';
import { api, User } from '../services/api';
import { useMutation } from '../hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface CreateUserFormProps {
  onUserCreated?: () => void;
}

export function CreateUserForm({ onUserCreated }: CreateUserFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const { data, loading, error, mutate, reset } = useMutation<
    User,
    [Omit<User, 'id'>]
  >(api.createUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await mutate({ name, email });
      // Clear form on success
      setName('');
      setEmail('');
      // Trigger refresh of user list
      onUserCreated?.();
      // Clear success message after 3 seconds
      setTimeout(() => reset(), 3000);
    } catch (err) {
      // Error is already handled by the hook
      console.error('Failed to create user:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New User</CardTitle>
        <CardDescription>
          Submit data to FastAPI backend
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create User'
            )}
          </Button>

          {data && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                User created successfully: {data.name}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to create user: {error}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
