import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Toaster } from 'react-hot-toast'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-camp-bg flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto min-h-screen">
        <Outlet />
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#fff',
            color: '#1a1a1a',
            borderRadius: '12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#1f5f45', secondary: '#fff' },
          },
        }}
      />
    </div>
  )
}
