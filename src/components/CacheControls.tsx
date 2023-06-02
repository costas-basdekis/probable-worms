import * as worms from "../worms";
import {SearchInstance} from "../RemoteSearch";
import React, {Component, createRef, RefObject} from "react";
import classNames from "classnames";
import {Button, Card, Popup} from "semantic-ui-react";

interface CacheControlsProps {
  cacheStats: worms.EvaluationCacheStats,
  searchInstance: SearchInstance,
}

interface CacheControlsState {
  cacheFileDragging: boolean,
}

export class CacheControls extends Component<CacheControlsProps, CacheControlsState> {
  loadCacheFileRef: RefObject<HTMLInputElement> = createRef();

  state = {
    cacheFileDragging: false,
  };

  render() {
    const {cacheFileDragging} = this.state;
    const {cacheStats} = this.props;
    return (
      <div
        className={classNames("cache-drop-target", {"drag-over": cacheFileDragging})}
        onDrop={this.onCacheDrop}
        onDragOver={this.onDragOver}
        onDragEnter={this.onCacheDragEnter}
        onDragLeave={this.onCacheDragLeave}
      >
        <input ref={this.loadCacheFileRef} type={"file"} style={{display: "none"}} onChange={this.onLoadCache}/>
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
    )
  }

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
    this.props.searchInstance.loadEvaluationCache(content);
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

  onDownloadCache = () => {
    this.props.searchInstance.downloadEvaluationCache();
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
    this.props.searchInstance.loadEvaluationCache(content);
  };

  onClearCache = () => {
    this.props.searchInstance.clearEvaluationCache();
  };
}
