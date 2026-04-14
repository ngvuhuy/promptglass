import { ScrollArea } from './ui/scroll-area';

interface TokenStreamProps {
  content: string;
}

export function TokenStream({ content }: TokenStreamProps) {
  return (
    <ScrollArea className="flex-1 w-full bg-gray-950 p-4 font-mono text-sm leading-relaxed border border-gray-800 rounded-md text-foreground">
      <div className="whitespace-pre-wrap break-all">
        {content}
      </div>
    </ScrollArea>
  );
}
