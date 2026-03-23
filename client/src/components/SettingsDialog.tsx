import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Settings } from 'lucide-react';
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
          // Only send API key if it was changed (not the placeholder '***')
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
      <DialogTrigger render={<button className="p-2 hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-white cursor-pointer" />}>
        <Settings className="w-5 h-5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gray-950 border-gray-800 text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-xl">Proxy Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="url">Target LLM URL</Label>
            <Input
              id="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="http://localhost:11434/v1/chat/completions"
              className="bg-gray-900 border-gray-800 text-gray-200"
            />
            <p className="text-xs text-gray-500">
              The OpenAI-compatible endpoint PromptGlass will forward requests to.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="key">Target API Key (Optional)</Label>
            <Input
              id="key"
              type="password"
              value={targetApiKey}
              onChange={(e) => setTargetApiKey(e.target.value)}
              placeholder="sk-..."
              className="bg-gray-900 border-gray-800 text-gray-200"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
