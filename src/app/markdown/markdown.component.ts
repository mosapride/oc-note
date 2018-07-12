import { Component, ViewChild, ElementRef, AfterContentInit, OnDestroy } from '@angular/core';
import * as codetype from 'codemirror';
import { ShareDataService, SelectFileInfo } from '../share-data.service';
import { Subscription } from 'rxjs';
import { Constant } from '../constant';
import { FileManager } from '../file-manager';
import { ElectronService } from '../providers/electron.service';
import { sep } from 'path';
declare var CodeMirror: typeof codetype;

@Component({
  selector: 'app-markdown',
  templateUrl: './markdown.component.html',
  styleUrls: ['./markdown.component.scss']
})
export class MarkdownComponent implements AfterContentInit, OnDestroy {
  @ViewChild('codemirror') codemirror: ElementRef;
  @ViewChild('repletion') repletion: ElementRef;
  private subscription: Subscription;
  markdown: string;
  instance: codetype.EditorFromTextArea;
  hightlightTheme: string[];
  selectFileInfo: SelectFileInfo;
  fileManager: FileManager;
  constructor(public es: ElectronService, public shareDataService: ShareDataService) {
    this.hightlightTheme = new Constant().highlightTheme;
    this.fileManager = new FileManager(es);
  }

  ngAfterContentInit() {
    this.instance = CodeMirror.fromTextArea(this.codemirror.nativeElement, {
      mode: 'markdown',
      lineNumbers: true,
      value: this.markdown,
      theme: 'default',
      extraKeys: { 'Enter': 'newlineAndIndentContinueMarkdownList' },

    });

    this.instance.setSize('100%', `calc(100% - ${this.repletion.nativeElement.clientHeight}px)`);
    this.instance.on('change', (instance) => this.onChangeTextArea());
    this.instance.on('drop', (instance, event) => {
      const imageFile: { name: string, path: string } = { name: '', path: '' };
      try {
        if (event.dataTransfer.files[0].type.match(/png|gif|jpeg|jpg|bmp/)) {
          imageFile.name = event.dataTransfer.files[0].name;
          imageFile.path = event.dataTransfer.files[0].path;
          this.fileManager.copy(imageFile.path, this.selectFileInfo.path + sep + imageFile.name, () => {
            this.onChangeTextArea();
            this.updateCodeMirror(instance, `![${imageFile.name}](./${imageFile.name})`);
          });
        }
      } catch (e) {
        return;
      }
      console.log(imageFile);

    });

    this.shareDataService.selectFileInfo$.subscribe(
      selectFileInfo => {
        if (selectFileInfo.grepFlg) {
          this.instance.getDoc().clearHistory();
          return;
        }
        this.selectFileInfo = selectFileInfo;
        this.markdown = this.fileManager.fileRead(this.selectFileInfo.getFullPathFilename());
        this.instance.setValue(this.markdown);
        this.instance.getDoc().clearHistory();
      }
    );

  }

  private updateCodeMirror(code: any, data: string) {
    const cm = this.instance;
    const doc = cm.getDoc();
    const cursor = doc.getCursor(); // gets the line number in the cursor position
    const line = doc.getLine(cursor.line); // get the line contents
    const pos = { // create a new object to avoid mutation of the original selection
      line: cursor.line,
      ch: line.length - 1 // set the character position to the end of the line
    };
    doc.replaceRange('\n' + data, pos); // adds a new line
  }

  ngOnDestroy() {
    //  リソースリーク防止のため CommonService から subcribe したオブジェクトを破棄する
    this.subscription.unsubscribe(); // 必要？
  }

  test(event: any) {
    console.log(event);
  }

  /**
   * hightrightのテーマ変更を行う
   *
   * @param {*} event
   * @memberof MarkdownComponent
   */
  changeHightTheme(event: any) {
    document.getElementById('cs_highlight')['href'] = `assets/highlight.js/styles/${event.target.value}`;
  }

  /**
   * markdownをmarkdownエティたに書き出す.
   *
   * @param code markdownコード
   */
  setCode(code: string): void {
    this.instance.setValue(code);
  }

  /**
   * markdownエディタに書かれたテキスト内容を取得する。
   *
   * @return code markdownコード
   */
  getCode(): string {
    return this.instance.getValue();
  }

  /**
   * makdownが変更された場合、viewerに反映させるために通知を出す
   * @private
   * @memberof MarkdownComponent
   */
  private onChangeTextArea(): void {
    this.shareDataService.onNotifyMarkdownDataChanged(this.getCode());
  }
}
