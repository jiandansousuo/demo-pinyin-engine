# SearchEngine

Simple search engine by pinyin, this project is copy from [pinyin-engine](https://github.com/aui/pinyin-engine) for study.

[在线Demo](https://demo.yugasun.com/SearchEngine/example)

本文主要是通过分析[pinyin-engine](https://github.com/aui/pinyin-engine)源码，一步步基于Javascript实现一个拼音搜索引擎。

本文主要分为两部分：

1. 实现简单的搜索文字匹配
2. 结合汉字拼音字典实现拼音搜索引擎

PS: 本文均基于ES6语法实现，考虑到兼容性，通过 [webpack](https://webpack.js.org/)工具 来进行编译输出ES5语法。

<!--more-->

## 实现简单的搜索文字匹配

### 创建搜索引擎类

一个基本的搜索类，必然包含所要搜索的数据集和需要搜索的属性集合，而且必须实现一个搜索方法，代码如下：

```js
class PinyinEngine {
  /**
   * 构造函数
   *
   * @param {Object} data 用户提供的需要搜索的数据集
   * @param {Array} indexs  用户提供查询的属性数组 - 对象键值
   * @memberof PinyinEngine
   */
  constructor (data, indexs) {
    this.data = data
    this.indexs = typeof indexs === 'string' ? [indexs] : indexs
  }
  query (keyword) {
    // 遍历数据集
    return this.data.filter((item) => {
      let result = false
      // 遍历需要搜索的键值数组，找到需要搜索
      this.indexs.map((index) => {
        if (item[index].indexOf(keyword) !== -1) {
          result = true
        }
      })
      return result
    })
  }
}

module.exports = PinyinEngine
```

以上代码通过 [Array.prototype.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) 方法来对数据集进行筛选查找，并对需要查找的对象属性数组进行遍历，只需要其中任何一个属性的值包含所要搜索的关键字，就返回结果。

### 初始化数据列表

此步骤主要是渲染搜索出来的相关数据，包括默认的所有数据：

```js
// 遍历拼接数据列表
function createTmpl (data) {
  var txt = []
  for (var i in data) {
    txt.push('<li><a href="javascript:;" id="')
    txt.push(data[i].id)
    txt.push('">')
    txt.push(data[i].name)
    txt.push('</a></li>')
  };

  txt = txt.join('')
  txt = txt === '' ? '<li><div class="tmpl-schoolBox-noContent">此地区暂时没有数据..</div></li>' : txt
  return '<ul>' + txt + '</ul>'
}
// 更新DOM内容
function loadSchool (data, timeEnd, initial) {
  // initial 为true, 默认渲染所有，直接输出缓存的模板 tmplCache
  var html = initial ? tmplCache : createTmpl(data)
  $unisContent.innerHTML = html
  $log.innerHTML = '(' + data.length + '条测试数据，索引创建耗时： ' + timeEnd + '毫秒'
};

// 初始化列表
// 缓存全部数据的列表模板，提高性能
tmplCache = createTmpl(_demoData)
loadSchool(_demoData, initTime, true)
```

### 监听输入框输入和值改变事件

当输入框输入和值变化时，需要监听并执行搜索的 `query` 方法来输出搜索结果：

```js
/ 绑定输入事件
$input.oninput = $input.onpropertychange = function () {
  var val = $input.value
  if (val === oldVal) return
  oldVal = $input.value

  clearTimeout(timer)
  timer = setTimeout(function () {
    var time = new Timer()

    // 如果val为空，则不需搜搜，直接渲染所有
    if (val === '') {
      loadSchool(_demoData, time.end(), true)
    } else {
      // 进行查询，输出结果
      var list = engine.query(val)
      loadSchool(list, time.end())
    }
  }, 40) // 延时可以减小查询频率
}
```

## 结合中文拼音字典，实现拼音搜索

### 准备中文拼音字典

创建 `cn_dict.json` 文件，结构如下：

```json
{
  "一": ["yi"],
  "丁:: ["ding"]
  ...
}
```

实现此字典文件的目的是为了，当用户输入拼音关键字时，通过此字典来匹配出相应的汉字。然后通过第一步实现的query方法查找输出结果。
那么在执行query之前，我们需要对输入的拼音组合进行分词拼接，输出组合。

> 源码中的 `cn_dist.json` 是对上面的结构的对象进行了压缩加密，然后通过 `decode.js` 进行解码输出，因为本文重点是拼音搜索，所以在此不做介绍。

### 创建中文分词方法

在构建搜索引擎的时候，我们需要根据需要查询的属性数组`props`，获取数据集`data`中对应属性的值 - `中文字符串`，然后对中文字符创进行分词，也就是循环遍历中文字符串，通过 `拼音字典` 找到每个中文所对应的 `拼音`，然后拼接出所有拼音组合的可能性，便于我们搜索，于是给 `PinyinEngine` 添加 `participle` 私有方法：

```js
 /**
   * 将内容进行分词
   *
   * @static
   * @param {String} words 目标字符串
   * @param {Object} dict   字典
   * @returns {String}
   * @memberof PinyinEngine
   */
  static participle (words, dict) {
    words = words.replace(/\s/g, '')  // 去除空白字符

    let result = `${words}`

    // k 存放汉字全拼
    // keywords[1] 存放的汉字首字母
    const keywords = [[], []]

    // 遍历文字内容
    for (const char of words) {
      const pinyin = dict[char] // 获取汉字对应拼音
      if (pinyin) {
        keywords[0].push(pinyin)
        if (words.length > 1) {
          keywords[1].push(pinyin.map(p => p.charAt(0)))
        }
      }
    }

    // 循环拼接拼音字符
    // 1. 拼接keywords[0]中存放的汉字拼音
    // 2. 拼接keywords[1]中存放的汉字拼音首字母
    // 3. 拼接原汉字和1、2中生成的拼音字符
    for (const list of keywords) {
      let current = list.shift()
      while (list.length) {
        const array = []
        const next = list.shift()
        for (const c of current) {
          for (const n of next) {
            array.push(c + n)
          }
        }
        current = array
      }
      if (current) {
        result += `\u0001${current.join('\u0001')}`
      }
    }
    return result
  }

  // 清华大学 -> 清华大学qinghuadaxueqinghuataixueqhdxqhtx
```

### 初始化拼音搜索索引数组

有了 `participle` 分词方法，我们在初始化的时候就可以对每个中文字符串进行分词，并存入到 `this.indexs` 索引中，然后改写构造函数为：

```js
/**
  * 构造函数
  *
  * @param {Array} data 用户提供的需要搜索的数据集
  * @param {Array|String} props  用户提供搜索索引 - 对象键值
  * @memberof PinyinEngine
  */
  constructor (data, props = []) {
    this.indexs = [] // 索索索引数组
    this.data = data
    this.dict = DICT

    props = typeof props === 'string' ? [props] : props

    // 遍历数据集进行索引对应的值进行分词
    data.map((item) => {
      let keywords = ''

      if (typeof item === 'string') {
        keywords = PinyinEngine.participle(item, DICT)
      } else {  // item 为对象
        for (const key of props) {
          const words = item[key]
          if (words) {
            keywords += PinyinEngine.participle(words, DICT)
          }
        }
      }

      // 建立拼音搜索索引数组
      // 考虑到值为大写英文字母的情况
      this.indexs.push(keywords.toLowerCase())
    })
  }
```

### 根据拼音搜索索引进行拼音搜索

这样当我们在执行 `query` 方法时，对我们构建的 `indexs - 拼音索引` 进行遍历，判断如果某个索引值包含了搜索关键字，就存入到输出数组中，从而得到搜索结果：

```js
 /**
   * 查询方法
   *
   * @param {String} keyword  需要查找的关键字
   * @returns {Array}
   * @memberof PinyinEngine
   */
  query (keyword) {
    keyword = keyword.replace(/\s/g, '').toLowerCase()

    let indexs = this.indexs
    let data = this.data
    let result = []

    // 遍历数据集
    indexs.map((item, index) => {
      // 遍历需要搜索的键值数组，找到包含搜索关键字的索引值
      if (item.indexOf(keyword) !== -1) {
        result.push(data[index])
      }
    })
    return result
  }
```

### 优化搜索结果

到这里我们已经实现了拼音搜索引擎的核心功能了，但是有个问题就是，我们在重复搜索同一个拼音字符的时候，搜索都是全局遍历的，那么我们是不是可以将上一次的搜索结果进行缓存呢，这样当再次搜索相同字符如果包含了上一次搜索的字符，可以将搜索索引缩小为上一次搜索缓存的索引数组，搜索的数据集也是，这样是不是更快。

对于 `PinyinEngine` 添加一个属性 `history` 专门用来存放我们的搜索结果，`history` 含有三个属性值：

* `keyword` 存放搜索关键字
* `indexs` 存放上一次搜索的索引
* `data` 存放上一次的搜索结果

修改 `constructor`：

```js
  constructor (data, indexs = [], dict = {}) {
    this.indexs = []
    this.history = { keyword: '', indexs: [], data: [] }
    // ...
  }
```

修改 `query` 方法：

```js
   /**
   * 查询方法
   *
   * @param {String} keyword  需要查找的关键字
   * @returns {Array}
   * @memberof PinyinEngine
   */
  query (keyword) {
    keyword = keyword.replace(/\s/g, '').toLowerCase()

    let indexs = this.indexs
    let data = this.data
    const history = this.history
    const result = []

    // 性能优化： 在上一次搜索结果中查询
    if (history.data.length && keyword.indexOf(history.keyword) === 0) {
      indexs = history.indexs
      data = history.data
    }

    // 遍历数据集
    indexs.map((item, index) => {
      // 遍历需要搜索的键值数组，找到需要搜索
      if (item.indexOf(keyword) !== -1) {
        history.indexs.push(item)
        history.data.push(data[index])
        result.push(data[index])
      }
    })
    return result
  }
```

## 总结

本篇就到这里结束了，再次感谢 [@糖饼](https://github.com/aui) 大神提供的 [pinyin-engine](https://github.com/aui/pinyin-engine) 库，才有了这篇文章。当然，本文只提供了中文字典，感兴趣的可以添加不同语言的字典，来扩展为各国语言的搜索引擎，[pinyin-engine](https://github.com/aui/pinyin-engine)这个库，就是扩展了繁体的拼音搜索，感兴趣的可以去研究研究。


