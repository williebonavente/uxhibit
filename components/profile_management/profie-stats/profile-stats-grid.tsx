import { LayoutGrid, Heart, Eye, Users } from "lucide-react";
import React from "react";

type Stat = {
    label: string;
    value: string | number;
    icon: React.ReactNode;
};

interface ProfileStatsGridProps {
    stats?: Stat[];
}

export default function ProfileStatsGrid({
    stats = [
        { label: "Designs", value: 24, icon: <LayoutGrid size={25} className="text-white" /> },
        { label: "Likes", value: 1280, icon: <Heart size={25} className="text-white" /> },
        { label: "Views", value: "15.2K", icon: <Eye size={25} className="text-white" /> },
        { label: "Followers", value: 342, icon: <Users size={25} className="text-white" /> },
    ],
}: ProfileStatsGridProps) {
    return (
        <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, i) => (
                <div
                    key={i}
                    className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4
            bg-white dark:bg-[#1A1A1A]/25 rounded-xl p-4 break-words shadow-md"
                >
                    <div className="bg-[#ED5E20] p-3 rounded-full shrink-0">{stat.icon}</div>
                    <div className="text-center sm:text-left">
                        <p className="text-xl font-bold text-[#1A1A1A] dark:text-white truncate">{stat.value}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-300 truncate">{stat.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}