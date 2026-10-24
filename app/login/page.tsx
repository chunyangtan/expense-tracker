import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { LoginForm } from "@/app/login/form";

export default async function Login() {
  if (await currentUser()) redirect("/add");
  return (
    <main className="max-w-sm w-full mx-auto px-4 pt-24">
      <h1 className="text-xl font-semibold">Expense Tracker</h1>
      <LoginForm />
    </main>
  );
}
