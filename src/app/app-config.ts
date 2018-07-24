import { sep } from 'path';
import { ElectronService } from './providers/electron.service';
import { FileManager } from './file-manager';
import { Constant } from './constant';


export class AppConfig {
  private C_WORK_DIRECTORY = 'workdirectory';
  private C_HIGHT_THEME = 'hightlight';
  private C_CODEMIRROR_THEME = 'codemirror';


  private configFile: string;
  fileManager: FileManager;
  constructor(public es: ElectronService) {
    this.fileManager = new FileManager(es);
    if (!this.configFile) {
      this.configFile = es.remote.app.getPath('appData') + sep + 'oc-config.json';
    }

    if (!this.fileManager.isStatFile(this.configFile)) {
      const obj = { name: 'oc-note' };
      this.es.fs.writeFileSync(this.configFile, JSON.stringify(obj), 'utf8');
    }

  }

  public getWorkDirectory(): string {
    let rtn: string;
    if (!this.fileManager.isStatFile(this.configFile)) {
      return rtn;
    }
    const obj = JSON.parse(this.fileManager.fileRead(this.configFile));
    rtn = obj[this.C_WORK_DIRECTORY];

    const stats = this.fileManager.getFsStat(rtn);
    if (!stats) {
      return undefined;
    }

    if (!stats.isDirectory()) {
      return undefined;
    }

    return rtn;
  }

  public setWorkDirectory(dir: string): void {
    this.write(this.C_WORK_DIRECTORY, dir);
  }

  getHightTheme(): string {
    const rtn = this.read(this.C_HIGHT_THEME);
    if (rtn) {
      return rtn;
    }
    return new Constant().highlightTheme[0];
  }

  getCodemirrorTheme(): string {
    const rtn = this.read(this.C_CODEMIRROR_THEME);
    if (rtn) {
      return rtn;
    }
    return new Constant().codemirrorTheme[0];
  }

  setHightTheme(theme: string): void {
    this.write(this.C_HIGHT_THEME, theme);
  }

  setCodemirrorTheme(theme: string): void {
    this.write(this.C_CODEMIRROR_THEME, theme);
  }

  /**
   * 設定ファイルにプロパティ、値の新規追加もしくは上書き行う。
   *
   * @param {string} propaty
   * @param {string} value
   */
  private write(propaty: string, value: string) {
    const obj = JSON.parse(this.fileManager.fileRead(this.configFile));
    obj[propaty] = value;
    this.es.fs.writeFileSync(this.configFile, JSON.stringify(obj), 'utf8');
  }

  /**
   * 設定ファイルのプロパティ値を読み込む.
   *
   * ファイル・プロパティが存在しない場合は`undefined`を返す
   *
   * @param {string} propaty プロパティ値もしくは`undefined`
   */
  private read(propaty: string): string {
    if (!this.fileManager.isStatFile(this.configFile)) {
      return undefined;
    }
    const obj = JSON.parse(this.fileManager.fileRead(this.configFile));
    if (obj.hasOwnProperty(propaty)) {
      return obj[propaty];
    }
    return undefined;
  }

}
