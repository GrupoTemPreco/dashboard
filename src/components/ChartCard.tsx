import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, TooltipItem, ChartEvent, ActiveElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

export interface ChartCardProps {
  title: string;
  type: 'bar' | 'doughnut' | 'line';
  chartData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
      fill?: boolean;
      tension?: number;
      pointRadius?: number;
      pointHoverRadius?: number;
    }[];
  };
  onBarClick?: (label: string) => void;
  formatType?: 'currency' | 'number' | 'days';
  getTooltipExtra?: (label: string) => string | undefined;
  onHover?: (datasetIndex: number | null) => void;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, type, chartData, onBarClick, formatType = 'currency', getTooltipExtra, onHover }) => {
  // Usar ChartOptions com tipo genérico para manter tipagem adequada
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function (context: TooltipItem<'bar' | 'line' | 'doughnut'>) {
            if (type === 'bar' || type === 'line') {
              const value = context.parsed.y;
              let label = '';
              if (formatType === 'days') {
                label = `${value.toLocaleString('pt-BR')} dias`;
              } else if (formatType === 'number') {
                label = value.toLocaleString('pt-BR');
              } else {
                label = value.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                });
              }
              // A propriedade getTooltipExtra agora é reconhecida devido à extensão da interface ChartOptions
              if (typeof (context.chart?.options as any)?.getTooltipExtra === 'function') {
                const extra = (context.chart.options as any).getTooltipExtra(context.label);
                if (extra) {
                  return label + ' | ' + extra;
                }
              }
              return label;
            }
            // Para outros tipos de gráfico (ex: doughnut), ou se não for bar/line, retorna o valor formatado
            if (typeof context.parsed === 'number') {
              if (formatType === 'currency') {
                return context.parsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
              }
              return context.parsed.toLocaleString('pt-BR');
            }
            return String(context.parsed); // Garante que o retorno é sempre string
          }
        }
      }
    },
    scales: type === 'bar' || type === 'line' ? {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: '#f3f4f6',
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
          },
          callback: function (value: string | number) {
            if (formatType === 'days') {
              return `${Number(value).toLocaleString('pt-BR')} dias`;
            } else if (formatType === 'number') {
              return Number(value).toLocaleString('pt-BR');
            } else {
              // currency (padrão)
              return Number(value).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
              });
            }
          }
        }
      }
    } : undefined,
    onClick: (_event: ChartEvent, elements: ActiveElement[]) => {
      if (onBarClick && elements.length > 0) {
        const index = elements[0].index;
        const label = chartData.labels[index];
        onBarClick(label);
      }
    },
    onHover: (event: ChartEvent, elements: ActiveElement[]) => {
      // Sistema de hover para legendas (funciona para pontos e linhas)
      if (onHover) {
        if (elements && elements.length > 0) {
          const datasetIndex = elements[0].datasetIndex;
          onHover(datasetIndex);
        } else {
          onHover(null);
        }
      }

      // Sistema de hover para barras (mantém funcionalidade existente)
      const canvas = event.native?.target as HTMLCanvasElement; // Adicionar verificação de nulidade
      if (!canvas) return; // Sair se canvas for nulo

      if (type === 'bar' && elements.length > 0) {
        canvas.style.cursor = 'pointer';
        const chart = (canvas as HTMLCanvasElement & { chart?: ChartJS }).chart;
        if (chart && chart.data.datasets[0].backgroundColor) {
          const originalColors = chart.data.datasets[0].backgroundColor as string[];
          const hoverColors = originalColors.map((_color: string, index: number) => {
            return index === elements[0].index ? '#b91c1c' : '#dc2626';
          });
          chart.data.datasets[0].backgroundColor = hoverColors;
          chart.update('none');
        }
      } else if (type === 'bar') {
        canvas.style.cursor = 'default';
        const chart = (canvas as HTMLCanvasElement & { chart?: ChartJS }).chart;
        if (chart && chart.data.datasets[0].backgroundColor) {
          const originalColors = chart.data.datasets[0].backgroundColor as string[];
          const normalColors = originalColors.map(() => '#dc2626');
          chart.data.datasets[0].backgroundColor = normalColors;
          chart.update('none');
        }
      }
    },
    getTooltipExtra: typeof getTooltipExtra === 'function' ? getTooltipExtra : undefined,
  };

  return (
    <div className="chart-card-inner">
      {title && <div className="chart-title-main">{title}</div>}
      <div className="chart-content" style={{ height: 300 }}>
        {type === 'bar' && <Bar data={chartData} options={options} />}
        {type === 'doughnut' && <Doughnut data={chartData} options={options} />}
        {type === 'line' && <Line data={chartData} options={options} />}
      </div>
    </div>
  );
};

export default ChartCard;