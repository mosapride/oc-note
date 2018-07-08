import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

// https://qiita.com/ksh-fthr/items/e43dd37bff2e51e95a59

@Injectable({
  providedIn: 'root'
})
export class ShareDataService {
  /**
   * データの変更を通知するためのオブジェクト
   */
  private markdownData = new Subject<string>();
  private selectFileInfo = new Subject<SelectFileInfo>();

  /**
   * Subscribe するためのプロパティ
   */
  public markdownData$ = this.markdownData.asObservable();
  public selectFileInfo$ = this.selectFileInfo.asObservable();
  constructor() { }

  /**
   * データの更新イベント
   * @param markdown 更新データ
   */
  public onNotifyMarkdownDataChanged(markdown: string) {
    this.markdownData.next(markdown);
  }
  public onNotifySelectFileInfoChanged(selectFileInfo: SelectFileInfo) {
    this.selectFileInfo.next(selectFileInfo);
  }
}


export class SelectFileInfo {
  path: string;
  name: string;
  pathSep: string;
  selectedFlg = false;
  changeFlg = false;

  constructor(path?: string, name?: string, pathSep?: string, selectedFlg?: boolean, changeFlg?: boolean) {
    if (path) {
      this.path = path;
    }
    if (name) {
      this.name = name;
    }
    if (pathSep) {
      this.pathSep = pathSep;
    }
    if (selectedFlg) {
      this.selectedFlg = selectedFlg;
    }
    if (changeFlg) {
      this.changeFlg = changeFlg;
    }
  }

  isChange(): boolean {
    return this.changeFlg;
  }

  getFullPathFilename(): string {
    return (this.path + this.pathSep + this.name);
  }

  customConstractor(fullpath: string, pathSep: string): void {
    this.path = '';
    this.name = '';
    this.pathSep = pathSep;
    const sfile = fullpath.split(pathSep);
    const wklist: string[] = [];
    for (const f of sfile) {
      if (f === '.') {
        continue;
      }
      if (f === '..') {
        wklist.pop();
        return;
      }
      wklist.push(f);
    }

    this.name = wklist.pop();
    // for (const w of wklist) {
    //   this.path += w + pathSep;
    // }

    for (let i = 0; i < wklist.length; i++) {
      this.path += wklist[i];
      if (wklist.length !== (i + 1)) {
        this.path += pathSep;
      }
    }
  }
}
