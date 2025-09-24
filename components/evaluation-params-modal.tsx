import React, { useState, useEffect } from "react";

export default function EvaluationParamsModal({
  open,
  onClose,
  onSubmit,
  initialParams,
}) {
  const [scale, setScale] = useState(initialParams.scale || 3);
  const [occupation, setOccupation] = useState(initialParams.occupation || "");
  const [generation, setGeneration] = useState(initialParams.generation || "");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setScale(initialParams.scale || 3);
      setOccupation(initialParams.occupation || "");
      setGeneration(initialParams.generation || "");
      setTouched(false);
    }
  }, [open, initialParams]);

  const isValid = occupation && generation && scale >= 1 && scale <= 5;

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onSubmit({ ...initialParams, scale, occupation, generation });
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="relative flex flex-col w-full max-w-sm sm:max-w-md md:max-w-lg
          p-6 sm:p-8 md:p-10 bg-white/40 dark:bg-[#1E1E1E]/40
          backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 text-center"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-[#ED5E20] mb-4">
          Edit Evaluation Parameters
        </h2>
        <p className="mb-6 text-sm sm:text-base md:text-lg text-[#1E1E1E]/70 dark:text-[#F5F5F5]/70">
          Please select your audience and scale before re-evaluating.
        </p>
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label className="block mb-1 font-medium text-sm text-neutral-700 dark:text-neutral-200">
              Generation
            </label>
            <select
              value={generation}
              onChange={e => setGeneration(e.target.value)}
              className={`w-full px-3 py-2 rounded border bg-white/80 dark:bg-neutral-900/80 text-sm focus:outline-none focus:ring-2 focus:ring-[#ED5E20] transition
                ${touched && !generation ? "border-red-400" : "border-neutral-300 dark:border-neutral-700"}
                cursor-pointer`}
            >
              <option value="">Select Generation</option>
              <option value="Gen Z">Gen Z (1997-2012)</option>
              <option value="Millennial">Millennial (1981-1996)</option>
              <option value="Gen Alpha">Gen Alpha (2013-Present)</option>
            </select>
            {touched && !generation && (
              <span className="text-xs text-red-500">Please select a generation.</span>
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium text-sm text-neutral-700 dark:text-neutral-200">
              Occupation
            </label>
            <select
              value={occupation}
              onChange={e => setOccupation(e.target.value)}
              className={`w-full px-3 py-2 rounded border bg-white/80 dark:bg-neutral-900/80 text-sm focus:outline-none focus:ring-2 focus:ring-[#ED5E20] transition
                ${touched && !occupation ? "border-red-400" : "border-neutral-300 dark:border-neutral-700"}
                cursor-pointer`}
            >
              <option value="">Select Occupation</option>
              <option value="Student">Student</option>
              <option value="Freelancer">Freelancer</option>
              <option value="Designer">Designer</option>
              <option value="Developer">Developer</option>
              <option value="Educator">Educator</option>
            </select>
            {touched && !occupation && (
              <span className="text-xs text-red-500">Please select an occupation.</span>
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium text-sm text-neutral-700 dark:text-neutral-200">
              Scale
            </label>
            <input
              type="number"
              min={1}
              max={5}
              value={scale}
              onChange={e => setScale(Number(e.target.value))}
              className={`w-full px-3 py-2 rounded border bg-white/80 dark:bg-neutral-900/80 text-sm focus:outline-none focus:ring-2 focus:ring-[#ED5E20] transition
                ${touched && (scale < 1 || scale > 5) ? "border-red-400" : "border-neutral-300 dark:border-neutral-700"}
                cursor-pointer`}
            />
            {touched && (scale < 1 || scale > 5) && (
              <span className="text-xs text-red-500">Scale must be between 1 and 5.</span>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-sm font-semibold bg-gray-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 shadow cursor-pointer hover:bg-gray-300 dark:hover:bg-neutral-700 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid}
            className={`px-6 py-2 rounded-lg text-sm font-semibold text-white shadow cursor-pointer transition
              ${isValid
                ? "bg-[#ED5E20] hover:bg-orange-600"
                : "bg-gray-400 cursor-not-allowed"
              }`}
          >
            Re-Evaluate
          </button>
        </div>
      </form>
    </div>
  );
}