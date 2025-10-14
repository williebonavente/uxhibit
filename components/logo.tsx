"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function Logo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const logoSrc =
    resolvedTheme === "dark"
      ? "/uxhibit-logo-light-mode.svg"
      : "/uxhibit-logo-dark-mode.svg";

  <Image
    src={logoSrc}
    alt="Logo"
    width={120}
    height={32}
    className="h-8 w-auto"
    priority
  />
}
