import AuthShell from "@/components/auth/auth-shell"
import PasswordSetupForm from "@/components/auth/password-setup-form"

export default function Page() {
  return (
    <AuthShell>
      <PasswordSetupForm usage="activation" />
    </AuthShell>
  )
}
