import { LoginForm } from "@/components/login-form"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function LoginPage({params}: { params: { locale: string, tenantId:string } }) {
  const session = await auth()
  const { tenantId, locale } = await params
  console.log('tenantId in login page ===>', tenantId);

  if (session) {
    redirect('/en')
  }

  return  <LoginForm />
}
