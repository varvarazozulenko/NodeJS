import fs from "node:fs/promises";
import path from "node:path";

interface FileEntry {
  path: string;
  type: "file";
  size: number;
  content: string;
}

interface DirectoryEntry {
  path: string;
  type: "directory";
}

type Entry = FileEntry | DirectoryEntry;

const snapshot = async () => {
  // TODO
  const workspaceDir = path.resolve(process.cwd(), "workspace");
  const snapshotFile = path.resolve(process.cwd(), "snapshot.json");

  try {
    await fs.stat(workspaceDir);
  } catch {
    await fs.mkdir(workspaceDir, { recursive: true });
    await fs.writeFile(path.join(workspaceDir, "file1.txt"), "Hello world");
  }

  const dirEntries = await fs.readdir(workspaceDir, {
    withFileTypes: true,
    recursive: true,
  });

  const entries: Entry[] = [];

  for (const item of dirEntries) {
    const itemParent =
      item.parentPath ?? (item as unknown as { path: string }).path;
    const fullPath = path.join(itemParent, item.name);
    const relativePath = path
      .relative(workspaceDir, fullPath)
      .replace(/\\/g, "/");

    if (item.isDirectory()) {
      entries.push({
        path: relativePath,
        type: "directory",
      });
    } else if (item.isFile()) {
      const fileBuffer = await fs.readFile(fullPath);
      const fileStat = await fs.stat(fullPath);

      entries.push({
        path: relativePath,
        type: "file",
        size: fileStat.size,
        content: fileBuffer.toString("base64"),
      });
    }
  }

  const result = {
    rootPath: workspaceDir.replace(/\\/g, "/"),
    entries,
  };

  await fs.writeFile(snapshotFile, JSON.stringify(result, null, 2), "utf-8");
};

await snapshot();
