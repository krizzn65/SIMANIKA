import { lookupOprecResult } from "@/services/oprecSubmission";
export const runtime = "nodejs";
export async function POST(request) { return lookupOprecResult(request); }
