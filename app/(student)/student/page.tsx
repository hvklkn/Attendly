import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";

export default function StudentIndexPage() {
  redirect(routes.student.scan);
}
