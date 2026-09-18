import fs from "node:fs/promises";
import path from "node:path";

interface Entry {
  path: string;
  type: "file" | "directory";
  size?: number;
  content?: string;
}

interface SnapshotData {
  rootPath: string;
  entries: Entry[];
}

const restore = async () => {
  // TODO
  const snapshotFile = path.resolve(process.cwd(), "snapshot.json");
  const targetDir = path.resolve(process.cwd(), "workspace_restored");

  try {
    await fs.access(snapshotFile);
  } catch {
    throw new Error("FS operation failed");
  }

  try {
    await fs.access(targetDir);
    throw new Error("FS operation failed");
  } catch (error: unknown) {
    if ((error as { message?: string }).message === "FS operation failed") {
      throw error;
    }
  }

  const rawData = await fs.readFile(snapshotFile, "utf-8");
  const data: SnapshotData = JSON.parse(rawData);

  await fs.mkdir(targetDir, { recursive: true });

  for (const entry of data.entries) {
    const destinationPath = path.join(targetDir, entry.path);

    if (entry.type === "directory") {
      await fs.mkdir(destinationPath, { recursive: true });
    } else if (entry.type === "file" && entry.content !== undefined) {
      await fs.mkdir(path.dirname(destinationPath), { recursive: true });

      const buffer = Buffer.from(entry.content, "base64");
      await fs.writeFile(destinationPath, buffer);
    }
  }
};

await restore();
