import React, {Component} from "react";
import {Button, Progress} from "semantic-ui-react";

interface SearchControlsProps {
  progress: number,
  searching: boolean,
  searchFinished: boolean,
  onSearchStep: () => void,
  onSearchToggle: () => void,
  onSearchRestart: () => void,
}

export class SearchControls extends Component<SearchControlsProps> {
  render() {
    const {progress, searching, searchFinished} = this.props;
    return <>
      <Progress percent={Math.floor(progress * 100)} progress={"percent"} indicating={searching && !searchFinished}
                autoSuccess/>
      <Button.Group>
        <Button content={"Step"} icon={"step forward"} labelPosition={"right"} onClick={this.props.onSearchStep}
                disabled={searching || searchFinished}/>
        <Button content={"Start"} icon={"play"} labelPosition={"right"} onClick={this.props.onSearchToggle}
                disabled={searching || searchFinished}/>
        <Button content={"Pause"} icon={"pause"} labelPosition={"right"} onClick={this.props.onSearchToggle}
                disabled={!searching || searchFinished}/>
        <Button content={"Restart"} icon={"undo"} labelPosition={"right"} onClick={this.props.onSearchRestart}
                disabled={!searchFinished}/>
      </Button.Group>
      <br/>
    </>;
  }
}
