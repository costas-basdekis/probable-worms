import * as worms from "../worms";
import React, {Component} from "react";
import {TooltipProps} from "recharts/types/component/Tooltip";
import {createSelector} from "reselect";
import {CartesianGrid, DotProps, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis} from "recharts";
import classNames from "classnames";

class MultipleEvaluationsChartTooltip extends Component<TooltipProps<number, string>> {
  render() {
    const {payload, label, active} = this.props;
    if (!active || !payload) {
      return null;
    }
    const rollsIncluded = worms.rollResults.filter(roll => payload.some(({dataKey}) => dataKey === `exactlyWith${roll}`));
    const exactlyValues = payload.filter(({dataKey, value}) => typeof dataKey === "string" && dataKey.includes("exactly") && value !== undefined).map(({value}) => value as number);
    const atLeastValues = payload.filter(({dataKey, value}) => typeof dataKey === "string" && dataKey.includes("atLeast") && value !== undefined).map(({value}) => value as number);
    const expectedValueOfAtLeastValues = payload.filter(({dataKey, value}) => typeof dataKey === "string" && dataKey.includes("expectedValueOfAtLeastWith") && value !== undefined).map(({value}) => value as number);
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
                  payload.some(({dataKey, value}) => dataKey === `exactlyWith${roll}` && value === maxExactlyValue)
                  && payload.some(({dataKey, value}) => dataKey === `atLeastWith${roll}` && value === maxAtLeastValue)
                  && payload.some(({dataKey, value}) => dataKey === `expectedValueOfAtLeastWith${roll}` && value === maxExpectedValueOfAtLeastValue)
                );
                const isWorst = (
                  payload.some(({dataKey, value}) => dataKey === `exactlyWith${roll}` && value === minExactlyValue)
                  && payload.some(({dataKey, value}) => dataKey === `atLeastWith${roll}` && value === minAtLeastValue)
                  && payload.some(({dataKey, value}) => dataKey === `expectedValueOfAtLeastWith$${roll}` && value === minExpectedValueOfAtLeastValue)
                );
                return (
                  <th key={roll} className={classNames({"best-multi-value": isBest, "worst-multi-value": isWorst})}>{roll}</th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th style={{color: "#8884d8"}}>Exactly</th>
              {rollsIncluded.map(roll => {
                const value = payload.find(({dataKey}) => dataKey === `exactlyWith${roll}`)?.value;
                return (
                  <td key={roll} className={classNames({"best-multi-value": value === maxExactlyValue, "worst-multi-value": value === minExactlyValue})}>{value ?? ""}</td>
                );
              })}
            </tr>
            <tr>
              <th style={{color: "#d88884"}}>At least</th>
              {rollsIncluded.map(roll => {
                const value = payload.find(({dataKey}) => dataKey === `atLeastWith${roll}`)?.value;
                return (
                  <td key={roll} className={classNames({"best-multi-value": value === maxAtLeastValue, "worst-multi-value": value === minAtLeastValue})}>{value ?? ""}</td>
                );
              })}
            </tr>
            <tr>
              <th style={{color: "#88d884"}}>EV of At least</th>
              {rollsIncluded.map(roll => {
                const value = payload.find(({dataKey}) => dataKey === `expectedValueOfAtLeastWith${roll}`)?.value;
                return (
                  <td key={roll} className={classNames({"best-multi-value": value === maxExpectedValueOfAtLeastValue, "worst-multi-value": value === minExpectedValueOfAtLeastValue})}>{value ?? ""}</td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}

interface CustomizedDotProps {
  dataKey?: string,
  cx?: number,
  cy?: number,
}

class CustomizedDot extends Component<DotProps & CustomizedDotProps> {
  render() {
    const {cx, cy, dataKey} = this.props;
    if (cx === undefined || cy === undefined || dataKey === undefined) {
      return null;
    }

    return (
      <text x={cx - 5} y={cy + 5} className={"die-dot"}>{dataKey?.slice(-1)}</text>
    );
  }
}

interface MultipleEvaluationsChartProps {
  evaluationsByPickedRoll: Map<worms.RollResult, worms.Evaluation>,
  diceCount: number,
  maxTotal: number,
  totals: number[],
  exactRoundedPercentagesEntriesByPickedRolls: Map<worms.RollResult, [number, number][]>,
  atLeastRoundedPercentagesEntriesByPickedRolls: Map<worms.RollResult, [number, number][]>,
  expectedValueOfAtLeastRoundedEntriesByPickedRolls: Map<worms.RollResult, [number, number][]>,
  visibleRollPicks?: worms.RollResult[],
}

interface ChartDataEntry {
  total: number,
  exactlyWith1: number, exactlyWith2: number, exactlyWith3: number, exactlyWith4: number, exactlyWith5: number, exactlyWithW: number,
  atLeastWith1: number, atLeastWith2: number, atLeastWith3: number, atLeastWith4: number, atLeastWith5: number, atLeastWithW: number,
  expectedValueOfAtLeastWith1: number, expectedValueOfAtLeastWith2: number, expectedValueOfAtLeastWith3: number, expectedValueOfAtLeastWith4: number, expectedValueOfAtLeastWith5: number, expectedValueOfAtLeastWithW: number,
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
      return totals.map(total => ({
        total,
        ...Object.fromEntries(worms.rollResults.map(roll => [`exactlyWith${roll}`, exactRoundedPercentagesEntriesByPickedRolls.get(roll)?.[total]?.[1] ?? 0])),
        ...Object.fromEntries(worms.rollResults.map(roll => [`atLeastWith${roll}`, atLeastRoundedPercentagesEntriesByPickedRolls.get(roll)?.[total]?.[1] ?? 0])),
        ...Object.fromEntries(worms.rollResults.map(roll => [`expectedValueOfAtLeastWith${roll}`, expectedValueOfAtLeastRoundedEntriesByPickedRolls.get(roll)?.[total]?.[1] ?? 0])),
      } as ChartDataEntry));
    },
  );

  get chartData(): ChartDataEntry[] {
    return this.chartDataSelector(this.props);
  }

  render() {
    const {chartData} = this;
    const {evaluationsByPickedRoll, diceCount, visibleRollPicks} = this.props;
    return (
      <LineChart className={"probabilities-chart"} width={600} height={300} data={chartData}>
        {Array.from(evaluationsByPickedRoll.keys()).filter(roll => visibleRollPicks?.includes(roll) ?? true).map(roll => (
          <Line yAxisId={"percentage"} key={`exactlyWith${roll}`} type={"monotone"} dataKey={`exactlyWith${roll}`} stroke={"#8884d8"} isAnimationActive={false} dot={<CustomizedDot />}/>
        ))}
        {Array.from(evaluationsByPickedRoll.keys()).filter(roll => visibleRollPicks?.includes(roll) ?? true).map(roll => (
          <Line yAxisId={"percentage"} key={`atLeastWith${roll}`} type={"monotone"} dataKey={`atLeastWith${roll}`} stroke={"#d88884"} isAnimationActive={false} dot={<CustomizedDot />}/>
        ))}
        {Array.from(evaluationsByPickedRoll.keys()).filter(roll => visibleRollPicks?.includes(roll) ?? true).map(roll => (
          <Line yAxisId={"expected-value"} key={`expectedValueOfAtLeastWith${roll}`} type={"monotone"} dataKey={`expectedValueOfAtLeastWith${roll}`} stroke={"#88d884"} isAnimationActive={false} dot={<CustomizedDot />}/>
        ))}
        <CartesianGrid stroke={"#ccc"} strokeDasharray={"5 5"}/>
        <XAxis dataKey={"total"}/>
        <YAxis yAxisId={"percentage"} domain={[0, 100]} />
        <YAxis yAxisId={"expected-value"} orientation={"right"} domain={[0, diceCount * 5]} />
        <Tooltip content={<MultipleEvaluationsChartTooltip/>}/>
        {/*<Legend width={100} wrapperStyle={this.legendWrapperStyle} formatter={this.formatLegend} />*/}
        {Array.from(evaluationsByPickedRoll.entries()).filter(([roll]) => visibleRollPicks?.includes(roll) ?? true).map(([roll, evaluation]) => (
          <ReferenceLine yAxisId={"percentage"} key={roll} x={Math.floor(evaluation.expectedValue)} stroke={"green"} label={`${roll}`}/>
        ))}
      </LineChart>
    );
  }
}
