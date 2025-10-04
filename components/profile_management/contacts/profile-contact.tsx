import { Mail, Users, Pencil } from "lucide-react";
import {
    Book, Trophy, Rocket, Star, Medal, Flame, Sparkles, Lightbulb,
    Heart, ThumbsUp, PartyPopper, Gem, Mountain, Globe,
    Sun, Moon, Brain, Dumbbell
} from "lucide-react";

export type ProfileContactProps = {
    email: string;
    website?: string;
    openTo?: string;
    onEdit?: () => void;
    isOwner?: boolean;
    extraFieldsRaw?: string;
    icon:
    | "book" | "trophy" | "rocket" | "star" | "medal" | "fire" | "sparkles" | "lightbulb"
    | "heart" | "thumbsup" | "party" | "diamond" | "mountain" | "globe"
    | "fireworks" | "muscle" | "brain" | "sun" | "moon";
};

const iconMap: Record<ProfileContactProps["icon"], React.ReactElement> = {
    book: <Book className="w-5 h-5 text-blue-500" />,
    trophy: <Trophy className="w-5 h-5 text-yellow-500" />,
    rocket: <Rocket className="w-5 h-5 text-orange-500" />,
    star: <Star className="w-5 h-5 text-amber-400" />,
    medal: <Medal className="w-5 h-5 text-yellow-600" />,
    fire: <Flame className="w-5 h-5 text-red-500" />,
    sparkles: <Sparkles className="w-5 h-5 text-pink-400" />,
    lightbulb: <Lightbulb className="w-5 h-5 text-amber-500" />,
    heart: <Heart className="w-5 h-5 text-rose-500" />,
    thumbsup: <ThumbsUp className="w-5 h-5 text-blue-600" />,
    party: <PartyPopper className="w-5 h-5 text-purple-500" />,
    diamond: <Gem className="w-5 h-5 text-cyan-500" />,
    mountain: <Mountain className="w-5 h-5 text-gray-600" />,
    globe: <Globe className="w-5 h-5 text-green-500" />,
    fireworks: <PartyPopper className="w-5 h-5 text-fuchsia-500" />,
    muscle: <Dumbbell className="w-5 h-5 text-slate-700" />,
    brain: <Brain className="w-5 h-5 text-pink-500" />,
    sun: <Sun className="w-5 h-5 text-orange-400" />,
    moon: <Moon className="w-5 h-5 text-indigo-500" />,
};

export default function ProfileContact({
    email,
    website,
    openTo,
    onEdit,
    isOwner,
    extraFieldsRaw
}: ProfileContactProps) {

    let extraFields: { label: string; value: string; icon: string; }[] = [];

    try {
        if (extraFieldsRaw) {
            extraFields = JSON.parse(extraFieldsRaw);
        }
    } catch (e) {
        console.error("Failed to parse extraFields: ", e);
    }

    const isEmpty =
        (!email && !website && !openTo) &&
        (!extraFields || extraFields.length === 0);

    function renderIcon(icon: string) {
        switch (icon) {
            case "Users":
                return <Users size={24} className="text-green-400" />;
            case "Mail":
                return <Mail size={24} className="text-orange-400" />;
            case "Globe":
                return <Globe size={24} className="text-blue-400" />;
            default:
                return <span style={{ fontSize: 24 }}>{icon}</span>; // For emoji
        }
    }

    return (
        <div className="flex-1 bg-white dark:bg-[#1A1A1A]/25 rounded-xl p-5 shadow-md relative group">
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-white mb-5 flex items-center gap-2">
                Contact
            </h2>

            {isOwner && onEdit && (
                <button
                    onClick={onEdit}
                    className="absolute top-5 right-5 p-2 cursor-pointer flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    title={isEmpty ? "Add Contact Info" : "Edit Contact Info"}
                    aria-label={isEmpty ? "Add Contact Info" : "Edit Contact Info"}
                >
                    <Pencil size={18} className="text-gray-500 hover:text-orange-500 dark:hover:text-white" />
                </button>
            )}

            {isEmpty ? (
                <div className="flex flex-col items-center justify-center py-8">
                    <svg
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="mb-4 opacity-40"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                        <rect width="24" height="24" rx="12" fill="#ED5E20" fillOpacity="0.1" />
                        <path d="M4 8v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2zm2 0l6 5 6-5" stroke="#ED5E20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-gray-400 dark:text-gray-500 text-center">
                        No contact information provided yet.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-[calc(50%-0.5rem)]">
                        <div className="bg-[#ED5E20]/20 dark:bg-[#ED5E20]/10 p-3 rounded-full shrink-0">
                            <Mail size={24} className="text-orange-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">Email</p>
                            <a
                                href={`mailto:${email}`}
                                className="text-sm text-orange-300 hover:text-[#ED5E20] hover:underline truncate cursor-pointer"
                            >
                                {email}
                            </a>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-[calc(50%-0.5rem)]">
                        <div className="bg-[#ED5E20]/20 dark:bg-[#ED5E20]/10 p-3 rounded-full shrink-0">
                            <Globe size={24} className="text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">Website</p>
                            {website ? (
                                <a
                                    href={website.startsWith("http") ? website : `https://${website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-orange-300 hover:text-[#ED5E20] hover:underline truncate cursor-pointer"
                                >
                                    {website}
                                </a>
                            ) : (
                                <p className="text-sm text-orange-300 truncate">{website}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-[calc(50%-0.5rem)]">
                        <div className="bg-[#ED5E20]/20 dark:bg-[#ED5E20]/10 p-3 rounded-full shrink-0">
                            <Users size={24} className="text-green-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">Open to</p>
                            <p className="text-sm text-gray-500 dark:text-gray-300 break-words whitespace-normal">{openTo}</p>
                        </div>
                    </div>
                    {extraFields.map((field, idx) => (
                        <div key={idx} className="flex items-center gap-3 w-full sm:w-[calc(50%-0.5rem)]">
                            <div className="bg-[#ED5E20]/20 dark:bg-[#ED5E20]/10 p-3 rounded-full shrink-0">
                                {iconMap[field.icon as ProfileContactProps["icon"]]}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">{field.label}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-300 break-words whitespace-normal">{field.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
