import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/auth.api'
import { Tent, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../components/ui/Spinner'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.forgotPassword({ email })
      setSent(true)
      toast.success('Reset email sent!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-camp-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-camp-green rounded-2xl flex items-center justify-center">
            <Tent size={20} className="text-white" />
          </div>
          <h1 className="font-display text-2xl text-camp-text-primary">Project Camp</h1>
        </div>

        <div className="card animate-fadeIn">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-camp-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✉️</span>
              </div>
              <h2 className="font-display text-xl text-camp-text-primary mb-2">Check your email</h2>
              <p className="text-camp-text-secondary text-sm mb-6">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                <ArrowLeft size={16} />
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-display text-camp-text-primary mb-1">Forgot password?</h2>
              <p className="text-camp-text-secondary text-sm mb-6">
                Enter your email and we'll send you a reset link
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-camp-text-secondary mb-1.5 block uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading && <Spinner size="sm" />}
                  Send Reset Link
                </button>
              </form>

              <p className="text-center text-sm text-camp-text-secondary mt-6">
                <Link to="/login" className="text-camp-green hover:underline flex items-center justify-center gap-1">
                  <ArrowLeft size={14} />
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
