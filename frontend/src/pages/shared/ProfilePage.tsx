import React, { useState } from 'react';
import { User as UserIcon, Mail, Shield, Key, Save, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { profileApi } from '../../api/profileApi';
import { PageHeader, Tabs, Input, Button, Card } from '../../components/ui';

const TABS = [
  { id: 'profile', label: 'Profile Info', icon: <UserIcon className="w-4 h-4" /> },
  { id: 'security', label: 'Security', icon: <Lock className="w-4 h-4" /> },
];

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [name, setName] = useState<string>(user?.name || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [changingPassword, setChangingPassword] = useState<boolean>(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { showToast('Name and email are required', 'warning'); return; }
    setSavingProfile(true);
    try {
      const updatedUser = await profileApi.updateProfile({ name: name.trim(), email: email.trim() });
      showToast('Profile updated successfully!', 'success');
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem('user', JSON.stringify({ ...parsed, ...updatedUser }));
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) { showToast('Please enter your current password', 'warning'); return; }
    if (newPassword.length < 6) { showToast('New password must be at least 6 characters', 'warning'); return; }
    if (newPassword !== confirmPassword) { showToast('New passwords do not match', 'warning'); return; }
    setChangingPassword(true);
    try {
      await profileApi.changePassword({ current_password: currentPassword, new_password: newPassword });
      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<UserIcon className="w-5 h-5" />}
        title="My Profile & Account Settings"
        subtitle="Manage your personal details, email address, and security preferences."
      />

      {/* Profile Banner */}
      <Card className="bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-900/60 border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-500 text-white font-bold text-3xl flex items-center justify-center shadow-xl shadow-primary-500/20 shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{user?.name}</h2>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${user?.role === 'manager' ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' : 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20'}`}>
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center justify-center sm:justify-start gap-2">
              <Mail className="w-4 h-4" /> {user?.email}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-zinc-400 font-mono">
              {user?.role === 'manager' ? (
                <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-violet-500" /> Full Manager Access</span>
              ) : (
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Team Member Access</span>
              )}
              {user?.created_at && (
                <span>Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'profile' | 'security')}
      />

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card className="max-w-lg">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-5 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-primary-500" /> Update Profile Information
          </h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              icon={<UserIcon className="w-4 h-4" />}
              autoComplete="name"
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
            />
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Role</label>
              <div className="px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <Lock className="w-4 h-4 text-zinc-400" />
                <span className="capitalize">{user?.role?.replace('_', ' ')} — role cannot be changed</span>
              </div>
            </div>
            <Button type="submit" variant="primary" loading={savingProfile} icon={<Save className="w-4 h-4" />}>
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card className="max-w-lg">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-5 flex items-center gap-2">
            <Key className="w-4 h-4 text-primary-500" /> Change Password
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              icon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              icon={<Key className="w-4 h-4" />}
              hint="Must be at least 6 characters long."
              autoComplete="new-password"
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              icon={<Key className="w-4 h-4" />}
              error={confirmPassword && newPassword !== confirmPassword ? "Passwords don't match" : undefined}
              autoComplete="new-password"
            />
            <Button type="submit" variant="primary" loading={changingPassword} icon={<Key className="w-4 h-4" />}>
              {changingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
            <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary-500" /> Security Best Practices
            </h4>
            {['Use at least 8+ characters with mixed case, numbers, and symbols.', 'Avoid reusing passwords from other services.', 'Change your password regularly (every 90 days).'].map((tip, i) => (
              <p key={i} className="text-[11px] text-zinc-400 flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> {tip}
              </p>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
