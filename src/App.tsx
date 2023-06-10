import React, {Component, createRef, RefObject} from "react";
import "./styles.scss";
import * as worms from "./worms";
import {CacheFetchingStatus, DiceComparisonEvaluationsInfo, RemoteSearch, SearchInstance} from "./RemoteSearch";
import {Button, Card, Container, Header, Image, Tab} from "semantic-ui-react";
import {
  About,
  DiceComparison,
  EvaluationControls,
  Help,
  InitialStateModal,
  MultipleEvaluations,
  REvaluation,
  RState,
  TargetSelector,
  TargetType
} from "./components";

const remoteSearch = RemoteSearch.default();

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface AppProps {
}

export interface EvaluationAndPickedRoll {
  pickedRoll: worms.RollResult;
  pickedCount: number;
  evaluation: worms.Evaluation;
  total: number;
}

interface AppState {
  state: worms.State,
  progress: number,
  evaluation: worms.Evaluation,
  preRollEvaluation: worms.Evaluation,
  searching: boolean,
  searchFinished: boolean,
  dicePickEvaluations: EvaluationAndPickedRoll[] | null,
  cacheStatusMessages: {message: string, id: number}[],
  cacheStats: worms.EvaluationCacheStats,
  targetType: TargetType,
  targetValue: number,
}

export default class App extends Component<AppProps, AppState> {
  state: AppState = {
    state: worms.UnrolledState.initial(),
    progress: 1,
    evaluation: worms.Evaluation.empty(),
    preRollEvaluation: worms.Evaluation.empty(),
    searching: false,
    searchFinished: true,
    dicePickEvaluations: null,
    cacheStatusMessages: [],
    cacheStats: {hitCount: 0, missCount: 0, entryCount: 0},
    targetType: "atLeast",
    targetValue: 21,
  };

  initialStateModalRef: RefObject<InitialStateModal> = createRef();
  diceComparisonRef: RefObject<DiceComparison> = createRef();

  onSearchResult = (
    searching: boolean, searchFinished: boolean, progress: number, evaluation: worms.Evaluation,
    preRollEvaluation: worms.Evaluation,
    dicePickEvaluations: EvaluationAndPickedRoll[] | null,
    cacheStats: worms.EvaluationCacheStats,
  ) => {
    this.setState({
      progress,
      evaluation: evaluation.toFixed(),
      preRollEvaluation: preRollEvaluation.toFixed(),
      searchFinished,
      searching,
      dicePickEvaluations,
      cacheStats,
    });
  };

  onCacheFetchingProgress = (diceCount: number, status: CacheFetchingStatus) => {
    let message: string;
    switch (status) {
      case "fetching":
        message = "Fetching cache...";
        break;
      case "success":
        message = "Cache is ready!";
        break;
      case "failure":
        message = "Cache failed to load";
        break;
      default:
        return;
    }
    this.setState(({cacheStatusMessages}) => {
      const id = (cacheStatusMessages[cacheStatusMessages.length - 1]?.id ?? 0) + 1;
      window.setTimeout(() => {
        this.setState(({cacheStatusMessages}) => ({
          cacheStatusMessages: cacheStatusMessages.filter(message => message.id !== id),
        }));
      }, 10000);
      return {
        cacheStatusMessages: [...cacheStatusMessages, {message, id}],
      };
    });
  };

  onDiceComparisonResponse = (diceComparisonEvaluationsInfo: DiceComparisonEvaluationsInfo) => {
    this.diceComparisonRef.current?.setDiceComparisonEvaluationsInfo(diceComparisonEvaluationsInfo);
  };

  searchInstance: SearchInstance = remoteSearch.newInstance(this.onSearchResult, this.onCacheFetchingProgress, this.onDiceComparisonResponse);

  componentDidMount() {
    this.onReset();
  }

  componentWillUnmount() {
    this.searchInstance.removeSearch();
  }

