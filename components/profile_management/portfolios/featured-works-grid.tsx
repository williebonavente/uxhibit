import Image from "next/image";
import Link from "next/link";
import { Globe, Pencil, Trash } from "lucide-react";
import { FeaturedWork } from "../types";

type Props = {
  works: FeaturedWork[];
  isOwner?: boolean;
  onEdit?: (work: FeaturedWork) => void;
  onDelete?: (work: FeaturedWork) => void;
};

export default function FeaturedWorksGrid({ works, isOwner, onEdit, onDelete }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {works.map((work, i) => (
        <div
          key={i}
          className="relative group bg-white dark:bg-[#1A1A1A] shadow-md rounded-xl p-3 gap-2 hover:scale-[1.05] transition-transform duration-200 cursor-pointer"
        >
          <Link href={work.link} target="_blank">
            <Image src={work.image} alt={work.title} width={400} height={200} className="rounded-md mb-3 object-cover w-full h-40" />
            <h3 className="font-semibold break-words leading-5 text-[#ED5E20] mb-3">{work.title}</h3>
            <p className="text-xs text-gray-800 dark:text-gray-400">{work.description}</p>
          </Link>
          {isOwner && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
              <div className="flex flex-col gap-2 bg-white/90 dark:bg-[#222] p-4 rounded-lg shadow-lg">
                <button
                  onClick={() => onEdit && onEdit(work)}
                  className="cursor-pointer flex items-center gap-2 text-orange-600 hover:text-orange-800 font-medium"
                  type="button"
                >
                  <Pencil size={16} /> Update
                </button>
                <button
                  onClick={() => onDelete && onDelete(work)}
                  className="cursor-pointer flex items-center gap-2 text-red-600 hover:text-red-800 font-medium"
                  type="button"
                >
                  <Trash size={16} /> Delete
                </button>
                <Link
                  href={work.link}
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