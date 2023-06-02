import React, {Component, createRef, RefObject} from "react";
import "./styles.scss";
import * as worms from "./worms";
import {RemoteSearch, SearchInstance} from "./RemoteSearch";
import {Button, Card, Popup} from "semantic-ui-react";
import {InitialStateModal, RChest, REvaluation, SearchControls} from "./components";
import classNames from "classnames";

const remoteSearch = RemoteSearch.default();

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface AppProps {
}
interface AppState {
  initialUnrolledState: worms.UnrolledState,
  progress: number,
  evaluation: worms.Evaluation,
  searching: boolean,
  searchFinished: boolean,
  cacheStats: worms.EvaluationCacheStats,
  cacheFileDragging: boolean,
}

export default class App extends Component<AppProps, AppState> {
  loadCacheFileRef: RefObject<HTMLInputElement> = createRef();

  state = {
    initialUnrolledState: worms.UnrolledState.initial(),
    progress: 1,
    evaluation: worms.Evaluation.empty(),
    searching: false,
    searchFinished: true,
    cacheStats: {hitCount: 0, missCount: 0, entryCount: 0},
    cacheFileDragging: false,
  };

  onSearchResult = (
    searching: boolean, searchFinished: boolean, progress: number, evaluation: worms.Evaluation,
    cacheStats: worms.EvaluationCacheStats,
  ) => {
    this.setState({
      progress,
      evaluation: evaluation.toFixed(),
      searchFinished,
      searching,
      cacheStats,
    });
  };

  searchInstance: SearchInstance = remoteSearch.newInstance(this.onSearchResult);

  componentDidMount() {
    this.onReset();
  }

  componentWillUnmount() {
    this.searchInstance.removeSearch();
  }

  render() {
    const {
      initialUnrolledState, progress, evaluation, searching, searchFinished, cacheStats, cacheFileDragging,
    } = this.state;
    return (
      <div className="App">
        <h2>Search</h2>
        <label>
          Initial state:
          <RChest chest={initialUnrolledState.chest} remainingDice={initialUnrolledState.remainingDiceCount} />
        </label>
        <InitialStateModal trigger={<Button>Change</Button>} onChangeInitialState={this.onChangeInitialState} />
        <SearchControls
          progress={progress}
          searching={searching}
          searchFinished={searchFinished}
          onSearchStep={this.onSearchStep}
          onSearchToggle={this.onSearchToggle}
          onSearchRestart={this.onSearchRestart}
        />
        <div className={classNames("cache-drop-target", {"drag-over": cacheFileDragging})} onDrop={this.onCacheDrop} onDragOver={this.onDragOver} onDragEnter={this.onCacheDragEnter} onDragLeave={this.onCacheDragLeave}>
          <input ref={this.loadCacheFileRef} type={"file"} style={{display: "none"}} onChange={this.onLoadCache} />
          <Popup trigger={<Button>Cache{cacheStats.entryCount ? "" : " is Empty"} </Button>} flowing hoverable>
            <Card>
              <Card.Content>
                <Card.Header>
                  {Math.floor(cacheStats.hitCount / ((cacheStats.hitCount + cacheStats.missCount) || 1) * 100)}%
                  cache hit rate
                </Card.Header>
                <Card.Meta>{cacheStats.entryCount} entries</Card.Meta>
                <Card.Description>
                  {cacheStats.hitCount}/{(cacheStats.hitCount + cacheStats.missCount)} hits/total
                </Card.Description>
              </Card.Content>
              <Card.Content extra>
                <Button.Group>
                  <Button basic color={"green"} onClick={this.onDownloadCache}>Download</Button>
                  <Button basic color={"green"} onClick={this.onLoadCacheClick}>Upload</Button>
                  <Button basic color={"red"} onClick={this.onClearCache}>Clear</Button>
                </Button.Group>
              </Card.Content>
            </Card>
          </Popup>
        </div>
        <br/>
        <label>Evaluation:</label>
        <br/>
        <REvaluation evaluation={evaluation} />
      </div>
    );
  }

  onChangeInitialState = (initialUnrolledState: worms.UnrolledState) => {
    this.setState({initialUnrolledState});
    this.searchInstance.setSearchUnrolledState(initialUnrolledState);
  };

  onReset = () => {
    const {initialUnrolledState} = this.state;
    this.searchInstance.setSearchUnrolledState(initialUnrolledState);
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
    this.searchInstance.setSearchUnrolledState(this.state.initialUnrolledState);
  };

  onDownloadCache = () => {
    this.searchInstance.downloadEvaluationCache();
  };

  onCacheDrop = async (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();

    let file: File | null = null;
    // noinspection PointlessBooleanExpressionJS
    if (!file) {
      const fileItem = Array.from(ev.dataTransfer.items).find(item => item.kind === "file");
      if (fileItem) {
        file = fileItem.getAsFile();
      }
    }
    if (!file) {
      file = Array.from(ev.dataTransfer.files)[0] ?? null;
    }
    if (!file) {
      return;
    }
    const content = await file.text();
    this.searchInstance.loadEvaluationCache(content);
  };

  onDragOver = (ev: React.DragEvent<HTMLDivElement>) => {
    ev.stopPropagation();
    ev.preventDefault();
  };

  onCacheDragEnter = (ev: React.DragEvent<HTMLDivElement>) => {
    this.setState({
      cacheFileDragging: ev.dataTransfer.files.length > 0 || Array.from(ev.dataTransfer.items).some(item => item.kind === "file"),
    });
  };

  onCacheDragLeave = () => {
    this.setState({cacheFileDragging: false});
  };

  onLoadCacheClick = () => {
    this.loadCacheFileRef.current?.click();
  };

  onLoadCache = async () => {
    if (!this.loadCacheFileRef?.current?.files?.length) {
      alert("No file selected");
      return;
    }
    const file = this.loadCacheFileRef.current.files[0];
    const content = await file.text();
    this.searchInstance.loadEvaluationCache(content);
  };

  onClearCache = () => {
    this.searchInstance.clearEvaluationCache();
  };

  startSearch() {
    this.searchInstance.startSearch();
  }

  stopSearch() {
    this.searchInstance.stopSearch();
  }
}
