import { sep } from 'path';
import { ElectronService } from './providers/electron.service';
import { FileManager } from './file-manager';


export class AppConfig {
  private C_WORK_DIRECTORY = 'workdirectory';


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
    const obj = JSON.parse(this.fileManager.fileRead(this.configFile));
    obj[this.C_WORK_DIRECTORY] = dir;
    this.es.fs.writeFileSync(this.configFile, JSON.stringify(obj), 'utf8');
  }

}
