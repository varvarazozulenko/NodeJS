import readline from "node:readline";

const lineNumberer = () => {
  // TODO
  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false,
  });

  let lineNumber = 1;

  rl.on("line", (line) => {
    process.stdout.write(`${lineNumber} | ${line}\n`);
    lineNumber++;
  });
};

lineNumberer();
