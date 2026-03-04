import { useParams, Link } from 'react-router-dom'
import { Tent, CheckCircle, XCircle } from 'lucide-react'

// This page handles two cases:
// 1. /verify-email/success  — backend redirected here after successful verification
// 2. /verify-email/error    — backend redirected here after failed verification
// The actual verification is done by the backend when the user clicks the email link:
//   GET /api/v1/auth/verify-email/:token  → redirects to one of the above
export default function VerifyEmail() {
  const { verificationToken } = useParams()
  const status = verificationToken === 'success' ? 'success'
               : verificationToken === 'error'   ? 'error'
               : 'error' // unknown token param — shouldn't happen

  return (
    <div className="min-h-screen bg-camp-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-camp-green rounded-2xl flex items-center justify-center">
            <Tent size={20} className="text-white" />
          </div>
          <h1 className="font-display text-2xl text-camp-text-primary">Project Camp</h1>
        </div>

        <div className="card text-center animate-fadeIn">
          {status === 'success' && (
            <>
              <CheckCircle size={48} className="text-camp-green mx-auto mb-4" />
              <h2 className="font-display text-xl text-camp-text-primary mb-2">Email Verified!</h2>
              <p className="text-camp-text-secondary text-sm mb-6">
                Your email has been verified. You can now sign in.
              </p>
              <Link to="/login" className="btn-primary inline-block">Sign In</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle size={48} className="text-red-400 mx-auto mb-4" />
              <h2 className="font-display text-xl text-camp-text-primary mb-2">Verification Failed</h2>
              <p className="text-camp-text-secondary text-sm mb-6">
                The verification link is invalid or has expired.
              </p>
              <Link to="/login" className="btn-secondary inline-block">Back to Login</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}