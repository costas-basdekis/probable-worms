// noinspection JSUnusedGlobalSymbols

import type {Meta, StoryObj} from '@storybook/react';

import {DiceSelector} from "../components";

export default {
  title: 'Components/DiceSelector',
  component: DiceSelector,
} as Meta<typeof DiceSelector>;

type Story = StoryObj<typeof DiceSelector>;

export const Tiny: Story = {
  args: {
    count: 8,
    tiny: true,
  },
};

export const Small: Story = {
  args: {
    count: 8,
    small: true,
  },
};

export const Medium: Story = {
  args: {
    count: 8,
    medium: true,
  },
};
