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

## The main framework you are using

* [maximegris/angular-electron](https://github.com/maximegris/angular-electron)
* [codemirror/CodeMirror](https://github.com/codemirror/CodeMirror)
* [markedjs/marked](https://github.com/markedjs/marked)
* [lokesh/lightbox2](https://github.com/lokesh/lightbox2)
* [isagalaev/highlight.js](https://github.com/isagalaev/highlight.js)

## CSSのカスタマイズ

workspace直下に`style.css`を置くとoc-noteアプリケーションに反映される。(要：アプリ再起動)

### 特殊なclass(defalt)

```css
.external-link {
  &::after {
    content: "↗";
  }
}

.internal-link {
  color: -webkit-link;
}

.no-link {
  color: red;
}
```

### memo

https://codemirror.net/demo/html5complete.html
https://codemirror.net/demo/matchhighlighter.html
https://codemirror.net/demo/search.html
https://codemirror.net/demo/visibletabs.html
