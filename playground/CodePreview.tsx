import type { PlaygroundConfig } from './config';
import { generateCodeSnippet } from './generateCodeSnippet';

export function CodePreview({ config }: { config: PlaygroundConfig }) {
  const code = generateCodeSnippet(config);

  return (
    <div className="pg-code">
      <pre><code>{code}</code></pre>
      <button
        type="button"
        className="pg-code__copy"
        onClick={() => navigator.clipboard.writeText(code)}
      >
        Copy snippet
      </button>
    </div>
  );
}
