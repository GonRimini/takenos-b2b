"use client";

import { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  onFileSelected: (file: File) => void;
}

export default function UploadFile({ onFileSelected }: Props) {
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div className="flex items-center gap-3">
      <input type="file" accept="application/pdf" onChange={onChange} />
      <Button type="button" variant="outline" onClick={() => {}} disabled>
        Subir PDF
      </Button>
    </div>
  );
}


