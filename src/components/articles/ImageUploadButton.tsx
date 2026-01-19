"use client";

import React from "react";
import { Button } from "@/components/ui/Button";

interface ImageUploadButtonProps {
  onFilesSelect: (files: File[]) => void;
  disabled?: boolean;
  multiple?: boolean;
}

export function ImageUploadButton({
  onFilesSelect,
  disabled = false,
  multiple = true,
}: ImageUploadButtonProps) {
  const inputId = React.useId();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelect(files);
      // Resetovat input, aby bylo možné nahrát stejný soubor znovu
      e.target.value = "";
    }
  };

  return (
    <div className="mb-4">
      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          if (disabled) return;
          const input = document.getElementById(inputId) as HTMLInputElement;
          if (input) {
            input.click();
          }
        }}
      >
        Přidat obrázky
      </Button>
    </div>
  );
}
