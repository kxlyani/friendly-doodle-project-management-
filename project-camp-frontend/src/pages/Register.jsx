import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Tent, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../components/ui/Spinner'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Please verify your email.')
      navigate('/login')
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-camp-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-camp-green/5 rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-camp-green/5 rounded-full" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-camp-green rounded-2xl flex items-center justify-center">
            <Tent size={20} className="text-white" />
          </div>
          <h1 className="font-display text-2xl text-camp-text-primary">Project Camp</h1>
        </div>

        <div className="card animate-fadeIn">
          <h2 className="text-2xl font-display text-camp-text-primary mb-1">Create account</h2>
          <p className="text-camp-text-secondary text-sm mb-6">Join your team on Project Camp</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-camp-text-secondary mb-1.5 block uppercase tracking-wider">
                Username
              </label>
              <input
                name="username"
                type="text"
                required
                className="input"
                placeholder="johndoe"
                value={form.username}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-camp-text-secondary mb-1.5 block uppercase tracking-wider">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-camp-text-secondary mb-1.5 block uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-camp-text-muted hover:text-camp-text-secondary"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading && <Spinner size="sm" />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-camp-text-secondary mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-camp-green font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
