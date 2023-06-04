import * as worms from "../worms";
import React, {Component} from "react";
import {Table} from "semantic-ui-react";
import classNames from "classnames";

interface REvaluationTableProps {
  evaluation: worms.Evaluation,
  maxTotal: number,
  totals: number[],
  exactRoundedPercentagesEntries: [number, number][],
  atLeastRoundedPercentagesEntries: [number, number][],
  expectedValueOfAtLeastRoundedEntries: [number, number][],
}

export class REvaluationTable extends Component<REvaluationTableProps> {
  render() {
    const {totals, exactRoundedPercentagesEntries, atLeastRoundedPercentagesEntries, expectedValueOfAtLeastRoundedEntries} = this.props;
    return (
      <Table definition collapsing unstackable size={"small"}>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell collapsing />
            {totals.map(total => (
              <Table.HeaderCell className={classNames("graded", {low: total < 21, high: total > 25})} collapsing key={total}>{total}</Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row className={"table-row-exactly"}>
            <Table.Cell>Exactly</Table.Cell>
            {exactRoundedPercentagesEntries.map(([total, percentage]) => (
              <Table.Cell key={total} style={{"--percentage": `${percentage}%`}}>{percentage}%</Table.Cell>
            ))}
          </Table.Row>
          <Table.Row className={"table-row-at-least"}>
            <Table.Cell>At least</Table.Cell>
            {atLeastRoundedPercentagesEntries.map(([total, percentage]) => (
              <Table.Cell key={total} style={{"--percentage": `${percentage}%`}}>{percentage}%</Table.Cell>
            ))}
          </Table.Row>
          <Table.Row className={"table-row-expected-value-of-at-least"}>
            <Table.Cell>EV of At least</Table.Cell>
            {expectedValueOfAtLeastRoundedEntries.map(([total, expectedValue]) => (
              <Table.Cell key={total} style={{"--percentage": `${expectedValue}%`}}>{expectedValue}</Table.Cell>
            ))}
          </Table.Row>
        </Table.Body>
      </Table>
    );
  }
}
