import type { EChartsOption } from "echarts";
import type { EChartsConfig } from "@/types/charts";
import {
  extractCategories,
  extractGroupedSeries,
  extractPieData,
  extractScatterData,
  extractSeries,
} from "../DataAdapter";

export function buildBar(config: EChartsConfig, rows: Record<string, unknown>[]): EChartsOption {
  const categories = extractCategories(rows, config.dataMapping);
  const series = config.dataMapping.group
    ? extractGroupedSeries(rows, config.dataMapping)
    : extractSeries(rows, config.dataMapping);

  const seriesWithStack = series.map((s, index) => {
    const baseSeries = {
      name: s.name,
      type: "bar" as const,
      data: s.data,
      ...(config.stacked === true && { stack: "stack-1" }),
    };

    if (config.seriesColors?.[index]) {
      return {
        ...baseSeries,
        itemStyle: {
          color: config.seriesColors[index],
        },
      };
    }

    return baseSeries;
  });

  console.log("[buildBar] Input config.stacked:", config.stacked);
  console.log("[buildBar] Series colors:", config.seriesColors);
  console.log(
    "[buildBar] Series:",
    seriesWithStack.map((s) => ({
      name: s.name,
      hasStack: "stack" in s,
      stackValue: s.stack,
      dataLength: s.data?.length,
      allKeys: Object.keys(s),
      type: s.type,
      hasColor: "itemStyle" in s,
    }))
  );
  console.log("[buildBar] First series object:", JSON.stringify(seriesWithStack[0], null, 2));
  console.log("[buildBar] Second series object:", JSON.stringify(seriesWithStack[1], null, 2));

  const result: EChartsOption = {
    xAxis: {
      type: "category",
      data: categories,
      axisLabel: { interval: 0, rotate: 30 },
      ...config.xAxis,
    },
    yAxis: {
      type: "value",
      ...config.yAxis,
    },
    series: seriesWithStack.map((s) => ({
      ...s,
      barGap: "0%",
      barCategoryGap: "20%",
    })),
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    legend:
      series.length > 1
        ? {
            data: series.map((s) => s.name),
            orient: "horizontal",
            top: "bottom",
            left: "center",
            itemGap: 20,
            padding: [20, 0, 0, 0],
          }
        : undefined,
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%",
      containLabel: true,
    },
  };

  console.log("[buildBar] Result:", result);

  return result;
}

export function buildLine(config: EChartsConfig, rows: Record<string, unknown>[]): EChartsOption {
  const categories = extractCategories(rows, config.dataMapping);
  const series = config.dataMapping.group
    ? extractGroupedSeries(rows, config.dataMapping)
    : extractSeries(rows, config.dataMapping);

  const option: EChartsOption = {
    xAxis: { type: "category", data: categories, ...config.xAxis },
    yAxis: { type: "value", ...config.yAxis },
    series: series.map((s, index) => {
      const baseSeries = {
        name: s.name,
        type: "line" as const,
        data: s.data,
        smooth: true,
      };

      if (config.seriesColors?.[index]) {
        return {
          ...baseSeries,
          itemStyle: {
            color: config.seriesColors[index],
          },
        };
      }

      return baseSeries;
    }),
    tooltip: { trigger: "axis" },
    legend: series.length > 1 ? { data: series.map((s) => s.name) } : undefined,
  };

  return option;
}

export function buildArea(config: EChartsConfig, rows: Record<string, unknown>[]): EChartsOption {
  const categories = extractCategories(rows, config.dataMapping);
  const series = config.dataMapping.group
    ? extractGroupedSeries(rows, config.dataMapping)
    : extractSeries(rows, config.dataMapping);

  const option: EChartsOption = {
    xAxis: { type: "category", data: categories, ...config.xAxis },
    yAxis: { type: "value", ...config.yAxis },
    series: series.map((s, index) => {
      const baseSeries = {
        name: s.name,
        type: "line" as const,
        data: s.data,
        smooth: true,
        areaStyle: {},
      };

      if (config.seriesColors?.[index]) {
        return {
          ...baseSeries,
          itemStyle: {
            color: config.seriesColors[index],
          },
          areaStyle: {
            color: config.seriesColors[index],
          },
        };
      }

      return baseSeries;
    }),
    tooltip: { trigger: "axis" },
    legend: series.length > 1 ? { data: series.map((s) => s.name) } : undefined,
  };

  return option;
}

/**
 * Pie and doughnut layout.
 *
 * These used to put a vertical legend against the left edge and a centred pie
 * with outside labels beside it, so the left-hand slice labels were drawn on
 * top of the legend. The legend now runs horizontally along one edge (bottom
 * unless the chart asks for top, scrolling if it is long), the pie is sized
 * and shifted to leave that edge clear, and labels that would still collide
 * are hidden rather than overprinted — the legend and tooltip name them.
 */
function pieOption(
  config: EChartsConfig,
  rows: Record<string, unknown>[],
  radius: string | [string, string]
): EChartsOption {
  const data = extractPieData(rows, config.dataMapping);
  const legendConfig = typeof config.legend === "object" ? config.legend : undefined;
  const showLegend = config.legend !== false && data.length > 1;
  const legendOnTop = legendConfig?.top === "top";

  return {
    series: [
      {
        type: "pie" as const,
        data,
        radius,
        // Leave the legend's edge clear.
        center: ["50%", showLegend ? (legendOnTop ? "55%" : "45%") : "50%"],
        avoidLabelOverlap: true,
        label: {
          show: true,
          formatter: "{b}",
          overflow: "truncate",
          width: 110,
          // ECharts strokes outside labels in a contrasting colour by default,
          // which on a dark surface reads as outlined text.
          textBorderWidth: 0,
        },
        labelLine: { length: 10, length2: 12 },
        labelLayout: { hideOverlap: true },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0,0,0,0.5)" },
        },
      },
    ],
    tooltip: { trigger: "item" },
    legend: showLegend
      ? {
          type: "scroll" as const,
          orient: "horizontal" as const,
          left: "center",
          ...(legendOnTop ? { top: 0 } : { bottom: 0 }),
        }
      : { show: false },
  };
}

export function buildPie(config: EChartsConfig, rows: Record<string, unknown>[]): EChartsOption {
  return pieOption(config, rows, "55%");
}

export function buildDoughnut(
  config: EChartsConfig,
  rows: Record<string, unknown>[]
): EChartsOption {
  return pieOption(config, rows, ["35%", "60%"]);
}

export function buildScatter(
  config: EChartsConfig,
  rows: Record<string, unknown>[]
): EChartsOption {
  const data = extractScatterData(rows, config.dataMapping);

  return {
    xAxis: { type: "value", ...config.xAxis },
    yAxis: { type: "value", ...config.yAxis },
    series: [
      {
        type: "scatter" as const,
        data,
        symbolSize: 8,
      },
    ],
    tooltip: { trigger: "item" },
  };
}
