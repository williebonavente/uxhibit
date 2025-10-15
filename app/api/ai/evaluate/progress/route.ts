import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const jobId = new URL(req.url).searchParams.get("jobId");
  const supabase = await createClient();
  const { data } = await supabase
    .from("frame_evaluation_progress")
    .select("progress, status")
    .eq("job_id", jobId)
    .single();
  return NextResponse.json({ progress: data?.progress ?? 0, status: data?.status ?? "started" });
}