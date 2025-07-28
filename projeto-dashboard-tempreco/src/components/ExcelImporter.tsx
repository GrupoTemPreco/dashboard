import React from 'react';

interface ExcelImporterProps {
    onImportComplete?: () => void;
}

const ExcelImporter: React.FC<ExcelImporterProps> = ({ onImportComplete }) => {
    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Importar Dados Excel</h3>
            <p className="text-gray-600">Funcionalidade de importação será implementada aqui.</p>
        </div>
    );
};

export default ExcelImporter; 