  tabPanes = [
    {menuItem: "Post-roll evaluation", render: () => {
      const {state, evaluation, preRollEvaluation, dicePickEvaluations, targetType, targetValue} = this.state;
      return (
        <Tab.Pane attached={false}>
          <TargetSelector
            state={state}
            targetType={targetType}
            targetValue={targetValue}
            onTargetTypeChange={this.onTargetTypeChange}
            onTargetValueChange={this.onTargetValueChange}
          />
          <MultipleEvaluations
            evaluation={evaluation}
            preRollEvaluation={preRollEvaluation}
            preRollTotal={state.runningTotal}
            rolledState={state as worms.RolledState}
            evaluationsAndPickedRolls={dicePickEvaluations}
            onSetUnrolledState={this.onStateChange}
            targetType={targetType}
            targetValue={targetValue}
          />
        </Tab.Pane>
      );
    }},
    {menuItem: "Pre-roll evaluation", render: () => {
      const {state, evaluation} = this.state;
      return (
        <Tab.Pane attached={false}>
          <REvaluation evaluation={evaluation} total={state.runningTotal} diceCount={state.totalDiceCount} />
        </Tab.Pane>
      );
    }},
    {menuItem: "Dice comparison", render: () => {
        const {state} = this.state;
        return (
        <Tab.Pane attached={false}>
          <DiceComparison
            ref={this.diceComparisonRef}
            unrolledState={state.unrolledState}
            requestDiceComparison={this.requestDiceComparison}
          />
        </Tab.Pane>
      );
    }},
  ];

  render() {
    const {state, progress, searching, searchFinished, cacheStatusMessages, cacheStats} = this.state;
    const cacheStatusMessage = cacheStatusMessages[cacheStatusMessages.length - 1]?.message ?? null;
    return (
      <div className="App">
        <Header as={"h1"} textAlign={"center"}>
          <Image src={`${process.env.PUBLIC_URL}/worm512.png`} />
          Probable worms
          <Image src={`${process.env.PUBLIC_URL}/worm512.png`} />
        </Header>
        <Container textAlign={"center"}>
          <Card centered>
            <Card.Content>
              <Card.Header>
                Initial State
              </Card.Header>
              <Card.Description>
                <RState size={"tiny"} state={state} center />
              </Card.Description>
            </Card.Content>
            <Card.Content extra>
              <div>
                <InitialStateModal
                  ref={this.initialStateModalRef}
                  size={"tiny"}
                  trigger={<Button>Change</Button>}
                  onStateChange={this.onStateChange}
                />
                <Button
                  onClick={this.onRandomRollClick}
                  disabled={!state.unrolledState.remainingDiceCount}
                >
                  {state.type === "unrolled" ? "Random Roll" : "Reroll"}
                </Button>
              </div>
            </Card.Content>
            <Card.Content extra>
              <EvaluationControls
                progress={progress}
                searching={searching}
                searchFinished={searchFinished}
                onSearchStep={this.onSearchStep}
                onSearchToggle={this.onSearchToggle}
                onSearchRestart={this.onSearchRestart}
                cacheStatusMessage={cacheStatusMessage}
                cacheStats={cacheStats}
                searchInstance={this.searchInstance}
              />
            </Card.Content>
          </Card>
          <Help />
          <br/>
          <br/>
          <Container textAlign={"center"}>
            <Tab menu={{pointing: true}} panes={this.tabPanes} />
          </Container>
          <About/>
        </Container>
      </div>
    );
  }

  onStateChange = (state: worms.State) => {
    this.setState({state});
    this.searchInstance.setSearchState(state);
    this.initialStateModalRef.current?.updateState(state);
  };

  onRandomRollClick = () => {
    this.setState(({state}) => {
      const unrolledState = state.unrolledState;
      if (!unrolledState.remainingDiceCount) {
        return null;
      }
      return {state: unrolledState.withRandomRoll()};
    }, () => {
      const {state} = this.state;
      this.searchInstance.setSearchState(state);
      this.initialStateModalRef.current?.updateState(state);
    });
  };

  onReset = () => {
    const {state} = this.state;
    this.searchInstance.setSearchState(state);
  };

  onSearchStep = () => {
    this.searchInstance.stepSearch();
  };

  onSearchToggle = () => {
    if (this.state.searching) {
      this.stopSearch();
    } else if (!this.state.searchFinished) {
      this.startSearch();
    }
  };

  onSearchRestart = () => {
    this.setState({searching: false, searchFinished: false});
    this.searchInstance.setSearchState(this.state.state);
  };

  startSearch() {
    this.searchInstance.startSearch();
  }

  stopSearch() {
    this.searchInstance.stopSearch();
  }

  onTargetTypeChange = (targetType: TargetType) => {
    this.setState({targetType});
  };

  onTargetValueChange = (targetValue: number) => {
    this.setState({targetValue});
  };

  requestDiceComparison = (unrolledState: worms.UnrolledState, firstDie: worms.RollResult, secondDie: worms.RollResult) => {
    this.searchInstance.requestDiceComparison(unrolledState, firstDie, secondDie);
  };
}
