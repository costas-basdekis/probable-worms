import * as worms from "../worms";
import React, {Component, ReactNode} from "react";
import {TooltipProps} from "recharts/types/component/Tooltip";
import {createSelector} from "reselect";
import {CartesianGrid, DotProps, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis} from "recharts";
import classNames from "classnames";
import {ChartDataEntry} from "./MultipleEvaluations";

class MultipleEvaluationsChartTooltipTableRow extends Component<{chartLineData: ChartLineData, rollsIncluded: worms.RollResult[]}> {
  colorMap = {
    "exactly": "#8884d8",
    "at-least": "#d88884",
    "expected-value-of-at-least": "#88d884",
  };
  labelMap = {
    "exactly": "Exactly",
    "at-least": "At least",
    "expected-value-of-at-least": "EV of at least",
  };

  render() {
    const {chartLineData, rollsIncluded} = this.props;
    if (!chartLineData.values.length) {
      return null
    }
    return (
      <tr>
        <th style={{color: this.colorMap[chartLineData.chartLine]}}>{this.labelMap[chartLineData.chartLine]}</th>
        {rollsIncluded.map(roll => {
          const value = chartLineData.valuesByRoll.get(roll);
          return (
            <td key={roll} className={classNames({
              "best-multi-value": value === chartLineData.maxValue,
              "worst-multi-value": value === chartLineData.minValue,
            })}>{value ?? ""}</td>
          );
        })}
      </tr>
    );
  }
}

class ChartLineData {
  chartLine: ChartLineName;
  valuesByRoll: Map<worms.RollResult, number | null>;
  values: number[];
  minValue: number;
  maxValue: number;

  static fromData(chartEntry: ChartDataEntry | undefined, chartLine: ChartLineName): ChartLineData {
    const dataKeyMap: {[key in ChartLineName]: "exactly" | "atLeast" | "expectedValueOfAtLeast"} = {
      "exactly": "exactly",
      "at-least": "atLeast",
      "expected-value-of-at-least": "expectedValueOfAtLeast",
    };
    if (!chartEntry) {
      return new ChartLineData(chartLine, new Map());
    }
    const dataKey = dataKeyMap[chartLine];
    return new ChartLineData(chartLine, new Map(worms.rollResults.map(roll => [roll, chartEntry[`${dataKey}With${roll}`] ?? null])));
  }

  constructor(chartLine: ChartLineName, valuesByRoll: Map<worms.RollResult, number | null>, values?: number[], minValue?: number, maxValue?: number) {
    this.chartLine = chartLine;
    this.valuesByRoll = valuesByRoll;
    this.values = values ?? Array.from(this.valuesByRoll.values()).filter(value => value !== null) as number[];
    this.minValue = minValue ?? Math.min(...this.values);
    this.maxValue = maxValue ?? Math.max(...this.values);
  }

  isRollBest(roll: worms.RollResult): boolean {
    return !this.values.length || this.valuesByRoll.get(roll) === this.maxValue;
  }

  isRollWorst(roll: worms.RollResult): boolean {
    return !this.values.length || this.valuesByRoll.get(roll) === this.minValue;
  }
}

type MultipleEvaluationsChartTooltipProps = TooltipProps<number, string> & {
  visibleRolls: worms.RollResult[],
  visibleChartLines?: ChartLineName[],
  chartData: ChartDataEntry[],
};

class MultipleEvaluationsChartTooltip extends Component<MultipleEvaluationsChartTooltipProps> {
  chartLineDataMapSelector = createSelector(
    ({chartData}: MultipleEvaluationsChartTooltipProps) => chartData,
    (chartData): Map<number, {exactlyChartLineData: ChartLineData, atLeastChartLineData: ChartLineData, expectedValueOfAtLeastChartLineData: ChartLineData}> => {
      return new Map(chartData.map(chartEntry => [
        chartEntry.total,
        {
          exactlyChartLineData: ChartLineData.fromData(chartEntry, "exactly"),
          atLeastChartLineData: ChartLineData.fromData(chartEntry, "at-least"),
          expectedValueOfAtLeastChartLineData: ChartLineData.fromData(chartEntry, "expected-value-of-at-least"),
        },
      ]));
    }
  );

  get chartLineDataMap() {
    return this.chartLineDataMapSelector(this.props);
  }

