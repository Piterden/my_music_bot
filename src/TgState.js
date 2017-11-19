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
    let self = this

    this.options = Object.assign({ pageSize: 10 }, options)
    this.path = path
    this.page = page

    fs.readdir(path, async (err, files) => {
      if (err) throw err

      self.folderFiles = await files

      self.keyboard = new TgKeyboard(files, {
        path,
        page,
        pageSize: self.options.pageSize,
        total: self.total
      })
    })

    return this
  }

  /**
   * Get the count of pages
   *
   * @return  {Number}
   */
  get total () {
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

module.exports = TgState
