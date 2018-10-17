import { Component, ElementRef, NgZone, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { sep } from 'path';
import { MatDialog } from '../../../node_modules/@angular/material';
import { AppConfig } from '../app-config';
import { Constant } from '../constant';
import { Dialog } from '../dialog/dialog.component';
import { FileManager } from '../file-manager';
import { ElectronService } from '../providers/electron.service';
import { SelectFileInfo, ShareDataService } from '../share-data.service';
import { TreeExplorer, TreeFiles } from '../tree-explorer';
import { FSWatcher } from 'fs';
// import * as fs from 'fs';
@Component({
  selector: 'app-explorer',
  templateUrl: './explorer.component.html',
  styleUrls: ['./explorer.component.scss']
})
export class ExplorerComponent implements OnInit, AfterViewInit {

  search = '';
  isSetting = false;
  fileManager: FileManager;
  treeExplorer: TreeExplorer;
  selectFileInfo: SelectFileInfo;
  selectRightInfo: TreeFiles;
  dialog: Dialog;
  hightlightTheme: string[];
  selectedHightTheme: string;
  comdemirrorTheme: string[];
  selectedCodemirrortheme: string;
  lastHover: string;
  hoverTimer: NodeJS.Timer;
  dragFile: { path: string, sep: string, name: string };
  fsWatcher: FSWatcher;
  searchedDrectoryCnt = 5;
  @ViewChild('workspace') workspace: ElementRef;
  @ViewChild('tree') tree: ElementRef;

  constructor(
    public es: ElectronService,
    public shareDataService: ShareDataService,
    private sanitizer: DomSanitizer,
    public matDialog: MatDialog,
    private ngZone: NgZone,
  ) {
    this.fileManager = new FileManager(es);
    this.selectFileInfo = new SelectFileInfo();
    this.dialog = new Dialog(matDialog);
    this.hightlightTheme = new Constant().highlightTheme;
    this.comdemirrorTheme = new Constant().codemirrorTheme;
  }

  ngOnInit() {
    this.shareDataService.selectFileInfo$.subscribe(
      selectFileInfo => {
        if (selectFileInfo.reWorkSpaceFlg === true) {
          return;
        }
        this.selectFileInfo = selectFileInfo;
        this.openFolder(this.selectFileInfo.path);
      }
    );
    const appConfig = new AppConfig(this.es);
    const wd = appConfig.getWorkDirectory();
    if (wd) {
      this.treeExplorer = this.fileManager.find(wd);
      if (this.fileManager.isStatFile(this.treeExplorer.workDirectory + sep + 'style.css')) {
        document.getElementById('cs_viewer')['href'] = `${this.treeExplorer.workDirectory}${sep}style.css#0`;
      }
      this.openFolder(wd);
      this.fswatch$();

    }
    this.selectedHightTheme = appConfig.getHightTheme();
    document.getElementById('cs_highlight')['href'] = `assets/highlight.js/styles/${this.selectedHightTheme}`;
    this.selectedCodemirrortheme = appConfig.getCodemirrorTheme();
  }

  ngAfterViewInit(): void {
    if (this.fileManager.isStatFile(this.treeExplorer.workDirectory + sep + 'index.md')) {
      for (const w of this.treeExplorer.childTree) {
        if (w.name === 'index.md') {
          setTimeout(() => {
            this.openFile(w);
          }, 100);
        }
      }
    }
  }
  clickSetting(): void {
    this.isSetting = !this.isSetting;
    if (this.isSetting) {
      this.workspace.nativeElement.style.height = '250px';
      this.tree.nativeElement.style.height = 'calc(100% - 250px)';
    } else {
      this.workspace.nativeElement.style.height = '100px';
      this.tree.nativeElement.style.height = 'calc(100% - 100px)';
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
    const paths = path.split(sep);
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
      let reg: RegExp;
      if (sep === '\\') {
        reg = new RegExp('\\\\', 'g');
      } else {
        reg = new RegExp('\\/', 'g');
      }
      wk = wk.replace(reg, '') + treeFile.name;
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
    this.searchedDrectoryCnt = 5;
    this.treeExplorer = this.fileManager.find(dir, this.searchedDrectoryCnt);
    if (this.fileManager.isStatFile(this.treeExplorer.workDirectory + sep + 'style.css')) {
      document.getElementById('cs_viewer')['href'] = `${this.treeExplorer.workDirectory}${sep}style.css#` + new Date().getTime();
    }
    const appconfig = new AppConfig(this.es);
    appconfig.setWorkDirectory(this.treeExplorer.workDirectory);
    this.selectFileInfo = new SelectFileInfo();
    this.selectFileInfo.reWorkSpaceFlg = true;
    this.shareDataService.onNotifySelectFileInfoChanged(this.selectFileInfo);
    this.fswatch$();
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
    // if (this.searchedDrectoryCnt < tree.depth) {
    //   this.treeExplorer = this.fileManager.find(this.treeExplorer.workDirectory, tree.depth + 1);
    //   this.searchedDrectoryCnt = tree.depth;
    // }
    this.fileManager.reloadWorkDirectory(this.treeExplorer.workDirectory, this.treeExplorer, tree.depth + 1, callTree => {
      this.treeExplorer = callTree;
      this.searchedDrectoryCnt = tree.depth + 1;
    });
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

  getFileKind(fileName: string): ('md' | 'img' | 'other') {
    if (fileName.match(/\.md$/)) {
      return 'md';
    }
    if (fileName.match(/\.png$|\.jpeg$|\.gif$|\.bmp$|\.jpg$|\.tiff$|\.tif$/)) {
      return 'img';
    }
    return 'other';
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
    if (this.fileManager.isStatFile(this.treeExplorer.workDirectory + sep + 'style.css')) {
      document.getElementById('cs_viewer')['href'] = `${this.treeExplorer.workDirectory}${sep}style.css#` + new Date().getTime();
    }
    this.fileManager.reloadWorkDirectory(this.treeExplorer.workDirectory, this.treeExplorer, this.searchedDrectoryCnt, tree => { this.treeExplorer = tree; });
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

  changeHightTheme(event: any) {
    this.selectedHightTheme = event.target.value;
    document.getElementById('cs_highlight')['href'] = `assets/highlight.js/styles/${this.selectedHightTheme}`;
    const appConfig = new AppConfig(this.es);
    appConfig.setHightTheme(this.selectedHightTheme);
  }

  changeCodemirrorTheme(event: any) {
    this.selectedCodemirrortheme = event.target.value;
    this.shareDataService.onNotifyCodemirrorTheme(this.selectedCodemirrortheme);
    const appConfig = new AppConfig(this.es);
    appConfig.setCodemirrorTheme(this.selectedCodemirrortheme);
  }

  mkdirTop(): void {
    if (!this.treeExplorer) {
      return;
    }

    if (this.treeExplorer.workDirectory === '') {
      return;
    }

    this.fileManager.mkdirTop(this.dialog, this.treeExplorer.workDirectory, () => {
      this.monitoringExplorer();
    });
  }

  mkfileTop(): void {
    if (!this.treeExplorer) {
      return;
    }

    if (this.treeExplorer.workDirectory === '') {
      return;
    }

    this.fileManager.mkfileTop(this.dialog, this.treeExplorer.workDirectory, () => {
      this.monitoringExplorer();
    });
  }

  onDrop(event: DragEvent, element: any, tree: TreeFiles) {
    this.lastHover = '';
    if (element.classList.contains('mouse-over')) {
      element.classList.remove('mouse-over');
    }
    const oldFile = this.dragFile.path + this.dragFile.sep + this.dragFile.name;
    const newFile = tree.path + sep + tree.name + sep + this.dragFile.name;
    if (this.fileManager.isStatFile(newFile)) {
      this.dialog.error('Same file', 'The same file name exists.');
      return;
    }
    this.es.fs.rename(oldFile, newFile, (err) => {
      if (err) {
        return;
      }
      this.monitoringExplorer();
    });
  }

  onDragStart(event: DragEvent, tree: TreeFiles) {
    this.dragFile = { path: tree.path, sep: sep, name: tree.name };
    // event.preventDefault();
  }

  onDragOver(element: any, event: DragEvent, tree: TreeFiles) {
    if (!element.classList.contains('mouse-over')) {
      element.classList.add('mouse-over');
    }
    this.lastHover = tree.path + sep + tree.name;
    event.preventDefault();
  }

  onDrag(event: DragEvent, tree: TreeFiles) {
    event.preventDefault();
  }

  onDragEnd(event: DragEvent, tree: TreeFiles) {
    event.preventDefault();
  }


  onDragChangeColor(element: any, tree: TreeFiles, flg: boolean): void {
    if (flg) {
      element.classList.add('mouse-over');
      if (this.hoverTimer) {
        clearTimeout(this.hoverTimer);
      }
      this.hoverTimer = setTimeout(() => {
        if (this.lastHover === (tree.path + sep + tree.name)) {
          tree.opened = !tree.opened;
        }
      }, 1500);
      this.lastHover = tree.path + sep + tree.name;
    } else {
      element.classList.remove('mouse-over');
      this.lastHover = '';
    }
  }

  private fswatch$(): void {
    if (this.fsWatcher) {
      this.fsWatcher.close();
      this.fsWatcher = undefined;
    }
    const stat = this.fileManager.getFsStat(this.treeExplorer.workDirectory);
    if (!(stat && stat.isDirectory())) {
      return;
    }
    this.fsWatcher = this.es.fs.watch(this.treeExplorer.workDirectory, { persistent: true, recursive: true }, (eventType, fileName) => {
      if (eventType === 'change') {
        if (fileName !== 'style.css') {
          return;
        }
      }
      this.monitoringExplorer();
    });
  }

  goHome() {
    if (this.fileManager.isStatFile(this.treeExplorer.workDirectory + sep + 'index.md')) {
      for (const w of this.treeExplorer.childTree) {
        if (w.name === 'index.md') {
          setTimeout(() => {
            this.openFile(w);
          }, 100);
        }
      }
    }
  }
}
