import React, {Component, FormEvent, ReactNode} from "react";
import {Button, Checkbox, Container, Label, Table} from "semantic-ui-react";
import {RChest} from "./RChest";
import * as worms from "../worms";
import {ChartLineName} from "./MultipleEvaluationsChart";
import {CheckboxProps} from "semantic-ui-react/dist/commonjs/modules/Checkbox/Checkbox";
import {RolledState} from "../worms";
import {createSelector} from "reselect";
import {EvaluationAndPickedRoll} from "../App";

class WrapColorLabel extends Component<{children: ReactNode, good: boolean, bad: boolean}> {
  render() {
    const {children, good, bad} = this.props;
    if (good) {
      return <Label color={"green"}>{children}</Label>;
    } else if (bad) {
      return <Label color={"red"}>{children}</Label>;
    } else {
      return children;
    }
  }
}

interface MultipleEvaluationsTableTargetProps {
  targetType: TargetType,
  pickValue: PickValue,
  minMaxPickValues: MinMaxPickValues,
}

class MultipleEvaluationsTableTarget extends Component<MultipleEvaluationsTableTargetProps> {
  static getIsBestAndWorst(targetType: TargetType, pickValue: PickValue, minMaxPickValues: MinMaxPickValues): {
    isBest: {exactly: boolean, atLeast: boolean, evOfAtLeast: boolean, overall: boolean},
    isWorst: {exactly: boolean, atLeast: boolean, evOfAtLeast: boolean, overall: boolean},
  } {
    const isBest = {
      exactly: pickValue.exactly === minMaxPickValues.max.exactly,
      atLeast: pickValue.atLeast === minMaxPickValues.max.atLeast,
      evOfAtLeast: pickValue.evOfAtLeast === minMaxPickValues.max.evOfAtLeast,
    };
    const isWorst = {
      exactly: pickValue.exactly === minMaxPickValues.min.exactly,
      atLeast: pickValue.atLeast === minMaxPickValues.min.atLeast,
      evOfAtLeast: pickValue.evOfAtLeast === minMaxPickValues.min.evOfAtLeast,
    };
    switch (targetType) {
      case "exactly": {
        return {
          isBest: {...isBest, overall: isBest.exactly},
          isWorst: {...isWorst, overall: isWorst.exactly},
        };
      }
      case "atLeast": {
        return {
          isBest: {...isBest, overall: isBest.atLeast && isBest.evOfAtLeast},
          isWorst: {...isWorst, overall: isWorst.atLeast && isWorst.evOfAtLeast},
        };
      }
      default:
        throw new Error("Unknown target type");
    }
  }
  render() {
    const {targetType, pickValue, minMaxPickValues} = this.props;
    const {isBest, isWorst} = MultipleEvaluationsTableTarget.getIsBestAndWorst(targetType, pickValue, minMaxPickValues);
    switch (targetType) {
      case "exactly": {
        return (
          <WrapColorLabel
            good={isBest.exactly}
            bad={isWorst.exactly}
          >
            {pickValue.exactlyStr}
          </WrapColorLabel>
        );
      }
      case "atLeast": {
        return <>
          <WrapColorLabel
            good={isBest.atLeast}
            bad={isWorst.atLeast}
          >
            {pickValue.atLeastStr}
          </WrapColorLabel>
          {" / EV: "}
          <WrapColorLabel
            good={isBest.evOfAtLeast}
            bad={isWorst.evOfAtLeast}
          >
            {pickValue.evOfAtLeastStr}
          </WrapColorLabel>
        </>;
      }
      default:
        throw new Error("Unknown target type");
    }
  }
}

export type TargetType = "exactly" | "atLeast";

export interface PickValue {
  exactly: number | null;
  atLeast: number | null;
  evOfAtLeast: number | null;
  exactlyStr: string;
  atLeastStr: string;
  evOfAtLeastStr: string;
}

export type PickValues = Map<worms.RollResult, PickValue>;

export interface MinMaxPickValues {
  min: { exactly: number, atLeast: number, evOfAtLeast: number };
  max: { exactly: number, atLeast: number, evOfAtLeast: number };
}

