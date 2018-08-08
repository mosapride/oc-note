import { Component, ElementRef, HostListener, OnInit, ViewChild, Input, Output, EventEmitter, NgZone } from '@angular/core';
import * as hljs from 'highlight.js';
import * as marked from 'marked';
import { sep as sep } from 'path';
import { FileManager } from '../file-manager';
import { ElectronService } from '../providers/electron.service';
import { SelectFileInfo, ShareDataService } from '../share-data.service';
import { MarkedHistory } from './marked-history';
import { MenuItem } from 'electron';

@Component({
  selector: 'app-marked',
  templateUrl: './marked.component.html',
  styleUrls: ['./marked.component.scss']
})
export class MarkedComponent implements OnInit {
  @ViewChild('menu') menu: ElementRef;
  @ViewChild('contents') contents: ElementRef<any>;
  @Output() wideFlgChange: EventEmitter<boolean>;
  wideFlg = false;
  markdown = '';
  html = '';
  public markRender = new marked.Renderer();
  public fileManager: FileManager;
  public selectFileInfo: SelectFileInfo;
  public history: MarkedHistory;
  public scrollDownFlg = false;

  public markOtion: marked.MarkedOptions = {
    highlight: function (str, lang) {
      let head = '<pre class="hljs highlight-padding"><code class="highlight-padding">';
      if (lang && hljs.getLanguage(lang)) {
        try {
          if (str) {
            let title = str.split(/\n|\r\n|\r/)[0];
            if (title.indexOf('title:') === 0) {
              title = title.replace('title:', '');
              const wk = str.split(/\n|\r\n|\r/);
              str = '';
              for (let i = 1; i <= wk.length; i++) {
                if (typeof wk[i] !== 'undefined') {
                  str += wk[i] + '\n';
                }
              }
              head += `<span class='highlight-title'>${title}</span><br style="line-height:22px">`;
            }
          }
          return `${head}<div class="highlight-code">${hljs.highlight(lang, str, true).value}</div></code></pre>`;
        } catch (err) {
          return `<pre><code><div class="highlight-code">${hljs.highlight(lang, str, true).value}</div></code></pre>`;
        }
      }
      if (str) {
        let title = str.split(/\n|\r\n|\r/)[0];
        if (title.indexOf('title:') === 0) {
          title = title.replace('title:', '');
          const wk = str.split(/\n|\r\n|\r/);
          str = '';
          for (let i = 1; i <= wk.length; i++) {
            if (typeof wk[i] !== 'undefined') {
              str += wk[i] + '\n';
            }
          }
          head += ``;
          return `<pre class="hljs highlight-padding"><span class='highlight-title'>${title}</span><br style="line-height:22px"><div class="highlight-code">${hljs.highlightAuto(str).value}</div></pre>`;
        }
      }
      return `<pre class="hljs highlight-padding"><div class="highlight-code">${hljs.highlightAuto(str).value}</div></pre>`;
      // return '';
    }

  };

