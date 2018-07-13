import { sep } from 'path';
import { FileManager } from './file-manager';
import { Constant } from './constant';

export class ChangeStyle {
  constructor() { }
  changeViewer(fileManager: FileManager, workDirectory: string) {
    const viewerCss = workDirectory + sep + 'style.css';
    if (fileManager.isStatFile(viewerCss)) {
      document.getElementById('cs_viewer')['href'] = viewerCss;
    }
  }


  getHighlightThemeList(): string[] {
    return new Constant().highlightTheme;
  }

  changeHighlightjs(cssName: string) {
    document.getElementById('cs_highlight')['href'] = `assets/highlight.js/styles/${cssName}`;
  }
}
