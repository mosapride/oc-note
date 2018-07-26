import { Component, OnInit, ViewChild, ElementRef, HostListener, Input, NgZone } from '@angular/core';
import { ElectronService } from '../../providers/electron.service';
import { MessageBoxOptions } from 'electron';

type findStyleType = ('find-open' | 'find-close');

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  findStype: findStyleType = 'find-close';
  findText = '';
  findFlg = false;

  public resizeStyle: ResizeStyle;
  message = 0;
  isProtect = false;
  resizeExplolerMarkdownFlg = false;
  resizeMainFlg = false;

  constructor(public es: ElectronService, private ngZone: NgZone) {
    window.addEventListener('keydown', (e) => {
      this.ngZone.run(() => {
        if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) {
          if (this.findStype === 'find-open') {
            this.closeFind();
          } else {
            this.findStype = 'find-open';
            setTimeout(() => {
              document.getElementById('find').focus();
            }, 10);
          }
        }

        if (e.keyCode === 27) {
          if (this.findStype === 'find-open') {
            this.closeFind();
          }
        }

        if (this.findFlg && e.keyCode === 13) {
          this.find();
        }
      });
    });

  }

  // @ViewChild('bar1') bar1: ElementRef;
  // @ViewChild('bar2') bar2: ElementRef;
  @ViewChild('explorer') explorer: ElementRef;
  @ViewChild('main') main: ElementRef;
  @ViewChild('markdown') markdown: ElementRef;
  @ViewChild('viewer') viewer: ElementRef;

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (this.resizeExplolerMarkdownFlg) {
      if (e.clientX >= 50 && e.clientX <= 800) {
        this.explorer.nativeElement.style.width = e.clientX + 'px';
        this.main.nativeElement.style.left = e.clientX + 'px';
      }
    }

    if (this.resizeMainFlg) {
      const mvpoint = e.clientX - this.explorer.nativeElement.clientWidth;
      const par = mvpoint / this.main.nativeElement.clientWidth * 100;
      if (par >= 1 && par <= 99) {
        this.markdown.nativeElement.style.width = `calc(${par}%)`;
        this.viewer.nativeElement.style.left = `calc(${par}%)`;
        this.viewer.nativeElement.style.width = `calc(${100 - par}%)`;
      }

    }
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(e: MouseEvent) {
    this.resizeExplolerMarkdownFlg = false;
    this.resizeMainFlg = false;
    this.isProtect = false;
  }

  ngOnInit() {

  }

  erTest() {
    const option: MessageBoxOptions = { title: `anan`, message: `messs` };
    this.es.remote.dialog.showMessageBox(option);
    this.message++;

  }

  resizeExplolerMarkdown(event: MouseEvent): void {
    this.isProtect = true;
    this.resizeExplolerMarkdownFlg = true;
  }

  resizeMain(event: MouseEvent): void {
    this.isProtect = true;
    this.resizeMainFlg = true;
  }

  find() {
    if (!this.findFlg) {
      this.findFlg = true;
    }
    this.es.remote.getCurrentWebContents().findInPage(this.findText);
  }

  closeFind() {
    this.findStype = 'find-close';
    this.findFlg = false;
    this.es.remote.getCurrentWebContents().stopFindInPage('clearSelection');
  }

  changeWideFlg(e: boolean) {
    if (e) {
      this.markdown.nativeElement.style.width = `calc(0%)`;
      this.viewer.nativeElement.style.left = `calc(0%)`;
      this.viewer.nativeElement.style.width = `calc(100%)`;
    } else {
      this.markdown.nativeElement.style.width = `calc(50%)`;
      this.viewer.nativeElement.style.left = `calc(50%)`;
      this.viewer.nativeElement.style.width = `calc(50%)`;
    }
  }
}

class ResizeStyle {
  private explolerLeftBarX: number;
  private markdownLeftBarX: number;

  setX(x1: number, x2: number) {
    this.explolerLeftBarX = x1;
    this.markdownLeftBarX = x2;
  }

  // section-explorer - width
  getExplolerWidth(): string {
    return (this.explolerLeftBarX - 5) + 'px';
  }


}
