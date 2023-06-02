// noinspection JSUnusedGlobalSymbols

import React, {useEffect, useRef, useState} from "react";
import type {Meta, StoryObj} from '@storybook/react';

import {SearchControls} from "../components";

export default {
  title: 'Components/SearchControls',
  component: SearchControls,
} as Meta<typeof SearchControls>;

interface StoryProps {
  progress: number;
  interactive: boolean;
}
type Story = StoryObj<StoryProps>;

const render = ({progress: initialProgress = 0, interactive = false}: Partial<StoryProps>) => {
  const [progress, setProgress] = useState(initialProgress);
  const [searching, setSearching] = useState(!interactive);
  const [searchFinished, setSearchFinished] = useState(false);
  const onSearchStep = () => {
    setProgress(progress => {
      if (progress >= 1) {
        return progress
      }
      const newProgress = Math.min(1, progress + 0.1);
      setSearchFinished(newProgress === 1);
      setSearching(searching => searching && newProgress !== 1);
      return newProgress;
    });
  };
  const timerInterval = useRef<number | null>(null);
  const stopTimer = () => {
    if (!timerInterval.current) {
      return;
    }
    window.clearInterval(timerInterval.current);
    timerInterval.current = null;
  };
  const tickTimer = () => {
    onSearchStep();
    setProgress(progress => {
      if (progress >= 1) {
        stopTimer();
      }
      return progress;
    });
  };
  const startTimer = () => {
    stopTimer();
    timerInterval.current = window.setInterval(tickTimer, 500);
  }
  useEffect(() => {
    return stopTimer;
  }, []);
  const onSearchToggle = () => {
    if (searching) {
      stopTimer();
      setSearching(false);
    } else {
      startTimer();
      setSearching(true);
    }
  };
  const onSearchRestart = () => {
    setProgress(0);
    setSearchFinished(false);
  };
  return (
    <SearchControls
      progress={progress}
      searching={searching}
      searchFinished={searchFinished}
      onSearchStep={interactive ? onSearchStep : () => null}
      onSearchToggle={interactive ? onSearchToggle : () => null}
      onSearchRestart={interactive ? onSearchRestart : () => null}
    />
  );
};

export const Interactive: Story = {
  render,
  args: {
    interactive: true,
  },
};

export const Start: Story = {
  render,
  args: {
    progress: 0,
  },
};

export const Middle: Story = {
  render,
  args: {
    progress: 0.5,
  },
};

export const Finished: Story = {
  render,
  args: {
    progress: 1,
  },
};
