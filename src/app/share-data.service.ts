import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { sep } from 'path';

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
  selectedFlg = false;
  changeFlg = false;
  grepFlg = false;

  constructor(path?: string, name?: string,  selectedFlg?: boolean, changeFlg?: boolean) {
    if (path) {
      this.path = path;
    }
    if (name) {
      this.name = name;
    }
    if (selectedFlg) {
      this.selectedFlg = selectedFlg;
    }
    if (changeFlg) {
      this.changeFlg = changeFlg;
    }
  }

  setGrepFlg(): void {
    this.grepFlg = true;
  }

  isChange(): boolean {
    return this.changeFlg;
  }

  getFullPathFilename(): string {
    return (this.path + sep + this.name);
  }

  customConstractor(fullpath: string): void {
    this.path = '';
    this.name = '';
    const sfile = fullpath.split(sep);
    const wklist: string[] = [];
    for (const f of sfile) {
      if (f === '.') {
        continue;
      }
      if (f === '..') {
        wklist.pop();
        continue;
      }
      wklist.push(f);
    }

    this.name = wklist.pop();

    for (let i = 0; i < wklist.length; i++) {
      this.path += wklist[i];
      if (wklist.length !== (i + 1)) {
        this.path += sep;
      }
    }
  }
}
