import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Phone, LogOut, User, Shield, Coins } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-gradient-to-r from-blue-900 to-blue-800 border-b border-blue-700 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and title */}
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg shadow-md">
              <Phone className="h-6 w-6 text-blue-900" />
            </div>
            <div>
              <h1 className="text-xl text-white">Voizmatic</h1>
              <p className="text-xs text-blue-200">AI Voice in Action</p>
            </div>
          </div>

          {/* User info and logout */}
          <div className="flex items-center gap-4">
            {/* Credits Display */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-300" />
                <div>
                  <p className="text-xs text-blue-200">Credits</p>
                  <p className="font-semibold text-white">{user?.credits?.toLocaleString() || 0}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-white text-blue-900">
                  {user ? getInitials(user.username) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white">{user?.username}</p>
                  <Badge 
                    variant="outline" 
                    className={user?.role === 'admin' 
                      ? 'bg-blue-100 text-blue-900 border-blue-300' 
                      : 'bg-white text-blue-900 border-blue-300'
                    }
                  >
                    {user?.role === 'admin' ? (
                      <><Shield className="h-3 w-3 mr-1" /> Admin</>
                    ) : (
                      <><User className="h-3 w-3 mr-1" /> User</>
                    )}
                  </Badge>
                </div>
                <p className="text-sm text-blue-200">{user?.email}</p>
              </div>
            </div>
            
            <Button variant="outline" onClick={logout} className="bg-white text-blue-900 border-blue-300 hover:bg-blue-50">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}