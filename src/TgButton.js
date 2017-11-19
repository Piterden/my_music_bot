'use strict'

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
   * @param   {String}    cb      The callback func
   * @param   {boolean}   hidden  Is hidden
   * @return  {this}
   */
  constructor (text, cb, hidden = false) {
    this.text = text
    this.callback_data = cb
    this.hide = hidden

    return this
  }

}

module.exports = TgButton
