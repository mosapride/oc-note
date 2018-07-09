import { ElectronService } from './providers/electron.service';
import { OpenDialogOptions } from 'electron';
import * as fs from 'fs';
import { TreeExplorer, TreeFiles } from './tree-explorer';

export class FileManager {
  es: ElectronService;
  ipc: Electron.IpcRenderer;
  dialog: Electron.Dialog;
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

  /**
   * `find .`のように末端ディレクトリまでのディレクトリ、ファイルを調べる。
   *
   * @param path find先のディレクトリ
   * @return Promise<TreeExplorer> ディレクトリ情報
   */
  public asyncfindAll(dir: string): Promise<TreeExplorer> {
    this.treeExplorer = new TreeExplorer(dir);
    return this._asyncfindAll(dir, this.treeExplorer.childTree);
  }

  /**
   * `find .`のように末端ディレクトリまでのディレクトリ、ファイルを調べる。
   *
   * @param path find先のディレクトリ
   * @param treeFiles 検索結果を格納するObject
   */
  private async _asyncfindAll(path: string, treeFiles: TreeFiles[]): Promise<TreeExplorer> {
    let rtn: TreeExplorer;
    await this._promiseFindAll(path, treeFiles, 0).then(data => { rtn = data; });
    return rtn;
  }

  private _promiseFindAll(path: string, treeFiles: TreeFiles[], depth: number) {
    return new Promise<TreeExplorer>((resolve, reject) => {
      this.fs.readdir(path, (err, names) => {
        if (err) {
          throw err;
        }
        let counter = 0;
        for (const name of names) {
          if (this.fs.statSync(path + this.pathSep + name).isDirectory()) {
            treeFiles.push(new TreeFiles(path, name, depth + 1, true));
            this._promiseFindAll(path + this.pathSep + name, treeFiles[counter].childTree, depth + 1);
          } else {
            treeFiles.push(new TreeFiles(path, name, depth + 1, false));
          }
          counter++;
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
        resolve(this.treeExplorer);
      });
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


}

