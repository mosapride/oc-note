import { Component, OnInit, AfterContentInit, HostListener } from '@angular/core';
import { ShareDataService, SelectFileInfo } from '../share-data.service';
import * as marked from 'marked';
import * as hljs from 'highlight.js';
import { FileManager } from '../file-manager';
import { ElectronService } from '../providers/electron.service';

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss']
})
export class ViewerComponent implements OnInit, AfterContentInit {

  markdown = '';
  public markRender = new marked.Renderer();
  public fileManager: FileManager;
  public selectFileInfo: SelectFileInfo;
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
              // tslint:disable-next-line:max-line-length
              head += `<span class='highlight-title'>${title}</span>`;
            }
          }
          return `${head}<div class="highlight-code">${hljs.highlight(lang, str, true).value}</div></code></pre>`;
        } catch (err) {
          return `<pre><code><div class="highlight-code">${hljs.highlight(lang, str, true).value}</div></code></pre>`;
        }
      }
      // return '<pre class="hljs"><code>' + str + '</code></pre>';
      return hljs.highlightAuto(str, [lang]).value;
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
    let markfile = '';
    try {
      markfile = event.target.dataset.inlink;
      if (!markfile) {
        return;
      }
      markfile = markfile.replace(/\//g, this.selectFileInfo.pathSep);
      markfile = this.selectFileInfo.path + this.selectFileInfo.pathSep + markfile;
      if (!this.fileManager.isStatFile(markfile)) {
        window.alert(`not found.\n${event.target.dataset.inlink}`);
        return;
      }
      const selectFileInfo = new SelectFileInfo();
      selectFileInfo.customConstractor(markfile, this.selectFileInfo.pathSep);
      this.shareDataService.onNotifySelectFileInfoChanged(selectFileInfo);
    } catch (e) {
      return;
    }
  }

  constructor(public es: ElectronService, public shareDataService: ShareDataService) {

    this.fileManager = new FileManager(es);

    this.markRender.heading = (text: string, level: number, raw: string): string => {
      const buffer = new Buffer(text);
      const id = buffer.toString('base64');
      return `<h${level} id='${id}'>${text}</h${level}>\n`;
    };

    this.markRender.link = (href: string, title: string, text: string): string => {
      if (href.match(/^http/) || href.match('//')) {
        return `<a href="${href}" title="${href}" alt="${href}" target="_blank" title="${title}">${text}</a>`;
      }
      return `<a href="javascript:void(0)" title="${href}" alt="${href}" data-inLink="${href}">${text}</a>`;
    };

    this.markRender.image = (href: string, title: string, text: string): string => {
      let optionCode = '';
      const option = href.replace(/^.*#/, '');
      if (option.match(/^[0-9]+$/)) {
        optionCode = option;
      }

      if (href.match(/^http/) || href.match('//')) {
        if (optionCode !== '') {
          return `<image src="${href}" alt="${text}" />`;
        }
        return `<a href="${href}" data-lightbox="${text}"><img src="${href}" style="width : ${optionCode} px"></a>`;
      }
      if (this.selectFileInfo.pathSep === '\\') {
        href = href.replace(/\//, '\\');
      }

      if (optionCode !== '') {
        // tslint:disable-next-line:max-line-length
        return `<a href="${this.selectFileInfo.path + this.selectFileInfo.pathSep + href}" data-lightbox="${text}"><image src="${this.selectFileInfo.path + this.selectFileInfo.pathSep + href}" alt="${text}"  style="width : ${optionCode}px" /></a>`;
      }
      return `<image src="${this.selectFileInfo.path + this.selectFileInfo.pathSep + href}" alt="${text}" />`;
    };

    this.markOtion.renderer = this.markRender;
  }

  ngOnInit() {

  }

  ngAfterContentInit() {
    this.shareDataService.markdownData$.subscribe(
      markdown => {
        this.markdown = marked(markdown, this.markOtion);
      }
    );
    this.shareDataService.selectFileInfo$.subscribe(
      selectFileInfo => {
        this.selectFileInfo = selectFileInfo;
      }
    );
  }
}

