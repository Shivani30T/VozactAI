import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Users, UserPlus, CheckCircle2, XCircle, Edit2, Trash2, Search } from 'lucide-react';
import { User, UserPlan } from '../types';

interface UserManagementProps {
  organizationName: string;
}

export function UserManagement({ organizationName }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([
    {
      id: 'user-001',
      username: 'user1',
      email: 'user1@callmanager.com',
      role: 'user',
      organizationId: 'org-001',
      plan: 'premium',
      isActive: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      credits: 1500,
    },
    {
      id: 'user-002',
      username: 'user2',
      email: 'user2@callmanager.com',
      role: 'user',
      organizationId: 'org-001',
      plan: 'basic',
      isActive: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
      credits: 750,
    },
    {
      id: 'user-003',
      username: 'user3',
      email: 'user3@callmanager.com',
      role: 'user',
      organizationId: 'org-001',
      plan: 'free',
      isActive: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
      credits: 100,
    },
  ]);

  const [showAddUser, setShowAddUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    plan: 'free' as UserPlan,
  });
  const [successMessage, setSuccessMessage] = useState('');

  const planOptions: UserPlan[] = ['free', 'basic', 'premium', 'enterprise'];

  const getPlanColor = (plan: UserPlan) => {
    switch (plan) {
      case 'free':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'basic':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'premium':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'enterprise':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleAddUser = () => {
    if (!newUser.username || !newUser.email) {
      return;
    }

    const user: User = {
      id: `user-${Date.now()}`,
      username: newUser.username,
      email: newUser.email,
      role: 'user',
      organizationId: 'org-001',
      plan: newUser.plan,
      isActive: true,
      createdAt: new Date().toISOString(),
      credits: 100,
    };

    setUsers([user, ...users]);
    setNewUser({ username: '', email: '', plan: 'free' });
    setShowAddUser(false);
    setSuccessMessage(`User ${user.username} added successfully!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    ));
  };

  const handleUpdatePlan = (userId: string, plan: UserPlan) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, plan } : user
    ));
    setSuccessMessage('Plan updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
      setSuccessMessage('User deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-blue-900 mb-1">User Management</h2>
        <p className="text-blue-700">Manage user access and plans for {organizationName}</p>
      </div>

      {successMessage && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200">
          <CardContent className="pt-6">
            <div className="text-2xl text-blue-900">{users.length}</div>
            <p className="text-sm text-blue-700">Total Users</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="pt-6">
            <div className="text-2xl text-green-700">{users.filter(u => u.isActive).length}</div>
            <p className="text-sm text-blue-700">Active Users</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="pt-6">
            <div className="text-2xl text-purple-700">
              {users.filter(u => u.plan === 'premium' || u.plan === 'enterprise').length}
            </div>
            <p className="text-sm text-blue-700">Premium+</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="pt-6">
            <div className="text-2xl text-red-700">{users.filter(u => !u.isActive).length}</div>
            <p className="text-sm text-blue-700">Inactive</p>
          </CardContent>
        </Card>
      </div>

      {/* Add user section */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Users className="h-5 w-5" />
                User List
              </CardTitle>
              <CardDescription className="text-blue-700">
                Manage user access and subscription plans
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAddUser(!showAddUser)}
              className="bg-blue-900 hover:bg-blue-800 text-white"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {showAddUser && (
            <div className="bg-blue-50 border border-blue-300 p-4 rounded-lg space-y-4">
              <h4 className="font-semibold text-blue-900">Add New User</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-username" className="text-blue-900">Username</Label>
                  <Input
                    id="new-username"
                    placeholder="Enter username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="border-blue-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email" className="text-blue-900">Email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="Enter email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="border-blue-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-plan" className="text-blue-900">Plan</Label>
                  <Select
                    value={newUser.plan}
                    onValueChange={(value) => setNewUser({ ...newUser, plan: value as UserPlan })}
                  >
                    <SelectTrigger className="border-blue-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {planOptions.map((plan) => (
                        <SelectItem key={plan} value={plan}>
                          {plan.charAt(0).toUpperCase() + plan.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAddUser}
                  disabled={!newUser.username || !newUser.email}
                  className="bg-blue-900 hover:bg-blue-800 text-white"
                >
                  Create User
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddUser(false);
                    setNewUser({ username: '', email: '', plan: 'free' });
                  }}
                  className="border-blue-300 text-blue-900"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
            <Input
              type="text"
              placeholder="Search users by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-blue-200"
            />
          </div>

          {/* Users table */}
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="border border-blue-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-blue-900">{user.username}</h4>
                      <Badge
                        variant="outline"
                        className={user.isActive 
                          ? 'bg-green-100 text-green-800 border-green-300' 
                          : 'bg-red-100 text-red-800 border-red-300'
                        }
                      >
                        {user.isActive ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Active</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                        )}
                      </Badge>
                      <Badge variant="outline" className={getPlanColor(user.plan!)}>
                        {user.plan?.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-blue-700">{user.email}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Created: {new Date(user.createdAt!).toLocaleDateString()} • Credits: {user.credits?.toLocaleString() || 0}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={user.plan}
                      onValueChange={(value) => handleUpdatePlan(user.id, value as UserPlan)}
                    >
                      <SelectTrigger className="w-[140px] border-blue-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {planOptions.map((plan) => (
                          <SelectItem key={plan} value={plan}>
                            {plan.charAt(0).toUpperCase() + plan.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(user.id)}
                      className="border-blue-300 text-blue-900"
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-blue-300 mx-auto mb-4" />
              <p className="text-blue-700">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan features */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-900 to-blue-800 border-b border-blue-700">
          <CardTitle className="text-white">Plan Features</CardTitle>
          <CardDescription className="text-blue-200">
            Compare features across different subscription plans
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold text-gray-900 mb-2">Free</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• 50 calls/month</li>
                <li>• Basic analytics</li>
                <li>• 7 days recording storage</li>
              </ul>
            </div>
            <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
              <h4 className="font-semibold text-blue-900 mb-2">Basic</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 500 calls/month</li>
                <li>• Advanced analytics</li>
                <li>• 30 days recording storage</li>
                <li>• Email support</li>
              </ul>
            </div>
            <div className="border border-purple-300 rounded-lg p-4 bg-purple-50">
              <h4 className="font-semibold text-purple-900 mb-2">Premium</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• 2000 calls/month</li>
                <li>• Full analytics suite</li>
                <li>• 90 days recording storage</li>
                <li>• Priority support</li>
                <li>• Campaign management</li>
              </ul>
            </div>
            <div className="border border-amber-300 rounded-lg p-4 bg-amber-50">
              <h4 className="font-semibold text-amber-900 mb-2">Enterprise</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Unlimited calls</li>
                <li>• Custom analytics</li>
                <li>• Unlimited storage</li>
                <li>• 24/7 dedicated support</li>
                <li>• API access</li>
                <li>• Team management</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}