"use client";

import { useState } from "react";
import { RepurposeStudio, type RepurposeItem } from "@/components/repurpose-studio";
import { downloadMediaAction, transcribeMediaAction } from "@/app/actions/media";

interface RepurposeClientProps {
  initialItems: RepurposeItem[];
}

export function RepurposeClient({ initialItems }: RepurposeClientProps) {
  const [items, setItems] = useState<RepurposeItem[]>(initialItems);

  const handleDownload = async (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, downloadStatus: "DOWNLOADING" } : i))
    );
    try {
      const res = await downloadMediaAction(id);
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                downloadStatus: res.success ? "DOWNLOADED" : "FAILED",
                localFilePath: res.localFilePath,
              }
            : i
        )
      );
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, downloadStatus: "FAILED" } : i))
      );
    }
  };

  const handleTranscribe = async (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, transcriptionStatus: "PROCESSING" } : i))
    );
    try {
      const res = await transcribeMediaAction(id);
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                transcriptionStatus: res.success ? "COMPLETED" : "FAILED",
                transcriptText: res.transcriptText,
              }
            : i
        )
      );
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, transcriptionStatus: "FAILED" } : i))
      );
    }
  };

  return (
    <RepurposeStudio
      items={items}
      onDownload={handleDownload}
      onTranscribe={handleTranscribe}
    />
  );
}
