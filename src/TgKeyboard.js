'use strict'

const TgButton = require('./TgButton')

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
  constructor (files, options = { pagesTotal: 0, page: 0 }) {
    this.files = files
    this.options = options

    return this
  }

  /**
   * Getter for the page.
   *
   * @return  {Object}  The page.
   */
  get page () {
    let self = this

    return self.files
      .slice(
        self.options.page * self.options.pageSize,
        self.options.page * self.options.pageSize + self.options.pageSize
      )
      .map((file) => new TgButton(
        file,
        `/get/${self.files.indexOf(file)}`,
        false
      ))
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
    list.push(new TgButton('Next >', '/next', this.options.page === this.pagesTotal))
    list.push(new TgButton('Last >>>', '/last', this.options.page === this.pagesTotal))

    list = list.reverse()

    list.push(new TgButton('< Prev', '/prev', this.options.page === 0))
    list.push(new TgButton('<<< First', '/first', this.options.page === 0))

    return list.reverse()
  }

}

module.exports = TgKeyboard
