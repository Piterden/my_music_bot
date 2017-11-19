require('dotenv').config()

const fs = require('fs')
const Telegraf = require('telegraf')
const { Markup, Extra } = require('telegraf')

/**
 * Class for telegraf state.
 *
 * @class  {TgState}
 */
class TgState
{

  constructor (path, page = 0, options = {}) {
    this.options = Object.assign(
      { pageSize: 10 },
      options
    )

    this.path = path
    this.page = page

    this.folderFiles = fs.readdirSync(path) || []

    this.keyboard = new TgKeyboard(
      this.folderFiles,
      {
        path,
        page,
        pageSize: this.options.pageSize,
        pagesCount: this.pagesCount
      }
    )

    return this
  }

  get length () {
    return this.folderFiles.length
  }

  get pagesCount () {
    return parseInt(this.length / this.options.pageSize)
  }

  get markup () {
    return Extra.HTML().markup(markup =>
      markup.inlineKeyboard(
        this.keyboard.getKeyboard(this.page),
        { wrap: (btn, index, currentRow) => currentRow.length <= 1 }
      )
    )
  }

  get stateInfo () {
    return JSON.stringify({ path: this.path, page: this.page })
  }

  getReply (ctx) {
    return ctx.reply(this.stateInfo, this.markup)
  }

}

/**
 * Class for telegraf keyboard.
 *
 * @class  {TgKeyboard}
 */
class TgKeyboard
{

  constructor (files, options) {
    this.files = files
    this.options = options

    return this
  }

  getKeyboard (page) {
    this.options.page = page
    return this.addNavigation(this.getPage())
  }

  getPage () {
    return this.files.slice(
      this.options.page * this.options.pageSize,
      this.options.page * this.options.pageSize + this.options.pageSize
    ).map(this.makeButton)
  }

  addNavigation (list) {
    list.push(new TgButton('Next >', '/next', this.options.page === this.options.pagesCount))
    list.push(new TgButton('Last >>>', '/last', this.options.page === this.options.pagesCount))

    list = list.reverse()

    list.push(new TgButton('< Prev', '/prev', this.options.page === 0))
    list.push(new TgButton('<<< First', '/first', this.options.page === 0))

    return list.reverse()
  }

  makeButton (file, idx) {
    return new TgButton(file, `/get/${idx}`, false)
  }

}

/**
 * Class for telegraf button.
 *
 * @class  {TgButton}
 */
class TgButton
{

  constructor (text, cb, hidden = false) {
    this.text = text
    this.callback_data = cb
    this.hide = hidden

    return this
  }

}

const app = new Telegraf(
  process.env.BOT_TOKEN,
  {
    username: process.env.BOT_NAME,
  }
)

console.log(process.env.BOT_ROOT_FOLDER)

const state = new TgState(process.env.BOT_ROOT_FOLDER)

app.command('start', ctx =>
  state.getReply(ctx)
)

app.action('/next', ctx => {
  state.page += 1
  return state.getReply(ctx)
})

app.action('/prev', ctx => {
  state.page -= 1
  return state.getReply(ctx)
})

app.action('/first', ctx => {
  state.page = 0
  return state.getReply(ctx)
})

app.action('/last', ctx => {
  state.page = state.pagesCount()
  return state.getReply(ctx)
})

app.action(/^\/get\/(.*)$/, ctx => {
  let filename = state.folderFiles[ctx.match[1]]

  console.log(`${filename} by ${ctx.from.first_name} ${ctx.from.last_name} @${ctx.from.username}`)

  if (typeof filename === 'undefined') {
    return ctx.reply('Error')
  }

  return ctx.replyWithAudio({ source: fs.readFileSync(`${state.path}/${filename}`) })
})

app.startPolling()
