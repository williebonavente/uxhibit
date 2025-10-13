import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // list users (paginated, max 1000)
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({ exists: true, userId: user.id });
  } catch (err) {
    console.error("Server error in /api/check_email:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
