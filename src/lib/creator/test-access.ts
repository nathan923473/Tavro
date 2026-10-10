import { createClient } from "@/lib/supabase/server";

export type TestCreatorAccount = {
  userId: string;
  email: string | null;
  displayName: string | null;
  creatorStatus: "none" | "pending" | "approved" | "rejected";
  isTestAccount: boolean;
  isCreator: boolean;
  isAdmin: boolean;
  hasOpenApplication: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeAccountEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 320 || !EMAIL_RE.test(email)) return null;
  return email;
}

export function isAccountId(value: string) {
  return UUID_RE.test(value);
}

export function isMissingTestAccessRpc(message: string) {
  return /schema cache|does not exist|could not find the function/i.test(message);
}

function asAccount(row: unknown): TestCreatorAccount | null {
  if (!row || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;
  const status = record.creator_status;
  if (typeof record.user_id !== "string") return null;
  if (
    status !== "none" &&
    status !== "pending" &&
    status !== "approved" &&
    status !== "rejected"
  ) {
    return null;
  }

  return {
    userId: record.user_id,
    email: typeof record.email === "string" ? record.email : null,
    displayName: typeof record.display_name === "string" ? record.display_name : null,
    creatorStatus: status,
    isTestAccount: record.is_test_account === true,
    isCreator: record.is_creator === true,
    isAdmin: record.is_admin === true,
    hasOpenApplication: record.has_open_application === true,
  };
}

export async function listTestCreatorAccounts(): Promise<
  | { status: "ok"; accounts: TestCreatorAccount[] }
  | { status: "migration" }
  | { status: "error"; message: string }
> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_test_creator_accounts");
  if (error) {
    if (isMissingTestAccessRpc(error.message)) return { status: "migration" };
    return { status: "error", message: error.message };
  }

  const accounts = (Array.isArray(data) ? data : [])
    .map(asAccount)
    .filter((account): account is TestCreatorAccount => account !== null);

  return { status: "ok", accounts };
}

export async function lookupTestCreatorAccount(email: string): Promise<
  | { status: "found"; account: TestCreatorAccount }
  | { status: "missing" }
  | { status: "migration" }
  | { status: "error"; message: string }
> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_lookup_account_by_email", {
    p_email: email,
  });
  if (error) {
    if (isMissingTestAccessRpc(error.message)) return { status: "migration" };
    return { status: "error", message: error.message };
  }

  const account = asAccount(Array.isArray(data) ? data[0] : null);
  if (!account) return { status: "missing" };
  return { status: "found", account };
}
