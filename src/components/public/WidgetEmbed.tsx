import { useEffect, useRef } from "react";

/**
 * Renders a third-party embed snippet (e.g. a paid X-feed widget) supplied by
 * an admin via site settings. Because `innerHTML` does not execute injected
 * <script> tags, this walks the parsed nodes and re-creates each script so it
 * runs — the standard way to mount vendor widget loaders.
 *
 * Trust boundary: the embed string comes only from the admin-only
 * `x_feed_widget` site setting (RLS-guarded), i.e. content the operator pasted
 * themselves. It is intentionally executed, exactly like a CMS "embed code"
 * field. Never wire this to untrusted/user input.
 */
export function WidgetEmbed({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.innerHTML = "";

    const template = document.createElement("template");
    template.innerHTML = html;

    Array.from(template.content.childNodes).forEach((node) => {
      if (node.nodeName === "SCRIPT") {
        const source = node as HTMLScriptElement;
        const script = document.createElement("script");
        Array.from(source.attributes).forEach((attr) => script.setAttribute(attr.name, attr.value));
        script.text = source.textContent || "";
        host.appendChild(script);
      } else {
        host.appendChild(node.cloneNode(true));
      }
    });

    return () => {
      host.innerHTML = "";
    };
  }, [html]);

  return <div className="x-widget-embed" ref={ref} />;
}
