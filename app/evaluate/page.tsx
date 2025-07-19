import UploadWithLink from "@/components/upload-file";

export default function Evaluate() {
  return (
    <div className="space-y-5">
      <div className="border-b-2 p-2">
        <h1 className="text-xl font-medium">Upload a Design</h1>
      </div>
      <div className="w-full px-4 p-10 py-10 flex flex-col items-center justify-center bg-accent rounded-xl">
        <div className="mb-5 flex items-center justify-center">
          <p>Paste your design's Figma link below.</p>
        </div>
        <UploadWithLink />
      </div>
    </div>
  );
}
