import * as worms from "../worms";
import React, {Component, ReactNode} from "react";
import {TooltipProps} from "recharts/types/component/Tooltip";
import {createSelector} from "reselect";
import {CartesianGrid, Legend, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis} from "recharts";
import {LegendType} from "recharts/types/util/types";

interface REvaluationChartProps {
  evaluation: worms.Evaluation,
  maxTotal: number,
  totals: number[],
  exactRoundedPercentagesEntries: [number, number][],
  atLeastRoundedPercentagesEntries: [number, number][],
}

class REvaluationChartTooltip extends Component<TooltipProps<number, number>> {
  render() {
    const {payload, label, active} = this.props;
    if (!active) {
      return null;
    }
    const [exactlyPayload, atLeastPayload] = payload!;
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
        </ul>
      </div>
    );
  }
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
    (totals, exactRoundedPercentagesEntries, atLeastRoundedPercentagesEntries): { total: number, exactly: number, atLeast: number }[] => {
      return totals.map(total => ({
        total,
        exactly: exactRoundedPercentagesEntries[total][1],
        atLeast: atLeastRoundedPercentagesEntries[total][1],
      }));
    },
  );

  get chartData(): { total: number, exactly: number, atLeast: number }[] {
    return this.chartDataSelector(this.props);
  }

  render() {
    const {chartData} = this;
    const {evaluation} = this.props;
    return (
      <LineChart className={"probabilities-chart"} width={600} height={300} data={chartData}>
        <Line type={"monotone"} dataKey={"exactly"} stroke={"#8884d8"} isAnimationActive={false}/>
        <Line type={"monotone"} dataKey={"atLeast"} stroke={"#d88884"} isAnimationActive={false}/>
        <CartesianGrid stroke={"#ccc"} strokeDasharray={"5 5"}/>
        <XAxis dataKey={"total"}/>
        <YAxis/>
        <Tooltip content={<REvaluationChartTooltip/>}/>
        <Legend width={100} wrapperStyle={this.legendWrapperStyle} formatter={this.formatLegend}/>
        <ReferenceLine x={Math.floor(evaluation.expectedValue)} stroke={"green"} label={"EV"}/>
      </LineChart>
    );
  }

  legendLabels: { [key: string]: string } = {exactly: "Exactly", atLeast: "At least"};

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
