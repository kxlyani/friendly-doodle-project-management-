import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { adminApi } from '../../api/admin.api'
import toast from 'react-hot-toast'
import BottomRightHub from './BottomRightHub'

export default function AppLayout() {
  const [impersonation, setImpersonation] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await adminApi.impersonationStatus()
        const data = res.data?.data || res.data
        if (!mounted) return
        setImpersonation(data?.active ? data : null)
      } catch {
        // If user is not system_admin, this endpoint will 403 — ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const stopImpersonation = async () => {
    try {
      await adminApi.stopImpersonation()
      setImpersonation(null)
      toast.success('Impersonation stopped')
      window.location.reload()
    } catch {
      toast.error('Failed to stop impersonation')
    }
  }

  return (
    <div className="min-h-screen bg-camp-bg flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto min-h-screen">
        {impersonation ? (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="text-sm text-yellow-900">
              <span className="font-semibold">Impersonating</span>{' '}
              {impersonation.impersonatedUser?.email ||
                impersonation.impersonatedUser?.username ||
                'user'}
              {impersonation.expiresAt ? (
                <span className="text-yellow-800">
                  {' '}
                  until {new Date(impersonation.expiresAt).toLocaleString()}
                </span>
              ) : null}
            </div>
            <button className="btn-secondary" onClick={stopImpersonation}>
              Stop
            </button>
          </div>
        ) : null}
        <Outlet />
      </main>
      <BottomRightHub />
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
