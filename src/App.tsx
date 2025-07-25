import { useState } from 'react';
import Dashboard from './components/Dashboard';
import FileUpload from './components/FileUpload';
import ExcelImporter from './components/ExcelImporter';
import { BarChart3, Upload, FileSpreadsheet } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'upload' | 'excel'>('dashboard');

  const handleUploadComplete = () => {
    setCurrentView('dashboard');
  };

  // Se estiver no dashboard, mostrar apenas o dashboard
  if (currentView === 'dashboard') {
    return <Dashboard />;
  }

  // Para outras views, mostrar com header
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Analytics</h1>
            </div>
            <nav className="flex space-x-4">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors text-gray-600 hover:text-blue-600"
              >
                <BarChart3 className="inline h-4 w-4 mr-2" />
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('upload')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'upload'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
                  }`}
              >
                <Upload className="inline h-4 w-4 mr-2" />
                Upload CSV
              </button>
              <button
                onClick={() => setCurrentView('excel')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'excel'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
                  }`}
              >
                <FileSpreadsheet className="inline h-4 w-4 mr-2" />
                Importar Excel
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'upload' && (
          <FileUpload onUploadComplete={handleUploadComplete} />
        )}
        {currentView === 'excel' && (
          <ExcelImporter />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-500 text-sm">
            Dashboard de Análise de Vendas e Estoque - {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;