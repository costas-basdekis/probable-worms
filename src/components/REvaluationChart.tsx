import * as worms from "../worms";
import React, {Component, ReactNode} from "react";
import {TooltipProps} from "recharts/types/component/Tooltip";
import {createSelector} from "reselect";
import {CartesianGrid, Legend, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis} from "recharts";
import {LegendType} from "recharts/types/util/types";

class REvaluationChartTooltip extends Component<TooltipProps<number, number>> {
  render() {
    const {payload, label, active} = this.props;
    if (!active) {
      return null;
    }
    const [exactlyPayload, atLeastPayload, expectedValueOfAtLeastPayload] = payload!;
    return (
      <div className={"custom-tooltip recharts-default-tooltip"}>
        <p className={"recharts-tooltip-label"}>Result: {label}</p>
        <ul className={"recharts-tooltip-item-list"}>
          <li className={"recharts-tooltip-item"} style={{color: exactlyPayload.color}}>
            <span className={"recharts-tooltip-item-name"}>Exactly {label}</span>
            <span className={"recharts-tooltip-item-separator"}>: </span>
            <span className={"recharts-tooltip-item-value"}>{exactlyPayload.value}</span>
            <span className={"recharts-tooltip-item-unit"}>%</span>
          </li>
          <li className={"recharts-tooltip-item"} style={{color: atLeastPayload.color}}>
            <span className={"recharts-tooltip-item-name"}>At least {label}</span>
            <span className={"recharts-tooltip-item-separator"}>: </span>
            <span className={"recharts-tooltip-item-value"}>{atLeastPayload.value}</span>
            <span className={"recharts-tooltip-item-unit"}>%</span>
          </li>
          <li className={"recharts-tooltip-item"} style={{color: expectedValueOfAtLeastPayload.color}}>
            <span className={"recharts-tooltip-item-name"}>EV of At least {label}</span>
            <span className={"recharts-tooltip-item-separator"}>: </span>
            <span className={"recharts-tooltip-item-value"}>{expectedValueOfAtLeastPayload.value}</span>
          </li>
        </ul>
      </div>
    );
  }
}

interface REvaluationChartProps {
  evaluation: worms.Evaluation,
  diceCount: number,
  maxTotal: number,
  totals: number[],
  exactRoundedPercentagesEntries: [number, number][],
  atLeastRoundedPercentagesEntries: [number, number][],
  expectedValueOfAtLeastRoundedEntries: [number, number][],
}

interface ChardDataEntry {
  total: number;
  exactly: number;
  atLeast: number;
  expectedValueOfAtLeast: number;
}

export class REvaluationChart extends Component<REvaluationChartProps> {
  legendWrapperStyle = {
    top: 40,
    right: 20,
    backgroundColor: '#f5f5f5',
    border: '1px solid #d5d5d5',
    borderRadius: 3,
    lineHeight: '40px',
  };

  chartDataSelector = createSelector(
    ({totals}: REvaluationChartProps) => totals,
    ({exactRoundedPercentagesEntries}: REvaluationChartProps) => exactRoundedPercentagesEntries,
    ({atLeastRoundedPercentagesEntries}: REvaluationChartProps) => atLeastRoundedPercentagesEntries,
    ({expectedValueOfAtLeastRoundedEntries}: REvaluationChartProps) => expectedValueOfAtLeastRoundedEntries,
    (totals, exactRoundedPercentagesEntries, atLeastRoundedPercentagesEntries, expectedValueOfAtLeastRoundedEntries): ChardDataEntry[] => {
      return totals.map(total => ({
        total,
        exactly: exactRoundedPercentagesEntries[total][1],
        atLeast: atLeastRoundedPercentagesEntries[total][1],
        expectedValueOfAtLeast: expectedValueOfAtLeastRoundedEntries[total][1],
      }));
    },
  );

  get chartData(): ChardDataEntry[] {
    return this.chartDataSelector(this.props);
  }

  render() {
    const {chartData} = this;
    const {evaluation, diceCount} = this.props;
    return (
      <LineChart className={"probabilities-chart"} width={600} height={450} data={chartData}>
        <Line yAxisId={"percentage"} type={"monotone"} dataKey={"exactly"} stroke={"#8884d8"} isAnimationActive={false}/>
        <Line yAxisId={"percentage"} type={"monotone"} dataKey={"atLeast"} stroke={"#d88884"} isAnimationActive={false}/>
        <Line yAxisId={"expected-value"} type={"monotone"} dataKey={"expectedValueOfAtLeast"} stroke={"#88d884"} isAnimationActive={false}/>
        <CartesianGrid stroke={"#ccc"} strokeDasharray={"5 5"}/>
        <XAxis dataKey={"total"}/>
        <YAxis yAxisId={"percentage"} domain={[0, 100]} />
        <YAxis yAxisId={"expected-value"} orientation={"right"} domain={[0, diceCount * 5]} />
        <Tooltip content={<REvaluationChartTooltip/>}/>
        <Legend width={100} wrapperStyle={this.legendWrapperStyle} formatter={this.formatLegend}/>
        <ReferenceLine yAxisId={"percentage"} x={Math.floor(evaluation.expectedValue)} stroke={"green"} label={"EV"}/>
      </LineChart>
    );
  }

  legendLabels: { [key: string]: string } = {exactly: "Exactly", atLeast: "At least", expectedValueOfAtLeast: "EV of At Least"};

  formatLegend = (value: string, entry: {
    value: number;
    id?: string;
    type?: LegendType;
    color?: string;
    payload?: {
      strokeDasharray: string | number;
    };
  }): ReactNode => {
    const {color} = entry;

    return <span style={{color}}>{this.legendLabels[value] ?? value}</span>;
  };
}
