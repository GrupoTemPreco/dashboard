import React from 'react';

export interface ChartCardProps {
    title: string;
    children?: React.ReactNode;
    className?: string;
    type?: string;
    onHover?: React.Dispatch<React.SetStateAction<number | null>>;
    data?: any;
    formatType?: string;
    onBarClick?: (mes: string) => void;
    getTooltipExtra?: (label: any) => string | undefined;
}

const ChartCard: React.FC<ChartCardProps> = ({
    title,
    children,
    className = '',
    type,
    onHover,
    data,
    formatType,
    onBarClick,
    getTooltipExtra
}) => {
    return (
        <div className={`bg-white rounded-lg shadow p-6 w-full ${className}`}>
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <div>
                {children}
                {/* Aqui você pode renderizar gráficos baseados nas props */}
                {type && data && (
                    <div className="chart-container">
                        <p className="text-sm text-gray-600">
                            Gráfico do tipo: {type}
                            {formatType && ` - Formato: ${formatType}`}
                        </p>
                        {/* Implementar renderização de gráficos aqui */}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChartCard; 