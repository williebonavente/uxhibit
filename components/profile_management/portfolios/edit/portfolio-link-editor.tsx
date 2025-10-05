"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export function PortfolioLinkEditor({
  userId,
  initialLink,
  onSaved,
}: {
  userId: string;
  initialLink: string;
  onSaved?: (newLink: string) => void;
}) {
  const [link, setLink] = useState(initialLink);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    const { data: existing } = await supabase
      .from("portfolio_links")
      .select("id")
      .eq("user_id", userId)
      .single();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from("portfolio_links")
        .update({
          url: link,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId));
    } else {
      ({ error } = await supabase
        .from("portfolio_links")
        .insert({
          user_id: userId,
          url: link,
          updated_at: new Date().toISOString(),
        }));
    }

    setSaving(false);
    if (error) toast.error(`Failed to save link ${error.message}`);
    else {
      toast.success("Portfolio link updated!");
      if (onSaved) onSaved(link); 
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <input
        className="border rounded px-2 py-1"
        value={link}
        onChange={e => setLink(e.target.value)}
        placeholder="https://www.figma.com/design/"
        disabled={saving}
      />
      <button onClick={handleSave} disabled={saving} className="btn btn-primary">
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}