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
  Wifi
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

type TabType = 'overview' | 'account' | 'security' | 'billing';

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

interface ActivityItemProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  status?: string;
  testId?: string;
}

function ActivityItem({ icon: Icon, title, subtitle, status, testId }: ActivityItemProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-zinc-800 last:border-b-0" data-testid={testId}>
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 bg-zinc-900 rounded-md flex items-center justify-center">
          <Icon size={16} className="text-zinc-500" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-white">{title}</h4>
          <p className="text-[11px] text-zinc-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {status && (
        <span className="text-[11px] text-zinc-600">{status}</span>
      )}
    </div>
  );
}

function OverviewTab() {
  const { user } = useAuth();
  
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
          percentage={0} 
          used="0MB Used" 
          total="1GB Total"
          testId="card-cloud-storage"
        />
        <UsageCard 
          title="Transfers" 
          percentage={0} 
          used="0 Files" 
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
        
        <div className="text-center py-8">
          <Activity size={32} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No recent activity</p>
          <p className="text-[11px] text-zinc-600 mt-1">Your file transfers will appear here</p>
        </div>
      </div>
    </motion.div>
  );
}

function AccountTab() {
  const { user } = useAuth();
  
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
              defaultValue={user?.username || ''}
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
          >
            Save Changes
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

export default function Account() {
  const { user, logout, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [hoveredNavItem, setHoveredNavItem] = useState<TabType | null>(null);

  const navItems: { id: TabType; icon: React.ElementType; label: string }[] = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'account', icon: User, label: 'Account' },
    { id: 'security', icon: Shield, label: 'Security' },
    { id: 'billing', icon: CreditCard, label: 'Billing' },
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
          <div className="flex items-center gap-2 px-4 mb-8">
            <div className="w-6 h-6 bg-cyan-500 rounded flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <span className="text-black text-xs font-bold">T</span>
            </div>
            <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-semibold">Titanium // Account</span>
          </div>

          <nav className="flex flex-col gap-1 flex-1" onMouseLeave={() => setHoveredNavItem(null)}>
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
            {renderContent()}
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
