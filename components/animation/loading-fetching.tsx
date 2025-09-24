import Image from "next/image";

export function LoadingInspiration() {
  return (
    <div className="flex flex-col items-center justify-center h-screen animate-pulse">
      <Image
        src="/images/inspiration-is-on-its-way.svg"
        alt="Loading inspiration illustration"
        height={150}
        width={150}
        className="object-contain mb-6"
        priority
      />
      <p className="text-gray-500 text-sm mb-4">
        Inspiration is on its way...
      </p>
    </div>
  );
}