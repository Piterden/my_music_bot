'use strict'

// const fs = require('fs')
// const { Extra } = require('telegraf')
// const TgKeyboard = require('./TgKeyboard')

/**
 * Class for telegraf logger.
 *
 * @class  {TgLogger}
 */
class TgLogger
{

  /**
   * Constructs the object.
   *
   * @return  {this}
   */
  constructor (ctx, next) {
    return new Promise((resolve, reject) => {
      let start = new Date()

      resolve(
        next()
        .then(() => {
          let ms = new Date() - start
          let command = ctx.update[ctx.updateType].text ||
            ctx.update[ctx.updateType].data

          console.log(
            `${command} | ` +
            `${ctx.from.first_name} | ` +
            `${ctx.from.last_name || ''} | ` +
            `@${ctx.from.username} | ` +
            'Response time %sms',
            ms
          )
        })
        .catch((err) => reject(err))
      )
    })
  }

}

module.exports = TgLogger
