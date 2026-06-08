"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { ApiError, authApi } from "@/lib/api";
import { pathForRole, saveSession } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const accessLevel = params.get("as") === "admin" ? "admin" : "user";
  const submitLabel =
    accessLevel === "admin" ? "Login as Administrator" : "Login as User";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await authApi.login(email, password);
      saveSession(result.accessToken, result.user);
      router.push(pathForRole(result.user.role));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="mb-8 text-center text-[32px] font-bold">Login</h1>

      <AuthField
        id="email"
        label="Email"
        type="email"
        icon="user"
        placeholder="Enter your Email Address"
        value={email}
        onChange={setEmail}
        autoComplete="email"
      />
      <AuthField
        id="password"
        label="Password"
        type="password"
        icon="lock"
        placeholder="Enter your Password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
      />

      {error && (
        <p className="mb-4 text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-sm bg-secondary py-3 font-medium text-white transition hover:bg-secondary/90 disabled:opacity-60"
      >
        {loading ? "Logging in…" : submitLabel}
      </button>

      <p className="mt-6 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-secondary">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell tagline="Your digital workspace, simplified.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
