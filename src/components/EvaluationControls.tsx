import * as worms from "../worms";
import {SearchInstance} from "../RemoteSearch";
import React, {Component} from "react";
import {Accordion, Icon, Label} from "semantic-ui-react";
import {SearchControls} from "./SearchControls";
import {CacheControls} from "./CacheControls";

interface EvaluationControlState {
  showEvaluation: boolean,
}

interface EvaluationControlsProps {
  progress: number,
  searching: boolean,
  searchFinished: boolean,
  onSearchStep: () => void,
  onSearchToggle: () => void,
  onSearchRestart: () => void,
  cacheStatusMessage: string | null,
  cacheStats: worms.EvaluationCacheStats,
  searchInstance: SearchInstance,
}

export class EvaluationControls extends Component<EvaluationControlsProps, EvaluationControlState> {
  state = {
    showEvaluation: false,
  };

  render() {
    const {showEvaluation} = this.state;
    const {
      progress,
      searching,
      searchFinished,
      onSearchStep,
      onSearchToggle,
      onSearchRestart,
      cacheStatusMessage,
      cacheStats,
      searchInstance
    } = this.props;
    return (
      <Accordion>
        <Accordion.Title index={0} active={showEvaluation} onClick={this.toggleShowEvaluation}>
          <Icon name='dropdown'/>
          <Label color={progress === 1 ? "olive" : searching ? "yellow" : "orange"}>
            {progress === 1 ? "Evaluation complete" : searching ? "Evaluating..." : (cacheStatusMessage ?? "Evaluation paused")}
          </Label>
        </Accordion.Title>
        <Accordion.Content active={showEvaluation}>
          <SearchControls
            progress={progress}
            searching={searching}
            searchFinished={searchFinished}
            onSearchStep={onSearchStep}
            onSearchToggle={onSearchToggle}
            onSearchRestart={onSearchRestart}
          />
          <CacheControls cacheStats={cacheStats} searchInstance={searchInstance}/>
        </Accordion.Content>
      </Accordion>
    );
  }

  toggleShowEvaluation = () => {
    this.setState(({showEvaluation}) => ({showEvaluation: !showEvaluation}));
  };
}