import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      password,
      email,
      authProvider, // "password" | "figma" | others
      confirm, // required as "DELETE" for OAuth flows
    } = body ?? {};

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: "Supabase client env not configured" }, { status: 500 });
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Service role key missing" }, { status: 500 });
    }
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Admin client for user lookup and deletion
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Ensure the user exists and optionally validate email matches
    const { data: getRes, error: getErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (getErr || !getRes?.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (email && getRes.user.email && email.toLowerCase() !== getRes.user.email.toLowerCase()) {
      return NextResponse.json({ error: "Email does not match user" }, { status: 400 });
    }

    const isPasswordProvider = (authProvider ?? "password") === "password";

    if (isPasswordProvider) {
      // Password users must provide email and password for verification
      if (!email || !password) {
        return NextResponse.json(
          { error: "Missing email or password for password account" },
          { status: 400 }
        );
      }
      const supabaseUser = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error: signInError } = await supabaseUser.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
      }
    } else {
      // OAuth users must explicitly confirm deletion
      if (!confirm || String(confirm).trim().toUpperCase() !== "DELETE") {
        return NextResponse.json({ error: 'Confirmation required. Type "DELETE".' }, { status: 400 });
      }
      // Optional: enforce recent re-auth for OAuth here if you pass/verify an access token
      // or use your session and provider constraints.
    }

    // Delete user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}