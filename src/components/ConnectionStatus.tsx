import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ConnectionStatusProps {
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error' | 'disconnected'>('checking');
  const [message, setMessage] = useState('');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const testConnection = async () => {
    setStatus('checking');
    setMessage('Testando conexão...');

    try {
      console.log('🔌 ConnectionStatus - Iniciando teste de conexão...');
      
      // Verificar variáveis de ambiente
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        setStatus('error');
        setMessage('Variáveis de ambiente não configuradas');
        return;
      }

      // Teste de conexão simples
      const { data, error } = await supabase
        .from('unidades')
        .select('*')
        .limit(1);

      if (error) {
        console.error('❌ ConnectionStatus - Erro na conexão:', error);
        setStatus('error');
        setMessage(`Erro: ${error.message}`);
      } else {
        console.log('✅ ConnectionStatus - Conexão OK');
        setStatus('connected');
        setMessage('Conectado ao Supabase');
        setLastCheck(new Date());
      }
    } catch (err) {
      console.error('❌ ConnectionStatus - Erro geral:', err);
      setStatus('error');
      setMessage('Erro de conexão');
    }
  };

  useEffect(() => {
    testConnection();
    
    // Testar conexão a cada 30 segundos
    const interval = setInterval(testConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Wifi className="h-4 w-4 animate-pulse text-yellow-500" />;
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-gray-500" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'text-yellow-600';
      case 'connected':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'disconnected':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      {getStatusIcon()}
      <span className={getStatusColor()}>
        {message}
      </span>
      {lastCheck && status === 'connected' && (
        <span className="text-xs text-gray-500">
          ({lastCheck.toLocaleTimeString()})
        </span>
      )}
      <button
        onClick={testConnection}
        className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
        disabled={status === 'checking'}
      >
        {status === 'checking' ? 'Testando...' : 'Testar'}
      </button>
    </div>
  );
};

export default ConnectionStatus; 