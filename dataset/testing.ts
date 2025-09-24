import fs from "fs";

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

const csvData = fs.readFileSync("ux_ratings.csv", "utf8");
const parsed = parseCSV(csvData);

const humanRatings = parsed.map(row => ({
  color: Number(row["Color Scheme"]),
  typography: Number(row["Typography"]),
  layout: Number(row["Layout"]),
  accessibility: Number(row["Accessibility"]),
  // ...add others if needed
}));

function averageScores(ratings: typeof humanRatings) {
  const sums: Record<string, number> = {};
  let count = 0;
  ratings.forEach(r => {
    Object.keys(r).forEach(k => {
      sums[k] = (sums[k] || 0) + r[k];
    });
    count++;
  });
  return Object.fromEntries(
    Object.entries(sums).map(([k, v]) => [k, v / count])
  );
}

const avgRatings = averageScores(humanRatings);
console.log(avgRatings);