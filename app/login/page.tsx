import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth";
import LoginForm from "../../components/LoginForm";

export default async function Login() {
  if (await getSession()) redirect("/");
  return <LoginForm />;
}
