import { Component, OnInit } from '@angular/core';
import { ElectronService } from '../providers/electron.service';
import { OpenDialogOptions } from 'electron';
// import * as path from 'path';
import * as fs from 'fs';
import { FileManager } from '../file-manager';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  fileManager: FileManager;
  workFolder = '';
  ipc: Electron.IpcRenderer;
  dialog: Electron.Dialog;
  dialogOption: OpenDialogOptions = {};
  fs: typeof fs;
  pathSep: string;
  constructor(public es: ElectronService) {
    this.ipc = this.es.ipcRenderer;
    this.dialog = this.es.remote.dialog;
    this.fs = this.es.fs;
    this.fileManager = new FileManager(es);
  }




  ngOnInit() {
    this.dialogOption = {
      properties: ['openFile', 'openDirectory']
    };
  }

  selectFolder(): void {
    const dir = this.fileManager.selectFolder();
    if (dir !== '') {
      this.fileManager.asyncfindAll(dir);
    }
  }

  debug() {
    console.log(`-- debug -- `);
    const dir = this.fileManager.selectFolder();
    if (dir !== '') {
      this.fileManager.asyncfindAll(dir).then(folders => {
        console.log(`ログ出すよ`);
        console.log(folders);
      });
    }
    console.log(`おしりω`);
  }
}
