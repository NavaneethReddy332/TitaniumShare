import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  User, 
  Shield, 
  CreditCard,
  Activity,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Wifi,
  AlertTriangle,
  Upload,
  Download,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type TabType = 'overview' | 'account' | 'security' | 'billing' | 'danger';

interface NavItemProps {
  id: TabType;
  icon: React.ElementType;
  label: string;
  active: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

function NavItem({ id, icon: Icon, label, active, isHovered, onClick, onMouseEnter }: NavItemProps) {
  return (
    <div className="relative" onMouseEnter={onMouseEnter}>
      {isHovered && (
        <motion.div
          layoutId="account-nav-hover"
          className="absolute inset-0 bg-zinc-800/60 rounded-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 350, 
            damping: 25,
            duration: 0.2
          }}
        />
      )}
      <button
        onClick={onClick}
        data-testid={`nav-${id}`}
        className={`
          relative z-10 w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors duration-200 rounded-md
          ${active 
            ? 'text-white' 
            : 'text-zinc-500'
          }
        `}
      >
        <Icon size={16} className={active ? 'text-cyan-500' : isHovered ? 'text-zinc-300' : ''} />
        <span className={isHovered && !active ? 'text-zinc-300' : ''}>{label}</span>
        {active && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-500 rounded-full" />}
      </button>
    </div>
  );
}

interface UsageCardProps {
  title: string;
  percentage: number;
  used: string;
  total: string;
  status?: string;
  color?: 'cyan' | 'green';
  testId?: string;
}

