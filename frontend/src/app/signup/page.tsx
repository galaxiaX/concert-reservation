"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { ApiError, authApi } from "@/lib/api";
import { pathForRole, saveSession } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.register(name, email, password);
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
    <AuthShell tagline="Powering the tools that power the team.">
      <form onSubmit={handleSubmit} noValidate>
        <h1 className="mb-8 text-center text-[32px] font-bold">Sign Up</h1>

        <AuthField
          id="name"
          label="Full name"
          type="text"
          icon="user"
          placeholder="Enter your Full Name"
          value={name}
          onChange={setName}
          autoComplete="name"
        />
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
          placeholder="Create a Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <AuthField
          id="confirm"
          label="Confirm Password"
          type="password"
          icon="lock"
          placeholder="Re-enter your Password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
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
          {loading ? "Creating account…" : "Create an account"}
        </button>

        <p className="mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-secondary">
            Login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
