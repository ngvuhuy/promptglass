import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

export function SettingsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [targetApiKey, setTargetApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          setTargetUrl(data.targetUrl || '');
          setTargetApiKey(data.targetApiKey || '');
        });
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          ...(targetApiKey !== '***' && { targetApiKey })
        }),
      });
      setIsOpen(false);
    } catch (e) {
      console.error('Failed to save settings', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<button className="text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer px-4 py-2 border-2 border-foreground rounded-md shadow-[2px_2px_0px_0px_var(--color-foreground)] hover:-translate-y-[1px] hover:-translate-x-[1px] hover:shadow-[3px_3px_0px_0px_var(--color-foreground)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none bg-background text-foreground">Settings</button>} />
      <DialogContent className="sm:max-w-[425px] border-2 border-foreground bg-background text-foreground rounded-md shadow-[8px_8px_0px_0px_var(--color-foreground)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tighter">Proxy Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-6">
          <div className="grid gap-2">
            <Label htmlFor="url" className="text-xs font-black uppercase tracking-widest text-primary">Target LLM URL</Label>
            <Input
              id="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="http://localhost:11434/v1"
              className="rounded-none border-border font-mono bg-secondary"
            />
            <p className="text-[10px] uppercase font-mono text-muted-foreground mt-1">
              The base URL for the OpenAI-compatible API. PromptGlass will append /chat/completions.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="key" className="text-xs font-black uppercase tracking-widest text-foreground">Target API Key</Label>
            <Input
              id="key"
              type="password"
              value={targetApiKey}
              onChange={(e) => setTargetApiKey(e.target.value)}
              placeholder="sk-..."
              className="rounded-none border-border font-mono bg-secondary"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-none font-bold uppercase tracking-widest"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
