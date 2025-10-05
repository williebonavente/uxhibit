import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Pencil, Trash, Globe } from "lucide-react";
import { CaseStudy } from "../types";

type Props = {
  studies: CaseStudy[];
  isOwner?: boolean;
  onEdit?: (study: CaseStudy) => void;
  onDelete?: (study: CaseStudy) => void;
};

export default function CaseStudiesGrid({ studies, isOwner, onEdit, onDelete }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {studies.map((study, i) => (
        <div
          key={i}
          className="relative group bg-white dark:bg-[#1A1A1A] shadow-md rounded-xl p-3 gap-2 hover:scale-[1.05] transition-transform duration-200 cursor-pointer"
        >
          <Link href={study.link} target="_blank">
            <Image src={study.image} alt={study.title} width={400} height={200} className="rounded-md mb-3 object-cover w-full h-40 border" />
            <h3 className="font-semibold break-words leading-5 text-[#ED5E20] mb-3">{study.title}</h3>
            <p className="text-xs text-gray-800 dark:text-gray-400 mb-2">{study.summary}</p>
            <p className="text-xs text-gray-400 italic flex items-center gap-1"><ArrowUpRight size={12} /> {study.outcome}</p>
          </Link>
          {isOwner && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
              <div className="flex flex-col gap-2 bg-white/90 dark:bg-[#222] p-4 rounded-lg shadow-lg">
                <button
                  onClick={() => onEdit && onEdit(study)}
                  className="cursor-pointer flex items-center gap-2 text-orange-600 hover:text-orange-800 font-medium"
                  type="button"
                >
                  <Pencil size={16} /> Update
                </button>
                <button
                  onClick={() => onDelete && onDelete(study)}
                  className="cursor-pointer flex items-center gap-2 text-red-600 hover:text-red-800 font-medium"
                  type="button"
                >
                  <Trash size={16} /> Delete
                </button>
                <Link
                  href={study.link}
                  target="_blank"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Globe size={16} /> Visit
                </Link>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}