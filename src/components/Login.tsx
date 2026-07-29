import { useState } from "react";
import { Shield, Loader2, Mail, Check } from "lucide-react";
import { supabase } from "../lib/supabase";

/**
 * Magic-link sign-in for the coach. Shown only when VITE_REQUIRE_AUTH=true and
 * Supabase is configured. Enters an email, Supabase emails a one-click link, and
 * on return the session is picked up by the auth listener in App.
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError("Enter your email.");
    setSending(true);
    try {
      const { error } = await supabase!.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      console.error(err);
      setError("Couldn't send the link. Check the email and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield size={22} className="text-accent-gold" />
          <span className="font-heading text-xl tracking-wide">ACADEMY REPORT</span>
        </div>

        {sent ? (
          <div className="rounded-md border border-accent-green/40 bg-accent-green/10 p-4">
            <div className="mb-1 flex items-center gap-2 text-accent-green">
              <Check size={16} />
              <span className="font-heading text-lg">Check your email</span>
            </div>
            <p className="text-sm text-text-secondary">
              We sent a sign-in link to <span className="text-text-primary">{email}</span>. Open it
              on this device to continue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="mb-4 text-sm text-text-secondary">
              Coach sign-in. Enter your email and we'll send you a one-click link.
            </p>
            <label className="mb-1 block text-sm text-text-secondary">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coach@academy.com"
              className="mb-3 w-full rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none focus:border-border-hover"
            />
            {error && <p className="mb-3 font-mono text-xs text-[#E58F86]">{error}</p>}
            <button
              type="submit"
              disabled={sending}
              className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-md bg-accent-gold px-4 py-2 text-sm font-medium text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
              Send sign-in link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
