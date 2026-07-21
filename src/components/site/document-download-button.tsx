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
}: {
  content: string;
  filename: string;
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
        <DropdownMenuItem onClick={() => exportAsDocx(content, filename)}>
          <FileText className="h-4 w-4 mr-2 text-gold" /> Word (.docx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportAsPdf(content, filename)}>
          <File className="h-4 w-4 mr-2 text-gold" /> PDF (.pdf)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
