import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const rehypeKatexOptions = { strict: false, throwOnError: false };

type MathTextProps = {
  children: string;
  className?: string;
  inline?: boolean;
};

export default function MathText({ children, className, inline = false }: MathTextProps) {
  const text = typeof children === "string" ? children : String(children ?? "");

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[[rehypeKatex, rehypeKatexOptions]]}
      components={{
        p: ({ node, children: mdChildren, ...props }: any) =>
          inline ? (
            <span {...props}>{mdChildren}</span>
          ) : (
            <p className={className} {...props}>
              {mdChildren}
            </p>
          ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
