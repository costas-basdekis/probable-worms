import * as worms from "../worms";
import React, {Component} from "react";
import {Segment, Table} from "semantic-ui-react";

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
      <Segment style={{width: "100%", overflowX: "scroll"}}>
        <Table definition collapsing unstackable size={"small"}>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell collapsing />
              {totals.map(total => (
                <Table.HeaderCell collapsing key={total}>{total}</Table.HeaderCell>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>Exactly</Table.Cell>
              {exactRoundedPercentagesEntries.map(([total, percentage]) => (
                <Table.Cell key={total}>{percentage}%</Table.Cell>
              ))}
            </Table.Row>
            <Table.Row>
              <Table.Cell>At least</Table.Cell>
              {atLeastRoundedPercentagesEntries.map(([total, percentage]) => (
                <Table.Cell key={total}>{percentage}%</Table.Cell>
              ))}
            </Table.Row>
          </Table.Body>
        </Table>
      </Segment>
    );
  }
}
