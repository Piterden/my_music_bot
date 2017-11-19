'use strict'

require('dotenv').config()

const fs = require('fs')
const Telegraf = require('telegraf')
const { Markup, Extra } = require('telegraf')

const TgState = require('./src/TgState')

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
app.command('start', ctx => state.getReply(ctx))

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
