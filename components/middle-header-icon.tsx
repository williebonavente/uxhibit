import Image from "next/image";
import Link from "next/link";

interface MiddleHeaderIconProps {
  href?: string;
  ariaLabel?: string;
}

export default function MiddleHeaderIcon({
  href = "/",
  ariaLabel = "Go to homepage",
}: MiddleHeaderIconProps) {
  const iconContent = (
    <span className="inline-flex">
      <Image
        src="/images/header-icon.png"
        alt="Login Illustration"
        width={102}
        height={42}
        className="block dark:hidden"
      />
      <Image
        src="/images/dark-header-icon.png"
        alt="Login Illustration Dark"
        width={102}
        height={42}
        className="hidden dark:block"
      />
    </span>
  );

  return (
    <div className="w-full flex justify-center items-center mt-5 mb-7">
      {href ? (
        <Link href={href} aria-label={ariaLabel}>
          {iconContent}
        </Link>
      ) : (
        iconContent
      )}
    </div>
  );
}
