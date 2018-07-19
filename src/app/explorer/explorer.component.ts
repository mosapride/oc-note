import { Component, OnInit, NgZone } from '@angular/core';
import { ElectronService } from '../providers/electron.service';
import { FileManager } from '../file-manager';
import { TreeExplorer, TreeFiles } from '../tree-explorer';
import { ShareDataService, SelectFileInfo } from '../share-data.service';
import { sep } from 'path';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Dialog } from '../dialog/dialog.component';
import { MatDialog } from '../../../node_modules/@angular/material';
import { AppConfig } from '../app-config';

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
  selectRightInfo: TreeFiles;
  dialog: Dialog;

  constructor(
    public es: ElectronService,
    public shareDataService: ShareDataService,
    private sanitizer: DomSanitizer,
    private matDialog: MatDialog,
    private ngZone: NgZone
  ) {
    this.fileManager = new FileManager(es);
    this.selectFileInfo = new SelectFileInfo();
    this.dialog = new Dialog(matDialog);
  }

  ngOnInit() {
    this.shareDataService.selectFileInfo$.subscribe(
      selectFileInfo => {
        this.selectFileInfo = selectFileInfo;
        this.openFolder(this.selectFileInfo.path);
      }
    );

    const wd = new AppConfig(this.es).getWorkDirectory();
    if (wd) {
      this.treeExplorer = this.fileManager.find(wd);
      if (this.fileManager.isStatFile(this.treeExplorer.workDirectory + sep + 'style.css')) {
        document.getElementById('cs_viewer')['href'] = `${this.treeExplorer.workDirectory}${sep}style.css#0`;
      }
      this.openFolder(wd);
    }
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
    const appconfig = new AppConfig(this.es);
    appconfig.setWorkDirectory(this.treeExplorer.workDirectory);
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
    if (tree.isDirectory) {
      this.rightClickOnDirectory(tree);
    } else {
      this.rightClickOnFile(tree);
    }
  }

  private rightClickOnDirectory(tree: TreeFiles): void {
    this.selectRightInfo = tree;
    const menu = new this.es.remote.Menu();
    const menuItem = this.es.remote.MenuItem;
    menu.append(new menuItem({
      label: 'open explorer', click: () => {
        this.ngZone.run(() => {
          this.es.shell.showItemInFolder(tree.path + sep + tree.name);
        });
      }
    }));
    menu.append(new menuItem({ type: 'separator' }));
    menu.append(new menuItem({
      label: 'new folder', click: () => {
        this.ngZone.run(() => {
          this.fileManager.mkdir(this.dialog, tree, () => {
            this.monitoringExplorer();
          });
        });
      }
    }));
    menu.append(new menuItem({
      label: 'new file', click: () => {
        this.ngZone.run(() => {
          this.fileManager.mkfile(this.dialog, tree, (file) => {
            this.monitoringExplorer();
            if (!file.match(/\.md/)) {
              return;
            }
            const selectFileInfo = new SelectFileInfo(tree.path + sep + tree.name, file);
            this.shareDataService.onNotifySelectFileInfoChanged(selectFileInfo);
          });
        });
      }
    }));
    menu.append(new menuItem({
      label: 'rename', click: () => {
        this.ngZone.run(() => {
          this.fileManager.rename(this.dialog, tree, (name) => {
            tree.name = name;
            this.monitoringExplorer();
          });
        });
      }
    }));
    menu.append(new menuItem({ type: 'separator' }));
    menu.append(new menuItem({
      label: 'delete', click: () => {
        this.ngZone.run(() => {
          this.fileManager.rmdir(this.dialog, tree, () => {
            this.monitoringExplorer();
          });
        });
      }
    }));
    menu.popup({
      window: this.es.remote.getCurrentWindow(), callback: () => {
        this.selectRightInfo = undefined;
      }
    });
  }

  private rightClickOnFile(tree: TreeFiles): void {
    this.selectRightInfo = tree;
    const menu = new this.es.remote.Menu();
    const menuItem = this.es.remote.MenuItem;
    menu.append(new menuItem({
      label: 'open explorer', click: () => {
        this.ngZone.run(() => {
          this.es.shell.showItemInFolder(tree.path + sep + tree.name);
        });
      }
    }));
    menu.append(new menuItem({ type: 'separator' }));
    menu.append(new menuItem({
      label: 'rename', click: () => {
        this.ngZone.run(() => {
          this.fileManager.rename(this.dialog, tree, (name) => {
            tree.name = name;
            this.monitoringExplorer();
          });
        });
      }
    }));
    menu.append(new menuItem({ type: 'separator' }));
    menu.append(new menuItem({
      label: 'delete', click: () => {
        this.ngZone.run(() => {
          this.fileManager.rmdir(this.dialog, tree, () => {
            this.monitoringExplorer();
          });
        });
      }
    }));
    menu.popup({
      window: this.es.remote.getCurrentWindow(), callback: () => {
        this.selectRightInfo = undefined;
      }
    });
  }

  isRightClick(tree: TreeFiles): boolean {
    if (!this.selectRightInfo) {
      return false;
    }
    if (tree.path === this.selectRightInfo.path && tree.name === this.selectRightInfo.name) {
      return true;
    }
    return false;
  }

  isImage(name: string): boolean {
    if (name.match(/\.png$|\.jpeg$|\.gif$|\.bmp$|\.jpg$|\.tiff$|\.tif$/)) {
      return true;
    }
    return false;
  }

  getLocalImageUrl(tree: TreeFiles): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(tree.path + sep + tree.name);
  }

  getBase64LocalImageUrl(tree: TreeFiles): string {
    const buffer = new Buffer(tree.path + sep + tree.name);
    return buffer.toString('base64');
  }

  getFileIcon(tree: TreeFiles): string {
    const rtnSrc = 'assets/tree-icon/';
    if (tree.name.match(/\.md$/)) {
      return rtnSrc + 'baseline-code-24px.svg';
    }

    if (tree.name.match(/\.png$|\.jpeg$|\.gif$|\.bmp$|\.jpg$|\.tiff$|\.tif$/)) {
      return rtnSrc + 'baseline-image-24px.svg';
    }
    return rtnSrc + 'baseline-info-24px.svg';
  }

  openFile(tree: TreeFiles): void {
    if (!tree.name.match(/\.md$/)) {
      this.es.shell.openItem(tree.path + sep + tree.name);
      return;
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
      selectFileInfo.setGrepFlg();
      this.shareDataService.onNotifySelectFileInfoChanged(selectFileInfo);
      this.shareDataService.onNotifyMarkdownDataChanged(markdown);
    }
  }


  monitoringExplorer(): void {
    if (!this.treeExplorer) {
      return;
    }
    this.fileManager.reloadWorkDirectory(this.treeExplorer.workDirectory, this.treeExplorer, tree => { this.treeExplorer = tree; });
  }

  closeFolder(): void {
    if (!this.treeExplorer) {
      return;
    }
    for (const t of this.treeExplorer.childTree) {
      this._closeFolder(t);
    }
  }

  private _closeFolder(tree: TreeFiles): void {
    if (tree.opened) {
      tree.opened = false;
    }
    for (const t of tree.childTree) {
      this._closeFolder(t);
    }
  }

 }
