"use client";

import React, { useEffect, useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { generateHeuristicReportSimple } from "@/lib/systemGeneratedReport/pdfGenerator";
import { toast } from "sonner";
import { IconLoader2, IconDownload } from "@tabler/icons-react";
import { createClient } from "@/utils/supabase/client";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const HEURISTICS = [
  { heuristic: "01", fullName: "Visibility of System Status" },
  { heuristic: "02", fullName: "Match Between System and the Real World" },
  { heuristic: "03", fullName: "User Control and Freedom" },
  { heuristic: "04", fullName: "Consistency and Standards" },
  { heuristic: "05", fullName: "Error Prevention" },
  { heuristic: "06", fullName: "Recognition Rather than Recall" },
  { heuristic: "07", fullName: "Flexibility and Efficiency of Use" },
  { heuristic: "08", fullName: "Aesthetic and Minimalist Design" },
  {
    heuristic: "09",
    fullName: "Help Users Recognize, Diagnose, and Recover from Errors",
  },
  { heuristic: "10", fullName: "Help and Documentation" },
];

type DesignRow = {
  id: string;
  title: string | null;
};

type DesignVersion = {
  id: string;
  design_id: string;
  created_at: string;
}

const HeuristicDashboard = () => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  type HeuristicChartData = {
    heuristic: string;
    name: string;
    value: number;
    high: number;
    medium: number;
    low: number;
    fullName: string;
  };

  const [versions, setVersions] = useState<DesignVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [heuristicData, setHeuristicData] = useState<HeuristicChartData[]>([]);
  const [designs, setDesigns] = useState<DesignRow[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);

  const supabase = createClient();
  
    useEffect(() => {
    const fetchHeuristicData = async () => {
      const supabase = createClient();
  
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
  
      if (userError || !user) {
        toast.error("User not logged in");
        return;
      }
      const currentUserId = user.id;
  
      // Get all designs for the user
      const { data: designsData, error: designsError } = await supabase
        .from("designs")
        .select("id, owner_id, title")
        .eq("owner_id", currentUserId);
  
      if (designsError) {
        toast.error("Error fetching designs");
        return;
      }
  
      type DesignRow = {
        id: string;
        owner_id: string | null;
        title: string | null;
      };
      const rawList = (designsData as DesignRow[] | null) ?? [];
  
      const designList = rawList.map((d) => ({
        id: d.id,
        title: d.title ?? "Untitled",
      }));
  
      setDesigns(designList);
  
      // Determine which design to use
      let designIds: string[] = [];
      if (selectedDesignId) {
        designIds = [selectedDesignId];
      } else if (designList.length > 0) {
        const firstId = designList[0].id;
        setSelectedDesignId((prev) => prev ?? firstId);
        designIds = [firstId];
      }
  
      let versionList: any[] = [];
      if (designIds.length > 0) {
        const { data: versionsData, error: versionsError } = await supabase
          .from("design_versions")
          .select("id, design_id, ai_data, created_at")
          .in("design_id", designIds)
          .order("created_at", { ascending: false });
  
        if (versionsError) {
          toast.error("Error fetching design versions");
          return;
        }
  
        if (!versionsData || versionsData.length === 0) {
          console.log("[DEBUG] No design_versions found for these designIds.");
        } else {
          // versionsData is already sorted newest → oldest
          versionList = versionsData as any[];
  
          // Build version list for dropdown
          const mappedVersions: DesignVersion[] = versionList.map((v) => ({
            id: v.id,
            design_id: v.design_id,
            created_at: v.created_at,
          }));
          setVersions(mappedVersions);
  
          // Default to the latest version (first item in sorted list)
          if (!selectedVersionId && mappedVersions.length > 0) {
            setSelectedVersionId(mappedVersions[0].id);
          }
        }
      }
  
      // Use either the selected version or (if none) the latest
            // Use either the selected version or (if none) ALL versions
      let versionsToProcess: any[] = [];
      
      if (selectedVersionId && versionList.length > 0) {
        const selected = versionList.find((v) => v.id === selectedVersionId);
        versionsToProcess = selected ? [selected] : [];
      } else {
        // no specific version selected → accumulate across all versions
        versionsToProcess = versionList;
      } 
  
      const allIssues: { heuristic: string; severity: string }[] = [];
  
      versionsToProcess.forEach((version, idx) => {
        let aiData = version.ai_data;
        if (typeof aiData === "string") {
          try {
            aiData = JSON.parse(aiData);
          } catch (e) {
            console.warn(
              `[DEBUG] Failed to parse aiData for version ${idx}:`,
              aiData,
              e
            );
            aiData = {};
          }
        }
  
        if (Array.isArray(aiData)) {
          aiData.forEach((item, itemIdx) => {
            const breakdown = Array.isArray(item?.ai?.heuristic_breakdown)
              ? item.ai.heuristic_breakdown
              : [];
  
            breakdown.forEach((entry: any) => {
              if (!entry || typeof entry.code !== "string") return;
  
              const heuristicCode = entry.code.replace(/^H/, "").padStart(2, "0");
              const score = Number(entry.score ?? 0);
              const max = Number(entry.max_points ?? 4);
              const ratio = max > 0 ? score / max : 0;
  
              let severity: "high" | "medium" | "low";
              if (ratio <= 0.25) severity = "high";
              else if (ratio <= 0.5) severity = "medium";
              else severity = "low";
  
              if (
                !allIssues.some(
                  (i) => i.heuristic === heuristicCode && i.severity === severity
                )
              ) {
                allIssues.push({ heuristic: heuristicCode, severity });
              }
            });
          });
        } else {
          const breakdown = Array.isArray(aiData?.ai?.heuristic_breakdown)
            ? aiData.ai.heuristic_breakdown
            : [];
  
          breakdown.forEach((entry: any) => {
            if (!entry || typeof entry.code !== "string") return;
  
            const heuristicCode = entry.code.replace(/^H/, "").padStart(2, "0");
            const score = Number(entry.score ?? 0);
            const max = Number(entry.max_points ?? 4);
            const ratio = max > 0 ? score / max : 0;
  
            let severity: "high" | "medium" | "low";
            if (ratio <= 0.25) severity = "high";
            else if (ratio <= 0.5) severity = "medium";
            else severity = "low";
  
            if (
              !allIssues.some(
                (i) => i.heuristic === heuristicCode && i.severity === severity
              )
            ) {
              allIssues.push({ heuristic: heuristicCode, severity });
            }
          });
        }
      });
  
      const counts: Record<
        string,
        { total: number; high: number; medium: number; low: number }
      > = {};
      HEURISTICS.forEach((h) => {
        counts[h.heuristic] = { total: 0, high: 0, medium: 0, low: 0 };
      });
  
      allIssues.forEach((issue) => {
        if (issue.heuristic && counts[issue.heuristic]) {
          counts[issue.heuristic].total += 1;
          if (
            issue.severity === "high" ||
            issue.severity === "medium" ||
            issue.severity === "low"
          ) {
            counts[issue.heuristic][
              issue.severity as "high" | "medium" | "low"
            ] += 1;
          }
        }
      });
  
      const chartData = HEURISTICS.map((h) => ({
        heuristic: h.heuristic,
        name: h.fullName,
        value: counts[h.heuristic].total,
        high: counts[h.heuristic].high,
        medium: counts[h.heuristic].medium,
        low: counts[h.heuristic].low,
        fullName: h.fullName,
      }));
  
      setHeuristicData(chartData);
    };
  
    fetchHeuristicData();
  }, [selectedDesignId, selectedVersionId]);

  const getSeverityColor = (value: number) => {
    if (value <= 20) return "text-green-600 dark:text-green-400";
    if (value <= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getSeverityBg = (value: number) => {
    if (value <= 20) return "bg-green-100 dark:bg-green-900/30";
    if (value <= 40) return "bg-yellow-100 dark:bg-yellow-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  const handleExportReport = async () => {
    setIsGeneratingPDF(true);
    try {
      toast.success("PDF report generated successfully.");
      await generateHeuristicReportSimple(heuristicData);
      // Show success message (optional)
      // TODO: Adding loading message
    } catch (error) {
      toast.error(error as string);
      console.error("Error generating report:", error);
      alert("Failed to generate PDF report. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-5 ">
      <div className="border-b-2 p-2">
        <h1 className="text-2xl font-medium">Heuristic Violation Frequency</h1>
      </div>

      <div className="p-2 m-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col gap-3">
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 w-full sm:mb-0 font-['Poppins']">
            This section shows which usability heuristics you&apos;re violating
            most often. The radar chart breaks down how frequently these issues
            occur in your projects, with color-coded severity levels (minor vs.
            major). It helps you spot patterns, understand recurring design
            challenges, and improve your designs more effectively.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
  {/* Project select */}
  <div className="flex items-center gap-3">
    <label
      htmlFor="project-select"
      className="text-sm sm:text-base text-gray-700 dark:text-gray-200 font-['Poppins']"
    >
      Project:
    </label>

    <Select
      value={selectedDesignId || ""}
      onValueChange={(value) => {
        setSelectedDesignId(value || null);
        setSelectedVersionId(null); // reset version when project changes
      }}
    >
      <SelectTrigger
        id="project-select"
        className="min-w-[220px] h-11 px-4 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#120F12] text-sm text-gray-900 dark:text-gray-100 font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-[#ED5E20]"
      >
        <SelectValue placeholder="Select a project" />
      </SelectTrigger>
      <SelectContent>
        {designs.length === 0 ? (
          <SelectItem value="__no_projects" disabled>
            No projects found
          </SelectItem>
        ) : (
          designs.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.title}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  </div>

  {/* Version select */}
  <div className="flex items-center gap-3">
    <label
      htmlFor="version-select"
      className="text-sm sm:text-base text-gray-700 dark:text-gray-200 font-['Poppins']"
    >
      Version:
    </label>

    <Select
      value={selectedVersionId || ""}
      onValueChange={(value) => setSelectedVersionId(value || null)}
      disabled={versions.length === 0}
    >
      <SelectTrigger
        id="version-select"
        className="min-w-[220px] h-11 px-4 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#120F12] text-sm text-gray-900 dark:text-gray-100 font-['Poppins'] focus:outline-none focus:ring-2 focus:ring-[#ED5E20]"
      >
        <SelectValue
          placeholder={
            versions.length === 0 ? "No versions" : "Select a version"
          }
        />
      </SelectTrigger>
      <SelectContent>
       {versions.map((v, index) => {
      const versionLabel = `v${versions.length - index}`; // latest = highest number
      const timeLabel = new Date(v.created_at).toLocaleString();
    
      return (
        <SelectItem key={v.id} value={v.id}>
          {versionLabel} — {timeLabel}
        </SelectItem>
      );
    })} 
      </SelectContent>
    </Select>
  </div>
</div>
        </div>

        <button
          onClick={handleExportReport}
          disabled={isGeneratingPDF}
          className={`w-full sm:w-auto px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors font-['Poppins'] font-medium sm:ml-6 cursor-pointer ${
            isGeneratingPDF
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#ED5E20] hover:bg-[#d44e0f]"
          } text-white`}
        >
          <span>
            {isGeneratingPDF ? (
              <IconLoader2 className="animate-spin" />
            ) : (
              <IconDownload />
            )}
          </span>
          <span>{isGeneratingPDF ? "Generating..." : "Export"}</span>
        </button>
      </div>

      <div className="bg-accent dark:bg-[#19181D] rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-6 text-center text-black dark:text-white font-['Poppins']">
          Jakob Nielsen&apos;s 10 Usability Heuristics
          <br />
          <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
            for User Interface Design
          </span>
        </h3>
        <div className="flex-col">
          {/* Radar Chart */}
          <div
            id="heuristic-chart-section"
            className="flex flex-col items-center"
          >
            <div id="heuristic-chart-container" className="w-full h-100">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={heuristicData}>
                  <PolarGrid stroke="#9ca3af" />
                  <PolarAngleAxis
                    dataKey="heuristic"
                    tick={{ fontSize: 13, fill: "#ED5E20" }}
                  />
                  <PolarRadiusAxis
                    angle={0}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickCount={6}
                  />
                  <Radar
                    name="Violation Frequency"
                    dataKey="value"
                    stroke="#ED5E20"
                    fill="#ED5E20"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Heuristics List */}
          <div className="flex flex-col items-center justify-center w-full">
            <div className="space-y-4 w-full max-w-2xl">
              {heuristicData.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-row items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-[#ED5E20]/50 dark:hover:bg-[#ED5E20]/50 transition-colors border border-gray-100 dark:border-gray-700 cursor-pointer"
                >
                  {/* Number, title, and score all side by side */}
                  <span className="text-[#ED5E20] font-bold text-xs sm:text-sm min-w-[24px] text-center shrink-0">
                    {item.heuristic}.
                  </span>
                  <span className="text-gray-800 dark:text-gray-200 text-xs sm:text-sm font-['Poppins'] mx-2 flex-1 truncate">
                    {item.fullName}
                  </span>
                  <span
                    className={`font-bold text-xs sm:text-sm ${getSeverityColor(
                      item.value
                    )} shrink-0 mx-2`}
                  >
                    {item.value}
                  </span>
                  <div
                    className={`w-3 h-3 rounded-full ${getSeverityBg(
                      item.value
                    )} shrink-0`}
                  ></div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-col items-center mt-8 p-4 bg-white dark:bg-[#120F12] rounded-lg border w-full max-w-2xl border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 font-['Poppins']">
                Legend:
              </div>
              <div className="flex flex-row justify-between w-full text-xs font-['Poppins'] mb-2">
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Minor Severity
                </span>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  Major Severity
                </span>
              </div>
              <div className="w-full bg-gradient-to-r from-green-200 via-yellow-200 to-red-200 dark:from-green-600 dark:via-yellow-600 dark:to-red-600 h-2 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeuristicDashboard;
