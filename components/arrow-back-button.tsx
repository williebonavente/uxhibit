import { useRouter } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface DesignHeaderTitleProps {
  title: string;
  version?: string | null;
  showVersion?: boolean;
  currentVersionId?: string;
  selectedVersionId?: string | null;
}

const DesignHeaderTitle: React.FC<DesignHeaderTitleProps> = ({
  title,
  version,
  showVersion = false,
  currentVersionId,
  selectedVersionId,
}) => {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      // console.error("currentUserId:", user?.id ?? null);
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  return (
    <div className="flex items-center w-full">
      <button
        disabled={currentUserId === null}
        onClick={() => {
          if (window.history.length > 1) {
            router.back();
          } else if (currentUserId) {
            router.push("/dashboard");
          } else {
            router.push("/auth/login");
          }
        }}
        aria-label="Go Back"
        className="p-1"
      >
        <IconArrowLeft
          size={24}
          className="cursor-pointer hover:text-orange-600 mr-2"
        />
      </button>
      <h1 className="text-xl font-medium flex items-center gap-2">
        {title}
        {showVersion &&
          selectedVersionId &&
          selectedVersionId !== currentVersionId &&
          version && (
            <span
              aria-label={`Version ${version}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-lg font-medium
               text-orange-700 border border-orange-300 bg-orange-50
               dark:text-orange-300 dark:border-orange-400/30 dark:bg-orange-500/10"
            >
              <span className="font-mono tracking-wide">v{version}</span>
            </span>
          )}
      </h1>
    </div>
  );
};

export default DesignHeaderTitle;
