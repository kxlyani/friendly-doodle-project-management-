import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/auth.api";
import { EyeOff, Eye, User, Lock } from "lucide-react";
import Spinner from "../components/ui/Spinner";
import Avatar from "../components/ui/Avatar";
import toast from "react-hot-toast";

export default function Settings() {
  const { user, refetchUser } = useAuth();
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
  });
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoadingPassword(true);
    try {
      await authApi.changePassword(passwordForm);
      toast.success("Password changed successfully");
      setPasswordForm({ newPassword: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to change password");
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleResendVerification = async () => {
    setLoadingResend(true);
    try {
      await authApi.resendEmailVerification();
      toast.success("Verification email sent!");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to resend verification",
      );
    } finally {
      setLoadingResend(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 animate-fadeIn">
        <h1 className="font-display text-3xl text-camp-text-primary">
          Settings
        </h1>
        <p className="text-camp-text-secondary mt-1">
          Manage your account preferences
        </p>
      </div>

      {/* Profile */}
      <div className="card mb-5 animate-fadeIn">
        <h2 className="font-semibold text-camp-text-primary flex items-center gap-2 mb-5">
          <User size={16} className="text-camp-green" />
          Profile
        </h2>
        <div className="flex items-center gap-5">
          <Avatar
            name={user?.fullName || user?.username || "U"}
            src={user?.avatar?.url}
            size="sm"
          />
          <div>
            <p className="font-semibold text-camp-text-primary text-lg">
              {user?.fullName || user?.username}
            </p>
            <p className="text-sm text-camp-text-secondary">{user?.email}</p>
            {user?.isEmailVerified === false && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                  Email not verified
                </span>
                <button
                  onClick={handleResendVerification}
                  disabled={loadingResend}
                  className="text-xs text-camp-green hover:underline font-medium flex items-center gap-1"
                >
                  {loadingResend && <Spinner size="sm" />}
                  Resend verification
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card animate-fadeIn" style={{ animationDelay: "60ms" }}>
        <h2 className="font-semibold text-camp-text-primary flex items-center gap-2 mb-5">
          <Lock size={16} className="text-camp-green" />
          Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-camp-text-secondary mb-1.5 block uppercase tracking-wider">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                className="input pr-10"
                placeholder="••••••••"
                required
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((f) => ({
                    ...f,
                    newPassword: e.target.value,
                  }))
                }
              />
              <button
                type="button"
                onClick={() => setShowNew((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-camp-text-muted hover:text-camp-text-secondary"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loadingPassword}
              className="btn-primary flex items-center gap-2"
            >
              {loadingPassword && <Spinner size="sm" />}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
