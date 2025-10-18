import type { Design } from "@/lib/types/designTypes";

export function createHandleOpenEvalParams(options: {
  design: Design | null;
  thumbUrl?: string | null;
  setPendingParams: (p: any) => void;
  setShowEvalParams: (b: boolean) => void;
}) {
  const { design, thumbUrl, setPendingParams, setShowEvalParams } = options;

  return function handleOpenEvalParams() {
    const frameIds = design?.frames?.map((f) => String(f.id)) ?? [];
    console.log("[handleOpenEvalParams] frameIds:", frameIds);

    const thumbnailUrl =
      thumbUrl || design?.thumbnail || design?.imageUrl || "/images/design-thumbnail.png";

    setPendingParams({
      designId: design?.id,
      fileKey: design?.fileKey,
      nodeId: design?.nodeId,
      snapshot: design?.snapshot,
      url: design?.figma_link,
      fallbackImageUrl: thumbnailUrl,
      frameIds,
    });

    setShowEvalParams(true);
  };
}