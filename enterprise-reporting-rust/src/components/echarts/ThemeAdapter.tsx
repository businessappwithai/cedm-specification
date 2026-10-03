"use client";

/**
 * ECharts theme adapter for the Tremor design system.
 *
 * Translates the Tremor tokens into ECharts option objects so canvas-rendered
 * charts match the Tremor components around them:
 *
 * - Series colours follow Tremor's categorical order (blue → emerald → violet → …)
 * - Axis lines and tick marks are hidden; only horizontal grid lines are drawn
 * - Tick labels use the Tremor label size on `content` grey
 * - Tooltips are a Tremor dropdown surface (radius 8px, `shadow-tremor-dropdown`)
 *
 * Colours are resolved to hex here rather than passed as `hsl(var(--token))`,
 * because ECharts paints to canvas and cannot resolve CSS custom properties.
 *
 * With an Astryx design theme selected, the same slots are filled from that
 * theme's generated hex values (`design-themes.ts`) instead, and the series
 * palette is Astryx's categorical data palette.
 */

import type { EChartsOption } from "echarts";
import { type DesignThemeMeta, getDesignTheme } from "@/lib/theme/design-themes";
import { TREMOR_DARK, TREMOR_LIGHT } from "@/lib/theme/tremor-colors";

const TREMOR = getDesignTheme("tremor");

/** The design theme's categorical palette, in series-assignment order. */
export function getEChartsThemeColors(design: DesignThemeMeta = TREMOR, isDark = false): string[] {
  return [...(isDark ? design.dark : design.light).chart];
}

const TREMOR_LABEL_SIZE = 12; // text-tremor-label
const TREMOR_DEFAULT_SIZE = 14; // text-tremor-default

export function getBaseEChartsOption(
  isDark: boolean,
  design: DesignThemeMeta = TREMOR
): EChartsOption {
  const tokens = (isDark ? design.dark : design.light).echarts;

  const contentColor = tokens.content; // axis + legend labels
  const strongColor = tokens.strong; // titles, tooltip values
  const emphasisColor = tokens.emphasis; // tooltip label text
  const gridColor = tokens.border; // grid lines
  const surfaceColor = tokens.surface; // tooltip surface
  const FONT_FAMILY = tokens.fontFamily;

  const axisDefaults = {
    // Tremor hides the axis rule and tick marks, keeping only the labels
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: contentColor,
      fontSize: TREMOR_LABEL_SIZE,
      fontFamily: FONT_FAMILY,
    },
    splitLine: {
      show: true,
      lineStyle: { color: gridColor, width: 1, type: "solid" as const },
    },
  };

  return {
    backgroundColor: "transparent",
    textStyle: {
      color: contentColor,
      fontFamily: FONT_FAMILY,
      fontSize: TREMOR_DEFAULT_SIZE,
    },
    title: {
      textStyle: {
        color: strongColor,
        fontSize: 18, // text-tremor-title
        fontWeight: 500,
        fontFamily: FONT_FAMILY,
      },
      subtextStyle: {
        color: contentColor,
        fontSize: TREMOR_DEFAULT_SIZE,
        fontFamily: FONT_FAMILY,
      },
    },
    legend: {
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
      textStyle: {
        color: contentColor,
        fontSize: TREMOR_DEFAULT_SIZE,
        fontFamily: FONT_FAMILY,
      },
    },
    tooltip: {
      backgroundColor: surfaceColor,
      borderColor: gridColor,
      borderWidth: 1,
      borderRadius: 8, // rounded-tremor-default
      padding: [8, 12],
      extraCssText: "box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);",
      textStyle: {
        color: emphasisColor,
        fontSize: TREMOR_DEFAULT_SIZE,
        fontFamily: FONT_FAMILY,
      },
      axisPointer: {
        lineStyle: { color: gridColor },
        crossStyle: { color: gridColor },
      },
    },
    // Tremor charts drop vertical grid lines on the category axis
    xAxis: { ...axisDefaults, splitLine: { show: false } },
    yAxis: axisDefaults,
  };
}

/** Hex values for the Tremor surface tokens, for engines that need them directly. */
export function getEChartsSurfaceColors(isDark: boolean) {
  const tokens = isDark ? TREMOR_DARK : TREMOR_LIGHT;
  return {
    background: tokens.background.DEFAULT,
    canvas: tokens.background.muted,
    border: tokens.border,
    content: tokens.content.DEFAULT,
    contentEmphasis: tokens.content.emphasis,
    contentStrong: tokens.content.strong,
    brand: tokens.brand.DEFAULT,
  };
}
