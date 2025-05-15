import { LoginForm } from "@/components/login-form"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function LoginPage(promise: { params: Promise<{ locale: string }> }) {
  const { locale } = await promise.params;
  const session = await auth();

  if (session) {
    redirect(`/${locale}`);
  }

  return <LoginForm />;
}
