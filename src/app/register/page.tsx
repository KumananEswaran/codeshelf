import { Suspense } from "react";
import RegisterForm from "@/components/auth/RegisterForm";
import { Navbar } from "@/components/homepage/Navbar";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex min-h-screen items-center justify-center p-4 pt-20">
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
