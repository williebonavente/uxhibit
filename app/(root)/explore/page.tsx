import ExplorePage from "@/components/explore-users";

export default function Explore() {
  return (
    <div className="space-y-5">
      <div className="border-b-2 p-2">
        <h1 className="text-2xl font-medium">Explore</h1>
      </div>
      <div className="p-2 m-5 flex items-center">
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 w-full sm:mb-0 font-['Poppins']">
          Discover other users&apos; UI/UX designs and see how they applied usability
          heuristics, design principles, and best practices. Analyze their
          layout choices, interactions, and accessibility features to gain
          insights and improve your own work.
        </p>
      </div>
      <ExplorePage />
    </div>
  );
}
