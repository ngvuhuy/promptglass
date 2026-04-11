import { ScrollArea } from './ui/scroll-area';

interface TokenStreamProps {
  content: string;
}

export function TokenStream({ content }: TokenStreamProps) {
  // Simple parser to separate <think> tags from regular content
  // This ensures that special tokens are highly visible
  const parseTokens = (text: any) => {
    if (!text) return [];
    
    // Ensure text is a string to avoid .split errors
    const str = typeof text === 'string' ? text : String(text);
    
    // Split by <think> and </think> keeping the delimiters
    const parts = str.split(/(<think>|<\/think>)/g);
    let inThinkBlock = false;
    
    return parts.map((part, index) => {
      if (part === '<think>') {
        inThinkBlock = true;
        return (
          <span key={index} className="bg-purple-900/50 text-purple-300 px-1 rounded mx-0.5 font-mono text-xs border border-purple-700/50">
            {part}
          </span>
        );
      }
      if (part === '</think>') {
        inThinkBlock = false;
        return (
          <span key={index} className="bg-purple-900/50 text-purple-300 px-1 rounded mx-0.5 font-mono text-xs border border-purple-700/50">
            {part}
          </span>
        );
      }
      
      if (inThinkBlock) {
        return (
          <span key={index} className="text-gray-400 italic">
            {part}
          </span>
        );
      }
      
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <ScrollArea className="flex-1 w-full bg-gray-950 p-4 font-mono text-sm leading-relaxed border border-gray-800 rounded-md">
      <div className="whitespace-pre-wrap whitespace-break-spaces">
        {parseTokens(content)}
      </div>
    </ScrollArea>
  );
}
