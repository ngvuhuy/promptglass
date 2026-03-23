import { useState } from 'react';
import { useRequests } from './hooks/useRequests';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { ChatMode } from './components/ChatMode';
import { BenchmarkMode } from './components/BenchmarkMode';
import { SettingsDialog } from './components/SettingsDialog';
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs';
import { Activity, LayoutDashboard } from 'lucide-react';
import './App.css';

function App() {
  const { requests, isLoading, error, refreshRequests } = useRequests();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('observe');

  const selectedRequest = requests.find((r) => r.id === selectedId) || requests[0];

  if (error) {
    return <div className="flex h-screen items-center justify-center bg-gray-950 text-red-500 font-mono">Error: {error}</div>;
  }

  const renderContent = () => {
    if (activeTab === 'chat') {
      return (
        <ChatMode 
          onMessageSent={() => {
            refreshRequests();
            setActiveTab('observe'); // Switch back to see the result
          }} 
        />
      );
    }

    if (activeTab === 'benchmark') {
      return (
        <BenchmarkMode 
          onRunComplete={() => {
            refreshRequests();
            setActiveTab('observe'); // Switch to observe to see the benchmark results
          }} 
        />
      );
    }
    
    if (isLoading && !selectedRequest) {
      return (
        <div className="h-full flex items-center justify-center text-gray-500 font-mono animate-pulse">
          Loading requests...
        </div>
      );
    }

    if (selectedRequest) {
      return <ChatView request={selectedRequest} />;
    }

    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
        <Activity className="w-12 h-12 text-gray-700" />
        <p>Waiting for proxy requests...</p>
        <code className="text-xs bg-gray-900 p-2 rounded border border-gray-800">
          POST http://localhost:3001/v1/chat/completions
        </code>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen bg-gray-950 text-gray-100 font-sans overflow-hidden">
      <Sidebar 
        requests={requests} 
        selectedId={selectedRequest?.id || null} 
        onSelect={setSelectedId} 
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
            <TabsList className="bg-gray-950 border border-gray-800">
              <TabsTrigger value="observe" className="data-[state=active]:bg-gray-800">
                <Activity className="w-4 h-4 mr-2" />
                Observe
              </TabsTrigger>
              <TabsTrigger value="chat" className="data-[state=active]:bg-gray-800">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="benchmark" className="data-[state=active]:bg-gray-800">
                <Activity className="w-4 h-4 mr-2" />
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
