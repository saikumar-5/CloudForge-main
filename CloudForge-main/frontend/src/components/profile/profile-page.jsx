import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Settings, LogOut, Trophy, Coins, Users, Calendar, ArrowLeft } from 'lucide-react';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 p-2 xs:p-3 sm:p-4 md:p-6">
      {/* Back Button */}
      <div className="max-w-2xl mx-auto mb-4">
        <Button
          onClick={() => navigate('/home')}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>

      <div className="max-w-2xl mx-auto space-y-4 xs:space-y-5 sm:space-y-6">
        {/* Profile Header Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white p-4 xs:p-5 sm:p-6">
          <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 xs:gap-4 mb-4 xs:mb-6">
            <h1 className="text-2xl xs:text-3xl font-bold">Profile</h1>
            <div className="flex gap-1 xs:gap-2">
              <Button onClick={() => setIsEditing(true)} variant="outline" className="border-white/20 text-white hover:bg-white/10 text-xs xs:text-sm px-2 py-1 xs:px-3 xs:py-2">
                Edit Profile
              </Button>
              <Button onClick={() => setShowSettings(true)} variant="outline" className="border-white/20 text-white hover:bg-white/10 text-xs xs:text-sm px-2 py-1 xs:px-3 xs:py-2">
                <Settings className="h-3 w-3 xs:h-4 xs:w-4 mr-1" />
                Settings
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col xs:flex-row items-center xs:items-start gap-4 xs:gap-6">
            <div className="h-16 w-16 xs:h-20 xs:w-20 sm:h-24 sm:w-24 rounded-full bg-blue-600 flex items-center justify-center text-xl xs:text-2xl sm:text-3xl font-bold text-white flex-shrink-0">
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 text-center xs:text-left">
              <h2 className="text-lg xs:text-xl sm:text-2xl font-semibold">{user.username}</h2>
              <p className="text-blue-200 text-sm xs:text-base">{user.email}</p>
              <div className="flex flex-wrap items-center justify-center xs:justify-start gap-2 xs:gap-3 mt-2">
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs xs:text-sm">
                  <Coins className="h-3 w-3 mr-1" />
                  {user.coins || 0}
                </Badge>
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs xs:text-sm">
                  <Trophy className="h-3 w-3 mr-1" />
                  {user.gamesWon || 0} Wins
                </Badge>
                {user.isGuest && (
                  <Badge variant="secondary" className="bg-gray-500/20 text-gray-300 border-gray-500/30 text-xs xs:text-sm">
                    Guest
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white p-4 xs:p-5 sm:p-6">
          <h3 className="text-lg xs:text-xl font-semibold mb-3 xs:mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 xs:h-5 xs:w-5" />
            Game Statistics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 xs:gap-4">
            <div className="text-center">
              <div className="text-lg xs:text-xl sm:text-2xl font-bold text-blue-300">{user.gamesPlayed || 0}</div>
              <div className="text-xs xs:text-sm text-blue-200">Games Played</div>
            </div>
            <div className="text-center">
              <div className="text-lg xs:text-xl sm:text-2xl font-bold text-green-300">{user.gamesWon || 0}</div>
              <div className="text-xs xs:text-sm text-green-200">Games Won</div>
            </div>
            <div className="text-center">
              <div className="text-lg xs:text-xl sm:text-2xl font-bold text-yellow-300">{user.coins || 0}</div>
              <div className="text-xs xs:text-sm text-yellow-200">Total Coins</div>
            </div>
            <div className="text-center">
              <div className="text-lg xs:text-xl sm:text-2xl font-bold text-purple-300">
                {user.gamesPlayed > 0 ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0}%
              </div>
              <div className="text-xs xs:text-sm text-purple-200">Win Rate</div>
            </div>
          </div>
        </Card>

        {/* Account Info Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white p-4 xs:p-5 sm:p-6">
          <h3 className="text-lg xs:text-xl font-semibold mb-3 xs:mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 xs:h-5 xs:w-5" />
            Account Information
          </h3>
          <div className="space-y-3 xs:space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
              <div className="flex-1">
                <Label className="text-xs xs:text-sm font-medium text-blue-200">Username</Label>
                <p className="mt-1 text-white text-sm xs:text-base break-all">{user.username}</p>
              </div>
              <Badge variant="outline" className="border-white/20 text-white text-xs xs:text-sm mt-1 sm:mt-0">
                {user.isGuest ? 'Guest Account' : 'Registered'}
              </Badge>
            </div>
            <div>
              <Label className="text-xs xs:text-sm font-medium text-blue-200">Email</Label>
              <p className="mt-1 text-white text-sm xs:text-base break-all">{user.email || 'Not provided (Guest)'}</p>
            </div>
            <div>
              <Label className="text-xs xs:text-sm font-medium text-blue-200">Unique ID</Label>
              <p className="mt-1 font-mono text-xs xs:text-sm text-white break-all">{user.id}</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
              <div className="flex-1">
                <Label className="text-xs xs:text-sm font-medium text-blue-200">Member Since</Label>
                <p className="mt-1 text-white text-sm xs:text-base flex items-center gap-2">
                  <Calendar className="h-3 w-3 xs:h-4 xs:w-4" />
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="border-slate-600 text-white hover:bg-slate-700">
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-white">Preferences</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Sound Effects</Label>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Notifications</Label>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Show Online Status</Label>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            <Separator className="bg-slate-700" />
            
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-white">Account</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Account Type</p>
                    <p className="text-sm text-slate-400">
                      {user.isGuest ? 'Guest Account' : 'Registered Account'}
                    </p>
                  </div>
                  <Badge variant={user.isGuest ? 'secondary' : 'default'} className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                    {user.isGuest ? 'Guest' : 'Registered'}
                  </Badge>
                </div>
                {!user.isGuest && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Email Verified</p>
                      <p className="text-sm text-slate-400">Account email status</p>
                    </div>
                    <Badge variant="outline" className="border-green-500/50 text-green-400">
                      Verified
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <Separator className="bg-slate-700" />

            <div className="space-y-4">
              <h4 className="text-lg font-medium text-red-400">Danger Zone</h4>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm('Are you sure you want to log out?')) {
                      updateProfile({}); // Clear auth context
                      window.location.href = '/';
                    }
                  }}
                  className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowSettings(false)} className="border-slate-600 text-white hover:bg-slate-700">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
