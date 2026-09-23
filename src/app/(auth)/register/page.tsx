import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your MoneyFlow account and start tracking your money.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
