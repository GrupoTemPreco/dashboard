import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bgColor?: string;
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, color, bgColor, subtitle }) => {
  return (
    <div className={`rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 ${bgColor || 'bg-white'}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;