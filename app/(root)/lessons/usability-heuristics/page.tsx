import LessonsTable from "@/components/lessons-table";

export default function Lessons() {
  return (
    <div className="space-y-5">
      <div className="border-b-2 p-2">
        <h1 className="text-2xl font-medium">
          Usability Heuristics for User Interface Design Lessons
        </h1>
      </div>
      <div className="p-2 m-5 flex items-center">
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 w-full sm:mb-0 font-['Poppins']">
          Explore bite-sized lessons based on Jakob Nielsen’s 10 usability
          heuristics. Each principle is explained with simple examples to help
          you design smarter, more user-friendly interfaces—no heavy reading,
          just clear and useful tips.
        </p>
      </div>
      <div className="flex justify-center w-full">
        <LessonsTable />
      </div>
    </div>
  );
}