interface MultipleEvaluationsTableProps {
  evaluation: worms.Evaluation,
  preRollEvaluation: worms.Evaluation,
  preRollTotal: number,
  evaluationsAndPickedRolls: EvaluationAndPickedRoll[] | null,
  exactRoundedPercentagesEntriesByPickedRolls: Map<worms.RollResult, [number, number][]>,
  atLeastRoundedPercentagesEntriesByPickedRolls: Map<worms.RollResult, [number, number][]>,
  expectedValueOfAtLeastRoundedEntriesByPickedRolls: Map<worms.RollResult, [number, number][]>,
  targetType: TargetType,
  targetValue: number,
  rolledState: RolledState,
  onSetUnrolledState?: (unrolledState: worms.UnrolledState) => void,
  visibleRollPicks: worms.RollResult[],
  visibleChartLines: ChartLineName[],
  showOnlyMaxValues: boolean,
  onVisibleRollPicksChange?: (visibleRollPicks: worms.RollResult[]) => void,
  onVisibleChartLinesChange?: (visibleChartLines: ChartLineName[]) => void,
  onShowOnlyMaxValuesChange?: (showOnlyMaxValues: boolean) => void,
}

export class MultipleEvaluationsTable extends Component<MultipleEvaluationsTableProps> {
  pickValuesSelector = createSelector(
    ({evaluationsAndPickedRolls}: MultipleEvaluationsTableProps) => evaluationsAndPickedRolls,
    ({exactRoundedPercentagesEntriesByPickedRolls}: MultipleEvaluationsTableProps) => exactRoundedPercentagesEntriesByPickedRolls,
    ({atLeastRoundedPercentagesEntriesByPickedRolls}: MultipleEvaluationsTableProps) => atLeastRoundedPercentagesEntriesByPickedRolls,
    ({expectedValueOfAtLeastRoundedEntriesByPickedRolls}: MultipleEvaluationsTableProps) => expectedValueOfAtLeastRoundedEntriesByPickedRolls,
    ({targetValue}: MultipleEvaluationsTableProps) => targetValue,
    (
      evaluationsAndPickedRolls,
      exactRoundedPercentagesEntriesByPickedRolls, atLeastRoundedPercentagesEntriesByPickedRolls,
      expectedValueOfAtLeastRoundedEntriesByPickedRolls, targetValue,
    ): PickValues => {
      if (!evaluationsAndPickedRolls) {
        return new Map();
      }
      const entries: [worms.RollResult, PickValue][] =
        evaluationsAndPickedRolls.map(({evaluation, pickedRoll}) => {
          const {exactly, atLeast, evOfAtLeast} = {
            exactly: (
              evaluation.exactResultOccurrences.has(targetValue)
                ? evaluation.exactResultOccurrences.get(targetValue)!
                : null
            ),
            atLeast: (
              evaluation.minimumResultOccurrences.has(targetValue)
                ? evaluation.minimumResultOccurrences.get(targetValue)!
                : null
            ),
            evOfAtLeast: (
              evaluation.expectedValueOfAtLeast.has(targetValue)
                ? evaluation.expectedValueOfAtLeast.get(targetValue)!
                : null
            ),
          };
          return [pickedRoll, {
            exactly, atLeast, evOfAtLeast,
            exactlyStr: exactly !== null ? `${Math.round(exactly * 100)}%` : "N/A",
            atLeastStr: atLeast !== null ? `${Math.round(atLeast * 100)}%` : "N/A",
            evOfAtLeastStr: evOfAtLeast !== null ? `${Math.round(evOfAtLeast * 10) / 10}` : "N/A",
          }];
        });
      return new Map(entries);
    },
  );

  get pickValues() {
    return this.pickValuesSelector(this.props);
  }

  minMaxPickValuesSelector = createSelector(
    this.pickValuesSelector,
    (pickValues): MinMaxPickValues => {
      const exactlyValues = Array.from(pickValues.values()).filter(({exactly}) => exactly !== null).map(({exactly}) => exactly!);
      const atLeastValues = Array.from(pickValues.values()).filter(({atLeast}) => atLeast !== null).map(({atLeast}) => atLeast!);
      const evOfAtLeastValues = Array.from(pickValues.values()).filter(({evOfAtLeast}) => evOfAtLeast !== null).map(({evOfAtLeast}) => evOfAtLeast!);
      return {
        min: {
          exactly: Math.min(...exactlyValues),
          atLeast: Math.min(...atLeastValues),
          evOfAtLeast: Math.min(...evOfAtLeastValues),
        },
        max: {
          exactly: Math.max(...exactlyValues),
          atLeast: Math.max(...atLeastValues),
          evOfAtLeast: Math.max(...evOfAtLeastValues),
        },
      };
    },
  );

  get minMaxPickValues() {
    return this.minMaxPickValuesSelector(this.props);
  }

