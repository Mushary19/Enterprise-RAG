import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

interface CodeBlockProps {
  code: string;
  lang: string;
}

export function CodeBlock({ code, lang }: CodeBlockProps) {
  const [html, setHtml] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function highlight() {
      try {
        const result = await codeToHtml(code, {
          lang: lang || "text",
          theme: "github-dark",
        });
        if (mounted) setHtml(result);
      } catch {
        const escaped = code
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        if (mounted) setHtml(`<pre style="color: #e4e4e7">${escaped}</pre>`);
      }
    }

    highlight();
    return () => {
      mounted = false;
    };
  }, [code, lang]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden my-3">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 border-b border-zinc-800">
        <span className="text-xs font-medium text-zinc-400">{lang || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-700/50 hover:bg-zinc-700 rounded-lg transition-all duration-200"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div
        className="overflow-x-auto max-w-full p-4 text-sm [&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!m-0 [&_pre]:!overflow-x-auto [&_pre]:max-w-full [&_code]:!bg-transparent [&_code]:whitespace-pre [&_span]:!bg-transparent"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
