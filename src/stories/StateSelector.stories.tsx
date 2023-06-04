// noinspection JSUnusedGlobalSymbols

import type {Meta, StoryObj} from '@storybook/react';

import {DieSize, StateSelector} from "../components";
import React from "react";
import {UnrolledState} from "../worms";

export default {
  title: 'Components/StateSelector',
  component: StateSelector,
} as Meta<typeof StateSelector>;

type Story = StoryObj<{size: DieSize}>;

const render = ({size}: {size: DieSize}) => {
  return (
    <StateSelector
      initialState={UnrolledState.initial()}
      size={size}
    />
  );
};

export const Tiny: Story = {
  render,
  args: {
    size: "tiny",
  },
};

export const Small: Story = {
  render,
  args: {
    size: "small",
  },
};

export const Medium: Story = {
  render,
  args: {
    size: "medium",
  },
};
