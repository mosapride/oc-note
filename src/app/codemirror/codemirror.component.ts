import { Component, ViewChild, ElementRef, AfterContentInit, OnDestroy } from '@angular/core';
import * as codetype from 'codemirror';
import { ShareDataService, SelectFileInfo } from '../share-data.service';
import { Subscription } from 'rxjs';
import { Constant } from '../constant';
import { FileManager } from '../file-manager';
import { ElectronService } from '../providers/electron.service';
import { sep } from 'path';
import { AppConfig } from '../app-config';
declare var CodeMirror: typeof codetype;

@Component({
  selector: 'app-codemirror',
  templateUrl: './codemirror.component.html',
  styleUrls: ['./codemirror.component.scss']
})
export class CodemirrorComponent implements AfterContentInit, OnDestroy {
  @ViewChild('codemirror') codemirror: ElementRef;
  @ViewChild('repletion') repletion: ElementRef;
  viewerSep: string;
  private subscription: Subscription;
  markdown: string;
  instance: codetype.EditorFromTextArea;
  hightlightTheme: string[];
  selectFileInfo: SelectFileInfo;
  fileManager: FileManager;
  SAVE_DELAY = 500;
  saveFileLastName = '';
  timeoutInstance: NodeJS.Timer = null;
  selectedCodemirrortheme: string;
  constructor(public es: ElectronService, public shareDataService: ShareDataService) {
    this.hightlightTheme = new Constant().highlightTheme;
    this.fileManager = new FileManager(es);
    this.selectedCodemirrortheme = new AppConfig(es).getCodemirrorTheme();
  }

  ngAfterContentInit() {
    this.viewerSep = sep;
    this.instance = CodeMirror.fromTextArea(this.codemirror.nativeElement, {
      mode: 'markdown',
      lineNumbers: true,
      lineWrapping: true,
      value: this.markdown,
      theme: this.selectedCodemirrortheme,
      viewportMargin: Infinity,
      extraKeys: {
        'Enter': 'newlineAndIndentContinueMarkdownList',
      },
    });


    this.instance.setSize('100%', `calc(100% - ${this.repletion.nativeElement.clientHeight}px)`);
    this.instance.on('change', (instance) => this.onChangeTextArea());
    this.instance.on('focus', (instance) =>  instance.refresh());
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
        if (this.timeoutInstance !== null) {
          clearTimeout(this.timeoutInstance);
          this.timeoutInstance = null;
          this.saveFileLastName = '';
        }
        this.selectFileInfo = selectFileInfo;
        this.markdown = this.fileManager.fileRead(this.selectFileInfo.getFullPathFilename());
        this.instance.setValue(this.markdown);
        this.instance.getDoc().clearHistory();
      }
    );

    this.shareDataService.codemirrorTheme$.subscribe(
      theme => {
        this.instance.setOption('theme', theme);
      }
    );
  }

  private updateCodeMirror(instance: any, data: string) {
    const cm = instance;
    const doc = cm.getDoc();
    doc.replaceSelection(data);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
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

    if (this.timeoutInstance !== null) {
      clearInterval(this.timeoutInstance);
      this.timeoutInstance = null;
    }

    if (!this.selectFileInfo) {
      return;
    }

    this.timeoutInstance = setTimeout(() => {
      if (!this.selectFileInfo) {
        return;
      }
      if (this.selectFileInfo.name === undefined || this.selectFileInfo.name === '') {
        return;
      }
      if (this.saveFileLastName !== this.selectFileInfo.getFullPathFilename()) {
        this.saveFileLastName = this.selectFileInfo.getFullPathFilename();
        return;
      }
      this.fileManager.save(this.selectFileInfo.getFullPathFilename(), this.getCode(), this.callbackSaved);
      this.timeoutInstance = null;
    }, this.SAVE_DELAY);

  }

  private callbackSaved(): void {

  }
}
