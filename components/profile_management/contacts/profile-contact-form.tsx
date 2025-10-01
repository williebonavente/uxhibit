"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { X, Trash2, Plus, Loader2, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";


// import EmojiPicker from "emoji-picker-react"; // Uncomment if you install an emoji picker

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
    const [email, setEmail] = useState(initialContact?.email || "");
    const [website, setWebsite] = useState(initialContact?.website || "");
    const [openTo, setOpenTo] = useState(initialContact?.open_to || "");
    const [loading, setLoading] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [newFieldIcon, setNewFieldIcon] = useState("👥");
    const [newFieldValue, setNewFieldValue] = useState("");
    const [extraFields, setExtraFields] = useState<ExtraField[]>(() => {
        if (initialContact?.extra_fields) {
            try {
                const parsed = typeof initialContact.extra_fields === "string"
                    ? JSON.parse(initialContact.extra_fields)
                    : initialContact.extra_fields;
                // Ensure every field has an icon
                return parsed.map((field: any) => ({
                    label: field.label,
                    value: field.value,
                    icon: field.icon ?? "👥", // Default icon if missing
                }));
            } catch {
                return [];
            }
        }
        return [];
    });
    const [showAddFieldModal, setShowAddFieldModal] = useState(false);
    const [newFieldLabel, setNewFieldLabel] = useState("");
    const supabase = createClient();
    const [page, setPage] = useState(1);

    const ITEMS_PER_PAGE = 5;

    const totalPages = Math.max(1, Math.ceil(extraFields.length / ITEMS_PER_PAGE));

    const paginatedFields = extraFields.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );



    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        // Log all values before submitting
        console.log("Submitting contact info:", {
            profile_details_id: profileDetailsId,
            email,
            website,
            open_to: openTo,
            extraFields,
        });

        const { error, data } = await supabase
            .from("profile_contacts")
            .upsert(
                [
                    {
                        profile_details_id: profileDetailsId,
                        email,
                        website,
                        open_to: openTo,
                        extra_fields: JSON.stringify(extraFields), // If you add a JSON column
                    },
                ],
                { onConflict: "profile_details_id" }
            );

        // Log Supabase response
        console.log("Supabase upsert response:", { error, data });

        setLoading(false);
        if (error) {
            console.error("Error updating contact:", error.message);
            alert("Failed to save contact info.");
            return;
        }
        onSave();
    }

    async function handleDelete() {
        setLoading(true);

        // Log delete action
        console.log("Deleting contact for profile_details_id:", profileDetailsId);

        const { error } = await supabase
            .from("profile_contacts")
            .delete()
            .eq("profile_details_id", profileDetailsId);

        // Log Supabase response
        console.log("Supabase delete response:", { error });

        setLoading(false);
        if (error) {
            alert("Failed to delete contact info.");
            return;
        }
        onSave();
    }

    // function handleAddField() {
    //     const newFields = [...extraFields, { label: "", value: "" }];
    //     console.log("Adding extra field:", newFields);
    //     setExtraFields(newFields);
    // }

    function handleExtraFieldChange(index: number, key: "label" | "value", val: string) {
        const updated = [...extraFields];
        updated[index][key] = val;
        console.log(`Extra field changed at index ${index}:`, updated);
        setExtraFields(updated);
    }


    function handleAddField() {
        setShowAddFieldModal(true);
        setNewFieldLabel("");
    }

    function handleConfirmAddField() {
        if (newFieldLabel.trim()) {
            setExtraFields([...extraFields, { label: newFieldLabel.trim(), value: "", icon: newFieldIcon }]);
        }
        setShowAddFieldModal(false);
        setNewFieldLabel("");
        setNewFieldIcon("👥");
    }

    function handleCancelAddField() {
        setShowAddFieldModal(false);
        setNewFieldLabel("");
    }



    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="relative bg-white dark:bg-[#1A1A1A] rounded-xl shadow-xl p-8 w-full max-w-2xl mx-4">
                <button
                    type="button"
                    onClick={onSave}
                    className="cursor-pointer absolute top-4 right-4 p-2 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900 transition"
                    aria-label="Close"
                >
                    <X size={20} className="text-orange-400" />
                </button>
                <h2 className="text-xl font-semibold mb-6 text-[#ED5E20] dark:text-orange-300 text-center">
                    Contact Info
                </h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Email field with label */}
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold mb-1 text-orange-400" htmlFor="email-input">Email</label>
                        <input
                            id="email-input"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Email"
                            required
                            className="border border-orange-200 dark:border-orange-700 rounded p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>
                    {/* Website field with label */}
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold mb-1 text-orange-400" htmlFor="website-input">Website</label>
                        <input
                            id="website-input"
                            type="text"
                            value={website}
                            onChange={e => setWebsite(e.target.value)}
                            placeholder="Website"
                            className="border border-orange-200 dark:border-orange-700 rounded p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>
                    {/* Open to field with label */}
                    <div className="flex flex-col relative">
                        <label className="text-sm font-semibold mb-1 text-orange-400" htmlFor="open-to-input">Open to</label>
                        <input
                            id="open-to-input"
                            type="text"
                            value={openTo}
                            onChange={e => setOpenTo(e.target.value)}
                            placeholder="Open to"
                            className="border border-orange-200 dark:border-orange-700 rounded p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                        {/* Emoji picker toggle */}
                        <button
                            type="button"
                            className="absolute right-2 top-8 cursor-pointer"
                            onClick={() => setShowEmoji(!showEmoji)}
                            aria-label="Pick emoji"
                        >
                            {/* <span role="img" aria-label="emoji">😊</span> */}
                        </button>
                        {/* {showEmoji && (
            <EmojiPicker
                onEmojiClick={emoji => setOpenTo(openTo + emoji.emoji)}
                width={250}
            />
        )} */}
                    </div>
                    {/* Extra fields as editable table */}
                    {paginatedFields.map((field: ExtraField, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <div className="flex flex-col flex-1">
                                <label className="text-sm font-semibold mb-1 text-orange-400">{field.label}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={field.value}
                                        onChange={e => handleExtraFieldChange(idx, "value", e.target.value)}
                                        placeholder={field.label}
                                        className="border rounded p-2"
                                    />
                                    <Select value={field.icon} onValueChange={val => handleExtraFieldChange(idx, "icon", val)}>
                                        <SelectTrigger
                                            className="border rounded p-2 text-xl text-center bg-white dark:bg-[#1A1A1A]"
                                            style={{ width: "80px" }}
                                        >
                                            <SelectValue placeholder="Pick" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="👥">👥</SelectItem>
                                            <SelectItem value="📧">📧</SelectItem>
                                            <SelectItem value="🌐">🌐</SelectItem>
                                            <SelectItem value="😊">😊</SelectItem>
                                            <SelectItem value="💼">💼</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="text-red-400 px-2 cursor-pointer"
                                onClick={() => {
                                    const updated = extraFields.filter((_, i) => i !== idx);
                                    setExtraFields(updated);
                                }}
                                aria-label="Delete field"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}

                    <div className="flex justify-center items-center gap-2 mt-2">
                        <button
                            type="button"
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-sm font-semibold text-orange-400">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage(page + 1)}
                            disabled={page === totalPages}
                            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition disabled:opacity-50"
                            aria-label="Next page"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <div className="flex justify-between items-center gap-2 mt-6 w-full">
                        {/* Left side: Add Field */}
                        <div className="flex-1 flex">
                            <button 
                                type="button"
                                className="bg-orange-100 text-orange-700 rounded p-2 font-semibold shadow hover:bg-orange-200 transition cursor-pointer flex items-center justify-center"
                                onClick={handleAddField}
                            >
                                <Plus size={18} className="mr-2" /> Add Field
                            </button>
                        </div>
                        {/* Right side: Save and Delete */}
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded p-2 font-semibold shadow hover:from-orange-500 hover:to-orange-600 transition cursor-pointer flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin mr-2" /> Saving...
                                    </>
                                ) : (
                                    <>
                                        <Pencil size={18} className="mr-2" /> Save
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                disabled={loading}
                                onClick={handleDelete}
                                className="bg-red-100 text-red-700 rounded p-2 font-semibold shadow hover:bg-red-200 transition cursor-pointer flex items-center justify-center"
                            >
                                <Trash2 size={18} className="mr-2" /> Delete 
                            </button>
                        </div>
                    </div>
                </form>

                {showAddFieldModal && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-[#1A1A1A] rounded-xl shadow-xl p-6 w-full max-w-md mx-4 flex flex-col gap-4">
                            <h3 className="text-lg font-semibold text-orange-400 mb-2 text-center">Add New Contact Information</h3>
                            <div className="flex gap-2 items-center">
                                <div className="flex flex-col flex-1">
                                    <label className="text-sm font-semibold mb-1 text-orange-400">Field</label>
                                    <input
                                        type="text"
                                        value={newFieldLabel}
                                        onChange={e => setNewFieldLabel(e.target.value)}
                                        placeholder="Enter field label"
                                        className="border border-orange-200 dark:border-orange-700 rounded p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold mb-1 text-orange-400">Icon</label>
                                    <Select value={newFieldIcon} onValueChange={setNewFieldIcon}>
                                        <SelectTrigger className="border rounded p-2 w-24 text-xl text-center bg-white dark:bg-[#1A1A1A]">
                                            <SelectValue placeholder="Pick" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="👥">👥</SelectItem>
                                            <SelectItem value="📧">📧</SelectItem>
                                            <SelectItem value="🌐">🌐</SelectItem>
                                            <SelectItem value="😊">😊</SelectItem>
                                            <SelectItem value="💼">💼</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-semibold mb-1 text-orange-400">Value</label>
                                <input
                                    type="text"
                                    value={newFieldValue}
                                    onChange={e => setNewFieldValue(e.target.value)}
                                    placeholder="Enter field value"
                                    className="border border-orange-200 dark:border-orange-700 rounded p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    className="px-4 py-2 rounded bg-orange-400 text-white font-semibold hover:bg-orange-500 transition cursor-pointer"
                                    onClick={() => {
                                        if (newFieldLabel.trim()) {
                                            setExtraFields([
                                                ...extraFields,
                                                { label: newFieldLabel.trim(), value: newFieldValue.trim(), icon: newFieldIcon }
                                            ]);
                                        }
                                        setShowAddFieldModal(false);
                                        setNewFieldLabel("");
                                        setNewFieldValue("");
                                        setNewFieldIcon("👥");
                                    }}
                                >
                                    Add
                                </button>
                                <button
                                    type="button"
                                    className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition cursor-pointer"
                                    onClick={handleCancelAddField}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

    );
}