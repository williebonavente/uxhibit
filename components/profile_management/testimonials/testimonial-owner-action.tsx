import { Pencil, Trash } from "lucide-react";
import { Testimonial } from "../types";

export default function TestimonialOwnerActions({
  testimonial,
  onEdit,
  onDelete,
}: {
  testimonial: Testimonial;
  onEdit: (testimonial: Testimonial) => void;
  onDelete: (testimonial: Testimonial) => void;
}) {
  return (
    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
      <span>
        {testimonial.created_at
          ? new Date(testimonial.created_at).toLocaleString()
          : ""}
      </span>
      <button
        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
        onClick={() => onEdit(testimonial)}
        title="Edit"
        type="button"
      >
        <Pencil size={14} /> Update
      </button>
      <button
        className="flex items-center gap-1 text-red-600 hover:text-red-800"
        onClick={() => onDelete(testimonial)}
        title="Delete"
        type="button"
      >
        <Trash size={14} /> Delete
      </button>
    </div>
  );
}