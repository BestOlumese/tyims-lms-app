import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role as string;

  if (role !== "instructor" && role !== "admin") {
    // Student trying to access instructor routes — redirect to their dashboard
    redirect("/dashboard");
  }

  return <>{children}</>;
}
