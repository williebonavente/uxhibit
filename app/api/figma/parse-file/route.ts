import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Helper function to detect if a buffer is a valid image
function detectImageType(buffer: Buffer): string | null {
  // PNG signature
  if (buffer.length >= 4 && 
      buffer[0] === 0x89 && 
      buffer[1] === 0x50 && 
      buffer[2] === 0x4E && 
      buffer[3] === 0x47) {
    return 'image/png';
  }
  
  // JPEG signature
  if (buffer.length >= 3 && 
      buffer[0] === 0xFF && 
      buffer[1] === 0xD8 && 
      buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  
  // WEBP signature (RIFF header + WEBP)
  if (buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && // RIFF
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) { // WEBP
    return 'image/webp';
  }
  
  return null;
}

// Validate image dimensions and quality
function validateImageBuffer(buffer: Buffer): { 
  valid: boolean; 
  error?: string; 
  type?: string;
  size: number;
} {
  const detectedType = detectImageType(buffer);
  
  if (!detectedType) {
    return { 
      valid: false, 
      error: "Invalid image format. Only PNG, JPEG, and WEBP are supported.",
      size: buffer.length 
    };
  }
  
  const sizeInKB = buffer.length / 1024;
  
  // Check minimum size (at least 10KB to ensure it's not a tiny icon)
  if (sizeInKB < 10) {
    return { 
      valid: false, 
      error: "Image too small. Minimum size is 10KB.",
      size: buffer.length 
    };
  }
  
  // Check maximum size
  if (buffer.length > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `Image too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
      size: buffer.length 
    };
  }
  
  return { 
    valid: true, 
    type: detectedType,
    size: buffer.length 
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;

    // Support both single and multiple file uploads
    const filesToProcess = files.length > 0 ? files : (singleFile ? [singleFile] : []);

    if (filesToProcess.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    console.log(`[parse-file] Processing ${filesToProcess.length} file(s)`);

    // Validate all files first
    const validatedFiles: Array<{
      file: File;
      buffer: Buffer;
      validation: ReturnType<typeof validateImageBuffer>;
    }> = [];

    for (const file of filesToProcess) {
      console.log(`[parse-file] Validating: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);

      // Check file extension
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
        return NextResponse.json(
          { 
            error: `Invalid file type: ${file.name}. Only PNG, JPG, JPEG, and WEBP files are supported.` 
          },
          { status: 400 }
        );
      }

      // Convert to buffer and validate
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const validation = validateImageBuffer(buffer);
      
      if (!validation.valid) {
        return NextResponse.json(
          { 
            error: `${file.name}: ${validation.error}` 
          },
          { status: 400 }
        );
      }

      console.log(`[parse-file] ✓ Valid image: ${file.name} (${validation.type}, ${(validation.size / 1024).toFixed(2)}KB)`);

      validatedFiles.push({
        file,
        buffer,
        validation,
      });
    }

    // Generate a unique file key for this upload session
    const fileKey = `uploaded_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;

    // Upload all validated images to Supabase Storage
    const frameImages: Record<string, string> = {};
    const uploadResults: Array<{
      name: string;
      success: boolean;
      url?: string;
      error?: string;
    }> = [];

    let thumbnailUrl: string | null = null;

    console.log(`[parse-file] Uploading ${validatedFiles.length} frame(s) to storage...`);

    for (let i = 0; i < validatedFiles.length; i++) {
      const { file, buffer, validation } = validatedFiles[i];
      const frameKey = `${fileKey}_frame_${i}`;
      
      // Determine file extension from detected type
      const extension = 
        validation.type === 'image/png' ? '.png' :
        validation.type === 'image/jpeg' ? '.jpg' :
        validation.type === 'image/webp' ? '.webp' : '.png';
      
      const storagePath = `${user.id}/${frameKey}${extension}`;
      const frameName = file.name.replace(/\.(png|jpg|jpeg|webp)$/i, "");

      console.log(`[parse-file] Uploading frame ${i + 1}/${validatedFiles.length}: ${frameName} -> ${storagePath}`);

      // Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from("figma-frames")
        .upload(storagePath, buffer, {
          contentType: validation.type!,
          upsert: false,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error(`[parse-file] Upload error for frame ${i}:`, uploadError);
        uploadResults.push({
          name: file.name,
          success: false,
          error: uploadError.message,
        });
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("figma-frames")
        .getPublicUrl(storagePath);

      frameImages[frameKey] = urlData.publicUrl;
      uploadResults.push({
        name: file.name,
        success: true,
        url: urlData.publicUrl,
      });

      console.log(`[parse-file] ✓ Frame ${i} uploaded successfully: ${frameKey}`);

      // Use first image as thumbnail
      if (i === 0) {
        thumbnailUrl = urlData.publicUrl;
      }
    }

    if (Object.keys(frameImages).length === 0) {
      return NextResponse.json(
        { error: "Failed to upload any images. Please try again." },
        { status: 500 }
      );
    }

    const successCount = uploadResults.filter(r => r.success).length;
    const failureCount = uploadResults.filter(r => !r.success).length;

    console.log(`[parse-file] Upload complete: ${successCount} succeeded, ${failureCount} failed`);
    console.log(`[parse-file] Frame keys:`, Object.keys(frameImages));

    // Use the first file's name as the design name
    const designName = validatedFiles[0]?.file.name.replace(/\.(png|jpg|jpeg|webp)$/i, "") || "Untitled Design";

    const response = {
      fileKey: fileKey,
      name: designName,
      thumbnailUrl: thumbnailUrl,
      nodeImageUrl: thumbnailUrl,
      frameImages: frameImages,
      type: "upload",
      nodeId: fileKey,
      uploadUrl: thumbnailUrl,
      extractedFrameCount: validatedFiles.length,
      uploadedFrameCount: Object.keys(frameImages).length,
      uploadResults: uploadResults,
    };

    console.log(`[parse-file] Response:`, {
      fileKey: response.fileKey,
      name: response.name,
      extractedFrameCount: response.extractedFrameCount,
      uploadedFrameCount: response.uploadedFrameCount,
      frameImageKeys: Object.keys(response.frameImages),
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("[parse-file] Error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}