  render() {
    const {pickValues, minMaxPickValues} = this;
    const {
      evaluation, preRollEvaluation, preRollTotal, evaluationsAndPickedRolls, targetType, targetValue,
      visibleRollPicks, visibleChartLines, showOnlyMaxValues,
    } = this.props;
    return (
      <Container textAlign={"center"}>
        <Table definition collapsing unstackable size={"small"} className={"centered-table"}>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell />
              <Table.HeaderCell>Pick</Table.HeaderCell>
              <Table.HeaderCell>Total</Table.HeaderCell>
              <Table.HeaderCell>{{exactly: "Exactly", atLeast: "At least"}[targetType]} {targetValue}</Table.HeaderCell>
              <Table.HeaderCell>Expected Value</Table.HeaderCell>
              <Table.HeaderCell>Visible</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>Pre-roll</Table.Cell>
              <Table.Cell />
              <Table.Cell>{preRollTotal}</Table.Cell>
              <Table.Cell>
                {targetType === "exactly" ? (
                  preRollEvaluation.exactResultOccurrences.has(targetValue)
                    ? `${Math.round(preRollEvaluation.exactResultOccurrences.get(targetValue)! * 100)}%`
                    : "N/A"
                ) : <>
                  {(
                    preRollEvaluation.minimumResultOccurrences.has(targetValue)
                      ? `${Math.round(preRollEvaluation.minimumResultOccurrences.get(targetValue)! * 100)}%`
                      : "N/A"
                  )}
                  {" / EV: "}
                  {(
                    preRollEvaluation.expectedValueOfAtLeast.has(targetValue)
                      ? `${Math.round(preRollEvaluation.expectedValueOfAtLeast.get(targetValue)! * 10) / 10}`
                      : "N/A"
                  )}
                </>}
              </Table.Cell>
              <Table.Cell>{preRollEvaluation.expectedValue.toFixed(1)}</Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            {evaluationsAndPickedRolls ? (
              <Table.Row>
                <Table.Cell>Post-roll</Table.Cell>
                <Table.Cell />
                <Table.Cell>{preRollTotal}</Table.Cell>
                <Table.Cell>
                  {targetType === "exactly" ? (
                    evaluation.exactResultOccurrences.has(targetValue)
                      ? (
                        <WrapColorLabel
                          good={evaluation.exactResultOccurrences.get(targetValue)! > (preRollEvaluation.exactResultOccurrences.get(targetValue) ?? 0)}
                          bad={evaluation.exactResultOccurrences.get(targetValue)! < (preRollEvaluation.exactResultOccurrences.get(targetValue) ?? 0)}
                        >
                          {Math.round(evaluation.exactResultOccurrences.get(targetValue)! * 100)}%
                        </WrapColorLabel>
                      )
                      : "N/A"
                  ) : <>
                    {(
                      evaluation.minimumResultOccurrences.has(targetValue)
                        ? (
                          <WrapColorLabel
                            good={evaluation.minimumResultOccurrences.get(targetValue)! > (preRollEvaluation.minimumResultOccurrences.get(targetValue) ?? 0)}
                            bad={evaluation.minimumResultOccurrences.get(targetValue)! < (preRollEvaluation.minimumResultOccurrences.get(targetValue) ?? 0)}
                          >
                            {Math.round(evaluation.minimumResultOccurrences.get(targetValue)! * 100)}%
                          </WrapColorLabel>
                        )
                        : "N/A"
                    )}
                    {" / EV: "}
                    {(
                      evaluation.expectedValueOfAtLeast.has(targetValue)
                        ? (
                          <WrapColorLabel
                            good={evaluation.minimumResultOccurrences.get(targetValue)! > (preRollEvaluation.minimumResultOccurrences.get(targetValue) ?? 0)}
                            bad={evaluation.minimumResultOccurrences.get(targetValue)! < (preRollEvaluation.minimumResultOccurrences.get(targetValue) ?? 0)}
                          >
                            {Math.round(evaluation.expectedValueOfAtLeast.get(targetValue)! * 10) / 10}
                          </WrapColorLabel>
                        )
                        : "N/A"
                    )}
                  </>}
                </Table.Cell>
                <Table.Cell>
                  <WrapColorLabel
                    good={evaluation.expectedValue > preRollEvaluation.expectedValue}
                    bad={evaluation.expectedValue < preRollEvaluation.expectedValue}
                  >
                    {evaluation.expectedValue.toFixed(1)}
                  </WrapColorLabel>
                </Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
            ) : null}
            {evaluationsAndPickedRolls?.map(({evaluation, pickedRoll, pickedCount, total}) => {
              const pickValue = pickValues.get(pickedRoll)!;
              const {isBest, isWorst} = MultipleEvaluationsTableTarget.getIsBestAndWorst(targetType, pickValue, minMaxPickValues);
              return (
                <Table.Row key={pickedRoll}>
                  <Table.Cell>Pick {pickedRoll}</Table.Cell>
                  <Table.Cell>
                    <WrapColorLabel good={isBest.overall} bad={isWorst.overall}>
                      <RChest
                        chest={worms.Chest.fromDiceRoll(new worms.DiceRoll([[pickedRoll, pickedCount]]))}
                        remainingDice={0}
                        size={"tiny"}
                      />
                    </WrapColorLabel>
                  </Table.Cell>
                  <Table.Cell>{total}</Table.Cell>
                  <Table.Cell>
                    <MultipleEvaluationsTableTarget
                      targetType={targetType}
                      pickValue={pickValue}
                      minMaxPickValues={minMaxPickValues}
                    />
                  </Table.Cell>
                  <Table.Cell>{evaluation.expectedValue.toFixed(1)}</Table.Cell>
                  <Table.Cell><Checkbox toggle checked={visibleRollPicks.includes(pickedRoll)} onChange={this.makeOnRollVisibleChange(pickedRoll)} /></Table.Cell>
                  <Table.Cell>
                    <Button onClick={this.makeOnContinueFromHere(pickedRoll)} color={isBest.overall ? "green" : isWorst.overall ? "red" : undefined}>
                      Continue from here
                    </Button>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
        {evaluationsAndPickedRolls ? (
          <Table collapsing unstackable size={"small"} className={"centered-table"}>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Show Exactly lines</Table.HeaderCell>
                <Table.HeaderCell>Show At Least lines</Table.HeaderCell>
                <Table.HeaderCell>Show EV of At Least Lines</Table.HeaderCell>
                <Table.HeaderCell>Show only max values</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell><Checkbox toggle checked={visibleChartLines.includes("exactly")} onChange={this.makeOnChartLineVisibleChange("exactly")}/></Table.Cell>
                <Table.Cell><Checkbox toggle checked={visibleChartLines.includes("at-least")} onChange={this.makeOnChartLineVisibleChange("at-least")}/></Table.Cell>
                <Table.Cell><Checkbox toggle checked={visibleChartLines.includes("expected-value-of-at-least")} onChange={this.makeOnChartLineVisibleChange("expected-value-of-at-least")}/></Table.Cell>
                <Table.Cell><Checkbox toggle checked={showOnlyMaxValues} onChange={this.onShowOnlyMaxValuesChange}/></Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        ) : null}
      </Container>
    );
  }

  makeOnRollVisibleChange(pickedRoll: worms.RollResult): (ev: FormEvent<HTMLInputElement>, data: CheckboxProps) => void {
    return (_ev: FormEvent<HTMLInputElement>, {checked}) => {
      const {visibleRollPicks} = this.props;
      if (checked && !visibleRollPicks.includes(pickedRoll)) {
        this.props.onVisibleRollPicksChange?.(([...visibleRollPicks, pickedRoll]));
      } else if (!checked && visibleRollPicks.includes) {
        this.props.onVisibleRollPicksChange?.((visibleRollPicks.filter(otherRoll => otherRoll !== pickedRoll)));
      }
    };
  }

  makeOnContinueFromHere(pickedRoll: worms.RollResult): () => void {
    return () => {
      this.props.onSetUnrolledState?.(this.props.rolledState.pick(pickedRoll));
    };
  }

  makeOnChartLineVisibleChange(chartLine: ChartLineName): (ev: FormEvent<HTMLInputElement>, data: CheckboxProps) => void {
    return (_ev: FormEvent<HTMLInputElement>, {checked}) => {
      const {visibleChartLines} = this.props;
      if (checked && !visibleChartLines.includes(chartLine)) {
        this.props.onVisibleChartLinesChange?.([...visibleChartLines, chartLine]);
      } else if (!checked && visibleChartLines.includes(chartLine)) {
        this.props.onVisibleChartLinesChange?.(visibleChartLines.filter(otherChartLine => otherChartLine !== chartLine));
      }
    };
  }

  onShowOnlyMaxValuesChange = (_ev: FormEvent<HTMLInputElement>, {checked}: CheckboxProps) => {
    this.props.onShowOnlyMaxValuesChange?.(checked!);
  };
}
