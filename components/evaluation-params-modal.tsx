import React, { useState, useEffect } from "react";
import { Input } from "./ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";

type EvaluationParams = {
  scale?: number;
  occupation?: string;
  generation: string;
};

type EvaluationParamsModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: EvaluationParams) => void;
  initialParams: EvaluationParams;
}

export default function EvaluationParamsModal({
  open,
  onClose,
  onSubmit,
  initialParams,
}: EvaluationParamsModalProps) {

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
          p-6 sm:p-8 md:p-10
          bg-white dark:bg-neutral-900
          rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center"
      >
        <h3 className="text-2xl sm:text-3xl font-bold text-center gradient-text mb-5">
          Edit Evaluation Parameters
        </h3>
        <p className="mb-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
          Please select your audience and scale before re-evaluating.
        </p>
        <fieldset className="grid grid-cols-1 gap-6 mb-6">
          {/* Generation */}
          <label className="group relative flex flex-col rounded-xl bg-neutral-100 dark:bg-neutral-800/60 p-5 transition-colors focus-within:ring-1 focus-within:ring-[#ED5E20]/70 focus-within:border-[#ED5E20] border text-left">
            <span className="text-[15px] font-semibold text-[#ED5E20] mb-2">
              Generation
            </span>
            {!generation && touched && (
              <span className="text-[13px] text-neutral-700 dark:text-neutral-400 mb-2">
                Please select a target generation.
              </span>
            )}
            <div className="relative flex items-center gap-2">
              <svg
                className="h-8 w-8 text-[#ED5E20]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <Select value={generation} onValueChange={setGeneration}>
                <SelectTrigger className="w-full rounded-lg bg-white dark:bg-neutral-800/70 text-sm font-medium text-neutral-900 dark:text-neutral-200 px-3 py-2">
                  <SelectValue placeholder="Select Generation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gen Z">Gen Z (1997-2012)</SelectItem>
                  <SelectItem value="Millennial">Millennial (1981-1996)</SelectItem>
                  <SelectItem value="Gen Alpha">Gen Alpha (2013-Present)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {touched && !generation && (
              <span className="text-xs text-red-500 mt-2">Please select a generation.</span>
            )}
          </label>
      
          {/* Occupation */}
          <label className="group relative flex flex-col rounded-xl bg-neutral-100 dark:bg-neutral-800/60 p-5 transition-colors focus-within:ring-1 focus-within:ring-[#ED5E20]/70 focus-within:border-[#ED5E20] border text-left">
            <span className="text-[15px] font-semibold text-[#ED5E20] mb-2">
              Occupation
            </span>
            {!occupation && touched && (
              <span className="text-[13px] text-neutral-700 dark:text-neutral-400 mb-2">
                Please select a target role.
              </span>
            )}
            <div className="relative flex items-center gap-2">
              <svg
                className="h-8 w-8 text-[#ED5E20]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              </svg>
              <Select value={occupation} onValueChange={setOccupation}>
                <SelectTrigger className="w-full rounded-lg bg-white dark:bg-neutral-800/70 text-sm font-medium text-neutral-900 dark:text-neutral-200 px-3 py-2">
                  <SelectValue placeholder="Select Occupation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Freelancer">Freelancer</SelectItem>
                  <SelectItem value="Designer">Designer</SelectItem>
                  <SelectItem value="Developer">Developer</SelectItem>
                  <SelectItem value="Educator">Educator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {touched && !occupation && (
              <span className="text-xs text-red-500 mt-2">Please select an occupation.</span>
            )}
          </label>
      
          {/* Scale */}
          <label className="group relative flex flex-col rounded-xl bg-neutral-100 dark:bg-neutral-800/60 p-5 transition-colors focus-within:ring-1 focus-within:ring-[#ED5E20]/70 focus-within:border-[#ED5E20] border text-left">
            <span className="text-[15px] font-semibold text-[#ED5E20] mb-2">
              Scale
            </span>
            <div className="relative flex items-center gap-2">
              <svg
                className="h-8 w-8 text-[#ED5E20]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <rect x="4" y="10" width="16" height="4" rx="2" />
                <rect x="7" y="7" width="10" height="4" rx="2" />
                <rect x="10" y="4" width="4" height="4" rx="2" />
              </svg>
              <Input
                type="number"
                min={1}
                max={5}
                value={scale}
                onChange={e => setScale(Number(e.target.value))}
                className="w-full rounded-lg bg-white dark:bg-neutral-800/70 text-sm font-medium text-neutral-900 dark:text-neutral-200 px-3 py-2"
              />
            </div>
            {touched && (scale < 1 || scale > 5) && (
              <span className="text-xs text-red-500 mt-2">Scale must be between 1 and 5.</span>
            )}
          </label>
        </fieldset>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-sm font-semibold bg-gray-100 dark:bg-neutral-800 text-neutral-700 
            dark:text-neutral-200 shadow hover:bg-gray-200 dark:hover:bg-neutral-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid}
            className={`px-6 py-2 rounded-lg text-sm font-semibold text-white shadow transition
              ${isValid
                ? "bg-[#ED5E20] hover:bg-orange-600 cursor-pointer"
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