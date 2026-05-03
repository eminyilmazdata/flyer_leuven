import { redirect } from "next/navigation";

/** Self-registration removed — coordinator creates accounts. */
export default async function RegisterPage() {
  redirect("/login?info=coordinator_accounts");
}
