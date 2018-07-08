export class TreeExplorer {
  workDirectory: string;
  public childTree: TreeFiles[] = [];
  constructor(workDirectory: string, childTree?: TreeFiles[]) {
    this.workDirectory = workDirectory;
    if (childTree) {
      this.childTree = childTree;
    }
  }
}

export class TreeFiles {
  path: string;
  name: string;
  depth: number;
  isDirectory = false;
  opened = false;
  public childTree: TreeFiles[] = [];
  constructor(path?: string, name?: string, depth?: number, isDirectory?: boolean) {
    this.name = name;
    this.path = path;
    this.depth = depth;
    this.isDirectory = isDirectory;
  }
  setInfo(path: string, name: string) {
    this.name = name;
    this.path = path;
  }
}
