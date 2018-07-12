import { sep } from 'path';
import { FileManager } from './file-manager';
import { TreeExplorer } from './tree-explorer';
import { Constant } from './constant';

export class ChangeStyle {
  constructor() { }

  changeViewer(fileManager: FileManager, treeExplorer: TreeExplorer) {
    if (fileManager.isStatFile(treeExplorer.workDirectory + sep + 'style.css')) {
      document.getElementById('cs_viewer')['href'] = `${treeExplorer.workDirectory}${sep}style.css`;
    }
  }

  getHighlightThemeList(): string[] {
    return new Constant().highlightTheme;
  }

  changeHighlightjs(cssName: string) {
    document.getElementById('cs_highlight')['href'] = `assets/highlight.js/styles/${cssName}`;
  }
}
