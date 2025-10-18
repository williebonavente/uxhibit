"use client";

import React from "react";
import {
  useEffect,
  useState,
  useRef,
} from "react";
import Image from "next/image";
import EvaluationResult from "./dialogs/EvaluationResult";
import FrameNavigator from "./dialogs/FrameNavigator";
import {
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
} from "@tabler/icons-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner/index";
import { fetchDesignVersions, deleteDesignVersion } from "@/database/actions/versions/versionHistory";
import VersionHistoryModal from "./dialogs/VersionHistoryModal";
import DesignHeaderActions from "./dialogs/DesignHeader";
import ZoomControls from "./dialogs/ZoomControls";
import { CommentsSection } from "./comments/page";
import { Comment } from "@/components/comments-user";
import EvaluationParamsModal from "@/components/evaluation-params-modal";
import DesignHeaderTitle from "@/components/arrow-back-button";
import { handleEvalParamsSubmit, handleEvaluateWithParams } from "@/lib/reEvaluate/evaluationHandlers";
import useResizeAndPan from "@/utils/resizer/useResizePan";
import useBodyPanEffects from "@/utils/resizer/useBodyPanEffects";
import type { Design, Versions } from "@/lib/types/designTypes";
import type { EvalResponse, FrameEvaluation } from "@/lib/types/evalResponse";
import {
  publishProjectService,
  syncPublishedStateService,
  unpublishProjectService
} from "@/lib/publisher/published";

import { fetchCommentsForDesign } from "@/lib/comments/serviceComment";
import { createCommentHandlers } from "@/lib/comments/handlers";
import { mapFrameToEvalResponse } from "@/lib/comments/frameMapperComment";
import { createFetchEvaluationsHandler } from "@/lib/evaluteDesign/fetchDesignEvaluation/handlers";
import { openCommentsForDesign } from "@/lib/comments/openComments";
import { createHandleOpenEvalParams } from "@/lib/reEvaluate/createHandleOpenEvalParams";
import { createHandleEvaluate } from "@/lib/reEvaluate/createHandleEvaluate";
import useFrameFiltering from "@/lib/framesFilter/useFrameFiltering";
import { fetchNormalizedDesign } from "@/lib/designs/fetchDesign";
import { fetchSavedEvaluationForDesign } from "@/lib/evaluations/savedEvaluations";
import { createFetchUserProfileHandler } from "@/lib/user/createFetchUserProfileHandler";
import { useSignedAvatarUrl } from "@/components/explore-users";
import { fetchEvaluationsForDesign } from "@/lib/evaluteDesign/fetchDesignEvaluation/fechDesignEvaluation";

