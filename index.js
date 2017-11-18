require('dotenv').config()

const fs = require('fs')
const Telegraf = require('telegraf')
const { Markup, Extra } = require('telegraf')

const app = new Telegraf(
  process.env.BOT_TOKEN,
  { username: process.env.BOT_NAME }
)

app.$options = {
  pageSize: 10,
}

app.$state = {
  path: '/home/den/Music',
  page: 0,
  folderButtons: [],
  folderFiles: () => app.$state.folderButtons.map(button => button.text),
  length: () => app.$state.folderButtons.length,
  pagesCount: () => parseInt(app.$state.length() / app.$options.pageSize)
}

const readDir = (path) => fs.readdirSync(path)

class TgButton
{
  constructor (text, cb, hidden = false) {
    this.text = text
    this.callback_data = cb
    this.hide = hidden

    return this
  }
}

class TgMarkup
{
  constructor (buttons) {

  }

  wrapWithNavigation () {

  }
}

const addNavigationButtons = (list) => {
  list.push(new TgButton('Next >', '/next', app.$state.page === app.$state.pagesCount()))
  list.push(new TgButton('Last >>>', '/last', app.$state.page === app.$state.pagesCount()))

  list = list.reverse()

  list.push(new TgButton('< Prev', '/prev', app.$state.page === 0))
  list.push(new TgButton('<<< First', '/first', app.$state.page === 0))

  return list.reverse()
}

const makeButton = (file, idx) => new TgButton(file, `/get/${idx}`, false)

const getKeyboard = (path, page) => {
  if (!(app.$state.folderButtons && app.$state.folderButtons.length)) {
    app.$state.folderButtons = readDir(path).map(makeButton)
  }

  return addNavigationButtons(
    app.$state.folderButtons.slice(
      page * app.$options.pageSize,
      page * app.$options.pageSize + app.$options.pageSize
    )
  )
}

const getMarkup = (ctx) =>
  Extra.HTML().markup(markup =>
    markup.inlineKeyboard(
      getKeyboard(ctx.path, ctx.page),
      { wrap: (btn, index, currentRow) => currentRow.length <= 1 }
    )
  )

const getStateInfo = (state) =>
  JSON.stringify({ path: state.path, page: state.page })

const getReply = (ctx) =>
  ctx.reply(getStateInfo(app.$state), getMarkup(app.$state))

const getAudioReply = (ctx) =>
  ctx.replyWithAudio()

const getState = () =>
  app.$state

app.command('start', ctx =>
  getReply(ctx)
)

app.action('/next', ctx => {
  app.$state.page += 1
  return getReply(ctx)
})

app.action('/prev', ctx => {
  app.$state.page -= 1
  return getReply(ctx)
})

app.action('/first', ctx => {
  app.$state.page = 0
  return getReply(ctx)
})

app.action('/last', ctx => {
  app.$state.page = app.$state.pagesCount()
  return getReply(ctx)
})

app.action(/^\/get\/(.*)$/, ctx => {
  let filename = app.$state.folderFiles()[ctx.match[1]]
  console.log(`${filename} by ${ctx.from.first_name} ${ctx.from.last_name} @${ctx.from.username}`)
  if (typeof filename === 'undefined') return ctx.reply('Error')
  return ctx.replyWithAudio({ source: fs.readFileSync(`${app.$state.path}/${filename}`) })
})

app.startPolling()
