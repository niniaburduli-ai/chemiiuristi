"use client";

import { Download, FileText, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportAsDocx, exportAsPdf } from "@/lib/export-document";

export function DocumentDownloadButton({
  content,
  filename,
  highlightPlaceholders = false,
}: {
  content: string;
  filename: string;
  /** Colors `[missing-info placeholder]` brackets red in the exported file —
   * only the "custom" free-form generation flow opts in; every other caller
   * (document analysis/review, etc.) defaults to false and is unaffected. */
  highlightPlaceholders?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="shrink-0">
            <Download className="h-4 w-4 mr-1 text-gold" /> ჩამოტვირთვა
          </Button>
        }
      />
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => exportAsDocx(content, filename, highlightPlaceholders)}>
          <FileText className="h-4 w-4 mr-2 text-gold" /> Word (.docx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportAsPdf(content, filename, highlightPlaceholders)}>
          <File className="h-4 w-4 mr-2 text-gold" /> PDF (.pdf)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
