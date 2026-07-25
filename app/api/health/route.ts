import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";

// Never cache: each request must reach the database so this doubles as the
// keepalive that stops Supabase's free tier from auto-pausing after 7 idle days.
export const dynamic = "force-dynamic";

/**
 * Liveness probe that deliberately touches the database. A `head` count query
 * exercises Supabase's API and Postgres without returning any rows, so it keeps
 * the project awake while leaking nothing. Invoked daily by a Vercel Cron job
 * (see `vercel.json`).
 */
export async function GET() {
  if (!supabase) {
    return NextResponse.json(
      { status: "error", database: "unconfigured" },
      { status: 503 },
    );
  }

  const { error } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json(
      { status: "error", database: "unreachable", detail: error.message },
      { status: 503 },
    );
  }

  return NextResponse.json({ status: "ok", database: "reachable" });
}
