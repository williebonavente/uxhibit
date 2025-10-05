"use client";
import { useEffect, useState } from "react";
import { Globe, Pencil } from "lucide-react";
import Link from "next/link";
import FeaturedWorksGrid from "./featured-works-grid";
import CaseStudiesGrid from "./case-studies-grid";
import { FeaturedWork, CaseStudy } from "../types";
import { PortfolioLinkEditor } from "./edit/portfolio-link-editor";
import { createClient } from "@/utils/supabase/client";
import { Plus } from "lucide-react";
import CreateFeaturedWorkModal from "./modals/create-featured-work-modal";
import { toast } from "sonner";
import CreateCaseStudyModal from "./modals/create-case-study-modal";

export default function PortfolioSection({
    portfolioLink,
    featuredWorks,
    caseStudies,
    profileId,
}: {
    portfolioLink: string;
    featuredWorks: FeaturedWork[];
    caseStudies: CaseStudy[];
    profileId: string;
}) {
    const [isOwner, setIsOwner] = useState(false);
    const [currentPortfolioLink, setCurrentPortfolioLink] = useState(portfolioLink);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCaseStudyModal, setShowCaseStudyModal] = useState(false);
    const [studies, setStudies] = useState<CaseStudy[]>(caseStudies);
    const [works, setWorks] = useState<FeaturedWork[]>(featuredWorks);
    const [isEditingLink, setIsEditingLink] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingWork, setEditingWork] = useState<FeaturedWork | null>(null);
    const [editingCaseStudy, setEditingCaseStudy] = useState<CaseStudy | null>(null);

    const handleEditWork = (work: FeaturedWork) => {
        setEditingWork(work);
        setShowEditModal(true);
    };

    const handleDeleteWork = async (work: FeaturedWork) => {
        if (!work.id) {
            toast.error("Cannot delete: item has no id.");
            return;
        }
        const confirmed = window.confirm(`Are you sure you want to delete "${work.title}"?`);
        if (!confirmed) return;

        const supabase = createClient();
        const { error } = await supabase
            .from("featured_works")
            .delete()
            .eq("id", work.id);

        if (error) {
            toast.error("Failed to delete portfolio item.");
        } else {
            setWorks(prev => prev.filter(w => w.id !== work.id));
            toast.success("Portfolio item deleted!");
        }
    };

    // Handler for delete (implement actual delete logic)
    const handleDeleteCaseStudy = async (study: CaseStudy) => {
        if (!study.id) {
            toast.error("Cannot delete: item has no id.");
            return;
        }
        const confirmed = window.confirm(`Are you sure you want to delete "${study.title}"?`);
        if (!confirmed) return;

        const supabase = createClient();
        const { error } = await supabase
            .from("case_studies")
            .delete()
            .eq("id", study.id);

        if (error) {
            toast.error("Failed to delete case study.");
        } else {
            setStudies(prev => prev.filter(s => s.id !== study.id));
            toast.success("Case study deleted!");
        }
    };


    // Update works if the prop changes (e.g. on navigation)
    useEffect(() => {
        setWorks(featuredWorks);
    }, [featuredWorks]);

    useEffect(() => {
        setStudies(caseStudies);
    }, [caseStudies]);

    const handleFeaturedWorkCreated = (newWork: FeaturedWork) => {
        setShowCreateModal(false);
        setWorks(prev => [newWork, ...prev]); // Add new work to the top
        toast.success("Portfolio item added!");

    };

    const handleCaseStudyCreated = (newStudy: CaseStudy) => {
        setStudies(prev => {
            const exists = prev.some(cs => cs.id === newStudy.id);
            if (exists) {
                return prev.map(cs => cs.id === newStudy.id ? newStudy : cs);
            } else {
                return [newStudy, ...prev];
            }
        });
    };

    useEffect(() => {
        setCurrentPortfolioLink(portfolioLink);
    }, [portfolioLink]);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            setIsOwner(data.user?.id === profileId);
        });
    }, [profileId]);


    return (
        <div className="flex flex-col gap-4">
            {showEditModal && (
                <CreateFeaturedWorkModal
                    open={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onCreated={updatedWork => {
                        if (editingWork) {
                            // Editing: update
                            setWorks(prev =>
                                prev.map(w => w.id === updatedWork.id ? updatedWork : w)
                            );
                        } else {
                            // Adding: add new
                            setWorks(prev => [updatedWork, ...prev]);
                        }
                        setShowEditModal(false);
                    }}
                    userId={profileId}
                    initialData={editingWork ?? undefined}
                    isEdit={!!editingWork}
                />
            )}

            <div className="bg-white dark:bg-[#1A1A1A]/25 rounded-xl p-5 shadow-md">
                <h2 className="text-lg font-semibold mb-3 text-[#1A1A1A] dark:text-white">Portfolio</h2>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Globe size={20} className="text-blue-400" />
                    {!isEditingLink ? (
                        <>
                            <Link
                                href={currentPortfolioLink}
                                target="_blank"
                                className="text-sm text-orange-300 dark:text-[#ED5E20] hover:underline truncate cursor-pointer"
                            >
                                {currentPortfolioLink}
                            </Link>
                            {isOwner && (
                                <button onClick={() => setIsEditingLink(true)}>
                                    <Pencil size={16} />
                                </button>
                            )}
                        </>
                    ) : (
                        isOwner && (
                            <>
                                <PortfolioLinkEditor
                                    userId={profileId}
                                    initialLink={currentPortfolioLink}
                                    onSaved={newLink => {
                                        setCurrentPortfolioLink(newLink);
                                        setIsEditingLink(false);
                                    }}
                                />
                                <button
                                    onClick={() => setIsEditingLink(false)}
                                    className="ml-2 px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-sm"
                                >
                                    Cancel
                                </button>
                            </>
                        )
                    )}
                    <div className="flex-1" />
                    {isOwner && (
                        <div className="relative self-end">
                            <button
                                onClick={() => {
                                    setEditingWork(null);
                                    setShowEditModal(true)
                                }}
                                className="flex items-center justify-center p-2 rounded hover:bg-orange-100 dark:hover:bg-[#ED5E20]/20 transition"
                                aria-label={works.length === 0 ? "Add Portfolio Item" : "Edit Portfolio"}
                                title={works.length === 0 ? "Add Portfolio Item" : "Edit Portfolio"}
                            >
                                {works.length === 0 ? (
                                    <Plus size={18} className="text-gray-500 hover:text-orange-500 dark:hover:text-white transition-colors" />
                                ) : (
                                    <Pencil size={18} className="text-gray-500 hover:text-orange-500 dark:hover:text-white transition-colors" />
                                )}
                            </button>
                            <CreateFeaturedWorkModal
                                open={showCreateModal}
                                onClose={() => setShowCreateModal(false)}
                                onCreated={handleFeaturedWorkCreated}
                                userId={profileId}
                                initialData={editingWork ?? undefined}
                                isEdit={!!editingWork}
                            />
                        </div>
                    )}
                </div>
                <FeaturedWorksGrid
                    works={works}
                    isOwner={isOwner}
                    onEdit={handleEditWork}
                    onDelete={handleDeleteWork}

                />
            </div>

            <div className="bg-white dark:bg-[#1A1A1A]/25 rounded-xl p-5 shadow-md">
                <h2 className="text-lg font-semibold mb-3 text-[#1A1A1A] dark:text-white">Case Studies</h2>
                <div className="flex items-center mb-4">
                    <div className="flex-1" />
                    {isOwner && (
                        <div className="relative self-end">
                            <button
                                onClick={() => setShowCaseStudyModal(true)}
                                className="flex items-center justify-center p-2 rounded hover:bg-orange-100 dark:hover:bg-[#ED5E20]/20 transition"
                                aria-label={studies.length === 0 ? "Add Case Study" : "Edit Case Studies"}
                                title={studies.length === 0 ? "Add Case Study" : "Edit Case Studies"}
                            >
                                {studies.length === 0 ? (
                                    <Plus size={18} className="text-gray-500 hover:text-orange-500 dark:hover:text-white transition-colors" />
                                ) : (
                                    <Pencil size={18} className="text-gray-500 hover:text-orange-500 dark:hover:text-white transition-colors" />
                                )}
                            </button>
                            <CreateCaseStudyModal
                                open={showCaseStudyModal}
                                onClose={() => {
                                    setShowCaseStudyModal(false);
                                    setEditingCaseStudy(null);
                                }}
                                onCreated={handleCaseStudyCreated}
                                userId={profileId}
                                initialData={editingCaseStudy ?? undefined}
                                isEdit={!!editingCaseStudy}
                            />
                        </div>
                    )}
                </div>
                <CaseStudiesGrid
                    studies={studies}
                    isOwner={isOwner}
                    onEdit={study => {
                        setEditingCaseStudy(study);
                        setShowCaseStudyModal(true);
                    }}
                    onDelete={handleDeleteCaseStudy}
                />
            </div>
        </div>
    );
}