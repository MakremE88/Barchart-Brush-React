import csv from "./ndx.json";
import React, { useEffect, useState } from "react";
import crossfilter from "crossfilter2";
import * as d3 from "d3";
import {
  BarChart,
  PieChart,
  BubbleChart,
  LineChart,
  ChartContext
} from "react-dc-js";

const numberFormat = d3.format(".2f");

function ConatinerBarChart() {
  const [cx, setCx] = useState(null);

  useEffect(() => {
    (async () => {
      const data = csv; // await d3.json(csv);
      const dateFormatSpecifier = "%m/%d/%Y";
      const dateFormatParser = d3.timeParse(dateFormatSpecifier);
      data.forEach((d) => {
        d.dd = dateFormatParser(d.date);
        d.month = d3.timeMonth(d.dd); // pre-calculate month for better performance
        d.close = +d.close; // coerce to number
        d.open = +d.open;
      });
      const cx = crossfilter(data);
      setCx(cx);
    })();
  }, []);

  if (!cx) {
    return <p>Loading Data...</p>;
  }

  const moveMonths = cx.dimension((d) => d.month);
  const volumeByMonthGroup = moveMonths
    .group()
    .reduceSum((d) => d.volume / 500000);

  const gainOrLoss = cx.dimension((d) => (d.open > d.close ? "Loss" : "Gain"));
  const gainOrLossGroup = gainOrLoss.group();

  const yearlyDimension = cx.dimension((d) => d3.timeYear(d.dd).getFullYear());
  const monthlyMoveGroup = moveMonths
    .group()
    .reduceSum((d) => Math.abs(d.close - d.open));
  const yearlyPerformanceGroup = yearlyDimension.group().reduce(
    (p, v) => {
      ++p.count;
      p.absGain += v.close - v.open;
      p.fluctuation += Math.abs(v.close - v.open);
      p.sumIndex += (v.open + v.close) / 2;
      p.avgIndex = p.sumIndex / p.count;
      p.percentageGain = p.avgIndex ? (p.absGain / p.avgIndex) * 100 : 0;
      p.fluctuationPercentage = p.avgIndex
        ? (p.fluctuation / p.avgIndex) * 100
        : 0;
      return p;
    },
    (p, v) => {
      --p.count;
      p.absGain -= v.close - v.open;
      p.fluctuation -= Math.abs(v.close - v.open);
      p.sumIndex -= (v.open + v.close) / 2;
      p.avgIndex = p.count ? p.sumIndex / p.count : 0;
      p.percentageGain = p.avgIndex ? (p.absGain / p.avgIndex) * 100 : 0;
      p.fluctuationPercentage = p.avgIndex
        ? (p.fluctuation / p.avgIndex) * 100
        : 0;
      return p;
    },
    () => ({
      count: 0,
      absGain: 0,
      fluctuation: 0,
      fluctuationPercentage: 0,
      sumIndex: 0,
      avgIndex: 0,
      percentageGain: 0
    })
  );
  const indexAvgByMonthGroup = moveMonths.group().reduce(
    (p, v) => {
      ++p.days;
      p.total += (v.open + v.close) / 2;
      p.avg = Math.round(p.total / p.days);
      return p;
    },
    (p, v) => {
      --p.days;
      p.total -= (v.open + v.close) / 2;
      p.avg = p.days ? Math.round(p.total / p.days) : 0;
      return p;
    },
    () => ({ days: 0, total: 0, avg: 0 })
  );

  return (
    <>
      <ChartContext>
        <BarChart
          id="testing"
          dimension={moveMonths}
          group={volumeByMonthGroup}
          width={1280}
          height={650}
          radius={80}
          centerBar={true}
          gap={1}
          x={d3
            .scaleTime()
            .domain([new Date(1985, 0, 1), new Date(2012, 11, 31)])}
          round={d3.timeMonth.round}
          alwaysUseRounding={true}
          xUnits={d3.timeMonths}
        />
      </ChartContext>
    </>
  );
}

export default ConatinerBarChart;
