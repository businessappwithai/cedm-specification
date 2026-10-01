"use client";

import { HelpCircle } from "lucide-react";
import { useHelp } from "@/components/help/help-toaster";
import { HelpPanel } from "@/components/help/HelpPanel";
import { Button } from "@/components/ui/button";

/**
 * The header's `?`. Opens the article library in the help toaster.
 *
 * Its tooltip used to read "Help (press ? for keyboard shortcut)" and there
 * was no such binding anywhere in the application — nothing listens for `?`,
 * and a global one would fire while someone was typing a question mark into
 * the SQL editor. The label says what the button does instead of promising
 * something that was never built.
 */
export function HelpButton() {
  const { showHelp } = useHelp();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9"
      onClick={() =>
        showHelp({
          key: "articles",
          title: "Help & Documentation",
          body: <HelpPanel />,
        })
      }
      aria-label="Help and documentation"
      title="Help and documentation"
    >
      <HelpCircle className="h-5 w-5" />
    </Button>
  );
}
