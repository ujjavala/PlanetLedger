"use client";
import { useUser } from "@auth0/nextjs-auth0/client";

export function LoginButton() {
  const { user, isLoading } = useUser();

  if (isLoading) return <span className="px-3 py-1">...</span>;

  if (user) {
    return (
      <>
        <span className="px-3 py-1 text-slate-700">{user.email}</span>
        <a
          href="/auth/logout"
          className="px-3 py-1 rounded transition text-slate-800 hover:text-white hover:bg-brand-600 focus:bg-brand-700 focus:text-white"
        >
          Logout
        </a>
      </>
    );
  }

  return (
    <a
      href="/auth/login"
      className="px-3 py-1 rounded transition text-slate-800 hover:text-white hover:bg-brand-600 focus:bg-brand-700 focus:text-white"
    >
      Login
    </a>
  );
}