  /**
   * Viewerのclickイベント.
   *
   * * 内部linkの実装
   *
   * 内部リンクに関しては通常通りの通さを行うとパスがexe-rootからになり使用しにくくなる。
   * また、もしパスが合ってたとしてもアプリ全体がその指定されたページになり、仕様どおりの動作にならないため内部リンクをキャッチする。
   *
   * @param {*} event
   * @returns
   * @memberof ViewerComponent
   */
  @HostListener('click', ['$event']) onclick(event) {
    let href = '';
    try {
      href = event.target.dataset.inlink;
      if (!href) {
        href = event.target.dataset.outerlink;
        this.es.shell.openExternal(href);
        return;
      }
      href = href.replace(/\//g, sep);
      href = this.selectFileInfo.path + sep + href;
      if (!this.fileManager.isStatFile(href)) {
        window.alert(`not found.\n${event.target.dataset.inlink}`);
        return;
      }
      const selectFileInfo = new SelectFileInfo();
      selectFileInfo.customConstractor(href);
      this.shareDataService.onNotifySelectFileInfoChanged(selectFileInfo);
    } catch (e) {
      return;
    }
  }

  constructor(public es: ElectronService, public shareDataService: ShareDataService, private ngZone: NgZone) {
    this.wideFlgChange = new EventEmitter();
    this.fileManager = new FileManager(es);
    this.history = new MarkedHistory(shareDataService);


    this.markRender.heading = (text: string, level: number, raw: string): string => {
      const buffer = new Buffer(text);
      const id = buffer.toString('base64');
      return `<h${level} id='${id}'>${text}</h${level}>\n`;
    };

    // linkが内部リンクの場合はa href機能を動作させず、clickイベントで処理させる。
    this.markRender.link = (href: string, title: string, text: string): string => {
      if (href.match(/^http/) || href.match('//')) {
        return `<a href="javascript:void(0)" title="${href}" alt="${href}" data-outerLink="${href}" target="_blank" class="external-link" title="${title}">${text}</a>`;
      }
      let cssClazzName = 'internal-link';
      let markfile = href.replace(/\//g, sep);
      markfile = this.selectFileInfo.path + sep + markfile;
      if (!this.fileManager.isStatFile(markfile)) {
        cssClazzName += ' no-link';
      }
      return `<a href="javascript:void(0)" title="${href}" alt="${href}" data-inLink="${href}" class="${cssClazzName}">${text}</a>`;
    };

    // imageタグの場合末尾に#数値がある場合はlightboxとして表示する。
    this.markRender.image = (href: string, title: string, text: string): string => {
      let optionCode = '';

      if (text.length === 0) {
        text = new Date().getTime() + '';
      }

      const option = href.replace(/^(.*)#/, '');
      if (option.match(/^[0-9]+$/)) {
        optionCode = option;
      }

      if (href.match(/^http/) || href.match('//')) {
        if (optionCode !== '') {
          return `<a href="${href}" data-lightbox="${text}"><img src="${href}" style="width : ${optionCode}px" class="set-lightbox"></a>`;
        }
        return `<image src="${href}" alt="${text}" />`;
      }
      if (sep === '\\') {
        href = href.replace(/\//, '\\');
      }

      if (optionCode !== '') {
        // tslint:disable-next-line:max-line-length
        return `<a href="${this.selectFileInfo.path + sep + href}" data-lightbox="${text}"><image src="${this.selectFileInfo.path + sep + href}" alt="${text}"  style="width : ${optionCode}px" class="set-lightbox" /></a>`;
      }
      return `<image src="${this.selectFileInfo.path + sep + href}" alt="${text}" />`;
    };

    this.markOtion.renderer = this.markRender;
  }

  ngOnInit() {
    this.shareDataService.selectFileInfo$.subscribe(
      selectFileInfo => {
        if (selectFileInfo.reWorkSpaceFlg) {
          this.history.clear();
        }
        if (this.selectFileInfo) {
          if (this.selectFileInfo.path === selectFileInfo.path && this.selectFileInfo.name === selectFileInfo.name) {
            this.contents.nativeElement.scrollTop = 0;
            return;
          }
          if (selectFileInfo.grepFlg) {
            this.selectFileInfo = selectFileInfo;
            this.contents.nativeElement.scrollTop = 0;
            return;
          }
        }
        this.selectFileInfo = selectFileInfo;
        this.history.add(this.selectFileInfo);
        setTimeout(() => {
          this.contents.nativeElement.scrollTop = 0;
        }, 100);
      }
    );
    this.shareDataService.markdownData$.subscribe(
      markdown => {
        this.markdown = markdown;
        this.html = marked(markdown, this.markOtion);
        if (this.scrollDownFlg) {
          setTimeout(() => {
            this.contents.nativeElement.scrollTop = this.contents.nativeElement.scrollHeight;
          }, 20);
        }
      }
    );
  }

  changeWideFlg(): void {
    this.wideFlg = !this.wideFlg;
    console.log(`maked   ${this.wideFlg}`);
    this.wideFlgChange.emit(this.wideFlg);
  }

  canHistoryGo(): boolean {
    return this.history.canHistoryGo();
  }

  canHistoryBack(): boolean {
    return this.history.canHistoryBack();
  }

  doHistoryBack(): void {
    if (this.canHistoryBack()) {
      this.history.doHistoryBack();
    }
  }

  doHistoryGo(): void {
    if (this.canHistoryGo()) {
      this.history.doHistoryGo();
    }
  }

  doScrollDown(): void {
    if (!this.scrollDownFlg) {
      this.contents.nativeElement.scrollTop = this.contents.nativeElement.scrollHeight;
    }
    this.scrollDownFlg = !this.scrollDownFlg;
    console.log(this.contents);
  }

  onDragOver(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  onDragLeave(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  onDrop(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }


  rightClickOnDirectory(): void {
    const menu = new this.es.remote.Menu();
    const menuItem = this.es.remote.MenuItem;
    menu.append(new menuItem({
      label: 'html -> clipbord', click: () => {
        this.ngZone.run(() => {
          this.es.remote.clipboard.writeText(this.html);
        });
      }
    }));
    menu.popup({
      window: this.es.remote.getCurrentWindow()
    });
  }

}

