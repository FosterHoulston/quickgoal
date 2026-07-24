"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabaseClient";

type SignInScreenProps = {
  authReady: boolean;
};

export function SignInScreen({ authReady }: SignInScreenProps) {
  const { pushToast } = useToast();
  const [email, setEmail] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthNotice(null);
    if (!supabase) {
      setAuthError("Missing Supabase environment variables.");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setAuthError(error.message);
      pushToast(error.message, "error");
    } else {
      pushToast("Redirecting to Google sign-in.", "default");
    }
  };

  const handleEmailSignIn = async () => {
    setAuthError(null);
    setAuthNotice(null);
    if (!supabase) {
      setAuthError("Missing Supabase environment variables.");
      return;
    }
    if (!email.trim()) {
      setAuthError("Enter an email address to continue.");
      pushToast("Enter an email address to continue.", "error");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      setAuthError(error.message);
      pushToast(error.message, "error");
      return;
    }
    setAuthNotice("Check your email for a sign-in link.");
    pushToast("Check your email for a sign-in link.", "success");
    setEmail("");
  };

  return (
    <div className="min-h-screen px-6 py-8 text-[15px] text-[color:var(--color-text)]">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3 text-sm uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
            <span className="rounded-full border border-[color:var(--color-border)] px-3 py-1">
              Quickgoal
            </span>
            <span>Capture the moment, build momentum.</span>
          </div>
          <h1 className="max-w-3xl font-[var(--font-fraunces)] text-3xl leading-tight text-[color:var(--color-text)] md:text-4xl">
            A calm space for goals — with timestamps that start the instant you
            begin.
          </h1>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:rgba(var(--color-surface-rgb),0.9)] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Sign in</h2>
              <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                Required
              </span>
            </div>
            <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
              Sign in to access your goals dashboard and keep your progress synced.
            </p>
            <div className="mt-6 flex flex-col gap-4 text-sm text-[color:var(--color-text-subtle)]">
              {!authReady ? (
                <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                  Checking session...
                </span>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="rounded-full bg-[color:var(--color-button)] px-6 py-3 text-sm font-semibold text-[color:var(--color-button-text)] transition hover:bg-[color:var(--color-button-hover)]"
                  >
                    Continue with Google
                  </Button>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="h-auto rounded-2xl border-[color:var(--color-ink-15)] bg-[color:var(--color-surface)] px-4 py-3 text-sm shadow-sm transition focus-visible:ring-[color:var(--color-ring-40)]"
                    />
                    <Button
                      type="button"
                      onClick={handleEmailSignIn}
                      variant="outline"
                      className="rounded-full border-[color:var(--color-ink)] px-5 py-3 text-sm font-medium text-[color:var(--color-text)] transition hover:border-[color:var(--color-accent)]"
                    >
                      Email me a sign-in link
                    </Button>
                  </div>
                </>
              )}
              {authError ? (
                <span className="rounded-2xl border border-[color:var(--color-danger-soft)] bg-[color:var(--color-danger-soft-2)] px-4 py-2 text-xs text-[color:var(--color-danger-strong)]">
                  {authError}
                </span>
              ) : null}
              {authNotice ? (
                <span className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-xs text-[color:var(--color-text-muted)]">
                  {authNotice}
                </span>
              ) : null}
              {!supabase ? (
                <span className="text-xs text-[color:var(--color-text-muted)]">
                  Add your Supabase env vars to enable auth.
                </span>
              ) : null}
            </div>
          </section>
          <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:rgba(var(--color-surface-rgb),0.7)] p-6">
            <h2 className="text-lg font-semibold">Why Quickgoal?</h2>
            <ul className="mt-4 space-y-3 text-sm text-[color:var(--color-text-muted)]">
              <li>Capture goals fast with instant timestamps.</li>
              <li>Optional end dates keep you time-aware.</li>
              <li>Track wins and misses in one calm space.</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
