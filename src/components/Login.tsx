import { useState } from "react";
import { Shield, Loader2, LogIn, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Enter your email address.");
      return;
    }

    if (!password) {
      setError("Enter your password.");
      return;
    }

    if (!supabase) {
      setError("Authentication is not configured.");
      return;
    }

    setSigningIn(true);

    try {
      const { error } = await supabase!.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("Sign-in failed:", error.code);
        setError("Invalid email or password.");
        return;
      }
    } catch (err) {
      console.error("Unexpected sign-in error:", err);
      setError("Unable to sign in. Please try again.");
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-bg-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <Shield size={22} className="text-accent-gold" />
          <span className="font-heading text-xl tracking-wide">
            ACADEMY REPORT
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <p className="mb-5 text-sm text-text-secondary">
            Sign in using your authorized coach account.
          </p>

          <label
            htmlFor="email"
            className="mb-1 block text-sm text-text-secondary"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="coach@academy.com"
            disabled={signingIn}
            className="mb-3 w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-border-hover disabled:opacity-60"
          />

          <label
            htmlFor="password"
            className="mb-1 block text-sm text-text-secondary"
          >
            Password
          </label>

          <div className="relative mb-3">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={signingIn}
              className="w-full rounded-md border border-border bg-bg-primary px-3 py-2 pr-10 text-sm text-text-primary outline-none focus:border-border-hover disabled:opacity-60"
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <p className="mb-3 font-mono text-xs text-[#E58F86]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={signingIn}
            className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-md bg-accent-gold px-4 py-2 text-sm font-medium text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {signingIn ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <LogIn size={14} />
            )}

            {signingIn ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
