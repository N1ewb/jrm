import { redirect } from "next/navigation";

export default function ReviewRoutesPage() {
  redirect("/protected/admin/review-queue");
}
