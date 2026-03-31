import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const elements: React.ReactNode[] = [];
  const lines = content.split('\n');
  let inList = false;
  let listItems: React.ReactNode[] = [];

const parseBold = (text: string): React.ReactNode => {
    return text.split(/\*\*(.*?)\*\*/g).map((part, index) => {
      return index % 2 === 1 ? <strong key={index} className="text-zinc-900 dark:text-zinc-100">{part}</strong> : part;
    });
  };

  const formatLine = (line: string): React.ReactNode => {
    // First, parse out our custom button syntax: [BUTTON: text](url)
    const parts = line.split(/\[BUTTON:\s*(.*?)]\((.*?)\)/g);
    
    if (parts.length > 1) {
      return parts.map((part, index) => {
        // Button text and URL appear at indices 1 and 2 (and 4/5, etc.)
        if (index % 3 === 1) {
          const text = part;
          const url = parts[index + 1];
          return (
            <a
              key={index}
              href={url}
              className="group inline-flex items-center justify-center bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-[15px] sm:text-base py-3.5 px-8 rounded-full shadow-[0_8px_20px_-6px_rgba(245,158,11,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(245,158,11,0.6)] transform hover:-translate-y-1 transition-all duration-300 no-underline mt-4 mb-2 max-w-full"
            >
              <span className="truncate">{text}</span>
              <svg className="ml-2 w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </a>
          );
        }
        if (index % 3 === 2) return null; // Skip rendering the URL part raw
        
        // Parse bold **text** for the remaining plain text parts
        return parseBold(part);
      });
    }
    return parseBold(line);
  };

  const pushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc pl-5 my-4 space-y-2">
          {listItems}
        </ul>
      );
      listItems = [];
    }
    inList = false;
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('* ')) {
      if (!inList) {
        // We've entered a list. Any previous paragraphs are already pushed.
        inList = true;
      }
      listItems.push(<li key={index}>{formatLine(trimmedLine.substring(2))}</li>);
    } else {
      if (inList) {
        // We just exited a list. Push the completed list.
        pushList();
      }
      if (trimmedLine) {
        // This is a regular paragraph or a heading.
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
          elements.push(
            <h2 key={index} className="text-xl md:text-2xl font-bold mt-6 md:mt-8 mb-3 md:mb-4">
              {formatLine(trimmedLine.substring(2, trimmedLine.length - 2))}
            </h2>
          );
        } else {
          elements.push(
            <p key={index} className="mb-4 text-base md:text-lg leading-relaxed break-words">
              {formatLine(trimmedLine)}
            </p>
          );
        }
      }
    }
  });

  // If the content ends with a list, push the remaining list items.
  if (inList) {
    pushList();
  }

  // Use prose-base on mobile, prose-lg on desktop to prevent text from being too large on small screens
  return (
    <div className="prose prose-base md:prose-lg lg:prose-xl max-w-none text-slate-800 dark:text-slate-200 prose-strong:font-bold prose-headings:text-slate-800 dark:prose-headings:text-slate-100 break-words">
      {elements}
    </div>
  );
};

export default MarkdownRenderer;
