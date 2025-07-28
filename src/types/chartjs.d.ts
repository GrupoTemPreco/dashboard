import 'chart.js';

declare module 'chart.js' {
  interface ChartOptions<TType extends ChartType> {
    getTooltipExtra?: (label: string) => string | undefined;
  }
}