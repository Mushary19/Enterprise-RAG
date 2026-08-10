import { useCallback, useState } from "react"
import { FileUp, Loader2, Upload } from "lucide-react"
import toast from "react-hot-toast"
import { cn } from "../../lib/cn"
import { useUploadDocument } from "../../hooks/useUploadDocument"

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
}

export function UploadDropzone() {
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const uploadMutation = useUploadDocument()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const acceptFile = useCallback(
    (file: File) => {
      if (!isPdfFile(file)) {
        toast.error("Only PDF files are supported.")
        return
      }

      setProgress(0)
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
      }, 100)

      uploadMutation.mutate(file, { onSettled: () => clearInterval(interval) })
    },
    [uploadMutation],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) acceptFile(file)
    },
    [acceptFile],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) acceptFile(file)
      e.target.value = ""
    },
    [acceptFile],
  )

  const isPending = uploadMutation.isPending

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-2xl p-6 text-center transition-colors duration-200",
        isDragging
          ? "border-blue-500/60 bg-blue-500/5"
          : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40",
      )}
    >
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        disabled={isPending}
        aria-label="Upload a PDF document"
      />

      {isPending ? (
        <>
          <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          </div>
          <p className="text-sm font-medium text-zinc-100 mb-2">Uploading...</p>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden max-w-[200px] mx-auto">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      ) : (
        <>
          <div className="w-11 h-11 mx-auto mb-3 rounded-xl bg-zinc-800 flex items-center justify-center">
            {isDragging ? (
              <FileUp className="w-5 h-5 text-blue-400" />
            ) : (
              <Upload className="w-5 h-5 text-zinc-400" />
            )}
          </div>
          <p className="text-sm font-medium text-zinc-100 mb-1">Drop a PDF here</p>
          <p className="text-xs text-zinc-500">or click to browse</p>
        </>
      )}
    </div>
  )
}
