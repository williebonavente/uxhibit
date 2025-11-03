import React, { useEffect, useMemo, useState } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Area,
    ReferenceDot,
    ReferenceLine,
} from "recharts";
import { ArrowUp, ArrowDown, X, ChartLine } from "lucide-react";

type EvaluationPoint = {
    timestamp: string | number | Date;
    score: number;
    value?: number;
};

type ImprovementGraphsProps = {
    evaluations: EvaluationPoint[];
    metricName?: string;
    height?: number;
    positiveColor?: string;
    neutralColor?: string;
    negativeColor?: string;
    onClose?: () => void;
    extraTickValues?: number[];
    theme?: "auto" | "light" | "dark";
};

function formatDateStamp(ts: string | number | Date) {
    const d = typeof ts === "string" || typeof ts === "number" ? new Date(ts) : ts;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ImprovementGraphs({
    evaluations,
    metricName = "Score",
    height,
    positiveColor = "#16A34A",
    // neutralColor = "#6B7280",   
    neutralColor = "#ED5E20",
    negativeColor = "#DC2626",
    onClose,
    extraTickValues = [],
    theme = "auto",
}: ImprovementGraphsProps) {
    // prefer explicit `value` field in incoming data for Y-axis.
    // fallback to `score` when `value` is not provided.
    const data = useMemo(
        () =>
            [...evaluations]
                .map((e) => ({ ...e, t: new Date(e.timestamp).getTime() }))
                .sort((a, b) => a.t - b.t)
                // attach a version index and normalized Y value (use value if supplied)
                .map((e, i) => ({
                    date: formatDateStamp(e.timestamp),
                    score: Number(e.score),
                    value: typeof (e as any).value !== "undefined" ? Number((e as any).value) : Number(e.score),
                    version: i + 1,
                })),
        [evaluations]
    );

    // which key to use for the Y axis (keeps code flexible)
    const yKey = "value";

    const first = data[0];
    const last = data[data.length - 1];

    // improvement = difference between the most recent score and the previous recorded score
    const improvement = useMemo(() => {
        const src = Array.isArray(data) ? data : evaluations ?? [];
        if (!src || src.length < 2) return 0;

        // sort by timestamp ascending to find latest two points reliably
        const sorted = [...src].sort((a: any, b: any) => {
            const ta = new Date(a.timestamp).getTime();
            const tb = new Date(b.timestamp).getTime();
            return ta - tb;
        });

        const last = sorted[sorted.length - 1];
        // find previous valid numeric score
        let i = sorted.length - 2;
        while (i >= 0 && (sorted[i].score == null || Number.isNaN(Number(sorted[i].score)))) i--;
        if (i < 0) return 0;
        const prev = sorted[i];

        return Number(last.score) - Number(prev.score);
    }, [data, evaluations]);

    const improvementDisplay = `${improvement > 0 ? "+" : ""}${improvement} pts`;

    // tri-state: positive / neutral / negative
    const trendState =
        improvement === Infinity
            ? (last?.score ?? 0) > 0
                ? "positive"
                : (last?.score ?? 0) < 0
                    ? "negative"
                    : "neutral"
            : improvement > 0
                ? "positive"
                : improvement < 0
                    ? "negative"
                    : "neutral";

    const trendColor =
        trendState === "positive" ? positiveColor : trendState === "negative" ? negativeColor : neutralColor;
    const TrendIcon = trendState === "positive" ? ArrowUp : trendState === "negative" ? ArrowDown : ChartLine;


    // theme detection (supports forced light/dark or auto)
    const getSystemPrefersDark = () =>
        typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

    const getDocDarkClass = () =>
        typeof document !== "undefined" && document.documentElement && document.documentElement.classList.contains("dark");

    const [isDark, setIsDark] = useState<boolean>(() => {
        if (typeof window === "undefined") return false;
        if (theme === "dark") return true;
        if (theme === "light") return false;
        // auto:
        return getDocDarkClass() || getSystemPrefersDark();
    });

    // custom hover tooltip state (replaces native <title> tooltip)
    const [hoverTooltip, setHoverTooltip] = useState<{ visible: boolean; label: string; x: number; y: number }>({
        visible: false,
        label: "",
        x: 0,
        y: 0,
    });

    // hide Rechart's Tooltip default while showing our customtick tooltip
    const [hideNativeTooltip, setHideNativeTooltip] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    // custom dot renderer (smaller default dots + creative hover halo/pulse)
    const renderDot = (props: any) => {
        const { cx, cy, index } = props;
        const keyIdx = typeof index === "number" ? index : Math.random();
        const fill = `var(--dot-fill, ${isDark ? "#410301ff" : "#fff"})`;
        const stroke = trendColor;
        const isActive = index === activeIndex;

        if (isActive) {
            return (
                <g key={`dot-g-${keyIdx}`}>
                    {/* subtle halo */}
                    <circle key={`halo-${keyIdx}`} cx={cx} cy={cy} r={14} fill={stroke} opacity={0.10} />
                    {/* outer animated ring */}
                    <circle
                        key={`pulse-${keyIdx}`}
                        className="uxh-pulse"
                        cx={cx}
                        cy={cy}
                        r={18}
                        stroke={stroke}
                        strokeWidth={0.5}
                        fill="none"
                        opacity={0.06}
                    />
                    {/* main active dot */}
                    <circle key={`main-${keyIdx}`} cx={cx} cy={cy} r={10} stroke={stroke} strokeWidth={2} fill={fill} />
                </g>
            );
        }

        // default small dot
        return <circle key={`dot-${keyIdx}`} cx={cx} cy={cy} r={6} stroke={stroke} strokeWidth={1.6} fill={fill} />;
    };

    useEffect(() => {
        if (theme === "dark") return setIsDark(true);
        if (theme === "light") return setIsDark(false);

        // theme === 'auto' -> listen to prefers-color-scheme changes
        const mq = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
        const handle = () => setIsDark(getDocDarkClass() || getSystemPrefersDark());
        handle();
        if (mq && mq.addEventListener) mq.addEventListener("change", handle);
        else if (mq && mq.addListener) mq.addListener(handle);
        return () => {
            if (mq && mq.removeEventListener) mq.removeEventListener("change", handle);
            else if (mq && mq.removeListener) mq.removeListener(handle);
        };
    }, [theme]);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape" && onClose) onClose();
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    // prefer CSS variables declared in globals ( :root / .dark). fall back to inline values.
    const overlayBg = `var(--overlay-bg, ${isDark ? "rgba(2,6,23,0.7)" : "rgba(13,18,25,0.45)"})`;
    const titleColor = `var(--title-color, ${isDark ? "#F8FAFC" : "#0f172a"})`;
    const subTitleColor = `var(--sub-title-color, ${isDark ? "#94A3B8" : "#6B7280"})`;
    const gridStroke = `var(--grid-stroke, ${isDark ? "rgba(255,255,255,0.04)" : "#E6E7EA"})`;
    const axisTick = `var(--axis-tick, ${isDark ? "#E6EEF7" : "#0F172A"})`;
    const tooltipBg = `var(--tooltip-bg, ${isDark ? "rgba(6,8,10,0.88)" : "rgba(255,255,255,0.98)"})`;
    const tooltipBorder = `var(--tooltip-border, ${isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)"})`;


    // supply extra Y ticks (replace with prop/state or live stream as needed)
        const yDomain = useMemo(() => {
            if (!data.length) return [0, 100];
    
            const vals = data.map((d: any) => Number(d[yKey]));
            const min = Math.min(...vals);
            const max = Math.max(...vals);
    
            // range and padding (proportional, with a sensible minimum)
            const range = Math.max(1, max - min);
            const pad = Math.max(5, Math.round(range * 0.12)); // ~12% padding, min 5
    
            // floor: raw floor then snap down to nearest 5, never below 0
            const rawFloor = min - pad;
            let floor = Math.max(0, Math.floor(rawFloor / 5) * 5);
    
            // if extraTickValues contain a lower value, expand the floor to include it (snap to 5)
            if (extraTickValues.length) {
                const extraMin = Math.min(...extraTickValues);
                if (extraMin < floor) floor = Math.max(0, Math.floor(extraMin / 5) * 5);
            }
    
            // defensive: ensure floor is below the ceil we will compute
            // compute a more UX-friendly ceil:
            // - give headroom above the max (max + pad)
            // - snap up to nearest 5
            // - ensure a minimum visible ceiling (e.g. 50) for small scores so the line isn't squashed at top
            // - cap at 100
            const minUsefulCeil = 50; // change this if you want a different minimum UX ceiling
            const desiredCeil = Math.ceil((max + pad) / 5) * 5;
            const ceil = Math.min(100, Math.max(minUsefulCeil, desiredCeil));
    
            // ensure floor < ceil; if not, push floor down (snap to 5)
            if (floor >= ceil) {
                floor = Math.max(0, Math.floor((ceil - 20) / 5) * 5);
            }
    
            return [floor, ceil];
        }, [data, extraTickValues]);


    const yTicks = useMemo(() => {
        const [floor, ceil] = yDomain;
        if (!data.length) return [0, 100];

        const ticks = new Set<number>();
        ticks.add(floor);
        ticks.add(ceil);
        // include the first recorded score exactly (ensure it's within domain)
        if (first && typeof first[yKey] === "number") {
            const v = Number(first[yKey]);
            if (v >= floor && v <= ceil) ticks.add(Math.round(v));
        }
        // include any extra values (real-time values) if within domain
        for (const v of extraTickValues) {
            if (typeof v === "number" && v >= floor && v <= ceil) ticks.add(Math.round(v));
        }
        const step = Math.max(5, Math.round((ceil - floor) / 4));
        for (let t = floor; t <= ceil; t += step) ticks.add(t);

        return Array.from(ticks).sort((a, b) => a - b);
    }, [yDomain, data, first, yKey, extraTickValues]);

    // modal sizing optimized for seniors (taller by default)
    const modalHeight = height ? `${height}px` : "min(760px, 90vh)";

    return (
        <div
            onClick={() => onClose?.()}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: overlayBg,
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                padding: 20,
            }}
            aria-modal="true"
            role="dialog"
        >
            <div onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[1040px] rounded-[14px] overflow-hidden flex flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(250,250,250,0.95))] dark:bg-[linear-gradient(180deg,rgba(12,14,17,0.92),rgba(18,20,24,0.92))] border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.04)] shadow-[0_30px_80px_rgba(2,6,23,0.48)] dark:shadow-[0_30px_80px_rgba(2,6,23,0.6)]"
                style={{ height: modalHeight }} >
                {hoverTooltip.visible && (
                    <div
                        role="tooltip"
                        aria-hidden={!hoverTooltip.visible}
                        style={{
                            position: "fixed",
                            left: hoverTooltip.x,
                            top: hoverTooltip.y,
                            transform: "translate(8px, 8px)",
                            background: tooltipBg,
                            color: titleColor,
                            padding: "6px 10px",
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 700,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                            pointerEvents: "none",
                            zIndex: 10000,
                            border: tooltipBorder,
                        }}
                    >
                        {hoverTooltip.label}
                    </div>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16 }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 12,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "linear-gradient(90deg,#ED5E20,#FF8A00)",
                                boxShadow: isDark ? "0 12px 36px rgba(0,0,0,0.6)" : "0 12px 36px rgba(237,94,32,0.14)",
                            }}
                        >
                            <ChartLine size={22} color="#fff" />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                            <h2
                                className="text-2xl sm:text-3xl font-bold text-center gradient-text mb-4"
                                style={{ color: titleColor, margin: 0 }}
                            >
                                {metricName} over time
                            </h2>
                            <div style={{ fontSize: 15, color: subTitleColor, textAlign: "left" }}>
                                {data.length > 0 ? `${data[0].date} — ${data[data.length - 1].date}` : "No evaluations"}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "10px 14px",
                                borderRadius: 12,
                                fontWeight: 800,
                                color: trendColor,
                                background:
                                    trendState === "positive"
                                        ? "linear-gradient(90deg, rgba(22,163,74,0.08), rgba(22,163,74,0.03))"
                                        : trendState === "negative"
                                            ? "rgba(220,38,38,0.06)"
                                            : "rgba(107,114,128,0.06)",
                                boxShadow:
                                    trendState === "positive"
                                        ? "0 10px 30px rgba(16,185,129,0.06)"
                                        : trendState === "negative"
                                            ? "0 8px 24px rgba(220,38,38,0.06)"
                                            : "0 6px 18px rgba(107,114,128,0.04)",
                                backdropFilter: "blur(6px)",
                                minWidth: 92,
                                justifyContent: "center",
                            }}
                            title={
                                trendState === "positive"
                                    ? "Improved"
                                    : trendState === "negative"
                                        ? "Regressed"
                                        : "No change"
                            }
                        >
                            <TrendIcon size={16} />
                            <span style={{ fontSize: 17 }}>
                                {improvementDisplay}
                            </span>
                        </div>
                        <button
                            onClick={() => onClose?.()}
                            aria-label="Close graphs"
                            className="inline-flex items-center justify-center w-[44px] h-[44px] rounded-[10px] bg-transparent cursor-pointer
                                       text-[#0F172A] dark:text-[#E6EEF7]
                                       border border-[rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.08)]
                                      hover:border-[rgba(0,0,0,0.18)] dark:hover:border-[rgba(255,255,255,0.12)]
                                       focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#FF8A00]/30"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div style={{ padding: 18, flex: 1, minHeight: 240 }}>
                    {/* Accessible description for assistive tech / screen readers */}
                    <span
                        id="improvement-graph-desc"
                        style={{ position: "absolute", left: -10000, top: "auto", width: 1, height: 1, overflow: "hidden" }}
                    >
                        {metricName} improvement chart. X axis shows evaluation dates, Y axis shows normalized score values.
                    </span>

                    {/* change cursor while hovering the chart area */}
                    <div
                        // allow CSS variable to control cursor color/shape via .dark
                        className="uxh-chart-cursor text-[#0F172A] dark:text-[#E6EEF7]"
                        onMouseEnter={() => { }}
                        onMouseLeave={() => { }}
                        style={{ width: "100%", height: "100%" }}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={data}
                                margin={{ top: 24, right: 18, left: 64, bottom: 20 }}
                                role="img"
                                aria-labelledby="improvement-graph-desc"
                                onMouseMove={(state: any) => {
                                    if (state && typeof state.activeTooltipIndex === "number") setActiveIndex(state.activeTooltipIndex);
                                    else setActiveIndex(null);
                                }}
                                onMouseLeave={() => setActiveIndex(null)}
                            >
                                <defs>
                                    <linearGradient id="gradA" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor={trendColor} stopOpacity={0.22} />
                                        <stop offset="100%" stopColor={trendColor} stopOpacity={0.04} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                                {first && (
                                    <>
                                        <ReferenceLine
                                            y={first[yKey]}
                                            stroke={trendColor}
                                            strokeWidth={1}
                                            strokeDasharray="4 6"
                                            label={{
                                                value: `First: ${first[yKey]} • ${first.date}`,
                                                position: "left",
                                                offset: -12,
                                                fill: axisTick,
                                                fontSize: 13,
                                                fontWeight: 700,
                                            }}
                                        />
                                        <ReferenceDot
                                            x={first.version}
                                            y={first[yKey]}
                                            r={6}
                                            fill={trendColor}
                                            stroke={titleColor}
                                            strokeWidth={1.5}
                                        />
                                    </>
                                )}
                                {/* X axis: larger, higher-contrast ticks and stronger axis line for readability */}
                                <XAxis
                                    dataKey="version"
                                    height={48}
                                    axisLine={{ stroke: "currentColor", strokeWidth: 1.6 }}
                                    tickLine={{ stroke: "currentColor", strokeWidth: 1 }}
                                    interval={data.length > 6 ? "preserveStartEnd" : 0}
                                    minTickGap={14}
                                    padding={{ left: 12, right: 12 }}
                                    label={{ value: "Versions", position: "insideBottom", offset: -8, fill: "currentColor", fontSize: 14 }}
                                    tick={({ x, y, payload }: any) => {
                                        const label = `Version ${payload.value}`; // what we show in the hover tooltip
                                        return (
                                            <g transform={`translate(${x}, ${y + 16})`}>
                                                <text
                                                    x={0}
                                                    y={0}
                                                    textAnchor="middle"
                                                    // Tailwind color toggles light/dark; ux h-axis-tick ensures SVG fill uses currentColor
                                                    className="uxh-axis-tick text-[16px] font-extrabold text-[#0F172A] dark:text-[#E6EEF7]"
                                                    style={{ cursor: "default", pointerEvents: "auto", userSelect: "none" }}
                                                    aria-label={label}
                                                    onMouseEnter={(e: any) => {
                                                        setHideNativeTooltip(true);
                                                        setHoverTooltip({ visible: true, label, x: e.clientX, y: e.clientY });
                                                    }}
                                                    onMouseMove={(e: any) =>
                                                        setHoverTooltip((s) => (s.visible ? { ...s, x: e.clientX, y: e.clientY } : s))
                                                    }
                                                    onMouseLeave={() => {
                                                        setHideNativeTooltip(false);
                                                        setHoverTooltip({ visible: false, label: "", x: 0, y: 0 });
                                                    }}
                                                >
                                                    {payload.value}
                                                </text>
                                            </g>
                                        );
                                    }}
                                />

                                {/* Y axis: fixed domain from yDomain, larger ticks and clearer lines */}
                                <YAxis
                                    // supply explicit ticks so the first score is shown on the axis
                                    ticks={yTicks}
                                    tick={{ fontSize: 16, fill: "currentColor", fontWeight: 700 }}
                                    axisLine={{ stroke: "currentColor", strokeWidth: 1.6 }}
                                    tickLine={{ stroke: "currentColor", strokeWidth: 1 }}
                                    domain={yDomain}
                                    allowDecimals={false}
                                    tickCount={5}
                                    label={{
                                        value: metricName,
                                        angle: 0,               // vertical orientation (conventional)
                                        position: "left",         // outside the plot area, left side
                                        dx: -12,                  // nudge left/right as needed
                                        dy: 4,                    // small vertical nudge so baseline aligns with ticks
                                        fill: "currentColor",
                                        fontSize: 14,
                                    }}
                                />
                                <Tooltip
                                    wrapperStyle={hideNativeTooltip ? { display: "none" } : undefined}
                                    cursor={false}
                                    // format the built-in chart tooltip label (top line) to "Version N"
                                    labelFormatter={(label) => `Version ${label}`}
                                    contentStyle={{
                                        borderRadius: 12,
                                        border: tooltipBorder,
                                        background: tooltipBg,
                                        backdropFilter: "blur(6px)",
                                        fontSize: 16,
                                        padding: "12px 14px",
                                    }}
                                    itemStyle={{ color: trendColor, fontWeight: 800 }}
                                    formatter={(value: any) => [value, metricName]}
                                    labelStyle={{ color: axisTick, fontSize: 15 }}
                                />
                                {/* use `yKey` so explicit values in data drive the Y axis when present */}
                                <Area type="monotone" dataKey={yKey} stroke={trendColor} fill="url(#gradA)" fillOpacity={1} />
                                <Line
                                    type="monotone"
                                    dataKey={yKey}
                                    stroke={trendColor}
                                    strokeWidth={activeIndex !== null ? 5 : 4.5}
                                    strokeOpacity={0.98}
                                    strokeLinecap="round"
                                    dot={renderDot}
                                    activeDot={false} // handled by renderDot via activeIndex
                                    aria-label={`${metricName} trend line`}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}