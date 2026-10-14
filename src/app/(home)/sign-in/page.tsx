import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { GoogleSignIn } from "~/components/google-sign-in";

export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) redirect("/drive");

  return <GoogleSignIn />;
}
