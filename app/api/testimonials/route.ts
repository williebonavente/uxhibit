import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Fetch testimonials
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");
    if (!profileId) return NextResponse.json([], { status: 200 });

    const supabase = await createClient();
    // const { data, error } = await supabase
    //     .from("testimonials")
    //     .select("id, quote, author, role, created_by, created_at")
    //     .eq("profile_id", profileId)
    //     .order("created_at", { ascending: false});

    const { data, error } = await supabase
  .from("testimonials")
  .select(`
    id, quote, author, role, created_by, created_at,
    profiles:created_by (
      avatar_url
    )
  `)
  .eq("profile_id", profileId)
  .order("created_at", { ascending: false });

    if (error) return NextResponse.json([], { status: 500 });
    return NextResponse.json(data ?? []);
}

// Add a testimonial
export async function POST(req: NextRequest) {
    const body = await req.json();
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // 1. Get the profile for the current user
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, first_name, middle_name, last_name, avatar_url")
        .eq("id", user.id)
        .single();

    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    // Prevent users from leaving testimonials for themselves
    if (profile.id === body.profile_id) {
        return NextResponse.json({ error: "You cannot leave a testimonial for yourself." }, { status: 403 });
    }

    // 2. Get the role from profile_details using profile.id
    const { data: profileDetails } = await supabase
        .from("profile_details")
        .select("role")
        .eq("profile_id", profile.id)
        .single();

    // Build the author name
    const author = [profile.first_name, profile.middle_name, profile.last_name]
        .filter(Boolean)
        .join(" ");
    const role = profileDetails?.role || "Contributor";

    

    // 3. Insert the testimonial
    const { data, error } = await supabase
        .from("testimonials")
        .insert([{
            quote: body.quote,
            profile_id: body.profile_id,
            author,
            role,
            created_by: user.id,
        }])
        .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data || !data[0]) return NextResponse.json({ error: "Insert failed" }, { status: 500 });

    return NextResponse.json(data[0], { status: 201 });
}

export async function PUT(req: NextRequest) {
    const body = await req.json();
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("testimonials")
        .update(body)
        .eq("id", body.id)
        .select();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data?.[0] ?? {}, { status: 200 });
}

export async function DELETE(req: NextRequest) {
    const { id } = await req.json();
    const supabase = await createClient();
    const { error } = await supabase
        .from("testimonials")
        .delete()
        .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true }, { status: 200 });
}