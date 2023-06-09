import React, {Component} from "react";
import _ from "underscore";
import classnames from "classnames";

type PipColumnType = "start" | "middle" | "end" | null;

interface PipsConfiguration {
  dots: [number, number, number],
  columns?: [PipColumnType, PipColumnType, PipColumnType],
}

class DiePips extends Component<{ face: number }> {
  static pipsConfigurations: { [key: number]: PipsConfiguration } = {
    1: {dots: [0, 1, 0], columns: [null, "middle", null]},
    2: {dots: [1, 0, 1], columns: ["start", null, "end"]},
    3: {dots: [1, 1, 1], columns: ["start", "middle", "end"]},
    4: {dots: [2, 0, 2]},
    5: {dots: [2, 1, 2], columns: [null, "middle", null]},
    6: {dots: [3, 0, 3]},
  };

  render() {
    const {face} = this.props;
    const pipConfiguration = DiePips.pipsConfigurations[face];
    if (!pipConfiguration) {
      throw new Error(`Unable to get pip configuration for face '${face}'`);
    }
    return _.range(3).map(columnIndex => (
      <span key={columnIndex} className={classnames("column", pipConfiguration.columns?.[columnIndex])}>
        {_.range(pipConfiguration.dots[columnIndex]).map(dotIndex => <span key={dotIndex} className={"dot"}/>)}
      </span>
    ));
  }
}

export type DieSize = "normal" | "medium" | "small" | "tiny";

export interface DieProps {
  face?: number | string | null | undefined,
  size?: DieSize,
  special?: boolean,
  selected?: boolean,
  disabled?: boolean,
  onClick?: () => void,
}

export class Die extends Component<DieProps> {
  render() {
    const {face, size = "normal", special = false, selected = false, disabled = false} = this.props;
    return (
      <span className={classnames("die", {medium: size === "medium", small: size === "small", tiny: size === "tiny", selected, disabled})} onClick={this.props.onClick}>
        <span className={classnames("face", {"letter-face": typeof face !== "number", special})}>
          {typeof face === "number" ? <DiePips face={face}/> : <span className={"letter"}>{face}</span>}
        </span>
      </span>
    );
  }
}
