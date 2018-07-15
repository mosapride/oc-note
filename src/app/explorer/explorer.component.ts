import { Component, OnInit } from '@angular/core';
import { ElectronService } from '../providers/electron.service';
import { FileManager } from '../file-manager';
import { TreeExplorer, TreeFiles } from '../tree-explorer';
import { ShareDataService, SelectFileInfo } from '../share-data.service';
import { MessageBoxOptions } from 'electron';
import { sep } from 'path';

@Component({
  selector: 'app-explorer',
  templateUrl: './explorer.component.html',
  styleUrls: ['./explorer.component.scss']
})
export class ExplorerComponent implements OnInit {
  search = '';
  fileManager: FileManager;
  treeExplorer: TreeExplorer;
  selectFileInfo: SelectFileInfo;
  // activeFile: string;
  messageBoxOptions: MessageBoxOptions = {
    type: 'question',
    title: '保存されていません',
    message: '変更を破棄してよろしいですか？',
    buttons: ['OK', 'cancel']
  };

  constructor(public es: ElectronService, public shareDataService: ShareDataService) {
    this.fileManager = new FileManager(es);
    this.selectFileInfo = new SelectFileInfo();
  }

  ngOnInit() {
    this.shareDataService.selectFileInfo$.subscribe(
      selectFileInfo => {
        this.selectFileInfo = selectFileInfo;
        this.openFolder(this.selectFileInfo.path);
      }
    );
    this._monitoringExplorer();
  }

  private openFolder(path: string): void {
    if (this.treeExplorer.workDirectory === path) {
      return;
    }
    const paths = this._getPathPttern(path);
    this._openFolder(this.treeExplorer.childTree, paths);
  }

  private _getPathPttern(path: string): string[] {
    const pathPatern: string[] = [];
    path = path.replace(this.treeExplorer.workDirectory, '');
    const paths = path.split(/\\|\//);
    let wk = '';
    for (const p of paths) {
      wk += p;
      pathPatern.push(wk);
    }
    return pathPatern;
  }

  private _openFolder(treeFiles: TreeFiles[], paths: string[]) {
    for (const treeFile of treeFiles) {
      if (!treeFile.isDirectory) {
        continue;
      }
      let wk = treeFile.path.replace(this.treeExplorer.workDirectory, '');
      wk = wk.replace(/\\|\//g, '') + treeFile.name;
      for (const path of paths) {
        if (path === wk) {
          treeFile.opened = true;
        }
        this._openFolder(treeFile.childTree, paths);
      }
    }
  }


  /**
   * ワークスペースを開く.
   */
  openWorkSpace() {
    const dir = this.fileManager.selectFolder();
    if (dir === '') {
      return;
    }
    this.treeExplorer = this.fileManager.find(dir);
    if (this.fileManager.isStatFile(this.treeExplorer.workDirectory + sep + 'style.css')) {
      document.getElementById('cs_viewer')['href'] = `${this.treeExplorer.workDirectory}${sep}style.css`;
    }
  }

  /**
   * フォルダのopen/closeの切り替え.
   *
   * 一つ前の要素であるチェックボックスを切り替える
   */
  changeCheckBox(event) {
    event.previousSibling.checked = !event.previousSibling.checked;
  }

  folerOnOff(tree: TreeFiles) {
    tree.opened = !tree.opened;
  }

  onRightClick(tree: TreeFiles): void {
    // https://electronjs.org/docs/api/menu
    console.log(`tree view folder right click`);
    if (tree.isDirectory) {
      this.rightClickOnDirectory(tree);
    } else {
      this.rightClickOnFile(tree);
    }
  }

  private rightClickOnDirectory(file: TreeFiles): void {
    const menu = new this.es.remote.Menu();
    const menuItem = this.es.remote.MenuItem;
    menu.append(new menuItem({ label: 'MenuItem1', click() { console.log('item 1 clicked'); } }));
    menu.append(new menuItem({ type: 'separator' }));
    menu.append(new menuItem({ label: 'MenuItem2', type: 'checkbox', checked: true }));
    menu.popup({ window: this.es.remote.getCurrentWindow() });
  }

  private rightClickOnFile(file: TreeFiles): void {

  }
  getFileIcon(tree: TreeFiles): string {
    const rtnSrc = 'assets/tree-icon/';
    if (tree.name.match(/\.md$/)) {
      return rtnSrc + 'baseline-code-24px.svg';
    }
    return rtnSrc + 'baseline-info-24px.svg';
  }

  openFile(tree: TreeFiles): void {
    if (!tree.name.match(/\.md$/)) {
      this.es.shell.openItem(tree.path + sep + tree.name);
      return;
    }

    if (this.selectFileInfo.isChange()) {
      this.es.remote.dialog.showMessageBox(
        this.messageBoxOptions
        , (response) => {
          if (response !== 0) {
            this._openFile(tree);
          }
        });
    } else {
      this._openFile(tree);
    }
  }

  isActive(tree: TreeFiles): boolean {
    if (this.selectFileInfo.path === tree.path && this.selectFileInfo.name === tree.name) {
      return true;
    }
    return false;
  }

  private _openFile(tree: TreeFiles) {
    // this.activeFile = tree.path + tree.name;
    const selectFileInfo = new SelectFileInfo(tree.path, tree.name);
    this.shareDataService.onNotifySelectFileInfoChanged(selectFileInfo);
  }


  doSearch() {
    if (!this.treeExplorer) {
      return;
    }
    if (this.search.length !== 0) {
      const markdown = this.fileManager.grep(this.search, this.treeExplorer);
      const selectFileInfo = new SelectFileInfo(this.treeExplorer.workDirectory, 'grep');
      console.log(this.treeExplorer.workDirectory);
      selectFileInfo.setGrepFlg();
      this.shareDataService.onNotifySelectFileInfoChanged(selectFileInfo);
      this.shareDataService.onNotifyMarkdownDataChanged(markdown);
    }
  }


  private _monitoringExplorer() {
    setInterval(() => {
      if (!this.treeExplorer) {
        return;
      }
      this.fileManager.reloadWorkDirectory(this.treeExplorer.workDirectory, this.treeExplorer, tree => { this.treeExplorer = tree; });
    }, 1000);
  }

  test(): void {
    this.fileManager.reloadWorkDirectory(this.treeExplorer.workDirectory, this.treeExplorer, tree => { this.treeExplorer = tree; });
  }
}
