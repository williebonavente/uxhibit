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


const HEURISTICS = [
  { heuristic: "01", fullName: "Visibility of System Status" },
  { heuristic: "02", fullName: "Match Between System and the Real World" },
  { heuristic: "03", fullName: "User Control and Freedom" },
  { heuristic: "04", fullName: "Consistency and Standards" },
  { heuristic: "05", fullName: "Error Prevention" },
  { heuristic: "06", fullName: "Recognition Rather than Recall" },
  { heuristic: "07", fullName: "Flexibility and Efficiency of Use" },
  { heuristic: "08", fullName: "Aesthetic and Minimalist Design" },
  { heuristic: "09", fullName: "Help Users Recognize, Diagnose, and Recover from Errors" },
  { heuristic: "10", fullName: "Help and Documentation" },
];
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

  const [heuristicData, setHeuristicData] = useState<HeuristicChartData[]>([]);

    useEffect(() => {
    const fetchHeuristicData = async () => {
      const supabase = createClient();
  
      // 1. Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error("User not logged in");
        return;
      }
      const currentUserId = user.id;
  
      // 2. Get all latest versions for the user's designs
      const { data: designs, error: designsError } = await supabase
        .from("designs")
        .select("current_version_id")
        .eq("owner_id", currentUserId);
  
      if (designsError) {
        toast.error("Error fetching designs");
        return;
      }
  
      type DesignRow = { current_version_id: string };
      const versionIds = (designs as DesignRow[] || []).map((d) => d.current_version_id).filter(Boolean);
  
      // 3. Fetch all design_versions for these versionIds
      type DesignVersion = { ai?: unknown; ai_data?: unknown };
      type AIssue = { heuristic: string; severity: "high" | "medium" | "low" };
  
      const allIssues: AIssue[] = [];
      if (versionIds.length > 0) {
        const { data: versionsData, error: versionsError } = await supabase
          .from("design_versions")
          .select("ai, ai_data")
          .in("id", versionIds);
  
        if (versionsError) {
          toast.error("Error fetching design versions");
        } else {
          (versionsData as DesignVersion[] || []).forEach((version) => {
            let aiData = version.ai_data ?? version.ai;
            if (typeof aiData === "string") {
              try { aiData = JSON.parse(aiData); } catch { aiData = {}; }
            }
            // Log the aiData for this version
            // console.log(`Version ${idx} aiData:`, aiData);
  
            if (Array.isArray((aiData as { issues?: AIssue[] })?.issues)) {
              (aiData as { issues: AIssue[] }).issues.forEach((issue) => {
                if (issue && typeof issue.heuristic === "string") {
                  allIssues.push(issue);
                }
              });
            }
          });
        }
      }
  
      // 4. Count violations per heuristic and severity
      const counts: Record<string, { total: number; high: number; medium: number; low: number }> = {};
      HEURISTICS.forEach(h => {
        counts[h.heuristic] = { total: 0, high: 0, medium: 0, low: 0 };
      });
  
      allIssues.forEach(issue => {
        if (issue.heuristic) {
          counts[issue.heuristic].total += 1;
          const sev = (issue.severity || "low").toLowerCase();
          if (sev === "high" || sev === "medium" || sev === "low") {
            counts[issue.heuristic][sev as "high" | "medium" | "low"] += 1;
          }
        }
      });
  
      // 5. Build data for the chart (you can use total, or show breakdowns)
      const chartData = HEURISTICS.map(h => ({
        heuristic: h.heuristic,
        name: h.fullName,
        value: counts[h.heuristic].total,
        high: counts[h.heuristic].high,
        medium: counts[h.heuristic].medium,
        low: counts[h.heuristic].low,
        fullName: h.fullName,
      }));
  
      console.log("All Issues: ", allIssues);
      console.log("Chart Data: ", chartData);
  
      setHeuristicData(chartData);
    };
  
    fetchHeuristicData();
  }, []);

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
        <h1 className="text-2xl font-medium">
          Heuristic Violation Frequency
        </h1>
      </div>
      <div className="p-2 m-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 w-full sm:mb-0 font-['Poppins']">
          {/* TODO: Message is too long! */}
          This section shows which usability heuristics you&apos;re violating
          most often. The radar chart breaks down how frequently these issues
          occur in your projects, with color-coded severity levels (minor vs.
          major). It helps you spot patterns, understand recurring design
          challenges, and improve your designs more effectively.
        </p>
        <button
          onClick={handleExportReport}
          disabled={isGeneratingPDF}
          className={`w-full sm:w-auto px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors font-['Poppins'] font-medium sm:ml-6 cursor-pointer ${isGeneratingPDF
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
