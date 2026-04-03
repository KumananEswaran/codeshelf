import { Suspense } from "react";
import SignInForm from "@/components/auth/SignInForm";
import { Navbar } from "@/components/homepage/Navbar";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex min-h-screen items-center justify-center p-4 pt-20">
        <Suspense>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
