export function LoadingInspiration({ text = "Fetching creative inspiration..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <span className="absolute animate-ping inline-flex h-16 w-16 rounded-full bg-orange-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-16 w-16 bg-orange-500 flex items-center justify-center text-3xl text-white">
          🎨
        </span>
      </div>
      <p className="mt-4 text-orange-500 font-semibold text-lg animate-pulse">
        {text}
      </p>
    </div>
  );
}