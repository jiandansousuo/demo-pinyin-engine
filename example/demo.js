let demoData = window._demoData

var $ = function (id) {
  return document.getElementById(id)
}

var Timer = function () {
  this.startTime = (new Date()).getTime()
}
Timer.prototype.end = function () {
  return (new Date()).getTime() - this.startTime
}

var initTime = new Timer()
var engine = new PinyinEngine(demoData, ['name'])

initTime = initTime.end()
var $log = $('demo-log')
var timer
var $input = $('tmpl-schoolBox-search-input')
var $unisContent = $('tmpl-schoolBox-unis-content')
var oldVal = $input.value
var tmplCache

// 填充学校数据
function createTmpl (data) {
  var txt = []
  data.map((item) => {
    txt.push('<li><a href="javascript:;" id="')
    txt.push(item.id)
    txt.push('">')
    txt.push(item.name)
    txt.push('</a></li>')
  })

  txt = txt.join('')
  txt = txt === '' ? '<li><div class="tmpl-schoolBox-noContent">此地区暂时没有数据..</div></li>' : txt
  return '<ul>' + txt + '</ul>'
}
function loadSchool (data, timeEnd, initial) {
  var html = initial ? tmplCache : createTmpl(data)
  $unisContent.innerHTML = html
  $log.innerHTML = '(' + data.length + '条测试数据，索引创建耗时： ' + timeEnd + '毫秒'
};

// 初始化列表
// 缓存全部数据的列表模板，提高性能
tmplCache = createTmpl(demoData)
loadSchool(demoData, initTime, true)

// 绑定输入事件
$input.oninput = $input.onpropertychange = function () {
  var val = $input.value
  if (val === oldVal) return
  oldVal = $input.value

  clearTimeout(timer)
  timer = setTimeout(function () {
    var time = new Timer()

    // 如果val为空，则不需搜搜，直接渲染所有
    if (val === '') {
      loadSchool(demoData, time.end(), true)
    } else {
      var list = engine.query(val)
      loadSchool(list, time.end())
    }
  }, 40) // 延时可以减小查询频率
}

if (window.console) {
  console.debug(engine)
}
