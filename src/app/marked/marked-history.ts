import { SelectFileInfo, ShareDataService } from '../share-data.service';

export class MarkedHistory {

  public selectFileInfoHistory: SelectFileInfo[] = [];
  public selectHistoryIndex = -1;
  public historyBackFlg = false;
  public historyGoFlg = false;

  constructor(public shareDataService: ShareDataService) {
  }

  clear() {
    this.selectFileInfoHistory = [];
    this.selectHistoryIndex = -1;
    this.historyBackFlg = false;
    this.historyGoFlg = false;
  }

  add(selectFileInfo: SelectFileInfo) {

    if (this.historyBackFlg) {
      this.historyBackFlg = false;
      return;
    }
    if (this.historyGoFlg) {
      this.historyGoFlg = false;
      return;
    }
    if (this.selectFileInfoHistory.length > 30) {
      for (let i = 0; i < 10; i++) {
        this.selectFileInfoHistory.shift();
        this.selectHistoryIndex -= 10;
      }
    }

    const last = this.selectFileInfoHistory[this.selectFileInfoHistory.length - 1];
    if (last) {
      if (last.path === selectFileInfo.path && last.name === selectFileInfo.name) {
        return;
      }
    }

    if (this.selectFileInfoHistory.length > (this.selectHistoryIndex + 1)) {
      this.selectFileInfoHistory.splice(this.selectHistoryIndex + 1);
      this.selectFileInfoHistory.push(selectFileInfo);
      this.selectHistoryIndex = this.selectFileInfoHistory.length - 1;
      return;
    }
    this.selectFileInfoHistory.push(selectFileInfo);
    this.selectHistoryIndex++;
  }


  doHistoryBack(): void {
    this.selectHistoryIndex--;
    this.historyBackFlg = true;
    this.shareDataService.onNotifySelectFileInfoChanged(this.selectFileInfoHistory[this.selectHistoryIndex]);

  }

  doHistoryGo(): void {
    this.selectHistoryIndex++;
    this.historyGoFlg = true;
    this.shareDataService.onNotifySelectFileInfoChanged(this.selectFileInfoHistory[this.selectHistoryIndex]);
  }

  canHistoryGo(): boolean {
    if (this.selectFileInfoHistory[this.selectHistoryIndex + 1]) {
      return true;
    }
    return false;
  }

  canHistoryBack(): boolean {
    if (this.selectFileInfoHistory[this.selectHistoryIndex - 1]) {
      return true;
    }
    return false;
  }

}
