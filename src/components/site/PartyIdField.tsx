"use client";

import type { Dispatch, SetStateAction } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { QuestionField } from "@/lib/legal/document-fields";

/** Renders a "partyId" question field: a personal-number/identification-code
 * toggle (checkbox pair) with a single input that follows whichever is
 * checked, so a party that can be either an individual or a legal entity
 * doesn't need two always-visible input fields. Shared by the AI-generation
 * form (/generate) and the static-template form (/templates). */
export function PartyIdField({
  field,
  answers,
  setAnswers,
  personalOptionLabel,
  idCodeOptionLabel,
}: {
  field: QuestionField;
  answers: Record<string, string>;
  setAnswers: Dispatch<SetStateAction<Record<string, string>>>;
  personalOptionLabel: string;
  idCodeOptionLabel: string;
}) {
  const personalKey = field.personalKey!;
  const idCodeKey = field.idCodeKey!;
  const mode = answers[field.key] === "idCode" ? "idCode" : "personal";
  const activeKey = mode === "idCode" ? idCodeKey : personalKey;

  return (
    <div className="space-y-2">
      <div className="flex gap-4">
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <Checkbox
            checked={mode === "personal"}
            onCheckedChange={(checked) => {
              if (checked) setAnswers((prev) => ({ ...prev, [field.key]: "personal", [idCodeKey]: "" }));
            }}
          />
          {personalOptionLabel}
        </label>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <Checkbox
            checked={mode === "idCode"}
            onCheckedChange={(checked) => {
              if (checked) setAnswers((prev) => ({ ...prev, [field.key]: "idCode", [personalKey]: "" }));
            }}
          />
          {idCodeOptionLabel}
        </label>
      </div>
      <Input
        value={answers[activeKey] ?? ""}
        onChange={(e) => setAnswers((prev) => ({ ...prev, [activeKey]: e.target.value }))}
      />
    </div>
  );
}
