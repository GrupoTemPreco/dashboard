import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface ChartCardProps {
  title: string;
  type: 'bar' | 'doughnut';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }[];
  };
  onBarClick?: (label: string) => void;
  formatType?: 'currency' | 'number' | 'days';
  getTooltipExtra?: (label: string) => string | undefined;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, type, data, onBarClick, formatType = 'currency', getTooltipExtra }) => {
  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
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
          label: function (context: any) {
            if (type === 'bar') {
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
              if (typeof context.chart?.options?.getTooltipExtra === 'function') {
                const extra = context.chart.options.getTooltipExtra(context.label);
                if (extra) {
                  return label + ' | ' + extra;
                }
              }
              return label;
            }
            return context.parsed;
          }
        }
      }
    },
    scales: type === 'bar' ? {
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
          callback: function (value: any) {
            if (formatType === 'days') {
              return `${value.toLocaleString('pt-BR')} dias`;
            } else if (formatType === 'number') {
              return value.toLocaleString('pt-BR');
            } else {
              // currency (padrão)
              return value.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              });
            }
          }
        },
      },
    } : undefined,
    onClick: (event: any, elements: any) => {
      if (onBarClick && elements.length > 0) {
        const index = elements[0].index;
        const label = data.labels[index];
        onBarClick(label);
      }
    },
    onHover: (event: any, elements: any) => {
      const canvas = event.native.target;
      if (elements.length > 0) {
        canvas.style.cursor = 'pointer';
        // Mudar cor da barra específica para hover
        const chart = canvas.chart;
        if (chart && chart.data.datasets[0].backgroundColor) {
          const originalColors = chart.data.datasets[0].backgroundColor as string[];
          const hoverColors = originalColors.map((color: string, index: number) => {
            return index === elements[0].index ? '#b91c1c' : '#dc2626';
          });
          chart.data.datasets[0].backgroundColor = hoverColors;
          chart.update('none');
        }
      } else {
        canvas.style.cursor = 'default';
        // Restaurar cores originais
        const chart = canvas.chart;
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
    <div className="chart-card" style={{ height: '300px' }}>
      {type === 'bar' ? (
        <Bar data={data} options={options} />
      ) : (
        <Doughnut data={data} options={options} />
      )}
    </div>
  );
};

export default ChartCard;