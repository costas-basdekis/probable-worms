import * as worms from "../worms";
import React, {Component, ReactNode} from "react";
import {TooltipProps} from "recharts/types/component/Tooltip";
import {createSelector} from "reselect";
import {CartesianGrid, DotProps, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis} from "recharts";
import classNames from "classnames";

type MultipleEvaluationsChartTooltipProps = TooltipProps<number, string> & {
  forceRolls?: worms.RollResult[],
  visibleChartLines?: ChartLineName[],
  chartData?: ChartDataEntry[],
};

class MultipleEvaluationsChartTooltip extends Component<MultipleEvaluationsChartTooltipProps> {
  render() {
    const {payload, label, active, forceRolls, visibleChartLines, chartData} = this.props;
    if (!active || !payload) {
      return null;
    }
    const chartEntry = chartData?.find(({total}) => total === label);
    const rollsIncluded = forceRolls ?? worms.rollResults.filter(roll => payload.some(({dataKey}) => [`exactlyWith${roll}`, `atLeastWith${roll}`, `expectedValueOfAtLeastWith${roll}`].includes(dataKey as string)));
    const exactlyValuesByRoll: Map<worms.RollResult, number | null> = (visibleChartLines?.includes("exactly") ?? true) ? new Map(chartEntry ? rollsIncluded.map(roll => [roll, chartEntry[`exactlyWith${roll}`]]) : rollsIncluded.map(roll => [roll, payload.find(({dataKey}) => dataKey === `exactlyWith${roll}`)?.value ?? null])) : new Map();
    const exactlyValues = Array.from(exactlyValuesByRoll.values()).filter(value => value !== null) as number[];
    const atLeastValuesByRoll: Map<worms.RollResult, number | null> = (visibleChartLines?.includes("at-least") ?? true) ? new Map(chartEntry ? rollsIncluded.map(roll => [roll, chartEntry[`atLeastWith${roll}`]]) : rollsIncluded.map(roll => [roll, payload.find(({dataKey}) => dataKey === `atLeastWith${roll}`)?.value ?? null])) : new Map();
    const atLeastValues = Array.from(atLeastValuesByRoll.values()).filter(value => value !== null) as number[];
    const expectedValueOfAtLeastValuesByRoll: Map<worms.RollResult, number | null> = (visibleChartLines?.includes("expected-value-of-at-least") ?? true) ? new Map(chartEntry ? rollsIncluded.map(roll => [roll, chartEntry[`expectedValueOfAtLeastWith${roll}`]]) : rollsIncluded.map(roll => [roll, payload.find(({dataKey}) => dataKey === `expectedValueOfAtLeastWith${roll}`)?.value ?? null])) : new Map();
    const expectedValueOfAtLeastValues = Array.from(expectedValueOfAtLeastValuesByRoll.values()).filter(value => value !== null) as number[];
    const minExactlyValue = Math.min(...exactlyValues);
    const maxExactlyValue = Math.max(...exactlyValues);
    const minAtLeastValue = Math.min(...atLeastValues);
    const maxAtLeastValue = Math.max(...atLeastValues);
    const minExpectedValueOfAtLeastValue = Math.min(...expectedValueOfAtLeastValues);
    const maxExpectedValueOfAtLeastValue = Math.max(...expectedValueOfAtLeastValues);
    return (
      <div className={"custom-tooltip recharts-default-tooltip"}>
        <p className={"recharts-tooltip-label"}>Result: {label}</p>
        <table>
          <thead>
            <tr>
              <th></th>
              {rollsIncluded.map(roll => {
                const isBest = (
                  (!exactlyValues.length || exactlyValuesByRoll.get(roll) === maxExactlyValue)
                  && (!atLeastValues.length || atLeastValuesByRoll.get(roll) === maxAtLeastValue)
                  && (!expectedValueOfAtLeastValues.length || expectedValueOfAtLeastValuesByRoll.get(roll) === maxExpectedValueOfAtLeastValue)
                );
                const isWorst = (
                  (!exactlyValues.length || exactlyValuesByRoll.get(roll) === minExactlyValue)
                  && (!atLeastValues.length || atLeastValuesByRoll.get(roll) === minAtLeastValue)
                  && (!expectedValueOfAtLeastValues.length || expectedValueOfAtLeastValuesByRoll.get(roll) === minExpectedValueOfAtLeastValue)
                );
                return (
                  <th key={roll} className={classNames({"best-multi-value": isBest, "worst-multi-value": isWorst})}>{roll}</th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {exactlyValues.length ? <tr>
              <th style={{color: "#8884d8"}}>Exactly</th>
              {rollsIncluded.map(roll => {
                const value = exactlyValuesByRoll.get(roll);
                return (
                  <td key={roll} className={classNames({"best-multi-value": value === maxExactlyValue, "worst-multi-value": value === minExactlyValue})}>{value ?? ""}</td>
                );
              })}
            </tr> : null}
            {atLeastValues.length ? <tr>
              <th style={{color: "#d88884"}}>At least</th>
              {rollsIncluded.map(roll => {
                const value = atLeastValuesByRoll.get(roll);
                return (
                  <td key={roll} className={classNames({"best-multi-value": value === maxAtLeastValue, "worst-multi-value": value === minAtLeastValue})}>{value ?? ""}</td>
                );
              })}
            </tr> : null}
            {expectedValueOfAtLeastValues.length ? <tr>
              <th style={{color: "#88d884"}}>EV of At least</th>
              {rollsIncluded.map(roll => {
                const value = expectedValueOfAtLeastValuesByRoll.get(roll);
                return (
                  <td key={roll} className={classNames({"best-multi-value": value === maxExpectedValueOfAtLeastValue, "worst-multi-value": value === minExpectedValueOfAtLeastValue})}>{value ?? ""}</td>
                );
              })}
            </tr> : null}
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
  visibleRollPicks?: worms.RollResult[],
  visibleChartLines?: ChartLineName[],
  showOnlyMaxValues?: boolean,
}

interface ChartDataEntry {
  total: number,
  exactlyWith1: number, exactlyWith2: number, exactlyWith3: number, exactlyWith4: number, exactlyWith5: number, exactlyWithW: number, exactlyMaxValue: number, exactlyMaxFaces: string,
  atLeastWith1: number, atLeastWith2: number, atLeastWith3: number, atLeastWith4: number, atLeastWith5: number, atLeastWithW: number, atLeastMaxValue: number, atLeastMaxFaces: string,
  expectedValueOfAtLeastWith1: number, expectedValueOfAtLeastWith2: number, expectedValueOfAtLeastWith3: number, expectedValueOfAtLeastWith4: number, expectedValueOfAtLeastWith5: number, expectedValueOfAtLeastWithW: number, expectedValueOfAtLeastMaxValue: number, expectedValueOfAtLeastMaxFaces: string,
}

export class MultipleEvaluationsChart extends Component<MultipleEvaluationsChartProps> {
  chartDataSelector = createSelector(
    ({totals}: MultipleEvaluationsChartProps) => totals,
    ({exactRoundedPercentagesEntriesByPickedRolls}: MultipleEvaluationsChartProps) => exactRoundedPercentagesEntriesByPickedRolls,
    ({atLeastRoundedPercentagesEntriesByPickedRolls}: MultipleEvaluationsChartProps) => atLeastRoundedPercentagesEntriesByPickedRolls,
    ({expectedValueOfAtLeastRoundedEntriesByPickedRolls}: MultipleEvaluationsChartProps) => expectedValueOfAtLeastRoundedEntriesByPickedRolls,
    (
      totals, exactRoundedPercentagesEntriesByPickedRolls, atLeastRoundedPercentagesEntriesByPickedRolls,
      expectedValueOfAtLeastRoundedEntriesByPickedRolls,
    ): ChartDataEntry[] => {
      return totals.map(total => {
        const exactlyEntries: [string, number][] = worms.rollResults.map(roll => [`exactlyWith${roll}`, exactRoundedPercentagesEntriesByPickedRolls.get(roll)?.[total]?.[1] ?? 0]);
        const atLeastEntries: [string, number][] = worms.rollResults.map(roll => [`atLeastWith${roll}`, atLeastRoundedPercentagesEntriesByPickedRolls.get(roll)?.[total]?.[1] ?? 0]);
        const expectedValueOfAtLeastEntries: [string, number][] = worms.rollResults.map(roll => [`expectedValueOfAtLeastWith${roll}`, expectedValueOfAtLeastRoundedEntriesByPickedRolls.get(roll)?.[total]?.[1] ?? 0]);
        const exactlyMaxValue = Math.max(...exactlyEntries.map(([, value]) => value));
        const atLeastMaxValue = Math.max(...atLeastEntries.map(([, value]) => value));
        const expectedValueOfAtLeastMaxValue = Math.max(...expectedValueOfAtLeastEntries.map(([, value]) => value));
        return ({
          total,
          ...Object.fromEntries(exactlyEntries),
          exactlyMaxValue,
          exactlyMaxFaces: exactlyEntries.filter(([, value]) => value === exactlyMaxValue).map(([label]) => label[label.length - 1]).join(","),
          ...Object.fromEntries(atLeastEntries),
          atLeastMaxValue,
          atLeastMaxFaces: atLeastEntries.filter(([, value]) => value === atLeastMaxValue).map(([label]) => label[label.length - 1]).join(","),
          ...Object.fromEntries(expectedValueOfAtLeastEntries),
          expectedValueOfAtLeastMaxValue,
          expectedValueOfAtLeastMaxFaces: expectedValueOfAtLeastEntries.filter(([, value]) => value === expectedValueOfAtLeastMaxValue).map(([label]) => label[label.length - 1]).join(","),
        } as ChartDataEntry);
      });
    },
  );

  get chartData(): ChartDataEntry[] {
    return this.chartDataSelector(this.props);
  }

  render() {
    const {chartData} = this;
    const {evaluationsByPickedRoll, diceCount, visibleRollPicks, visibleChartLines, showOnlyMaxValues} = this.props;
    const visibleRolls = Array.from(evaluationsByPickedRoll.keys()).filter(roll => visibleRollPicks?.includes(roll) ?? true);
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
        <Tooltip content={<MultipleEvaluationsChartTooltip forceRolls={showOnlyMaxValues ? visibleRolls : undefined} visibleChartLines={visibleChartLines} chartData={chartData} />}/>
        {/*<Legend width={100} wrapperStyle={this.legendWrapperStyle} formatter={this.formatLegend} />*/}
        {visibleRolls.map(roll => (
          <ReferenceLine yAxisId={"percentage"} key={roll} x={Math.floor(evaluationsByPickedRoll.get(roll)!.expectedValue)} stroke={"green"} label={`${roll}`}/>
        ))}
      </LineChart>
    );
  }
}
