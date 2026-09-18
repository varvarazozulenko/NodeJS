import fs from "node:fs";
import readline from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getCliArg(argName: string): string | null {
  const index = process.argv.indexOf(argName);
  if (index !== -1 && index + 1 < process.argv.length) {
    const value = process.argv[index + 1];
    return value !== undefined ? value : null;
  }
  return null;
}

const split = async () => {
  // TODO
  const linesArg = getCliArg("--lines");
  const maxLines = linesArg ? parseInt(linesArg, 10) : 10;

  const sourceFile = path.resolve(__dirname, "source.txt");

  if (!fs.existsSync(sourceFile)) {
    return;
  }

  const fileStream = fs.createReadStream(sourceFile, { encoding: "utf-8" });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let currentChunkIndex = 1;
  let linesInCurrentChunk = 0;
  let currentWriteStream: fs.WriteStream | null = null;

  for await (const line of rl) {
    if (!currentWriteStream || linesInCurrentChunk >= maxLines) {
      if (currentWriteStream) {
        currentWriteStream.end();
      }
      const chunkPath = path.resolve(
        __dirname,
        `chunk_${currentChunkIndex}.txt`,
      );
      currentWriteStream = fs.createWriteStream(chunkPath, {
        encoding: "utf-8",
      });
      currentChunkIndex++;
      linesInCurrentChunk = 0;
    }

    currentWriteStream.write(line + "\n");
    linesInCurrentChunk++;
  }

  if (currentWriteStream) {
    currentWriteStream.end();
  }
};

await split();
