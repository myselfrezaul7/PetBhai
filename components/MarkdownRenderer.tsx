import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const elements: React.ReactNode[] = [];
  const lines = content.split('\n');
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const formatLine = (line: string): React.ReactNode => {
    // This regex splits the line by **...** occurrences, capturing the bolded content.
    return line.split(/\*\*(.*?)\*\*/g).map((part, index) => {
      // The captured bolded content will be at odd indices.
      return index % 2 === 1 ? <strong key={index}>{part}</strong> : part;
    });
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
