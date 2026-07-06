import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Database, FileText, Loader2, CheckCircle, ScanLine } from "lucide-react";
import { UploadDropzone } from "./UploadDropzone";
import { uploadDocument } from "../services/mockApi";
import { QUERY_KEYS } from "../lib/queryKeys";
import { useDocuments } from "../hooks/useDocuments";
import type { Document } from "../types";

export function KnowledgePanel() {
  const queryClient = useQueryClient();
  const { data: documents, isLoading } = useDocuments();

  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.documents,
      });
    },
  });

  const stats = {
    total: documents?.length ?? 0,
    processed: documents?.filter((d) => d.status === "processed").length ?? 0,
    processing:
      documents?.filter((d) => d.status !== "processed").length ?? 0,
  };

  return (
    <div className="bg-slate-900 md:border md:border-zinc-800 md:rounded-2xl md:shadow-xl h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 md:px-5 md:py-4 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
            <Database className="w-4 h-4 text-zinc-400" />
          </div>
          <div>
            <h2 className="font-semibold text-zinc-100">Knowledge Base</h2>
            <p className="text-xs text-zinc-500">Your uploaded documents</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Ready" value={stats.processed} tone="green" />
          <StatCard label="Processing" value={stats.processing} tone="amber" />
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 min-h-0">
        <div className="mb-5">
          <UploadDropzone
            onUpload={(file) => uploadMutation.mutate(file)}
            isPending={uploadMutation.isPending}
          />
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Uploaded Documents
          </label>
          <div className="h-px bg-zinc-800 mt-3" />
        </div>

        <DocumentList documents={documents} isLoading={isLoading} />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  tone?: "default" | "green" | "amber";
}

function StatCard({ label, value, tone = "default" }: StatCardProps) {
  const toneClasses = {
    default: "text-zinc-100",
    green: "text-green-400",
    amber: "text-amber-400",
  };

  return (
    <div className="bg-zinc-800/40 border border-zinc-800 rounded-xl px-3 py-2.5 text-center">
      <p className={`text-xl font-bold ${toneClasses[tone]}`}>{value}</p>
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
        {label}
      </p>
    </div>
  );
}

function DocumentList({
  documents,
  isLoading,
}: {
  documents: Document[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 bg-zinc-800/30 border border-zinc-800 rounded-xl animate-pulse"
          >
            <div className="w-10 h-10 rounded-lg bg-zinc-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-700 rounded w-3/4" />
              <div className="h-3 bg-zinc-700 rounded w-1/4" />
            </div>
            <div className="h-7 w-24 bg-zinc-700 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 text-sm">
        No documents uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((document) => (
        <DocumentRow key={document.id} document={document} />
      ))}
    </div>
  );
}

function DocumentRow({ document }: { document: Document }) {
  const statusConfig = {
    processed: {
      icon: CheckCircle,
      label: "Processed",
      className: "text-green-400 bg-green-400/10 border-green-400/20",
    },
    parsing: {
      icon: Loader2,
      label: "Parsing",
      className:
        "text-amber-400 bg-amber-400/10 border-amber-400/20 animate-pulse",
    },
    ocr_engaged: {
      icon: ScanLine,
      label: "OCR",
      className: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    },
  };

  const config = statusConfig[document.status];
  const StatusIcon = config.icon;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-zinc-800/30 border border-zinc-800 rounded-xl hover:bg-zinc-800/50 transition-all duration-200">
      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-zinc-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-100 truncate">
          {document.filename}
        </p>
        <p className="text-xs text-zinc-500">{formatFileSize(document.size)}</p>
      </div>
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${config.className} flex-shrink-0`}
      >
        <StatusIcon
          className={`w-3.5 h-3.5 ${
            document.status === "parsing" ? "animate-spin" : ""
          }`}
        />
        {config.label}
      </div>
    </div>
  );
}
