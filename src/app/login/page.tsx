"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createBrowserSupabaseAuthClient } from "@/lib/supabase/authBrowser";

const signUpSuccessMessage =
  "Account created. Please check your email to confirm your account before signing in.";

function getSafeNextPath() {
  const nextPath = new URLSearchParams(window.location.search).get("next");

  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/app/map";
  }

  return nextPath;
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseAuthClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } else {
      setSuccessMessage("Signed in. Taking you to Locco.");
      router.replace(getSafeNextPath());
    }

    setIsSubmitting(false);
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
    <main className="min-h-dvh bg-cream px-4 py-8">
      <div className="mx-auto max-w-md">
        <Link href="/app" className="text-sm font-bold text-tomato">
          Back to Locco
        </Link>

        <section className="mt-6 rounded-lg bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-semibold text-tomato">Supabase Auth</p>
          <h1 className="mt-2 text-3xl font-black text-ink">Sign in to Locco</h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Signing in is optional for now. The app still works with mock/demo data.
          </p>

          <form onSubmit={handleSignIn} className="mt-6 grid gap-4">
            <label className="grid gap-1 text-sm font-bold text-stone-700">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-lg border border-stone-200 px-3 py-2 font-normal"
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
                className="rounded-lg border border-stone-200 px-3 py-2 font-normal"
              />
            </label>

            {errorMessage ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                {successMessage}
              </p>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-ink px-5 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                {isSubmitting ? "Working..." : "Sign in"}
              </button>

              <button
                type="button"
                onClick={handleSignUp}
                disabled={isSubmitting}
                className="rounded-full bg-white px-5 py-3 text-sm font-black text-ink ring-1 ring-stone-200 disabled:opacity-60"
              >
                Sign up
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
