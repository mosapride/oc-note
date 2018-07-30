# OC-NOTE Customized functions(folderA/index.md)

## Internal link

[sample1.md](sample1.md)

[sample2.md](./sample2.md)

**Relative path**

[folderB/index.md](../folderB/index.md)


## highlightjs

```javascript
function $initHighlight(block, cls) {
  try {
    if (cls.search(/\bno\-highlight\b/) != -1)
      return process(block, true, 0x0F) +
             ` class="${cls}"`;
  } catch (e) {
    /* handle exception */
  }
  for (var i = 0 / 2; i < classes.length; i++) {
    if (checkCondition(classes[i]) === undefined)
      console.log('undefined');
  }
}

export  $initHighlight;
```

## highlightjs + title

```javascript
title:this is title
export  $initHighlight;
```

## image

**nomal image**

![any](./electron.png)

**lightbox image**

please click↓

![lightbox width  50px](./electron.png#50)
![lightbox width 100px](./electron.png#100)
![lightbox width 150px](./electron.png#150)

Prefix `#` Specify width(px)

