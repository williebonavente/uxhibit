"use client";

import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartTooltip,
  Legend,
} from "recharts";
import { generateUsabilityTrendReport } from "@/lib/systemGeneratedReport/trendPdfGenerator";
import { toast } from "sonner";
import { IconLoader2, IconDownload } from "@tabler/icons-react";
import { createClient } from "@/utils/supabase/client";

/* shadcn/ui components — adjust paths if your project places them elsewhere */
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

/* Lightweight tooltip renderer for recharts (keeps UI consistent with shadcn) */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-white dark:bg-slate-900 border rounded-md px-3 py-2 text-sm shadow">
      <div className="font-medium text-slate-900 dark:text-slate-100">Version {point.version}</div>
      <div className="text-slate-600 dark:text-slate-300">Score: {point.score}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">Label: {label}</div>
    </div>
  );
}

export default function UsabilityScoreTrendPage() {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [trendData, setTrendData] = useState<
    { version: string; score: number; label: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendData = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          toast.error("User not logged in");
          setTrendData([]);
          return;
        }
        const currentUserId = user.id;

        const { data, error } = await supabase
          .from("design_versions")
          .select("version, total_score, created_at")
          .eq("created_by", currentUserId)
          .order("created_at", { ascending: true });

        if (error) {
          toast.error("Error fetching trend data");
          setTrendData([]);
          return;
        }

        const mapped = (data || []).map((row: any, idx: number) => ({
          version: `V${row.version ?? idx + 1}`,
          score: Math.max(0, Math.min(10, Number(row.total_score ?? 0))),
          label: (idx + 1).toString().padStart(2, "0"),
        }));

        setTrendData(mapped);
      } catch (err) {
        console.error("fetchTrendData error", err);
        setTrendData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendData();
  }, []);

  const handleExportReport = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateUsabilityTrendReport(trendData);
      toast.success("PDF report generated successfully");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate PDF report");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Usability Score Trend</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl mt-2">
            Track how your designs improve over time. Each submission is evaluated using
            Nielsen's heuristics — this chart helps you spot regressions and improvements.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button onClick={handleExportReport} disabled={isGeneratingPDF || trendData.length === 0}>
            {isGeneratingPDF ? (
              <span className="flex items-center gap-2">
                <IconLoader2 className="animate-spin w-4 h-4" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <IconDownload className="w-4 h-4" />
                Export
              </span>
            )}
          </Button>
          <Badge variant="secondary">{trendData.length} submissions</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Improvements</span>
            <div className="text-sm text-slate-500 dark:text-slate-400">Usability Score (0–10)</div>
          </CardTitle>
        </CardHeader>

        <Separator />

        <CardContent className="p-4">
          <div className="h-72 w-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <IconLoader2 className="animate-spin w-6 h-6 text-slate-600 dark:text-slate-300" />
              </div>
            ) : trendData.length === 0 ? (
              <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                No data available. Submit evaluations to see trends.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 12, right: 24, left: 8, bottom: 12 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#ED5E20" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#ED5E20" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    interval={0}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#ED5E20", fontWeight: 600 }}
                    ticks={[0, 2, 4, 6, 8, 10]}
                    width={40}
                  />

                  <RechartTooltip content={<ChartTooltip />} />
                  <Legend verticalAlign="top" height={36} />

                  <Area
                    type="monotone"
                    dataKey="score"
                    name="Usability"
                    stroke="#ED5E20"
                    strokeWidth={3}
                    fill="url(#scoreGrad)"
                    activeDot={{ r: 5 }}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-400">Version</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Last updated: N/A</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}