const consoleError = console.error.bind(console);

console.error = function filterWarnings(...args: string[]) {
  if (args[0]?.includes("Warning: %s is deprecated in StrictMode") && args[1] === "findDOMNode" && args[4]?.includes("at button") && args[4]?.includes("at Button")) {
    return;
  }
  consoleError(...args);
};
