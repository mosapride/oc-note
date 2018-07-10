import { SelectFileInfo, ShareDataService } from '../share-data.service';

export class ViewerHistory {

  public selectFileInfoHistory: SelectFileInfo[] = [];
  public selectHistoryIndex = -1;
  public historyBackFlg = false;
  public historyGoFlg = false;

  constructor(public shareDataService: ShareDataService) {
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
      }
    }
    this.selectFileInfoHistory.push(selectFileInfo);
    this.selectHistoryIndex = this.selectFileInfoHistory.length - 1;
  }


  doHistoryBack(): void {
    this.selectHistoryIndex--;
    this.historyBackFlg = true;
    // return this.selectFileInfoHistory[this.selectHistoryIndex];
    this.shareDataService.onNotifySelectFileInfoChanged(this.selectFileInfoHistory[this.selectHistoryIndex]);

  }

  doHistoryGo(): void {
    this.selectHistoryIndex++;
    this.historyGoFlg = true;
    // return this.selectFileInfoHistory[this.selectHistoryIndex];
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
