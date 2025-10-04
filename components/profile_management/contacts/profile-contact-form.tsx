"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Handshake, Mail, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Book,
    Trophy,
    Rocket,
    Star,
    Medal,
    Flame,
    Sparkles,
    Lightbulb,
    Heart,
    ThumbsUp,
    Gem,
    Mountain,
    Globe,
    Dumbbell,
    Brain,
    Sun,
    Moon,
} from "lucide-react";

const iconOptions = [
    { value: "book", icon: <Book size={18} /> },
    { value: "trophy", icon: <Trophy size={18} /> },
    { value: "rocket", icon: <Rocket size={18} /> },
    { value: "star", icon: <Star size={18} /> },
    { value: "medal", icon: <Medal size={18} /> },
    { value: "fire", icon: <Flame size={18} /> },
    { value: "sparkles", icon: <Sparkles size={18} /> },
    { value: "lightbulb", icon: <Lightbulb size={18} /> },
    { value: "heart", icon: <Heart size={18} /> },
    { value: "thumbsup", icon: <ThumbsUp size={18} /> },
    { value: "diamond", icon: <Gem size={18} /> },
    { value: "mountain", icon: <Mountain size={18} /> },
    { value: "globe", icon: <Globe size={18} /> },
    { value: "muscle", icon: <Dumbbell size={18} /> },
    { value: "brain", icon: <Brain size={18} /> },
    { value: "sun", icon: <Sun size={18} /> },
    { value: "moon", icon: <Moon size={18} /> },
];

type ExtraField = {
    label: string;
    value: string;
    icon: string;
};

