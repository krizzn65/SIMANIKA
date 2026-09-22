import { passwordRecovery } from "@/services/passwordRecovery";

export const runtime = "nodejs";
export async function POST(request) { return passwordRecovery(request, "reset"); }
