"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseAuthClient } from "@/lib/supabase/authBrowser";

const signUpSuccessMessage =
  "Account created. Please check your email to confirm your account before signing in.";
const defaultNextPath = "/app/map";

function getSafeNextPath(search: string) {
  const nextPath = new URLSearchParams(search).get("next");

  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return defaultNextPath;
  }

  return nextPath;
}

function hasSafeNextPath(search: string) {
  const nextPath = new URLSearchParams(search).get("next");

  return Boolean(nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//"));
}

function RedirectState({ message, progress }: { message: string; progress: number }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-cream/60 px-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-sm rounded-lg border border-[#575527]/15 bg-white p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-[#575527] text-sm font-black text-white">
            L
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-black text-ink">{message}</p>
            <p className="mt-1 text-sm font-semibold leading-5 text-[#575527]/75">
              Keeping your place warm while Locco opens.
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-cream">
              <div
                className="h-full rounded-full bg-[#B97D7B] transition-[width] duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseAuthClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [safeNextPath, setSafeNextPath] = useState(defaultNextPath);
  const [wasSentToLogin, setWasSentToLogin] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState("Opening your Locco map");
  const [redirectProgress, setRedirectProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startRedirect = useCallback((targetPath: string) => {
    setRedirectMessage("Opening your Locco map");
    setRedirectProgress(12);
    setIsRedirecting(true);
    requestAnimationFrame(() => setRedirectProgress(100));
    router.replace(targetPath);
  }, [router]);

  useEffect(() => {
    const nextPath = getSafeNextPath(window.location.search);
    const hasNext = hasSafeNextPath(window.location.search);

    setSafeNextPath(nextPath);
    setWasSentToLogin(hasNext);

    if (!supabase) {
      setIsCheckingSession(false);
      return;
    }

    let isMounted = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!isMounted) return;

        if (data.user) {
          startRedirect(nextPath);
          return;
        }

        setIsCheckingSession(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setIsCheckingSession(false);
      });

    return () => {
      isMounted = false;
    };
  }, [startRedirect, supabase]);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setErrorMessage("Supabase Auth is not configured for this environment.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
    } else {
      startRedirect(safeNextPath);
    }
  }

  async function handleSignUp() {
    if (!supabase) {
      setErrorMessage("Supabase Auth is not configured for this environment.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage(signUpSuccessMessage);
    }

    setIsSubmitting(false);
  }

  return (
    <main className="min-h-dvh bg-cream px-4 py-8 text-ink">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md items-center">
        <section className="w-full rounded-lg bg-white p-5 shadow-sm ring-1 ring-[#575527]/10">
          <div className="inline-flex rounded-full bg-[#ECC4C3]/60 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#575527]">
            Locco
          </div>
          <h1 className="mt-4 text-3xl font-black leading-tight text-ink">
            Sign in to your food map
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#575527]/75">
            {wasSentToLogin
              ? "Sign in to continue to your Locco map."
              : "Use email and password to keep your trusted food spots close."}
          </p>

          <form onSubmit={handleSignIn} className="mt-6 grid gap-4">
            <label className="grid gap-1 text-sm font-bold text-stone-700">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting || isCheckingSession || isRedirecting}
                className="rounded-lg border border-[#575527]/15 bg-cream/40 px-3 py-3 font-normal outline-none transition focus:border-[#B97D7B] focus:bg-white disabled:opacity-60"
              />
            </label>

            <label className="grid gap-1 text-sm font-bold text-stone-700">
              Password
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting || isCheckingSession || isRedirecting}
                className="rounded-lg border border-[#575527]/15 bg-cream/40 px-3 py-3 font-normal outline-none transition focus:border-[#B97D7B] focus:bg-white disabled:opacity-60"
              />
            </label>

            {errorMessage ? (
              <p className="rounded-lg bg-[#ECC4C3]/35 px-3 py-2 text-sm font-bold text-ink">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-lg bg-[#FFF1B5]/80 px-3 py-2 text-sm font-bold text-[#575527]">
                {successMessage}
              </p>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="submit"
                disabled={isSubmitting || isCheckingSession || isRedirecting}
                className="rounded-full bg-[#231F20] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#575527] disabled:bg-[#231F20]/70 disabled:text-white disabled:opacity-100"
              >
                {isSubmitting || isCheckingSession ? "Checking..." : "Sign in"}
              </button>

              <button
                type="button"
                onClick={handleSignUp}
                disabled={isSubmitting || isCheckingSession || isRedirecting}
                className="rounded-full bg-white px-5 py-3 text-sm font-black text-ink ring-1 ring-[#575527]/15 transition hover:bg-[#ECC4C3]/25 disabled:opacity-60"
              >
                Sign up
              </button>
            </div>

            <p className="text-xs font-semibold leading-5 text-[#575527]/65">
              New accounts may need email confirmation before signing in.
            </p>
          </form>
        </section>
      </div>
      {isRedirecting ? <RedirectState message={redirectMessage} progress={redirectProgress} /> : null}
    </main>
  );
}
