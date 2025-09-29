import { Mail, Globe, Users, Pencil } from "lucide-react";

export type ProfileContactProps = {
    email: string;
    website?: string;
    openTo?: string;
    onEdit?: () => void;
    isOwner?: boolean;
    extraFieldsRaw?: string;
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
        <div className="flex-1 bg-white dark:bg-[#1A1A1A]/25 rounded-xl p-5 justify-center shadow-md">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-[#1A1A1A] dark:text-white">Contact</h2>
                {isOwner && onEdit && (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="cursor-pointer p-2 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900 transition"
                        aria-label="Edit Contact"
                    >
                        <Pencil size={20} className="text-orange-400" />
                    </button>
                )}
            </div>

            {isEmpty ? (
                <div className="flex flex-col items-center justify-center py-8">
                    {/* Transparent SVG illustration */}
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
                    {isOwner && onEdit && (
                        <button
                            type="button"
                            onClick={onEdit}
                            className="cursor-pointer mt-4 px-4 py-2 bg-orange-400 text-white rounded shadow hover:bg-orange-500 transition"
                        >
                            <Pencil size={18} className="inline mr-2" />
                            Add Contact Info
                        </button>
                    )}
                </div>

            ) : (
                <>
                    <div className="flex flex-col flex-wrap gap-4">
                        <div className="flex items-center gap-3 w-full sm:w-[calc(50%-0.5rem)]">
                            <div className="bg-white/10 p-3 rounded-full shrink-0">
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
                            <div className="bg-white/10 p-3 rounded-full shrink-0">
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
                        <div className="flex items-center gap-3 w-full">
                            <div className="bg-white/10 p-3 rounded-full shrink-0">
                                <Users size={24} className="text-green-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">Open to</p>
                                <p className="text-sm text-gray-500 dark:text-gray-300 break-words whitespace-normal">{openTo}</p>
                            </div>
                        </div>
                    </div>
                    {extraFields.map((field, idx) => (
                        <div key={idx} className="flex items-center gap-3 w-full mt-2">
                            <div className="bg-white/10 p-3 rounded-full shrink-0 flex items-center justify-center">
                                {renderIcon(field.icon)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">{field.label}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-300 break-words whitespace-normal">{field.value}</p>
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}