  render() {
    const {label, active, visibleRolls} = this.props;
    if (!active) {
      return null;
    }
    const {chartLineDataMap} = this;
    const total = parseInt(label, 10);
    const chartLineData = chartLineDataMap.get(total);
    if (!chartLineData) {
      return null;
    }
    const {exactlyChartLineData, atLeastChartLineData, expectedValueOfAtLeastChartLineData} = chartLineData;
    return (
      <div className={"custom-tooltip recharts-default-tooltip"}>
        <p className={"recharts-tooltip-label"}>Result: {label}</p>
        <table>
          <thead>
            <tr>
              <th></th>
              {visibleRolls.map(roll => {
                const isBest = (
                  exactlyChartLineData.isRollBest(roll)
                  && atLeastChartLineData.isRollBest(roll)
                  && expectedValueOfAtLeastChartLineData.isRollBest(roll)
                );
                const isWorst = (
                  exactlyChartLineData.isRollWorst(roll)
                  && atLeastChartLineData.isRollWorst(roll)
                  && expectedValueOfAtLeastChartLineData.isRollWorst(roll)
                );
                return (
                  <th key={roll} className={classNames({"best-multi-value": isBest, "worst-multi-value": isWorst})}>{roll}</th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <MultipleEvaluationsChartTooltipTableRow chartLineData={exactlyChartLineData} rollsIncluded={visibleRolls} />
            <MultipleEvaluationsChartTooltipTableRow chartLineData={atLeastChartLineData} rollsIncluded={visibleRolls} />
            <MultipleEvaluationsChartTooltipTableRow chartLineData={expectedValueOfAtLeastChartLineData} rollsIncluded={visibleRolls} />
          </tbody>
        </table>
      </div>
    );
  }
}

interface RollDotProps {
  payload?: ChartDataEntry,
  cx?: number,
  cy?: number,
  label?: ReactNode,
  labelKey?: keyof ChartDataEntry,
}

class RollDot extends Component<DotProps & RollDotProps> {
  render() {
    const {cx, cy, labelKey, payload} = this.props;
    if (cx === undefined || cy === undefined || (labelKey && !payload)) {
      return null;
    }

    let label: ReactNode;
    if (labelKey && payload) {
      label = payload[labelKey];
    } else {
      label = this.props.label;
    }

    return (
      <text x={cx - 5} y={cy + 5} className={"die-dot"}>{label}</text>
    );
  }
}

export type ChartLineName = "exactly" | "at-least" | "expected-value-of-at-least";

interface MultipleEvaluationsChartProps {
  evaluationsByPickedRoll: Map<worms.RollResult, worms.Evaluation>,
  diceCount: number,
  maxTotal: number,
  totals: number[],
  exactRoundedPercentagesEntriesByPickedRolls: Map<worms.RollResult, [number, number][]>,
  atLeastRoundedPercentagesEntriesByPickedRolls: Map<worms.RollResult, [number, number][]>,
  expectedValueOfAtLeastRoundedEntriesByPickedRolls: Map<worms.RollResult, [number, number][]>,
  chartData: ChartDataEntry[],
  visibleRolls: worms.RollResult[],
  visibleRollPicks?: worms.RollResult[],
  visibleChartLines?: ChartLineName[],
  showOnlyMaxValues?: boolean,
}

export class MultipleEvaluationsChart extends Component<MultipleEvaluationsChartProps> {
  render() {
    const {evaluationsByPickedRoll, diceCount, visibleRolls, chartData, visibleChartLines, showOnlyMaxValues} = this.props;
    return (
      <LineChart className={"probabilities-chart"} width={600} height={300} data={chartData}>
        {showOnlyMaxValues ? <>
          {(!visibleChartLines || visibleChartLines?.includes("exactly")) ? (
            <Line yAxisId={"percentage"} type={"monotone"} dataKey={`exactlyMaxValue`} stroke={"#8884d8"} isAnimationActive={false} dot={<RollDot labelKey={"exactlyMaxFaces"} />}/>
          ) : null}
          {(!visibleChartLines || visibleChartLines?.includes("at-least")) ? (
            <Line yAxisId={"percentage"} type={"monotone"} dataKey={`atLeastMaxValue`} stroke={"#d88884"} isAnimationActive={false} dot={<RollDot labelKey={"atLeastMaxFaces"} />}/>
          ) : null}
          {(!visibleChartLines || visibleChartLines?.includes("expected-value-of-at-least")) ? (
            <Line yAxisId={"percentage"} type={"monotone"} dataKey={`expectedValueOfAtLeastMaxValue`} stroke={"#88d884"} isAnimationActive={false} dot={<RollDot labelKey={"expectedValueOfAtLeastMaxFaces"} />}/>
          ) : null}
        </> : <>
          {(!visibleChartLines || visibleChartLines?.includes("exactly")) ? visibleRolls.map(roll => (
            <Line yAxisId={"percentage"} key={`exactlyWith${roll}`} type={"monotone"} dataKey={`exactlyWith${roll}`} stroke={"#8884d8"} isAnimationActive={false} dot={<RollDot label={roll} />}/>
          )) : null}
          {(!visibleChartLines || visibleChartLines?.includes("at-least")) ? visibleRolls.map(roll => (
            <Line yAxisId={"percentage"} key={`atLeastWith${roll}`} type={"monotone"} dataKey={`atLeastWith${roll}`} stroke={"#d88884"} isAnimationActive={false} dot={<RollDot label={roll} />}/>
          )) : null}
          {(!visibleChartLines || visibleChartLines?.includes("expected-value-of-at-least")) ? visibleRolls.map(roll => (
            <Line yAxisId={"expected-value"} key={`expectedValueOfAtLeastWith${roll}`} type={"monotone"} dataKey={`expectedValueOfAtLeastWith${roll}`} stroke={"#88d884"} isAnimationActive={false} dot={<RollDot label={roll} />}/>
          )) : null}
        </>}
        <CartesianGrid stroke={"#ccc"} strokeDasharray={"5 5"}/>
        <XAxis dataKey={"total"}/>
        <YAxis yAxisId={"percentage"} domain={[0, 100]} />
        <YAxis yAxisId={"expected-value"} orientation={"right"} domain={[0, diceCount * 5]} />
        <Tooltip content={<MultipleEvaluationsChartTooltip visibleRolls={visibleRolls} visibleChartLines={visibleChartLines} chartData={chartData} />}/>
        {/*<Legend width={100} wrapperStyle={this.legendWrapperStyle} formatter={this.formatLegend} />*/}
        {visibleRolls.map(roll => (
          <ReferenceLine yAxisId={"percentage"} key={roll} x={Math.floor(evaluationsByPickedRoll.get(roll)!.expectedValue)} stroke={"green"} label={`${roll}`}/>
        ))}
      </LineChart>
    );
  }
}
