"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Logo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const logoSrc =
    resolvedTheme === "dark"
      ? "/uxhibit-logo-light-mode.svg"
      : "/uxhibit-logo-dark-mode.svg";

  return <img src={logoSrc} alt="Logo" className="h-8 w-auto" />;
}
