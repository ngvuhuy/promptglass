import './App.css'

function App() {
  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100 font-sans">
      {/* Sidebar Placeholder */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 p-4">
        <h1 className="text-xl font-bold text-white mb-6">PromptGlass</h1>
        <p className="text-sm text-gray-400">Sidebar coming soon...</p>
      </div>

      {/* Main Content Placeholder */}
      <div className="flex-1 flex flex-col p-6">
        <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
        <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 p-8 flex items-center justify-center">
          <p className="text-gray-400">Content area</p>
        </div>
      </div>
    </div>
  )
}

export default App
