# oc-note

markdown editor & markdown browser

o(俺流に)c(カスタマイズしたらこうなった)-note = (Selfish note)

## Getting Started

```bash
git clone https://github.com/mosapride/oc-note.git
cd oc-note
npm install
npm start
```

### Dev mode

main.ts

```ts
win.webContents.openDevTools();
````

### 実行ファイル(exe)作成

VS Codeを開いた状態だと、ディレクトリを掴んだ状態になるためコマンドプロンプトのみを立ち上げ下記コマンドを実行する

```bash
npm run electron:windows
```

## The main framework you are using

* [maximegris/angular-electron](https://github.com/maximegris/angular-electron)
* [codemirror/CodeMirror](https://github.com/codemirror/CodeMirror)
* [markedjs/marked](https://github.com/markedjs/marked)
* [lokesh/lightbox2](https://github.com/lokesh/lightbox2)
* [isagalaev/highlight.js](https://github.com/isagalaev/highlight.js)

## License

MIT
