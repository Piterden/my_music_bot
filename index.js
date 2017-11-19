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

  /**
   * Constructs the object.
   *
   * @param   {String}  path     The path
   * @param   {Number}  page     The page
   * @param   {Object}  options  The options
   * @return  {this}
   */
  constructor (path, page = 0, options = {}) {
    let self = this

    this.options = Object.assign({ pageSize: 10 }, options)
    this.path = path
    this.page = page

    // this.folderFiles = fs.readdirSync(path) || []
    fs.readdir(path, (err, files) => {
      if (err) throw err

      self.folderFiles = files

      self.keyboard = new TgKeyboard(files, {
        path,
        page,
        pageSize: self.options.pageSize,
        pagesCount: self.pagesCount
      })
    })

    return this
  }

  /**
   * Get the count of pages
   *
   * @return  {Number}
   */
  get pagesCount () {
    return parseInt(this.folderFiles.length / this.options.pageSize)
  }

  /**
   * Get the markup
   *
   * @return  {Object}
   */
  get markup () {
    return Extra.HTML().markup(markup =>
      markup.inlineKeyboard(
        this.keyboard.getKeyboard(this.page),
        { wrap: (btn, index, currentRow) => currentRow.length <= 1 }
      )
    )
  }

  /**
   * Get state info string
   *
   * @return  {String}
   */
  get stateInfo () {
    return JSON.stringify({ path: this.path, page: this.page })
  }

  /**
   * Gets the reply.
   *
   * @param   {Telegraf}  ctx  The context
   * @return  {Object}         The reply.
   */
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

  /**
   * Constructs the object.
   *
   * @param   {Array}   files    The files
   * @param   {Object}  options  The options
   * @return  {this}
   */
  constructor (files, options) {
    this.files = files
    this.options = options

    return this
  }

  /**
   * Gets the page.
   *
   * @return  {Object}  The page.
   */
  get page () {
    return this.files.slice(
      this.options.page * this.options.pageSize,
      this.options.page * this.options.pageSize + this.options.pageSize
    ).map(this.makeButton)
  }

  /**
   * Gets the keyboard chunk for page.
   *
   * @param   {Number}  page  The page
   * @return  {Object}        The keyboard.
   */
  getKeyboard (page) {
    this.options.page = page
    return this.addNavigation(this.page)
  }

  /**
   * Adds a navigation to the list.
   *
   * @param   {Array}   list    The list
   * @return  {Array}
   */
  addNavigation (list) {
    list.push(new TgButton('Next >', '/next', this.options.page === this.options.pagesCount))
    list.push(new TgButton('Last >>>', '/last', this.options.page === this.options.pagesCount))

    list = list.reverse()

    list.push(new TgButton('< Prev', '/prev', this.options.page === 0))
    list.push(new TgButton('<<< First', '/first', this.options.page === 0))

    return list.reverse()
  }

  /**
   * Makes a single button object.
   *
   * @param   {String}    file    The file
   * @param   {Number}    idx     The index
   * @return  {TgButton}
   */
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

  /**
   * Constructs the object.
   *
   * @param   {String}    text    The text
   * @param   {Function}  cb      THe callback func
   * @param   {boolean}   hidden  The hidden
   * @return  {this}
   */
  constructor (text, cb, hidden = false) {
    this.text = text
    this.callback_data = cb
    this.hide = hidden

    return this
  }

}

/**
 * Create the new Telegraf message
 *
 * @type   {Telegraf}
 */
const app = new Telegraf(
  process.env.BOT_TOKEN,
  {
    username: process.env.BOT_NAME,
  }
)

/**
 * Create the new State instance
 *
 * @type  {TgState}
 */
const state = new TgState(process.env.BOT_ROOT_FOLDER)

/**
 * The start command
 */
app.command('start', ctx =>
  state.getReply(ctx)
)

/**
 * The next page action
 */
app.action('/next', ctx => {
  state.page += 1
  return state.getReply(ctx)
})

/**
 * The previuos page action
 */
app.action('/prev', ctx => {
  state.page -= 1
  return state.getReply(ctx)
})

/**
 * Get the first page
 */
app.action('/first', ctx => {
  state.page = 0
  return state.getReply(ctx)
})

/**
 * Get the last page
 */
app.action('/last', ctx => {
  state.page = state.pagesCount
  return state.getReply(ctx)
})

/**
 * Get a media file
 */
app.action(/^\/get\/(.*)$/, ctx => {
  let filename = state.folderFiles[ctx.match[1]]

  console.log(`${filename} by ${ctx.from.first_name} @${ctx.from.username}`)

  if (!filename) return ctx.reply('Error')

  fs.readFile(`${state.path}/${filename}`, (err, data) => {
    if (err) throw err

    return ctx.replyWithAudio({
      source: data,
    })
  })
})

/**
 * Start the bot
 */
app.startPolling()
