'use strict'

const fs = require('fs')
const { Extra } = require('telegraf')
const TgKeyboard = require('./TgKeyboard')

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

    this.options = Object.assign({ pageSize: 10 }, options)
    this.path = path
    this.page = page

    this.updateDirInfo()

    return this
  }

  /**
   * Quarantin
   */
  updateDirInfo () {
    let self = this

    fs.readdir(this.path, async (err, files) => {
      if (err) throw err

      self.folderFiles = await files

      self.keyboard = new TgKeyboard(files, this.attrs)
    })
  }

  /**
   * Get options attributes
   *
   * @return  {Object}
   */
  get attrs () {
    return {
      path: this.path,
      page: this.page,
      pageSize: this.options.pageSize,
      pagesTotal: this.pagesTotal
    }
  }

  /**
   * Get the count of pages
   *
   * @return  {Number}
   */
  get pagesTotal () {
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
        {
          wrap: (btn) => !btn.callback_data.match(/^\/last|\/prev$/),
        }
      )
    )
  }

  /**
   * Get state info string
   *
   * @return  {String}
   */
  get stateInfo () {
    return `<pre>${
      JSON.stringify(this.attrs)
        .replace(/,/g, ',\n  ')
        .replace(/\{/g, '{\n  ')
        .replace(/}/g, '\n}')}</pre>`
  }

  /**
   * Gets the reply.
   *
   * @param   {Telegraf}  ctx  The context
   * @return  {Object}         The reply.
   */
  getReply (ctx) {
    return ctx.reply(this.stateInfo, this.markup, '<b>HHHHH</b>')
  }

}

module.exports = TgState
