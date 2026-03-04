import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  FileText,
  Settings,
  LogOut,
  Tent,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'
import toast from 'react-hot-toast'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: FolderOpen, label: 'Projects', to: '/projects' },
  { icon: CheckSquare, label: 'My Tasks', to: '/tasks' },
  { icon: FileText, label: 'Notes', to: '/notes' },
  { icon: Settings, label: 'Settings', to: '/settings' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
      toast.success('Logged out successfully')
    } catch {
      toast.error('Failed to logout')
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white flex flex-col shadow-card z-40 border-r border-gray-100">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-gray-100">
        <div className="w-9 h-9 bg-camp-green rounded-xl flex items-center justify-center">
          <Tent size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-display text-lg text-camp-text-primary leading-tight">Project Camp</h1>
          <p className="text-xs text-camp-text-muted">Workspace</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <p className="text-xs font-semibold text-camp-text-muted uppercase tracking-wider mb-3 px-2">
          Navigation
        </p>
        <ul className="space-y-1">
          {navItems.map(({ icon: Icon, label, to }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-camp-green text-white shadow-green'
                      : 'text-camp-text-secondary hover:bg-camp-bg hover:text-camp-text-primary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} className={isActive ? 'text-white' : 'text-camp-text-muted group-hover:text-camp-green'} />
                    <span className="flex-1">{label}</span>
                    {isActive && <ChevronRight size={14} className="text-white/70" />}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-camp-bg transition-colors">
          <Avatar name={user?.fullName || user?.username || 'U'} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-camp-text-primary truncate">
              {user?.fullName || user?.username}
            </p>
            <p className="text-xs text-camp-text-muted truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-150"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
