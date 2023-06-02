import * as worms from "../worms";
import React, {Component} from "react";

interface REvaluationTableProps {
  evaluation: worms.Evaluation,
  maxTotal: number,
  totals: number[],
  exactRoundedPercentagesEntries: [number, number][],
  atLeastRoundedPercentagesEntries: [number, number][],
}

export class REvaluationTable extends Component<REvaluationTableProps> {
  render() {
    const {totals, exactRoundedPercentagesEntries, atLeastRoundedPercentagesEntries} = this.props;
    return (
      <table>
        <thead>
        <tr>
          <th/>
          {totals.map(total => (
            <th key={total}>{total}</th>
          ))}
        </tr>
        </thead>
        <tbody>
        <tr/>
        <tr>
          <th>Exactly</th>
          {exactRoundedPercentagesEntries.map(([total, percentage]) => (
            <td key={total}>{percentage}%</td>
          ))}
        </tr>
        <tr>
          <th>At least</th>
          {atLeastRoundedPercentagesEntries.map(([total, percentage]) => (
            <td key={total}>{percentage}%</td>
          ))}
        </tr>
        </tbody>
      </table>
    );
  }
}
