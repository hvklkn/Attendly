import { redirect } from "next/navigation";
import { routes } from "@/constants/routes";

export default function AdminIndexPage() {
  redirect(routes.admin.dashboard);
}
