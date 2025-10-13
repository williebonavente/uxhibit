"use client";
import { useCallback, useEffect, useState } from "react";
import TestimonialsForm from "./testimoinals-form";
import type { Testimonial } from "../types";
import { createClient } from "@/utils/supabase/client";
import TestimonialOwnerActions from "./testimonial-owner-action";
import { Plus } from "lucide-react";
import Image from "next/image";

export default function TestimonialsSection({ profileId }: { profileId: string }) {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);


    const fetchTestimonials = useCallback(async () => {
        setLoading(true);
        const res = await fetch(`/api/testimonials?profileId=${profileId}`);
        const data = await res.json();
        setTestimonials(data);
        setLoading(false);
    }, [profileId]);


    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            setCurrentUserId(data?.user?.id ?? null);
        });
    }, []);

    useEffect(() => {
        fetchTestimonials();
    }, [fetchTestimonials]);

    function handleEdit(testimonial: Testimonial) {
        setEditingTestimonial(testimonial);
        setShowForm(true);
    }

    function handleTestimonialSaved(newTestimonial: Testimonial) {
        fetchTestimonials();
        setTestimonials(prev =>
            prev.some(t => t.id === newTestimonial.id)
                ? prev.map(t => t.id === newTestimonial.id ? newTestimonial : t)
                : [newTestimonial, ...prev]
        );
        setShowForm(false);
        setEditingTestimonial(null);
    }

    async function handleDelete(testimonial: Testimonial) {
        await fetch("/api/testimonials", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: testimonial.id }),
        });
        setTestimonials(prev => prev.filter(t => t.id !== testimonial.id));
    }
    function handleCancel() {
        setShowForm(false);
    }
    const isOwner = currentUserId === profileId;
    return (
        <div className="flex-1 bg-white dark:bg-[#1A1A1A]/25 rounded-xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#1A1A1A] dark:text-white">Testimonials</h2>
                {!isOwner && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="cursor-pointer flex items-center transition-colors"
                        aria-label="Add Testimonial"
                        title="Add Testimonial"
                    >
                        <Plus size={18} className="text-gray-500 hover:text-orange-500 dark:hover:text-white transition-colors" />
                    </button>
                )}
            </div>
            {showForm && (
                <TestimonialsForm
                    profileId={profileId}
                    initialData={editingTestimonial ?? undefined}
                    onSaved={handleTestimonialSaved}
                    onCancel={handleCancel}
                />
            )}
            <div className="space-y-4 mt-4">
                {loading ? (
                    <p className="text-gray-400">Loading testimonials...</p>
                ) : testimonials.length === 0 ? (
                    <p className="text-gray-400 italic">No testimonials yet.</p>
                ) : (
                    (
                        testimonials
                            .filter((t) => t.id)
                            .filter((t, idx, arr) => arr.findIndex(x => x.id === t.id) === idx)
                            .map((t, idx) => (
                                <div key={t.id ?? idx} className="relative group">
                                    <blockquote className="text-sm text-gray-500 dark:text-gray-300 italic border-l-4 border-green-400 pl-4 pr-12">
                                        <div className="flex justify-between items-start w-full">
                                            <span className="block flex-1">
                                                “{t.quote}”
                                            </span>
                                            {isOwner && t.created_at && (
                                                <span className="ml-4 px-3 py-1 bg-white dark:bg-[#1A1A1A] rounded shadow text-xs text-gray-500 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Posted: {new Date(t.created_at).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                        <footer className="mt-1 text-xs text-gray-400 flex items-center gap-2">
                                            <Image
                                                src={t.profiles?.avatar_url ?? "/images/default_avatar.png"}
                                                alt={t.author}
                                                className="w-6 h-6 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                                height={24}
                                                width={24}
                                            />
                                            {/* Name and role */}
                                            <span>
                                                <span className="font-semibold text-gray-700 dark:text-gray-200">{t.author}</span>
                                                {t.role && <span className="ml-1 text-gray-400">({t.role})</span>}
                                                {t.created_by === currentUserId && (
                                                    <span className="ml-2 text-green-500 font-semibold">(You)</span>
                                                )}
                                            </span>
                                        </footer>
                                    </blockquote>
                                    {/* Edit/Delete actions for testimonial author */}
                                    {t.created_by === currentUserId && (
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-[#1A1A1A] rounded shadow p-1 z-20">
                                            <TestimonialOwnerActions
                                                testimonial={t}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))
                    )
                )}
            </div>
        </div>
    );
}