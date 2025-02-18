import { useState } from "react";

interface Theme {
  primary: string;
  variant: 'professional' | 'tint' | 'vibrant';
  appearance: 'light' | 'dark' | 'system';
  radius: number;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>({
    primary: "#0066cc",
    variant: "professional",
    appearance: "system",
    radius: 0.5
  });

  return { theme, setTheme };
}
