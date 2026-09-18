import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const generateHeadingId = (text: string): string => {
  return (
    text
      .toLowerCase()
      .replace(/[^\w\u0980-\u09FF]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'section'
  );
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content || typeof content !== 'string') {
    return (
      <div className="p-4 md:p-6 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-center">
        <p className="text-slate-500 dark:text-slate-400">
          Content summary is currently unavailable.
        </p>
      </div>
    );
  }

  const elements: React.ReactNode[] = [];
  const lines = content.split('\n');
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;
  let listItems: React.ReactNode[] = [];
  let inBlockquote = false;
  let blockquoteItems: React.ReactNode[] = [];

  const parseBold = (text: string): React.ReactNode => {
    return text.split(/\*\*(.*?)\*\*/g).map((part, index) => {
      return index % 2 === 1 ? (
        <strong key={index} className="text-zinc-900 dark:text-zinc-100 font-bold">
          {part}
        </strong>
      ) : (
        part
      );
    });
  };

  const parseLinksAndBold = (text: string): React.ReactNode => {
    // Matches standard markdown links: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = text.split(linkRegex);

    if (parts.length > 1) {
      return parts.map((part, index) => {
        // Group matches:
        // index % 3 === 0: plain text
        // index % 3 === 1: link text
        // index % 3 === 2: link url
        if (index % 3 === 1) {
          const linkText = part;
          const url = parts[index + 1];
          const isExternal = url.startsWith('http://') || url.startsWith('https://');
          return (
            <a
              key={`link-${index}`}
              href={url}
              className="text-amber-600 dark:text-amber-400 hover:text-orange-500 underline decoration-amber-500/40 hover:decoration-orange-500 font-medium transition-colors"
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
            >
              {parseBold(linkText)}
            </a>
          );
        }
        if (index % 3 === 2) return null;

        return parseBold(part);
      });
    }

    return parseBold(text);
  };

  const formatLine = (line: string): React.ReactNode => {
    // First, parse out custom button syntax: [BUTTON: text](url)
    const buttonRegex = /\[BUTTON:\s*([^\]]+)\]\(([^)]+)\)/g;
    const parts = line.split(buttonRegex);

    if (parts.length > 1) {
      return parts.map((part, index) => {
        if (index % 3 === 1) {
          const text = part;
          const url = parts[index + 1];
          return (
            <a
              key={`btn-${index}`}
              href={url}
              className="group inline-flex items-center justify-center bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-[15px] sm:text-base py-3.5 px-8 rounded-full shadow-[0_8px_20px_-6px_rgba(245,158,11,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(245,158,11,0.6)] transform hover:-translate-y-1 transition-all duration-300 no-underline mt-4 mb-2 max-w-full"
            >
              <span className="truncate">{text}</span>
              <svg
                className="ml-2 w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
          );
        }
        if (index % 3 === 2) return null;

        return parseLinksAndBold(part);
      });
    }

    return parseLinksAndBold(line);
  };

  const pushList = () => {
    if (listItems.length > 0) {
      if (listType === 'ol') {
        elements.push(
          <ol
            key={`ol-${elements.length}`}
            className="list-decimal pl-5 my-4 space-y-2 text-slate-800 dark:text-slate-200"
          >
            {listItems}
          </ol>
        );
      } else {
        elements.push(
          <ul
            key={`ul-${elements.length}`}
            className="list-disc pl-5 my-4 space-y-2 text-slate-800 dark:text-slate-200"
          >
            {listItems}
          </ul>
        );
      }
      listItems = [];
    }
    inList = false;
    listType = null;
  };

  const pushBlockquote = () => {
    if (blockquoteItems.length > 0) {
      elements.push(
        <blockquote
          key={`quote-${elements.length}`}
          className="my-5 p-4 md:p-5 rounded-r-2xl border-l-4 border-amber-500 bg-amber-500/10 dark:bg-amber-950/20 text-slate-700 dark:text-slate-300 italic space-y-2 backdrop-blur-sm"
        >
          {blockquoteItems}
        </blockquote>
      );
      blockquoteItems = [];
    }
    inBlockquote = false;
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      if (inList) pushList();
      if (inBlockquote) pushBlockquote();
      return;
    }

    const isBulletList = trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ');
    const isNumberedList = /^\d+\.\s/.test(trimmedLine);
    const isBlockquote = trimmedLine.startsWith('>');

    if (isBlockquote) {
      if (inList) pushList();
      inBlockquote = true;
      const quoteText = trimmedLine.replace(/^>\s?/, '');
      blockquoteItems.push(
        <p key={`quote-line-${index}`} className="leading-relaxed">
          {formatLine(quoteText)}
        </p>
      );
    } else if (isBulletList || isNumberedList) {
      if (inBlockquote) pushBlockquote();
      const currentListType = isBulletList ? 'ul' : 'ol';
      if (!inList) {
        inList = true;
        listType = currentListType;
      } else if (listType !== currentListType) {
        pushList();
        inList = true;
        listType = currentListType;
      }

      const contentText = isBulletList
        ? trimmedLine.substring(2)
        : trimmedLine.replace(/^\d+\.\s/, '');

      listItems.push(<li key={`li-${index}`}>{formatLine(contentText)}</li>);
    } else {
      if (inList) pushList();
      if (inBlockquote) pushBlockquote();

      if (trimmedLine.startsWith('### ')) {
        const headingText = trimmedLine.replace(/^###\s+/, '').trim();
        const id = generateHeadingId(headingText);
        elements.push(
          <h3
            id={id}
            key={`h3-${index}`}
            className="text-lg md:text-xl font-bold mt-5 md:mt-6 mb-2 md:mb-3 text-zinc-900 dark:text-zinc-100 scroll-mt-24"
          >
            {formatLine(headingText)}
          </h3>
        );
      } else if (trimmedLine.startsWith('## ')) {
        const headingText = trimmedLine.replace(/^##\s+/, '').trim();
        const id = generateHeadingId(headingText);
        elements.push(
          <h2
            id={id}
            key={`h2-${index}`}
            className="text-xl md:text-2xl font-bold mt-6 md:mt-8 mb-3 md:mb-4 text-zinc-900 dark:text-zinc-50 scroll-mt-24"
          >
            {formatLine(headingText)}
          </h2>
        );
      } else if (
        trimmedLine.startsWith('**') &&
        trimmedLine.endsWith('**') &&
        trimmedLine.length > 4
      ) {
        const headingText = trimmedLine.substring(2, trimmedLine.length - 2).trim();
        const id = generateHeadingId(headingText);
        elements.push(
          <h2
            id={id}
            key={`h2-bold-${index}`}
            className="text-xl md:text-2xl font-bold mt-6 md:mt-8 mb-3 md:mb-4 text-zinc-900 dark:text-zinc-50 scroll-mt-24"
          >
            {formatLine(headingText)}
          </h2>
        );
      } else {
        elements.push(
          <p key={`p-${index}`} className="mb-4 text-base md:text-lg leading-relaxed break-words">
            {formatLine(trimmedLine)}
          </p>
        );
      }
    }
  });

  if (inList) {
    pushList();
  }
  if (inBlockquote) {
    pushBlockquote();
  }

  // Use prose-base on mobile, prose-lg on desktop to prevent text from being too large on small screens
  return (
    <div className="prose prose-base md:prose-lg lg:prose-xl max-w-none text-slate-800 dark:text-slate-200 prose-strong:font-bold prose-headings:text-slate-800 dark:prose-headings:text-slate-100 break-words">
      {elements}
    </div>
  );
};

export default MarkdownRenderer;
