import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Zap, ArrowLeftRight, BarChart3,
  MessageSquare, BrainCircuit, Settings, ChevronLeft,
  ChevronRight, X, Activity,
} from 'lucide-react'
import { cn } from '@/utils/status'
import { useLang } from '@/contexts/LangContext'

interface NavItem {
  labelKey: keyof typeof import('@/i18n/en').default.nav
  icon: React.ElementType
  to: string
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: 'overview',      icon: LayoutDashboard, to: '/dashboard' },
  { labelKey: 'chargePoints',  icon: Zap,              to: '/charge-points' },
  { labelKey: 'transactions',  icon: ArrowLeftRight,   to: '/transactions' },
  { labelKey: 'analytics',     icon: BarChart3,        to: '/analytics' },
  { labelKey: 'messages',      icon: MessageSquare,    to: '/messages' },
  { labelKey: 'aiInsights',    icon: BrainCircuit,     to: '/ai-insights' },
  { labelKey: 'settings',      icon: Settings,         to: '/settings' },
]

interface SidebarProps {
  open: boolean
  collapsed: boolean
  onClose: () => void
  onToggleCollapse: () => void
}

export default function Sidebar({ open, collapsed, onClose, onToggleCollapse }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        style={{
          width: collapsed ? '72px' : '240px',
          transition: 'width 0.25s ease',
          background: 'linear-gradient(180deg, #0d1526 0%, #111d35 100%)',
          boxShadow: '4px 0 24px 0 rgb(0 0 0 / 0.15)',
        }}
        className="hidden lg:flex flex-col flex-shrink-0 h-full z-30"
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      </aside>

      {/* Mobile sidebar */}
      <aside
        style={{
          background: 'linear-gradient(180deg, #0d1526 0%, #111d35 100%)',
          boxShadow: '4px 0 24px 0 rgb(0 0 0 / 0.15)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          width: '240px',
        }}
        className="lg:hidden fixed inset-y-0 left-0 z-30 flex flex-col"
      >
        <div className="flex justify-end p-3 pt-4">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <SidebarContent collapsed={false} onToggleCollapse={onClose} showLogo />
      </aside>
    </>
  )
}

function SidebarContent({
  collapsed,
  onToggleCollapse,
  showLogo = true,
}: {
  collapsed: boolean
  onToggleCollapse: () => void
  showLogo?: boolean
}) {
  const { t } = useLang()
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-xl"
          style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            boxShadow: '0 0 16px rgba(59,130,246,0.4)',
          }}
        >
          <Activity size={18} color="white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-semibold text-sm leading-none">OCPP Dashboard</p>
            <p className="text-slate-400 text-xs mt-0.5">EV Charging Manager</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Collapse toggle */}
      <div
        className="hidden lg:flex px-2 pb-4 border-t pt-3"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <button
          onClick={onToggleCollapse}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/07 transition-colors text-sm',
            collapsed ? 'justify-center' : ''
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : (
            <>
              <ChevronLeft size={16} />
              <span>{t.nav.collapse}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function SidebarNavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const location = useLocation()
  const { t } = useLang()
  const isActive = location.pathname.startsWith(item.to)
  const Icon = item.icon
  const label = t.nav[item.labelKey]

  return (
    <NavLink
      to={item.to}
      title={collapsed ? label : undefined}
      className={cn('sidebar-item', isActive ? 'active' : '', collapsed ? 'justify-center px-2' : '')}
    >
      <Icon size={18} className="flex-shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )
}