export default function DesignDetailPage({ params }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  const [showEval, setShowEval] = useState(true);
  const [showVersions, setShowVersions] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [design, setDesign] = useState<Design | null>(null);
  const [designLoading, setDesignLoading] = useState(true);
  const [evalResult, setEvalResult] = useState<EvalResponse | null>(null);
  const [loadingEval, setLoadingEval] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [versions, setVersions] = useState<Versions[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [versionChanged, setVersionChanged] = useState(0);
  const [frameEvaluations, setFrameEvaluations] = useState<FrameEvaluation[]>([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"default" | "asc" | "desc">("default");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [postingComment, setPostingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ fullName: string; avatarUrl: string | null } | null>(null);
  const [showEvalParams, setShowEvalParams] = useState(false);
  const [pendingParams, setPendingParams] = useState<any>(null);
  const [page, setPage] = useState(0);
  const minSidebarWidth = 0;
  const maxSidebarWidth = 700;
  const [zoom, setZoom] = useState(1);
  const [sidebarTab, setSidebarTab] = useState<"ai" | "comments">("ai");
  const [expectedFrameCount, setExpectedFrameCount] = useState<number>(0);
  const [evaluatedFramesCount, setEvaluatedFramesCount] = useState<number>(0);
  const pageSize = 6;
  const sortRef = useRef<HTMLDivElement>(null);

  const {
    sidebarWidth,
    setSidebarWidth,
    startResizing,
    pan,
    setPan,
    handlePanStart,
    isPanning,
    isResizing,
    handlePanMove,
    handlePanEnd,
  } = useResizeAndPan({
    initialSidebarWidth: 700,
    minSidebarWidth,
    maxSidebarWidth,
    zoom,
    onCollapse: () => setShowEval(false),
  });

  useBodyPanEffects({
    isResizing,
    isPanning,
    handlePanMove,
    handlePanEnd,
    zoom,
    setPan,
  });

  const { handleAddComment,
    handleAddReply,
    handleDeleteComment } = createCommentHandlers({
      design,
      currentUserId,
      newCommentText,
      setNewCommentText,
      setComments,
      setPostingComment,
    });


  const {
    sortedFrameEvaluations,
    filteredFrameEvaluations,
    currentFrame,
  } = useFrameFiltering({
    frameEvaluations,
    sortOrder,
    searchQuery,
    selectedFrameIndex,
    setSelectedFrameIndex,
    setEvalResult,
    mapFrameToEvalResponse,
  });

  const fetchEvaluations = React.useCallback(async () => {
    const designId = design?.id ?? null;
    if (!designId) return;

    const mounted = true;
    try {
      // call the pure lib/service that returns combined frames
      const combined = await fetchEvaluationsForDesign(designId);
      if (!mounted) return;
      setFrameEvaluations(combined);
    } catch (err) {
      console.error("[fetchEvaluations] error", err);
    }
    // no return needed; mounted handled by outer scope in the effect below
  }, [design?.id, setFrameEvaluations]);

  const thumbUrl = useSignedAvatarUrl(design?.thumbnail ?? null);

  const handleOpenEvalParams = React.useMemo(
    () =>
      createHandleOpenEvalParams({
        design,
        thumbUrl,
        setPendingParams,
        setShowEvalParams,
      }),
    [design, thumbUrl, setPendingParams, setShowEvalParams]
  );

  const handleEvaluate = React.useMemo(
    () =>
      createHandleEvaluate({
        getDesign: () => design,
        setLoadingEval,
        setEvalError,
        setEvalResult,
        setDesign,
        setLoadingVersions,
      }),
    [design, setLoadingEval, setEvalError, setEvalResult, setDesign, setLoadingVersions]
  );

  const handleShowVersions = async () => {
    setShowVersions(true);
    setLoadingVersions(true);
    if (design?.id) {
      fetchDesignVersions(design.id)
        .then((versions) => setVersions(
          versions.map((v: any) => ({
            ...v,
            total_score: v.total_score ?? 0,
          }))
        ))
        .catch((e: string) => console.error("Failed to fetch versions", e))
        .finally(() => setLoadingVersions(false));
    } else {
      setLoadingVersions(false);
    }
  }

  async function handleOpenComments() {
    setShowComments(true);
    setLoadingComments(true);
    try {
      const roots = await openCommentsForDesign(design?.id, currentUserId ?? null);
      setComments(roots);
    } catch (err) {
      console.error("[handleOpenComments] error", err);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }

  // wrapper used by effects / UI DONE ALREADY
  const syncPublishedState = React.useCallback(() => {
    return syncPublishedStateService(design, setDesign);
  }, [design]);
  async function publishProject() {
    await publishProjectService(design, setDesign);
  }
  async function unpublishProject() {
    await unpublishProjectService(design, setDesign);
  }

  // fetch comments
  useEffect(() => {
    if (design?.id) {
      fetchCommentsForDesign(design.id ?? null)
        .then(setComments)
        .catch(() => setComments([]))
        .finally(() => setLoadingComments(false));
    }
  }, [design?.id]);

  useEffect(() => {
    const fetchProfile = createFetchUserProfileHandler({
      setCurrentUserId,
      setCurrentUserProfile,
    });
    fetchProfile();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortOptions(false);
      }
    }
    if (showSortOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSortOptions]);


  useEffect(() => {
    if (design?.id) {
      syncPublishedState();
    }
  }, [design?.id, syncPublishedState]);

  useEffect(() => {
    if (!design?.id || loadingEval) return;
    let mounted = true;

    async function run() {
      try {
        await fetchEvaluations();
        if (!mounted) return;
        // fetchEvaluations sets frameEvaluations internally
      } catch (err) {
        if (mounted) console.error("[useEffect fetchEvaluations] error", err);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [design?.id, fetchEvaluations, loadingEval]);

  useEffect(() => {
    if (frameEvaluations[selectedFrameIndex]) {
      setEvalResult(mapFrameToEvalResponse(frameEvaluations[selectedFrameIndex], selectedFrameIndex));
    }
  }, [selectedFrameIndex, frameEvaluations]);

  useEffect(() => {
    const auto =
      typeof window !== "undefined" &&
      new URLSearchParams(location.search).get("auto") === "1";
    if (
      !designLoading &&
      auto &&
      design?.fileKey &&
      !loadingEval &&
      !evalResult
    ) {
      handleEvaluate();
    }
  }, [designLoading, design, loadingEval, evalResult, handleEvaluate]);

  useEffect(() => {
    if (showVersions) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showVersions]);

  useEffect(() => {
    if (showVersions) setPage(0);
  }, [showVersions, versions.length])

  useEffect(() => {
    if (!design?.id) return;
    setLoadingVersions(true);
    fetchDesignVersions(design.id)
      .then((versions) =>
        setVersions(
          versions.map((v: any) => ({
            ...v,
            total_score: v.total_score ?? 0,
          }))
        )
      )
      .catch((e: string) => console.error("Failed to fetch versions", e))
      .finally(() => setLoadingVersions(false));
  }, [design?.id, versionChanged]);

  useEffect(() => {
    let mounted = true;
    async function loadSavedEvaluation() {
      try {
        if (!design?.id) return;
        const saved = await fetchSavedEvaluationForDesign(design.id);
        if (!mounted) return;
        if (saved) {
          console.log("Setting saved evaluation:", saved);
          setEvalResult(saved);
          setShowEval(true);
        }
      } catch (err) {
        console.error("Failed to load saved AI evaluation:", err);
      }
    }
    loadSavedEvaluation();
    return () => { mounted = false; };
  }, [design?.id]);

  useEffect(() => {
    if (editingId && !comments.some(c => c.id === editingId)) {
      setEditingId(null);
    }
    if (replyingToId && !comments.some(c => c.id === replyingToId)) {
      setReplyingToId(null);
    }
  }, [replyingToId, editingId, comments]);


  useEffect(() => {
    if (sidebarTab !== "comments") {
      setEditingId(null);
      setReplyingToId(null);
    }
  }, [sidebarTab]);

  useEffect(() => {
    if (!design?.id || loadingEval) return;
    fetchEvaluations();
  }, [design?.id, fetchEvaluations, loadingEval]);




  if (designLoading)
    return (
      <div className="flex flex-col items-center justify-center h-screen animate-pulse">
        <Image
          src="/images/loading-your-designs.svg"
          alt="Loading designs illustration"
          height={150}
          width={150}
          className="object-contain mb-6"
          priority
        />
        <p className="text-gray-500 text-sm mb-4">
          Loading designs...
        </p>
      </div>
    );

  if (!design)
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Design not found.</p>
      </div>
    );

  const isOwner = currentUserId && design?.id && currentUserId === design?.owner_id;
  return (
    <div>
      {/* Re-evaluate loading bar */}
      {loadingEval && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-[#232323] shadow-lg rounded-lg px-6 py-4 border border-orange-300 flex flex-col items-center">
          <Spinner className="w-6 h-6 mb-2" />
          <span className="font-semibold text-orange-600">
            AI re-evaluation in progress...
          </span>
          <span className="text-sm text-gray-600 mt-1">
          </span>
        </div>
      )}
      <div className="mb-2">
        <div className="flex gap-2 items-center justify-between w-full">
          <DesignHeaderTitle
            title={design.project_name}
            version={selectedVersion?.version?.toString() ?? ""}
            showVersion={!!selectedVersion}
            currentVersionId={design.current_version_id}
            selectedVersionId={selectedVersion?.id ?? null}
          />
          {isOwner && (
            <DesignHeaderActions
              handleShowVersions={handleShowVersions}
              handleOpenComments={handleOpenComments}
              showComments={showComments}
              setShowComments={setShowComments}
              comments={comments}
              loadingComments={loadingComments}
              showSearch={showSearch}
              setShowSearch={setShowSearch}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showSortOptions={showSortOptions}
              setShowSortOptions={setShowSortOptions}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              sortRef={sortRef}
              design={design}
              selectedVersion={selectedVersion}
              publishProject={publishProject}
              unpublishProject={unpublishProject}
              syncPublishedState={syncPublishedState}
            />
          )}

        </div>
      </div>
      <div className="mt-8">
        {/* TODO: Ongoing  */}
        {/* <DesignChats designId={design.id} currentUserId={currentUserId} /> */}
      </div>
      <div className="flex h-screen">
        <div className="flex-2 h-full border rounded-md bg-accent overflow-y-auto flex items-center justify-center relative">
          {designLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-[#232323]/80 z-20 rounded-md animate-fade-in-up">
              <Spinner className="w-12 h-12 text-[#ED5E20] animate-spin mb-4" />
              <span className="text-lg font-semibold text-[#ED5E20] animate-pulse">
                Loading your design...
              </span>
              <span className="text-sm text-gray-400 mt-2">
                Please wait while we fetch your frame.
              </span>
            </div>
          )}
          <ZoomControls zoom={zoom} setZoom={setZoom} setPan={setPan} pan={pan} />
          {/* Center of the image here */}
          <Image
            src={
              selectedFrameIndex === 0
                ? (thumbUrl
                  ? thumbUrl
                  : design.fileKey
                    ? `/api/figma/thumbnail?fileKey=${design.fileKey}${design.nodeId
                      ? `&nodeId=${encodeURIComponent(design.nodeId)}`
                      : ""}`
                    : "/images/design-thumbnail.png")
                : (frameEvaluations[selectedFrameIndex]?.thumbnail_url
                  ? frameEvaluations[selectedFrameIndex].thumbnail_url
                  : "/images/design-thumbnail.png")
            }
            alt={
              selectedFrameIndex === 0
                ? "Overall"
                : frameEvaluations[selectedFrameIndex]?.node_id
                  ? `Frame ${selectedFrameIndex}`
                  : design.project_name || "Design"
            }
            width={600}
            height={400}
            className="w-full h-full object-contain"
            style={{
              opacity: designLoading ? 0.5 : 1,
              transition: isPanning ? "none" : "opacity 0.3s, transform 0.2s",
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: "center center",
              cursor: zoom > 1 ? (isPanning ? "grabbing" : "grab") : "default",
            }}
            onMouseDown={handlePanStart}
          />
        </div>
        {/* {!isOwner && <VisitorEngagement designId={design.id} />} */}
        <div>
          <button
            onClick={() => setShowEval((prev) => !prev)}
            className="p-2 rounded cursor-pointer"
          >
            {showEval ? (
              <IconLayoutSidebarRightCollapse size={22} />
            ) : (
              <IconLayoutSidebarRightExpand size={22} />
            )}
          </button>
        </div>

        <div
          style={{ cursor: "col-resize", width: 8 }}
          className="flex-shrink-0 bg-transparent hover:bg-orange-200 transition"
          onMouseDown={startResizing}
          aria-label="Resize evaluation sidebar"
          tabIndex={0}
          role="separator"
        />
        {/* RIGHT PANEL (Evaluation Sidebar) */}
        {showEval && sidebarWidth > 20 && <div style={{ width: sidebarWidth }}>
          <div
            className="flex-1 bg-gray-50 border rounded-md dark:bg-[#1A1A1A] p-5 overflow-y-auto flex flex-col h-screen"
            style={{ width: sidebarWidth, minWidth: minSidebarWidth, maxWidth: maxSidebarWidth }}
          >
            {/* Tabs */}
            <div className="flex items-center justify-between mb-3 border-b pb-2">
              <button
                className={`text-lg font-semibold flex-1 text-center cursor-pointer
                          ${sidebarTab === "ai" ? "text-[#ED5E20] border-b-2 border-[#ED5E20]" : "text-gray-500"}`}
                onClick={() => setSidebarTab("ai")}
              >
                AI Evaluation
              </button>
              <button
                className={`text-lg font-semibold flex-1 text-center cursor-pointer
                  ${sidebarTab === "comments" ? "text-[#ED5E20] border-b-2 border-[#ED5E20]" : "text-gray-500"}`}
                onClick={() => setSidebarTab("comments")}
              >
                Comments
              </button>
            </div>
            {sidebarTab === "ai" && (
              <>
                <FrameNavigator
                  selectedFrameIndex={selectedFrameIndex}
                  setSelectedFrameIndex={setSelectedFrameIndex}
                  sortedFrameEvaluations={sortedFrameEvaluations}
                  filteredFrameEvaluations={filteredFrameEvaluations}
                />

                <div className="flex-1 overflow-y-auto pr-5 space-y-5">
                  {/* Error State */}
                  {evalError && (
                    <div className="text-red-500 text-sm">
                      Error: {evalError}
                    </div>
                  )}

                  {/* Results */}
                  {evalResult && !loadingEval && (
                    <EvaluationResult
                      evalResult={evalResult}
                      loadingEval={loadingEval}
                      currentFrame={currentFrame}
                      frameEvaluations={frameEvaluations}
                      selectedFrameIndex={selectedFrameIndex}
                    />
                  )}

                </div>
                {isOwner && (
                  <div className="mt-auto pt-4">
                    <button
                      onClick={handleOpenEvalParams}
                      disabled={loadingEval}
                      className="w-full px-4 py-2 text-sm rounded-md bg-[#ED5E20] text-white hover:bg-orange-600 disabled:opacity-50 cursor-pointer"
                    >
                      {loadingEval ? "Evaluating..." : "Re-Evaluate"}
                    </button>
                    <EvaluationParamsModal
                      open={showEvalParams}
                      onClose={() => setShowEvalParams(false)}
                      onSubmit={(params) =>
                        handleEvalParamsSubmit(
                          params,
                          handleEvaluateWithParams,
                          design,
                          setLoadingEval,
                          setEvalError,
                          setEvalResult,
                          setFrameEvaluations,
                          setExpectedFrameCount,
                          setEvaluatedFramesCount,
                          fetchEvaluations,
                          setShowEvalParams,
                        )
                      }
                      initialParams={pendingParams || {}}
                    />
                  </div>
                )}
              </>
            )}
            {sidebarTab === "comments" && (
              <div className="flex-1 flex flex-col">
                <CommentsSection
                  comments={comments}
                  newCommentText={newCommentText}
                  setNewCommentText={setNewCommentText}
                  currentUserId={currentUserId}
                  handleAddComment={handleAddComment}
                  handleAddReply={handleAddReply}
                  editingId={editingId}
                  setEditingId={setEditingId}
                  replyingToId={replyingToId}
                  setReplyingToId={setReplyingToId}
                  handleDeleteComment={handleDeleteComment}
                  postingComment={postingComment}
                />
              </div>
            )}
          </div>
        </div>
        }
        {sidebarWidth <= 20 && (
          <button
            onClick={() => {
              setSidebarWidth(700);
              setShowEval(true);
            }}
            className="absolute top-1/2 right-0 z-50 bg-[#ED5E20] text-white rounded-l px-2 py-1 shadow -translate-y-1/2"
            aria-label="Show Evaluation Sidebar"
          >
            <IconLayoutSidebarRightExpand size={22} />
          </button>
        )}

      </div>
      {
        showVersions && (
          <VersionHistoryModal
            open={showVersions}
            onClose={() => setShowVersions(false)}
            loadingVersions={loadingVersions}
            versions={versions}
            page={page}
            pageSize={pageSize}
            setPage={setPage}
            design={design}
            selectedVersion={selectedVersion}
            setSelectedVersion={setSelectedVersion}
            fetchDesignVersions={fetchDesignVersions}
            deleteDesignVersion={deleteDesignVersion}
            setVersions={setVersions}
            setVersionChanged={setVersionChanged}
            setEvalResult={setEvalResult}
            setShowEval={setShowEval}
            setFrameEvaluations={setFrameEvaluations}
          />
        )
      }
    </div >
  );
}