function UsageCard({ title, percentage, used, total, status, color = 'cyan', testId }: UsageCardProps) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-md p-5 transition-colors hover:border-zinc-700" data-testid={testId}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="text-[10px] text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded-full">
          {status || `${percentage}%`}
        </span>
      </div>
      <div className="space-y-2">
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${
              color === 'green' 
                ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
            }`}
          />
        </div>
        <div className="flex justify-between text-[11px] text-zinc-500">
          <span>{used}</span>
          <span>{total}</span>
        </div>
      </div>
    </div>
  );
}

interface ActivityItemRowProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  status?: string;
  testId?: string;
}

function ActivityItemRow({ icon: Icon, title, subtitle, status, testId }: ActivityItemRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-zinc-800 last:border-b-0" data-testid={testId}>
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 bg-zinc-900 rounded-md flex items-center justify-center">
          <Icon size={16} className="text-zinc-500" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-white truncate max-w-[200px]">{title}</h4>
          <p className="text-[11px] text-zinc-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {status && (
        <span className="text-[11px] text-zinc-600">{status}</span>
      )}
    </div>
  );
}

interface StorageData {
  usedBytes: number;
  usedFormatted: string;
  totalBytes: number;
  totalFormatted: string;
  percentage: number;
  fileCount: number;
}

interface ActivityItem {
  id: string;
  type: string;
  fileName: string;
  size: number;
  sizeFormatted: string;
  downloadCount: number;
  createdAt: string;
}

function OverviewTab() {
  const { user } = useAuth();
  
  const { data: storageData, isLoading: storageLoading } = useQuery<StorageData>({
    queryKey: ['/api/account/storage'],
  });

  const { data: activityData, isLoading: activityLoading } = useQuery<ActivityItem[]>({
    queryKey: ['/api/account/activity'],
  });
  
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-xl font-semibold text-white mb-1">Dashboard</h1>
      <p className="text-xs text-zinc-500 mb-8">Welcome back, {user?.username || user?.email?.split('@')[0] || 'User'}.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <UsageCard 
          title="Cloud Storage" 
          percentage={storageData?.percentage || 0} 
          used={storageLoading ? "Loading..." : (storageData?.usedFormatted || "0 B") + " Used"} 
          total={storageData?.totalFormatted || "1 GB"} 
          testId="card-cloud-storage"
        />
        <UsageCard 
          title="Transfers" 
          percentage={Math.min((storageData?.fileCount || 0) * 10, 100)} 
          used={`${storageData?.fileCount || 0} Files`} 
          total="This Month"
          status="Ready"
          color="green"
          testId="card-transfers"
        />
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-md p-5" data-testid="card-recent-activity">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
          <span className="text-[10px] text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded-full flex items-center gap-1" data-testid="badge-live">
            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>
        
        {activityLoading ? (
          <div className="text-center py-8">
            <Loader2 size={24} className="text-zinc-500 mx-auto animate-spin" />
          </div>
        ) : activityData && activityData.length > 0 ? (
          <div>
            {activityData.map((item) => (
              <ActivityItemRow
                key={item.id}
                icon={Upload}
                title={item.fileName}
                subtitle={`${item.sizeFormatted} - ${item.downloadCount} downloads`}
                status={formatTimeAgo(item.createdAt)}
                testId={`activity-${item.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity size={32} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No recent activity</p>
            <p className="text-[11px] text-zinc-600 mt-1">Your file transfers will appear here</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AccountTab() {
  const { user, refetch } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState(user?.username || '');
  
  const updateUsernameMutation = useMutation({
    mutationFn: async (newUsername: string) => {
      const res = await apiRequest('PATCH', '/api/account/username', { username: newUsername });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update username');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Username updated", description: "Your display name has been changed." });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-xl font-semibold text-white mb-1">Account</h1>
      <p className="text-xs text-zinc-500 mb-8">Manage your account settings.</p>

      <div className="bg-zinc-950 border border-zinc-800 rounded-md p-5 mb-5">
        <h3 className="text-sm font-semibold text-white mb-5">Profile Information</h3>
        
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-zinc-800 text-zinc-300 text-lg">
              {user?.username?.[0] || user?.email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="text-sm font-medium text-white">{user?.username || 'User'}</h4>
            <p className="text-xs text-zinc-500">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-2 font-semibold">
              Display Name
            </label>
            <Input 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              data-testid="input-display-name"
              className="bg-black border-zinc-800 text-white h-10 focus-visible:ring-0 focus-visible:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-2 font-semibold">
              Email Address
            </label>
            <Input 
              defaultValue={user?.email || ''}
              data-testid="input-email"
              className="bg-black border-zinc-800 text-white h-10 focus-visible:ring-0 focus-visible:border-cyan-500"
              disabled
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button 
            data-testid="btn-save-profile"
            onClick={() => updateUsernameMutation.mutate(username)}
            disabled={updateUsernameMutation.isPending || username === user?.username}
          >
            {updateUsernameMutation.isPending ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-md p-5">
        <h3 className="text-sm font-semibold text-white mb-5">Preferences</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm text-white">Email Notifications</h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">Receive transfer alerts via email</p>
            </div>
            <Switch data-testid="switch-email-notifications" />
          </div>
          <Separator className="bg-zinc-800" />
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm text-white">Auto-delete Files</h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">Delete files after 7 days</p>
            </div>
            <Switch data-testid="switch-auto-delete" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SecurityTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest('POST', '/api/account/change-password', data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to change password');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password changed", description: "Your password has been updated successfully." });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-xl font-semibold text-white mb-1">Security</h1>
      <p className="text-xs text-zinc-500 mb-8">Manage your security settings.</p>

      <div className="bg-zinc-950 border border-zinc-800 rounded-md p-5 mb-5">
        <h3 className="text-sm font-semibold text-white mb-5">Account Information</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-zinc-800">
            <div>
              <h4 className="text-sm text-white">Login Method</h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">How you sign in to your account</p>
            </div>
            <span className="text-xs text-zinc-400 bg-zinc-900 px-3 py-1 rounded-full capitalize">
              {user?.provider || 'Local'}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="text-sm text-white">Account Created</h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">When you joined Titanium</p>
            </div>
            <span className="text-xs text-zinc-400">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-md p-5 mb-5">
        <h3 className="text-sm font-semibold text-white mb-5">Change Password</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-2 font-semibold">
              Current Password
            </label>
            <Input 
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              data-testid="input-current-password"
              className="bg-black border-zinc-800 text-white h-10 focus-visible:ring-0 focus-visible:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-2 font-semibold">
              New Password
            </label>
            <Input 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              data-testid="input-new-password"
              className="bg-black border-zinc-800 text-white h-10 focus-visible:ring-0 focus-visible:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-2 font-semibold">
              Confirm New Password
            </label>
            <Input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              data-testid="input-confirm-password"
              className="bg-black border-zinc-800 text-white h-10 focus-visible:ring-0 focus-visible:border-cyan-500"
            />
          </div>
          <div className="pt-2">
            <Button 
              onClick={handlePasswordChange}
              disabled={changePasswordMutation.isPending || !newPassword || !confirmPassword}
              data-testid="btn-change-password"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Changing...
                </>
              ) : 'Change Password'}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-md p-5 mb-5">
        <h3 className="text-sm font-semibold text-white mb-5">Current Session</h3>
        
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-zinc-900 rounded-md flex items-center justify-center">
              <Settings size={16} className="text-zinc-500" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white">This Browser</h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">Currently active session</p>
            </div>
          </div>
          <div className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-md p-5">
        <h3 className="text-sm font-semibold text-white mb-5">Two-Factor Authentication</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm text-white">Enable 2FA</h4>
            <p className="text-[11px] text-zinc-500 mt-0.5">Coming soon</p>
          </div>
          <Switch data-testid="switch-2fa" disabled />
        </div>
      </div>
    </motion.div>
  );
}

function BillingTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-xl font-semibold text-white mb-1">Billing</h1>
      <p className="text-xs text-zinc-500 mb-8">Manage your subscription and payments.</p>

      <div className="bg-zinc-950 border border-zinc-800 rounded-md p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Current Plan</h3>
          <span className="text-[10px] bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 px-2 py-0.5 rounded-full">
            Free Tier
          </span>
        </div>
        
        <div className="bg-black border border-zinc-800 rounded-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-white">Free</h4>
              <p className="text-xs text-zinc-500">1GB Storage - 100 API calls/month</p>
            </div>
            <span className="text-2xl font-bold text-white">$0<span className="text-sm text-zinc-500">/mo</span></span>
          </div>
        </div>

        <Button 
          data-testid="btn-upgrade"
          className="w-full"
        >
          Upgrade to Pro
        </Button>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-md p-5">
        <h3 className="text-sm font-semibold text-white mb-5">Payment History</h3>
        
        <div className="text-center py-8">
          <FileText size={32} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No payment history</p>
          <p className="text-[11px] text-zinc-600 mt-1">Invoices will appear here once you upgrade</p>
        </div>
      </div>
    </motion.div>
  );
}

function DangerZoneTab() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [confirmEmail, setConfirmEmail] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', '/api/account', { confirmEmail });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete account');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
      logout();
      navigate('/');
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-xl font-semibold text-white mb-1">Danger Zone</h1>
      <p className="text-xs text-zinc-500 mb-8">Irreversible and destructive actions.</p>

      <div className="bg-zinc-950 border border-red-900/50 rounded-md p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/10 rounded-md flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Delete Account</h3>
            <p className="text-[11px] text-zinc-500">Permanently delete your account and all data</p>
          </div>
        </div>

        <div className="bg-red-500/5 border border-red-900/30 rounded-md p-4 mb-5">
          <h4 className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wider">Warning</h4>
          <ul className="text-xs text-zinc-400 space-y-1">
            <li>All your files will be permanently deleted</li>
            <li>Your account data will be erased</li>
            <li>You will NOT be able to create a new account with this email for 5 days</li>
            <li>This action cannot be undone</li>
          </ul>
        </div>

        {!showConfirm ? (
          <Button 
            variant="destructive"
            onClick={() => setShowConfirm(true)}
            data-testid="btn-show-delete-confirm"
            className="w-full"
          >
            Delete My Account
          </Button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-2 font-semibold">
                Type your email to confirm: <span className="text-red-400">{user?.email}</span>
              </label>
              <Input 
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="Enter your email"
                data-testid="input-confirm-delete-email"
                className="bg-black border-red-900/50 text-white h-10 focus-visible:ring-0 focus-visible:border-red-500"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmEmail('');
                }}
                className="flex-1"
                data-testid="btn-cancel-delete"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => deleteAccountMutation.mutate()}
                disabled={deleteAccountMutation.isPending || confirmEmail !== user?.email}
                className="flex-1"
                data-testid="btn-confirm-delete"
              >
                {deleteAccountMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : 'Permanently Delete'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Account() {
  const { user, logout, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [hoveredNavItem, setHoveredNavItem] = useState<TabType | null>(null);

  const navItems: { id: TabType; icon: React.ElementType; label: string }[] = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'account', icon: User, label: 'Account' },
    { id: 'security', icon: Shield, label: 'Security' },
    { id: 'billing', icon: CreditCard, label: 'Billing' },
    { id: 'danger', icon: AlertTriangle, label: 'Danger Zone' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'account':
        return <AccountTab />;
      case 'security':
        return <SecurityTab />;
      case 'billing':
        return <BillingTab />;
      case 'danger':
        return <DangerZoneTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="h-screen bg-black text-white font-mono flex flex-col overflow-hidden">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute w-[600px] h-[600px] -top-[200px] -left-[200px] opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'breath 10s infinite alternate',
          }}
        />
      </div>

      <style>{`
        @keyframes breath {
          0% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          100% { transform: translate(50px, 50px) scale(1.1); opacity: 0.5; }
        }
      `}</style>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 shrink-0 z-10 bg-black/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-3 text-zinc-500 hover:text-white transition-colors">
          <ChevronRight size={16} className="rotate-180" />
          <span className="text-xs uppercase tracking-wider">Back to Titanium</span>
        </Link>
        
        <div className="flex items-center gap-3">
          {user && (
            <>
              <span className="text-xs text-zinc-500">{user.email}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => logout()}
                data-testid="btn-logout"
                className="text-zinc-400 hover:text-red-500 hover:bg-red-500/10"
              >
                <LogOut size={14} />
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-60 border-r border-zinc-900 p-4 flex flex-col bg-black/60 backdrop-blur-md shrink-0">
          <nav className="flex flex-col gap-1 flex-1 mt-4" onMouseLeave={() => setHoveredNavItem(null)}>
            <AnimatePresence>
              {navItems.map((item) => (
                <NavItem
                  key={item.id}
                  id={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeTab === item.id}
                  isHovered={hoveredNavItem === item.id}
                  onClick={() => setActiveTab(item.id)}
                  onMouseEnter={() => setHoveredNavItem(item.id)}
                />
              ))}
            </AnimatePresence>
          </nav>

          {/* User Profile */}
          <div className="mt-auto pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-3 px-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
                  {user?.username?.[0] || user?.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-medium text-white">{user?.username || 'User'}</p>
                <p className="text-[10px] text-zinc-600">Free Plan</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-12 overflow-y-auto">
          <div className="max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-3 flex items-center justify-between bg-black shrink-0 z-10">
        <div className="flex items-center gap-2 text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
          <span>Powered by</span>
          <span className="text-white font-bold flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-white rounded-sm" /> REPLIT
          </span>
        </div>

        <div className="border border-zinc-900 bg-zinc-950 px-3 py-1.5 flex items-center gap-4 min-w-[160px]">
          <Wifi size={12} className="text-zinc-600" />
          <div className="flex-1 flex justify-between items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-600 font-mono uppercase">Down</span>
              <span className="text-[10px] text-zinc-300 font-mono">80.7 Mbps</span>
            </div>
            <div className="h-5 w-px bg-zinc-900" />
            <div className="flex flex-col text-right">
              <span className="text-[8px] text-zinc-600 font-mono uppercase">Up</span>
              <span className="text-[10px] text-zinc-300 font-mono">38.3 Mbps</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
