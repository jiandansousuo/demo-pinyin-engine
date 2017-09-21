const dict = require('./dict-cn.json')
const decode = require('./decode')

// 这里解码后的字典结构如下：
/**
 * {
 *   "一": ["yi"],
 *   "丁:: ["ding"]
 *   ...
 * }
 */
const DICT = decode(dict)

class PinyinEngine {
  /**
  * 构造函数
  *
  * @param {Array} data 用户提供的需要搜索的数据集
  * @param {Array|String} props  用户提供搜索索引 - 对象键值
  * @memberof PinyinEngine
  */
  constructor (data, props = []) {
    this.indexs = [] // 索索索引数组
    this.history = { keyword: '', indexs: [], data: [] }
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
    history.indexs = []
    history.data = []

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
}

module.exports = PinyinEngine
