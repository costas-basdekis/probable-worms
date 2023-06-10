import {Command, InvalidArgumentError, program} from "commander";
import {run} from "./runner";

const parseIntOption = (value: string): number => {
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new InvalidArgumentError(`'${value}' is not a number`);
  }
  if (parseFloat(value) !== parsedValue) {
    throw new InvalidArgumentError(`'${value}' is not an integer`);
  }
  return parsedValue;
};

const makeProgram = (): Command => {
  return program
    .requiredOption("--dice <count>", "Dice count", parseIntOption);
}

const runCli = () => {
  const program = makeProgram();
  program.parse();
  const {dice} = program.opts();
  run(dice);
};

runCli();
