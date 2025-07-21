import React, { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

interface FileUploadProps {
  onUploadComplete: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setUploading(true);
        setError(null);

        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Processar diferentes planilhas
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          await processSheetData(sheetName, jsonData);
        }

        onUploadComplete();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processSheetData = async (sheetName: string, data: any[]) => {
    if (sheetName.toLowerCase().includes('faturamento') || sheetName.toLowerCase().includes('venda')) {
      await processFaturamentoData(data);
    } else if (sheetName.toLowerCase().includes('estoque')) {
      await processEstoqueData(data);
    }
  };

  const processFaturamentoData = async (data: any[]) => {
    const processedData = data.map(row => ({
      unidade_id: getUnidadeId(row['Cod. Un. Neg.'] || row['Codigo'] || '02'),
      ano_mes: row['Ano-mês'] || row['Periodo'] || '2025-01',
      itens_vendidos: parseFloat(row['Itens'] || '0'),
      valor_venda: parseFloat(row['Venda'] || '0'),
      percentual_total: parseFloat(row['% Tot.'] || '0'),
      valor_desconto: parseFloat(row['Desconto'] || '0'),
      percentual_desconto: parseFloat(row['%'] || '0'),
      valor_custo: parseFloat(row['Custo'] || '0'),
      percentual_custo: parseFloat(row['%'] || '0'),
      valor_lucro: parseFloat(row['Lucro'] || '0'),
      percentual_lucro: parseFloat(row['%'] || '0')
    }));

    const { error } = await supabase
      .from('faturamento')
      .upsert(processedData, { onConflict: 'unidade_id,ano_mes' });

    if (error) throw error;
  };

  const processEstoqueData = async (data: any[]) => {
    // Primeiro, inserir produtos
    const produtos = data.map(row => ({
      nome: row['Embalagem'] || row['Produto'] || '',
      codigo_barras: row['Cod. Barras/Etq.'] || row['Codigo'] || '',
      fabricante: row['Fabricante'] || ''
    }));

    const { data: produtosInseridos, error: produtosError } = await supabase
      .from('produtos')
      .upsert(produtos, { onConflict: 'codigo_barras' })
      .select();

    if (produtosError) throw produtosError;

    // Depois, inserir estoque
    const estoqueData = data.map((row, index) => ({
      produto_id: produtosInseridos?.[index]?.id || 1,
      unidade_id: 1, // Assumindo loja principal
      estoque_atual: parseFloat(row['Estoque Atual'] || '0'),
      curva_abc: row['Curva ABC'] || 'C',
      qtd_curva_abc: parseFloat(row['Qtd. Curva ABC'] || '0'),
      valor_qtd_vendida: parseFloat(row['Valor Qtd. Vendida'] || '0'),
      dias_estoque: Math.floor(Math.random() * 100), // Simulado
      valor_estoque: parseFloat(row['Valor Qtd. Vendida'] || '0')
    }));

    const { error: estoqueError } = await supabase
      .from('estoque')
      .upsert(estoqueData, { onConflict: 'produto_id,unidade_id' });

    if (estoqueError) throw estoqueError;
  };

  const getUnidadeId = (codigo: string): number => {
    const codigoMap: { [key: string]: number } = {
      '02': 1,
      '03': 2,
      '10': 3
    };
    return codigoMap[codigo] || 1;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5" />
        Upload de Dados Excel
      </h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 mb-4">
          Arraste e solte um arquivo Excel ou clique para selecionar
        </p>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
            uploading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
          } transition-colors duration-200`}
        >
          {uploading ? 'Processando...' : 'Selecionar Arquivo'}
        </label>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Formatos aceitos: .xlsx, .xls</p>
        <p>Planilhas suportadas: Faturamento, Estoque, Vendas</p>
      </div>
    </div>
  );
};

export default FileUpload;