"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
type Design = {
    id: string;
    project_name: string;
    fileKey?: string;
    nodeId?: string;
    // Add other properties as needed
};


export default function DesignDetailPage() {
    const [design, setDesign] = useState<Design | null>(null);
    const { id } = useParams() as { id: string }; // ← get dynamic route param

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("designs") || "[]");
        setDesign(stored.find((d: Design) => d.id === id) || null);
    }, [id]);

    if (!design) return <p className="p-4">Design not found.</p>;

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-xl font-semibold">{design.project_name}</h1>

            <div className="relative w-full max-w-4xl aspect-[16/9] rounded-xl overflow-hidden">
                <Image
                    src={
                        design.fileKey
                            ? `/api/figma/thumbnail?fileKey=${design.fileKey}${design.nodeId ? `&nodeId=${encodeURIComponent(design.nodeId)}` : ""
                            }`
                            : "/images/design-thumbnail.png"
                    }
                    alt={design.project_name || "Figma Preview"}
                    fill
                    className="object-cover"
                />
            </div>

            {/* Placeholder for AI evaluation content */}
            <section className="prose dark:prose-invert">
                <h2>AI Evaluation</h2>
                <p>Coming soon…</p>
            </section>

            <Link href="/" className="text-blue-600 underline">Back</Link>
        </div>
    );
}