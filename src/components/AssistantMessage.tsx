import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function AssistantMessage({ content }: { content: string }) {
  const markdown = content.replace(/<br\s*\/?>/gi, "  \n");

  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ node: _node, ...props }) => <p {...props} className="my-2 first:mt-0 last:mb-0" />,
          ul: ({ node: _node, ...props }) => (
            <ul {...props} className="my-2 list-disc space-y-1 pl-5" />
          ),
          ol: ({ node: _node, ...props }) => (
            <ol {...props} className="my-2 list-decimal space-y-1 pl-5" />
          ),
          strong: ({ node: _node, ...props }) => <strong {...props} className="font-semibold" />,
          a: ({ node: _node, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer" className="text-primary underline" />
          ),
          table: ({ node: _node, ...props }) => (
            <div className="my-3 overflow-x-auto">
              <table {...props} className="min-w-[32rem] border-collapse text-left text-xs" />
            </div>
          ),
          th: ({ node: _node, ...props }) => (
            <th {...props} className="border border-border bg-secondary px-3 py-2 font-semibold" />
          ),
          td: ({ node: _node, ...props }) => (
            <td {...props} className="border border-border px-3 py-2 align-top" />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