export default function ProfileContactForm({
    profileDetailsId,
    initialContact,
    onSave,

}: {
    profileDetailsId: string;
    initialContact?: any;
    onSave: () => void;

}) {
    const supabase = createClient();

    const [email, setEmail] = useState(initialContact?.email || "");
    const [website, setWebsite] = useState(initialContact?.website || "");
    const [openTo, setOpenTo] = useState(initialContact?.open_to || "");
    const [extraFields, setExtraFields] = useState<ExtraField[]>(() => {
        try {
            const parsed =
                typeof initialContact?.extra_fields === "string"
                    ? JSON.parse(initialContact.extra_fields)
                    : initialContact?.extra_fields || [];
            return parsed.map((f: any) => ({
                label: f.label,
                value: f.value,
                icon: f.icon ?? "star",
            }));
        } catch {
            return [];
        }
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        await supabase.from("profile_contacts").upsert(
            [
                {
                    profile_details_id: profileDetailsId,
                    email,
                    website,
                    open_to: openTo,
                    extra_fields: JSON.stringify(extraFields),
                },
            ],
            { onConflict: "profile_details_id" }
        );

        onSave();
    }

    function handleAdd() {
        setExtraFields((prev) => [
            ...prev,
            { label: "", value: "", icon: "star" },
        ]);
    }

    function handleChange(
        idx: number,
        key: keyof ExtraField,
        value: string
    ) {
        setExtraFields((prev) =>
            prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item))
        );
    }

    function handleDelete(idx: number) {
        setExtraFields((prev) => prev.filter((_, i) => i !== idx));
    }

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer"
            onClick={onSave}
        >
            <div
                className="relative z-10 flex flex-col w-full max-w-sm sm:max-w-md md:max-w-xl
          p-6 sm:p-8 md:p-10 bg-white dark:bg-[#1A1A1A]
          rounded-2xl shadow-xl border border-white/20 cursor-default"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-bold text-center gradient-text mb-6">
                    Manage Contact Info
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* Basic fields */}
                    <div className="grid grid-cols-1 gap-4">
                        {/* Email */}
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                className="border rounded-lg pl-9 py-2 h-10"
                            />
                        </div>

                        {/* Website */}
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                            <Input
                                type="text"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                placeholder="Website"
                                className="border rounded-lg pl-9 py-2 h-10"
                            />
                        </div>

                        {/* Open To */}
                        <div className="relative">
                            <Handshake className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                            <Input
                                type="text"
                                value={openTo}
                                onChange={(e) => setOpenTo(e.target.value)}
                                placeholder="Open To (e.g. collaborations)"
                                className="border rounded-lg pl-9 py-2 h-10"
                            />
                        </div>
                    </div>

                    {/* Extra fields */}
                    <div className="overflow-y-auto max-h-64 pr-3">
                        <table className="w-full text-sm sm:text-base border-separate border-spacing-y-5">
                            <tbody>
                                {extraFields.map((field, idx) => (

                                    <tr
                                        key={idx}
                                        className="bg-gray-50 dark:bg-accent rounded-xl transition shadow-md"
                                    >
                                        <td className="pl-5 pr-5 py-5 rounded-xl">
                                            <div className="flex items-center justify-between gap-3">

                                                <div className="flex flex-col w-full gap-3 items-end">

                                                    <Select
                                                        value={field.icon}
                                                        onValueChange={(val) =>
                                                            handleChange(idx, "icon", val)
                                                        }
                                                    >
                                                        <SelectTrigger
                                                            className="border rounded-lg px-3 py-2 w-full cursor-pointer"
                                                            aria-label="Icon"
                                                        >
                                                            <SelectValue placeholder="Choose icon" />
                                                        </SelectTrigger>
                                                        <SelectContent className="z-[300]" position="popper">
                                                            {iconOptions.map((opt) => (
                                                                <SelectItem key={opt.value} value={opt.value}>
                                                                    <div className="flex items-center gap-2">
                                                                        {opt.icon}
                                                                        <span className="capitalize">
                                                                            {opt.value}
                                                                        </span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    <Input
                                                        type="text"
                                                        value={field.label}
                                                        onChange={(e) =>
                                                            handleChange(idx, "label", e.target.value)
                                                        }
                                                        placeholder="Field title"
                                                        className="border rounded-lg px-3 py-2 w-full"
                                                    />
                                                    <Input
                                                        type="text"
                                                        value={field.value}
                                                        onChange={(e) =>
                                                            handleChange(idx, "value", e.target.value)
                                                        }
                                                        placeholder="Field value"
                                                        className="border rounded-lg px-3 py-2 flex-1 w-full"
                                                    />

                                                    <button
                                                    type="button"
                                                    onClick={() => handleDelete(idx)}
                                                    className="pt-2"
                                                    aria-label="Delete field"
                                                >
                                                    <Trash2
                                                        size={18}
                                                        className="text-gray-500 hover:text-red-600 cursor-pointer transition"
                                                    />
                                                </button>

                                                </div>


                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Add button */}

                    <button
                        type="button"
                        onClick={handleAdd}
                        className="w-full mb-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2
                        text-[#ED5E20] border border-dashed border-[#ED5E20]/50 hover:bg-[#ED5E20]/10 transition w-full cursor-pointer"
                    >
                        <Plus size={18} /> Add Field
                    </button>


                    {/* Footer buttons */}
                    <div className="flex gap-4 mt-2">
                        <button
                            type="button"
                            onClick={onSave}
                            className="flex-1 inline-flex items-center justify-center rounded-xl text-sm font-medium
              border border-neutral-300/70 dark:border-neutral-600/60
              bg-white/70 dark:bg-neutral-800/70
              text-neutral-700 dark:text-neutral-200
              shadow-sm backdrop-blur
              hover:bg-neutral-100 dark:hover:bg-neutral-700
              transition-colors h-12 cursor-pointer"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="relative flex-1 inline-flex items-center justify-center
              rounded-xl text-sm text-white font-semibold tracking-wide
              transition-all duration-300 h-12 overflow-hidden
              focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40
              cursor-pointer group"
                        >
                            <span
                                aria-hidden
                                className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b]"
                            />
                            <span
                                aria-hidden
                                className="absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.25),rgba(255,255,255,0.06))] backdrop-blur-[2px]"
                            />
                            <span
                                aria-hidden
                                className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl"
                            >
                                <span className="absolute inset-y-0 -left-full w-1/2
                  bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0
                  transition-all duration-700 group-hover:translate-x-[220%] group-hover:opacity-70" />
                            </span>
                            <span className="relative z-10">Save All</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
