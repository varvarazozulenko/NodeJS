import { Transform, pipeline } from "node:stream";

function getCliArg(argName: string): string | null {
  const index = process.argv.indexOf(argName);
  if (index !== -1 && index + 1 < process.argv.length) {
    const value = process.argv[index + 1];
    return value !== undefined ? value : null;
  }
  return null;
}

const filter = () => {
  // TODO
  const pattern = getCliArg("--pattern") ?? "";

  let buffer = "";

  const filterStream = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.includes(pattern)) {
          this.push(line + "\n");
        }
      }
      callback();
    },
    flush(callback) {
      if (buffer.length > 0 && buffer.includes(pattern)) {
        this.push(buffer + "\n");
      }
      callback();
    },
  });

  pipeline(process.stdin, filterStream, process.stdout, () => {});
};

filter();
