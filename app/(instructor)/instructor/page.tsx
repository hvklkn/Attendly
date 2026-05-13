import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";

export default function InstructorIndexPage() {
  redirect(routes.instructor.dashboard);
}
