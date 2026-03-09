import { Suspense } from "react";
import { CustomerLoginForm } from "./customer-login-form";

export default function CustomerLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Suspense fallback={<div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm animate-pulse h-64" />}>
        <CustomerLoginForm />
      </Suspense>
    </div>
  );
}
