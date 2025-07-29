"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function FigmaLinkUploader() {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedLink, setUploadedLink] = useState<string | null>(null);
  const [age, setAge] = useState("");
  const [occupation, setOccupation] = useState("");


  // TODO: Link Validator
  const handleUpload = () => {
    // TODO: Expand the following link
    if (!link || !link.includes("figma.com")) {
      toast.error("Please enter a valid Figma link.")
      return;
    }

    // TODO: Loading screen
    setLoading(true);
    setProgress(0);

    // Replace with real ones
    const fakeUpload = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(fakeUpload);
          setLoading(false);
          setUploadedLink(link);
          return 100;
        }
        // TODO: Return with real loading part of the screen
        return prev + 20;
      });
      // TODO: Add later for optimization
    }, 200);
  };

  const isParamsComplete = age.trim() !== "" && occupation.trim() !== "";

  return (
    // Limit only to maximum of 10 design per user
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* Upload Inputs */}
      <div className="flex space-x-4">
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://www.figma.com/design/"
          className="w-[400px] p-2 rounded-md bg-white dark:bg-[#120F12] border"
        />

        <button
          onClick={handleUpload}
          className="bg-[#ED5E20] text-white px-8 py-2 rounded-md hover:bg-orange-600 hover:cursor-pointer text-sm"
          disabled={loading}
        >
          Upload
        </button>
      </div>

    {/* TODO: Replace with dynamic loading percentage according to the speed of data fetching of the client  */}
      {/* Loading Bar */}
      {loading && (
        <div className="w-full max-w-xl bg-white dark:bg-[#120F12] rounded-xl h-10 flex items-center px-4 space-x-4">
          <span className="text-sm font-medium w-12">{progress}%</span>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[linear-gradient(to_right,#FFDB97,#ED5E20)] h-2 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* TODO: Separate in another file/component */}
      {/* Form after upload */}
      {uploadedLink && !loading && (
        <div className="w-full max-w-xl flex flex-col space-y-4">
          {/* Age Dropdown */}
          <select
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="p-2 border rounded-md bg-white dark:bg-[#120F12] font-sm"
          >
            <option value="">Select Generation</option>
            <option value="Gen Z">Gen Z (1997–2012)</option>
            <option value="Millennial">Millennial (1981–1996)</option>
            <option value="Gen Alpha">Gen Alpha (2013–Present)</option>
          </select>

          {/* Occupation Dropdown */}
          <select
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            className="p-2 border rounded-md bg-white dark:bg-[#120F12] font-sm"
          >
            <option value="Student">Student</option>
            <option value="Freelancer">Freelancer</option>
            <option value="Designer">Designer</option>
            <option value="Developer">Developer</option>
            <option value="Educator">Educator</option>
          </select>

          {/* Evaluate Button */}
          <button
            className={`px-8 py-3 rounded-md text-white text-sm font-medium ${
              isParamsComplete
                ? "bg-[#ED5E20] hover:bg-orange-600 hover:cursor-pointer"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            disabled={!isParamsComplete}
          >
            Evaluate Design
          </button>
        </div>
      )}
    </div>
  );
}
