import { redirect } from "next/navigation";

/** Member private challenges were removed — creator challenges live in Studio. */
export default function DeprecatedCreateChallengePage() {
  redirect("/challenges");
}
