import { useMemo } from "react";
import styles from "./LineChart.module.css";

export interface ChartDataPoint {
  label: string;
  value: number;
  date?: Date;
}

interface LineChartProps {
  data: ChartDataPoint[];
  height?: number;
  showGrid?: boolean;
  showPoints?: boolean;
  lineColor?: string;
  fillColor?: string;
  emptyMessage?: string;
}

export default function LineChart({
  data,
  height = 400,
  showGrid = true,
  showPoints = true,
  lineColor = "#3b82f6",
  fillColor = "rgba(59, 130, 246, 0.1)",
  emptyMessage = "Chưa có dữ liệu",
}: LineChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const values = data.map((d) => d.value);
    const minValue = Math.min(...values, 0);
    const maxValue = Math.max(...values, 1);
    const range = maxValue - minValue || 1;

    const padding = 40;
    const chartWidth = 800;
    const chartHeight = height - padding * 2;
    const stepX = (chartWidth - padding * 2) / Math.max(1, data.length - 1);

    const points = data.map((point, index) => {
      const x = padding + index * stepX;
      const normalizedValue = (point.value - minValue) / range;
      const y = padding + chartHeight - normalizedValue * chartHeight;
      return { x, y, ...point };
    });

    // Tạo path cho đường line
    let pathData = "";
    let fillPathData = "";
    
    if (points.length > 0) {
      pathData = `M ${points[0].x} ${points[0].y}`;
      fillPathData = `M ${padding} ${padding + chartHeight} L ${points[0].x} ${points[0].y}`;
      
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cp1x = prev.x + (curr.x - prev.x) / 2;
        const cp1y = prev.y;
        const cp2x = prev.x + (curr.x - prev.x) / 2;
        const cp2y = curr.y;
        
        pathData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
        fillPathData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      }
      
      fillPathData += ` L ${points[points.length - 1].x} ${padding + chartHeight} Z`;
    }

    return {
      points,
      pathData,
      fillPathData,
      minValue,
      maxValue,
      chartWidth,
      chartHeight: height,
      padding,
    };
  }, [data, height]);

  if (!chartData) {
    // Skeleton chart khi chưa có data
    return (
      <div className={styles.chartContainer} style={{ height }}>
        <svg
          viewBox={`0 0 800 ${height}`}
          className={styles.chartSvg}
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {showGrid && (
            <g className={styles.grid}>
              {[0, 1, 2, 3, 4].map((i) => {
                const y = 40 + (i * (height - 80)) / 4;
                return (
                  <line
                    key={i}
                    x1={40}
                    y1={y}
                    x2={760}
                    y2={y}
                    stroke="rgba(148, 163, 184, 0.2)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                );
              })}
            </g>
          )}
          
          {/* X-axis labels placeholder */}
          <g className={styles.xAxis}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
              const x = 40 + (i * 720) / 11;
              return (
                <text
                  key={i}
                  x={x}
                  y={height - 10}
                  className={styles.axisLabel}
                  textAnchor="middle"
                  fill="rgba(148, 163, 184, 0.5)"
                >
                  {i + 1}
                </text>
              );
            })}
          </g>
        </svg>
        <div className={styles.emptyMessage}>{emptyMessage}</div>
      </div>
    );
  }

  const { points, pathData, fillPathData, minValue, maxValue, chartWidth, padding } = chartData;

  // Tính số lượng grid lines
  const gridLines = 5;
  const gridStep = (maxValue - minValue) / gridLines;

  return (
    <div className={styles.chartContainer} style={{ height }}>
      <svg
        viewBox={`0 0 ${chartWidth} ${height}`}
        className={styles.chartSvg}
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {showGrid && (
          <g className={styles.grid}>
            {Array.from({ length: gridLines + 1 }).map((_, i) => {
              const value = maxValue - i * gridStep;
              const y = padding + (i * (height - padding * 2)) / gridLines;
              return (
                <g key={i}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={chartWidth - padding}
                    y2={y}
                    stroke="rgba(148, 163, 184, 0.2)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding - 10}
                    y={y + 4}
                    className={styles.axisLabel}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="12"
                  >
                    {value.toLocaleString("vi-VN")}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* Fill area */}
        <path
          d={fillPathData}
          fill={fillColor}
          className={styles.fillArea}
        />

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={lineColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.line}
        />

        {/* Data points */}
        {showPoints &&
          points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill={lineColor}
                stroke="#fff"
                strokeWidth="2"
                className={styles.point}
              />
              <title>
                {point.label}: {point.value.toLocaleString("vi-VN")} ₫
              </title>
            </g>
          ))}

        {/* X-axis labels */}
        <g className={styles.xAxis}>
          {points.map((point, index) => {
            // Chỉ hiển thị một số labels để tránh quá đông
            const showLabel = index % Math.ceil(points.length / 12) === 0 || index === points.length - 1;
            if (!showLabel) return null;
            
            return (
              <text
                key={index}
                x={point.x}
                y={height - padding + 20}
                className={styles.axisLabel}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="11"
              >
                {point.label}
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
