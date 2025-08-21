"use client";

import { parseFigmaUrl } from "@/lib/figma";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Input } from "./ui/input";

type ParsedFigma = { fileKey: string; nodeId?: string; name?: string };

export default function FigmaLinkUploader() {
  const router = useRouter();
  const [lastId, setLastId] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedLink, setUploadedLink] = useState<string | null>(null);
  const [age, setAge] = useState("");
  const [occupation, setOccupation] = useState("");

  function handleClear() {
    setLink?.("");
    setProgress(0);
    setLoading(false);
  }
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFigmaUrl(link);
    if (!parsed) {
      toast.error("The input is empty");
      return;
    }
    setLoading(true);
    setProgress(10);

    try {
      const res = await fetch("/api/figma/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to parse Figma link");
        setLoading(false);
        setProgress(0);
        return;
      }

      setProgress(80);


      const newDesign = {
        id: crypto.randomUUID(),
        figma_link: link,
        project_name: data?.name || "Untitled Design",
        likes: 0,
        views: 0,
        age,
        occupation,
        // store keys so gallery can render thumbnails automatically
        fileKey: parsed?.fileKey || null,
        nodeId: parsed?.nodeId || null,
        // optional immediate preview if you already have one
        thumbnail: (data?.nodeImageUrl as string) || (data?.thumbnailUrl as string) || null,
        createdAt: new Date().toISOString(),
      };

      try {

        // get the signed-in user from Supabse (client-side)
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          toast.error("Please sign in first.");
          setLoading(false);
          setProgress(0);
          return;
        }


        const saveRes = await fetch("/api/designs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // owner_id: ownerId, // TODO: inject from your auth/session
            title: newDesign.project_name,
            figma_link: link,
            file_key: newDesign.fileKey,
            node_id: newDesign.nodeId,
            thumbnail_url: newDesign.thumbnail,
            snapshot: { age, occupation },
            ai: null,
          }),
        });
        const saved = await saveRes.json();
        // attach remote identifiers to your local record
        (newDesign as any).remoteId = saved?.design?.id;
        (newDesign as any).remoteCurrentVersionId = saved?.current_version?.id;
        (newDesign as any).remoteVersionNumber = saved?.current_version?.version;

      } catch (e: any) {
        toast.error(e.message || "Failed to save to database");
        setLoading(false);
        setProgress(0);
        return;
      }
      const existing = JSON.parse(localStorage.getItem("designs") || "[]");
      // const isDuplicate = existing.some((d: any) => d.figma_link === link);

      // if (isDuplicate) {
      //   toast.error("This design is already uploaded.");
      //   setLoading(false);
      //   setProgress(0);
      //   return;
      // } 

      localStorage.setItem("designs", JSON.stringify([newDesign, ...existing])); toast.success("Design uploaded successfully!");
      setUploadedLink(link);
      setLastId(newDesign.id);
      setProgress(100);

    } catch {
      toast.error("Network error");
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const isParamsComplete = age.trim() !== "" && occupation.trim() !== "";

  // Limit only to maximum of 10 design per user
  return (
    <div className="flex flex-col items-center justify-center space-y-6 w-full px-2">
      {/* Upload Inputs */}
      <div className="w-full max-w-xl space-y-5">
        <Input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://www.figma.com/design/..."
          className="w-full sm:max-w-[640px] md:max-w-[720px]
               h-12 md:h-14 px-4 md:px-5 rounded-lg
               bg-white dark:bg-[#120F12] border
               text-base md:text-lg"
        />

        {/* Buttons below input */}
        <div className="flex flex-col sm:flex-row mt-10 gap-5 items-center justify-center">
          <button
            type="button"
            onClick={handleUpload}
            className="h-[44px] px-6 inline-flex items-center justify-center rounded-[10px]
                       bg-[#ED5E20] text-white text-sm font-semibold
                       transition-colors duration-200 hover:bg-[#56cc1b] hover:cursor-pointer
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8700]
                       disabled:opacity-50 w-full sm:w-auto"
            disabled={loading}
          >
            Upload
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="h-[44px] px-6 inline-flex items-center justify-center rounded-[10px]
                       bg-[#ED5E20] text-white text-sm font-semibold
                       transition-colors duration-200 hover:bg-[#fc0317] hover:cursor-pointer
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8700]
                       disabled:opacity-50 w-full sm:w-auto"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Loading Bar */}
      {loading && (
        <div className="w-full max-w-xs sm:max-w-xl bg-white dark:bg-[#120F12] rounded-xl h-10 flex items-center px-4 space-x-4">
          <span className="text-sm font-medium w-12">{progress}%</span>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[linear-gradient(to_right,#FFDB97,#ED5E20)] h-2 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Form after upload */}
      {uploadedLink && !loading && (
        <div className="w-full max-w-xs sm:max-w-xl flex flex-col space-y-4">
          {/* Age Dropdown */}
          <select
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="p-2 border rounded-md bg-white dark:bg-[#120F12] text-sm"
          >
            <option value="">Select Generation</option>
            <option value="Gen Z">Gen Z (1997-2012)</option>
            <option value="Millennial">Millennial (1981-1996)</option>
            <option value="Gen Alpha">Gen Alpha (2013-Present)</option>
          </select>

          {/* Occupation Dropdown */}
          <select
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            className="p-2 border rounded-md bg-white dark:bg-[#120F12] text-sm"
          >
            <option value="">Select Occupation</option>
            <option value="Student">Student</option>
            <option value="Freelancer">Freelancer</option>
            <option value="Designer">Designer</option>
            <option value="Developer">Developer</option>
            <option value="Educator">Educator</option>
          </select>

          {/* Evaluate Button */}
          <button
            className={`px-8 py-3 rounded-md text-white text-sm font-medium ${isParamsComplete
              ? "bg-[#ED5E20] hover:bg-orange-600 hover:cursor-pointer"
              : "bg-gray-400 cursor-not-allowed"
              } w-full`}
            disabled={!isParamsComplete || !uploadedLink}
            onClick={() => lastId && router.push(`/designs/${lastId}`)}
          >
            Evaluate Design
          </button>
        </div>
      )}
    </div>
  );
}

