import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId;

    console.log("Received delete request for userId:", userId);

    if (!userId) {
      console.error("Missing userId in request body");
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error("Supabase deleteUser error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("User deleted successfully:", userId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Server error in deleteUser route:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}