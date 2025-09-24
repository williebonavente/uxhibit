import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function parseCSV(text: string): any[] {
  const [headerLine, ...lines] = text.trim().split("\n");
  const headers = headerLine.split(",").map(h => h.trim());
  return lines.map(line => {
    const values = line.split(",").map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i];
    });
    return row;
  });
}

export async function GET() {
  const csvPath = path.join(process.cwd(), "dataset", "ux_ratings.csv");
  const csvData = fs.readFileSync(csvPath, "utf8");
  const parsed = parseCSV(csvData);

  const humanRatings = parsed.map(row => ({
    color: Number(row["Color Scheme"]),
    typography: Number(row["Typography"]),
    layout: Number(row["Layout"]),
    accessibility: Number(row["Accessibility"]),
    // ...add others if needed
  }));

  const sums: Record<string, number> = {};
  let count = 0;
  humanRatings.forEach(r => {
    Object.keys(r).forEach(k => {
      sums[k] = (sums[k] || 0) + r[k];
    });
    count++;
  });
  const avgRatings = Object.fromEntries(
    Object.entries(sums).map(([k, v]) => [k, v / count])
  );

  return NextResponse.json(avgRatings);
}