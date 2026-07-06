import { useCallback, useState } from "react";
import { Upload, FileUp, Loader2 } from "lucide-react";

interface UploadDropzoneProps {
  onUpload: (file: File) => void;
  isPending: boolean;
}

export function UploadDropzone({ onUpload, isPending }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type === "application/pdf") {
        setProgress(0);
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 100);
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setProgress(0);
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 100);
        onUpload(file);
      }
    },
    [onUpload]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 ${
        isDragging
          ? "border-blue-500 bg-blue-500/10"
          : "border-zinc-700 hover:border-zinc-600 bg-zinc-800/30"
      }`}
    >
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isPending}
      />

      {isPending ? (
        <>
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
          <p className="text-sm font-medium text-zinc-100 mb-2">Uploading...</p>
          <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden max-w-[200px] mx-auto">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      ) : (
        <>
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-zinc-800 flex items-center justify-center">
            {isDragging ? (
              <FileUp className="w-6 h-6 text-blue-400" />
            ) : (
              <Upload className="w-6 h-6 text-zinc-400" />
            )}
          </div>
          <p className="text-sm font-medium text-zinc-100 mb-1">
            Drop PDF files here
          </p>
          <p className="text-xs text-zinc-500">or click to browse</p>
        </>
      )}
    </div>
  );
}
