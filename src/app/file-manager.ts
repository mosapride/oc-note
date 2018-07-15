import { ElectronService } from './providers/electron.service';
import { OpenDialogOptions } from 'electron';
import * as fs from 'fs';
import { TreeExplorer, TreeFiles } from './tree-explorer';
import { sep } from 'path';

export class FileManager {
  es: ElectronService;
  ipc: Electron.IpcRenderer;
  dialog: Electron.Dialog;
  private fileList: string[];
  private asyncfindAllStartTime: Date;
  private asyncCallBackFlg: boolean;
  private ASYNC_TIME_OUT_MS = 3000;
  dialogOption: OpenDialogOptions = {
    properties: ['openFile', 'openDirectory']
  };
  fs: typeof fs;
  pathSep: string;
  treeExplorer: TreeExplorer;

  constructor(es: ElectronService) {
    this.es = es;
    this.ipc = es.ipcRenderer;
    this.dialog = es.remote.dialog;
    this.fs = es.fs;
  }


  /**
   * フォルダーを選択する.
   * キャンセルされた場合は戻り値として空白の文字列を返す。
   */
  public selectFolder(): string {
    const folders = this.dialog.showOpenDialog(this.dialogOption);
    if (folders) {
      this.checkPathSep(folders[0]);
      return folders[0];
    }
    return '';
  }

  /**
   * 指定したファイル内容を返す。
   * ディレクトリが指定された場合は空情報を返す。
   *
   * @param fullPath 読み込むファイル
   */
  public fileRead(fullPath: string): string {
    if (this.fs.statSync(fullPath).isDirectory()) {
      return '';
    }
    return this.fs.readFileSync(fullPath, { encoding: 'utf8' });
  }

  /**
   * ファイルの存在有無
   * @param fullPath フルパス
   * @return true:存在する/false:存在しない
   */
  public isStatFile(fullPath: string): boolean {
    try {
      if (this.fs.statSync(fullPath).isFile()) {
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }

  /**
   * path.sep(ディレクトリの区切り記号)を返す。
   * electron＋angularではpathクラスが使えない？ので作成。
   *
   * @param dir 何かしらのディレクトリ
   */
  checkPathSep(dir: string): void {
    if (dir.match(/^\\|^[A-Z]/)) {
      this.pathSep = '\\';
    } else {
      this.pathSep = '/';
    }
  }


  grep(search: string, treeExplorer: TreeExplorer): string {
    let rtnMarkDown = '';
    this.fileList = [];
    this._getFileList(treeExplorer.childTree);

    for (const file of this.fileList) {
      const fileContents = this.fileRead(file);
      const lines = fileContents.split(/\r|\n|\r\n/);
      for (let lineCount = 0; lineCount < lines.length; lineCount++) {
        if (lines[lineCount].match(search)) {
          let markF = file.replace(treeExplorer.workDirectory, '.');
          markF = markF.replace(/\\/g, '/');
          rtnMarkDown += `[${markF}](${markF}) \n\n`;
          rtnMarkDown += lines[lineCount] + '\n\n---\n\n';
        }
      }
    }
    return rtnMarkDown;
  }

  private _getFileList(treeFiles: TreeFiles[]): void {
    for (const tree of treeFiles) {
      if (!tree.isDirectory) {
        this.fileList.push(tree.path + '\\' + tree.name);
      }
      this._getFileList(tree.childTree);
    }
  }


  public reloadWorkDirectory(workDirectory: string, oldTreeExplorer: TreeExplorer, callback: (tree: TreeExplorer) => void): void {
    if (!oldTreeExplorer) {
      return;
    }

    const treeFiles = this.find(workDirectory);
    const openFileList = this._getOpenDirectoryList(oldTreeExplorer);
    for (const tree of treeFiles.childTree) {
      this._reloadWorkDrectory(openFileList, tree);
    }
    callback(treeFiles);
  }

  private _reloadWorkDrectory(openFileList: Array<string>, file: TreeFiles) {
    for (const f of openFileList) {
      if (f === (file.path + file.name)) {
        file.opened = true;
      }
    }
    for (const c of file.childTree) {
      this._reloadWorkDrectory(openFileList, c);
    }
  }

  private _getOpenDirectoryList(exp: TreeExplorer): Array<string> {
    const rtnArray = [];
    for (const t of exp.childTree) {
      this.__getOpenDirectoryList(rtnArray, t);
    }
    return rtnArray;
  }

  private __getOpenDirectoryList(fullPathList: Array<string>, file: TreeFiles): void {
    if (file.opened) {
      fullPathList.push(file.path + file.name);
    }
    for (const child of file.childTree) {
      this.__getOpenDirectoryList(fullPathList, child);
    }
  }

  public find(path: string): TreeExplorer {
    const treeExplorer = new TreeExplorer(path);
    this._find(path, treeExplorer.childTree, 0);
    return treeExplorer;
  }

  private _find(path: string, treeFiles: TreeFiles[], depth: number) {
    const names = this.fs.readdirSync(path);
    for (let counter = 0; counter < names.length; counter++) {
      if (this.fs.statSync(path + sep + names[counter]).isDirectory()) {
        treeFiles.push(new TreeFiles(path, names[counter], depth + 1, true));
        this._find(path + sep + names[counter], treeFiles[counter].childTree, depth + 1);
      } else {
        treeFiles.push(new TreeFiles(path, names[counter], depth + 1, false));
      }
    }
    treeFiles.sort((a, b) => {
      if (a.isDirectory === true && b.isDirectory === false) {
        return -1;
      }
      if (a.isDirectory === false && b.isDirectory === true) {
        return 1;
      }
      if (a.name.toUpperCase() > b.name.toUpperCase()) {
        return 1;
      }
      if (a.name.toUpperCase() < b.name.toUpperCase()) {
        return -1;
      }
      return 0;
    });
  }

  public copy(src: string, dest: string, callback: () => void): void {
    if (this.isStatFile(dest)) {
      callback();
      return;
    }

    this.fs.copyFile(src, dest, this.fs.constants.COPYFILE_EXCL
      , (err) => {
        if (err) { throw err; }
        callback();
      });
  }

  public save(path: string, writeData: string, callback: () => void) {
    this.fs.writeFile(path, writeData, callback);
  }


}

