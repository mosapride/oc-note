import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogConfig } from '@angular/material';
import { Observable } from 'rxjs';

type position = ('left' | 'center' | 'right');
// tslint:disable-next-line:interface-over-type-literal
type dialogConfig = {
  title: string,
  iconName: string,
  iconColor: string,
  defaltIconColor: string,
  content: string,
  buttonPosition: position,
  positionStyle: string
  dialogPattern: string,
  defaltButtonPosition: position,
  newFile: string,
  deleteFile: string,
  rename: string
};

@Component({
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent implements OnInit {
  iconName: string;
  dialogPattern: string;
  iconColor = 'rgba(20, 20, 20, 0.7)';
  defaltIconColor = 'rgba(20, 20, 20, 0.7)';
  title: string;
  content: string;
  buttonPosition: position;
  positionStyle: string;
  defaltButtonPosition: position = 'center';
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: dialogConfig,
    public dialogRef: MatDialogRef<DialogComponent>
  ) { }

  ngOnInit(): void {
    const config = this.data;
    this.iconName = config.iconName;
    if (!config.iconColor) {
      this.iconColor = this.defaltIconColor;
    }
    this.title = config.title;
    switch (config.buttonPosition) {
      case 'left':
        this.positionStyle = '';
        break;
      case 'center':
        this.positionStyle = 'justify-content:center';
        break;
      case 'right':
        this.positionStyle = 'justify-content:flex-end';
        break;
      default:
        this.positionStyle = '';
    }

    if (!config.dialogPattern) {
      throw new Error('dialogPattern is not declaration');
    }
    this.dialogPattern = config.dialogPattern;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onKeyEnter() {
    this.dialogRef.close(this.data.newFile);
  }

  onKeyEnterRenew() {
    this.dialogRef.close(this.data.rename);
  }

}
/**
 * Dialog Wrapper
 *
 * Angular Materialを利用したDialog.
 *
 * example
 * ```
 * // << component class - global area
 * dialog: Dialog;
 * // >>
 *
 * // << conponent class - counstracter
 * constructor( private MatDialog: MatDialog ) {
 *   this.dialog = new Dialog(MatDialog);
 * }
 * // >>
 * ```
*/
export class Dialog {
  private dialog: MatDialog;
  constructor(dialog: MatDialog) {
    this.dialog = dialog;
  }

  public newFolder(): Observable<string> {
    const config = new MatDialogConfig();
    config.data = {
      title: 'create folder',
      iconName: 'help_outline',
      dialogPattern: 'newfolder',
    };
    const ref = this.dialog.open<DialogComponent, dialogConfig, string>(DialogComponent, config);
    return ref.afterClosed();
  }

  public newFile(): Observable<string> {
    const config = new MatDialogConfig();
    config.data = {
      title: 'create file',
      iconName: 'help_outline',
      dialogPattern: 'newfile',
    };
    const ref = this.dialog.open<DialogComponent, dialogConfig, string>(DialogComponent, config);
    return ref.afterClosed();
  }

  public rename(oldName: string): Observable<string> {
    const config = new MatDialogConfig();
    config.data = {
      title: 'rename',
      iconName: 'help_outline',
      dialogPattern: 'rename',
      rename: oldName
    };
    const ref = this.dialog.open<DialogComponent, dialogConfig, string>(DialogComponent, config);
    return ref.afterClosed();
  }

  public deleteAlert(name: string): Observable<boolean> {
    const config = new MatDialogConfig;
    config.data = {
      title: 'delete',
      iconName: 'help_outline',
      dialogPattern: 'delete',
      deleteFile: name
    };
    const ref = this.dialog.open<DialogComponent, dialogConfig, boolean>(DialogComponent, config);
    return ref.afterClosed();
  }
  /**
   * 確認ダイアログ
   *
   * example
   * ```
   * this.dialog.confirm('タイトル', '内容').subscribe(rtn => {
   *   if (rtn) {
   *     console.log('ok')
   *   } else {
   *     console.log('cancel or undefined(Esc key or Click outside the dialog)')
   *   }
   * });
   * ```
   *
   * @param {string} title ダイアログのタイトル
   * @param {string} content ダイアログの内容
   * @returns {Observable<boolean>} true:OK, false:cancel, undefined:ESC,Click outside the dialog
   * @memberof Dialog
   */
  public confirm(title: string, content: string): Observable<boolean> {
    const config = new MatDialogConfig();
    config.data = {
      title: title,
      content: content,
      iconName: 'help_outline',
      dialogPattern: 'confirm'
    };
    const ref = this.dialog.open(DialogComponent, config);
    return ref.afterClosed();
  }

  /**
   * エラーダイアログ
   *
   * example
   * ```
   * this.dialog.error('タイトル', '内容').subscribe(rtn => {
   *   if (rtn) {
   *     console.log('ok')
   *   } else {
   *     console.log('cancel or undefined(Esc key or Click outside the dialog)')
   *   }
   * });
   * ```
   * @param {string} title ダイアログのタイトル
   * @param {string} content ダイアログの内容
   * @returns {Observable<boolean>} true:close, undefined:ESC,Click outside the dialog
   * @memberof Dialog
   */
  public error(title: string, content: string): Observable<boolean> {
    const config = new MatDialogConfig();
    config.data = {
      title: title,
      content: content,
      iconName: 'highlight_off',
      dialogPattern: 'error'
    };
    const ref = this.dialog.open(DialogComponent, config);
    return ref.afterClosed();
  }

  /**
   * 情報ダイアログ
   *
   * example
   * ```
   * this.dialog.info('タイトル', '内容').subscribe(rtn => {
   *   if (rtn) {
   *     console.log('ok')
   *   } else {
   *     console.log('cancel or undefined(Esc key or Click outside the dialog)')
   *   }
   * });
   * ```
   * @param {string} title ダイアログのタイトル
   * @param {string} content ダイアログの内容
   * @returns {Observable<boolean>} true:close, undefined:ESC,Click outside the dialog
   * @memberof Dialog
   */
  public info(title: string, content: string): Observable<boolean> {
    const config = new MatDialogConfig();
    config.data = {
      title: title,
      content: content,
      iconName: 'info_outline',
      dialogPattern: 'info'
    };
    const ref = this.dialog.open(DialogComponent, config);
    return ref.afterClosed();
  }

  /**
   * 警告ダイアログ
   *
   * example
   * ```
   * this.dialog.warning('タイトル', '内容').subscribe(rtn => {
   *   if (rtn) {
   *     console.log('ok')
   *   } else {
   *     console.log('cancel or undefined(Esc key or Click outside the dialog)')
   *   }
   * });
   * ```
   * @param {string} title ダイアログのタイトル
   * @param {string} content ダイアログの内容
   * @returns {Observable<boolean>} true:close, undefined:ESC,Click outside the dialog
   * @memberof Dialog
   */
  public warning(title: string, content: string): Observable<boolean> {
    const config = new MatDialogConfig();
    config.data = {
      title: title,
      content: content,
      iconName: 'warning',
      dialogPattern: 'warning'
    };
    const ref = this.dialog.open(DialogComponent, config);
    return ref.afterClosed();
  }
}
