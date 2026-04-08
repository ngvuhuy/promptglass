import { useState } from 'react';
import { useRequests } from './hooks/useRequests';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { ChatMode } from './components/ChatMode';
import { BenchmarkMode } from './components/BenchmarkMode';
import { SettingsDialog } from './components/SettingsDialog';
import { DiffView } from './components/DiffView';
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs';
import './App.css';

function App() {
  const { requests, isLoading, error, refreshRequests, deleteRequests } = useRequests();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [diffTargetId, setDiffTargetId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('observe');

  const selectedRequest = requests.find((r) => r.id === selectedId) || requests[0];
  const diffRequest = requests.find((r) => r.id === diffTargetId);

  if (error) {
    return <div className="flex h-screen items-center justify-center bg-background text-destructive font-mono">Error: {error}</div>;
  }

  const renderContent = () => {
    if (activeTab === 'chat') {
      return (
        <ChatMode
          onMessageSent={() => {
            refreshRequests();
            setActiveTab('observe');
            setDiffTargetId(null);
          }}
        />
      );
    }

    if (activeTab === 'benchmark') {
      return (
        <BenchmarkMode
          onRunComplete={() => {
            refreshRequests();
            setActiveTab('observe');
            setDiffTargetId(null);
          }}
        />
      );
    }

    if (isLoading && !selectedRequest) {
      return (
        <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">
          Loading requests...
        </div>
      );
    }

    if (selectedRequest && diffRequest) {
      return (
        <DiffView
          requestA={selectedRequest}
          requestB={diffRequest}
          onClose={() => setDiffTargetId(null)}
        />
      );
    }

    if (selectedRequest) {
      return <ChatView request={selectedRequest} />;
    }

    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6">
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Waiting for proxy requests</p>
        <code className="text-xs bg-secondary text-foreground px-4 py-2 font-mono">
          POST http://localhost:3001/v1/chat/completions
        </code>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen bg-background text-foreground font-sans overflow-hidden">
      <Sidebar
        requests={requests}
        selectedId={selectedRequest?.id || null}
        diffTargetId={diffTargetId}
        onSelect={(id) => {
          setSelectedId(id);
          setDiffTargetId(null);
        }}
        onDiffSelect={setDiffTargetId}
        onDelete={deleteRequests}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent h-auto p-0 flex gap-2">
              <TabsTrigger
                value="observe"
                className="font-bold uppercase tracking-widest text-xs border border-border rounded-md px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[2px_2px_0px_0px_var(--color-foreground)] transition-all"
              >
                Observe
              </TabsTrigger>
              <TabsTrigger
                value="chat"
                className="font-bold uppercase tracking-widest text-xs border border-border rounded-md px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[2px_2px_0px_0px_var(--color-foreground)] transition-all"
              >
                Chat
              </TabsTrigger>
              <TabsTrigger
                value="benchmark"
                className="font-bold uppercase tracking-widest text-xs border border-border rounded-md px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[2px_2px_0px_0px_var(--color-foreground)] transition-all"
              >
                Benchmark
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <SettingsDialog />
        </header>

        <main className="flex-1 overflow-hidden">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
