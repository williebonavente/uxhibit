"use client";

import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { generateUsabilityTrendReport } from "@/lib/systemGeneratedReport/trendPdfGenerator";
// import { useTheme } from "next-themes";
import { toast } from "sonner";
import { IconLoader2, IconDownload } from "@tabler/icons-react";
import { createClient } from "@/utils/supabase/client";

export default function UsabilityScoreTrendPage() {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [trendData, setTrendData] = useState<
    { version: string; score: number; label: string }[]
  >([]);

  useEffect(() => {
    const fetchTrendData = async () => {
      const supabase = createClient();

      // 1. Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error("User not logged in");
        return;
      }
      const currentUserId = user.id;

      // 2. Fetch all versions for the user's designs (or a selected design)
      // You may want to filter by a specific design_id if needed
      const { data, error } = await supabase
        .from("design_versions")
        .select("version, total_score, created_at")
        .eq("created_by", currentUserId)
        .order("created_at", { ascending: true });

      if (error) {
        toast.error("Error fetching trend data");
        return;
      }

      // 3. Map to chart data format
      const mapped = (data || []).map((row: any, idx: number) => ({
        version: `V${row.version ?? idx + 1}`,
        score: row.total_score ?? 0,
        label: (idx + 1).toString().padStart(2, "0"),
      }));

      setTrendData(mapped);
    };

    fetchTrendData();
  }, []);
  const handleExportReport = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateUsabilityTrendReport(trendData);
      // Show success message (optional)
      toast.success("PDF report generetead successfully");
      // showSuccessToast("PDF report generated successfully", theme);
      // alert('PDF report generated successfully!');
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate PDF report. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="border-b-2 p-2">
        <h1 className="text-2xl font-medium">
          Usability Score Trend
        </h1>
      </div>
      <div className="p-2 m-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 w-full sm:mb-0 font-['Poppins']">
          Track how your design improves over time. Each submission is evaluated
          using Jakob Nielsen&apos;s 10 heuristics, and your score is plotted here.
          The line graph helps you see whether revisions are making your UI more
          usable before it&apos;s added to your portfolio.
        </p>
        <button
          onClick={handleExportReport}
          disabled={isGeneratingPDF}
          className={`w-full sm:w-auto px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors font-['Poppins'] font-medium mt-4 sm:mt-0 sm:ml-6 cursor-pointer ${isGeneratingPDF
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
      <div className="bg-white dark:bg-[#19181D] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header with Improvements label */}
        <div className="bg-[#ED5E20] text-white px-6 py-4">
          <h3 className="text-center align-middle text-lg font-bold font-['Poppins']">
            Improvements
          </h3>
        </div>

        {/* Chart Container */}
        <div className="p-8">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient
                    id="scoreGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#ED5E20" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ED5E20" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#6b7280" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 14,
                    fill: "#6b7280",
                    fontFamily: "Poppins",
                  }}
                  dy={10}
                />
                <YAxis
                  domain={[0, 10]}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: "#ED5E20",
                    fontFamily: "Poppins",
                    fontWeight: "bold",
                  }}
                  dx={-10}
                  label={{
                    value: "Usability Score",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      textAnchor: "middle",
                      fill: "#ED5E20",
                      fontFamily: "Poppins",
                      fontWeight: "bold",
                    },
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#ED5E20"
                  strokeWidth={3}
                  fill="url(#scoreGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Version labels */}
          <div className="flex justify-center mt-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 font-['Poppins'] font-medium">
                Version
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
