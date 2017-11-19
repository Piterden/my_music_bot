'use strict'

require('dotenv').config()

const fs = require('fs')
const Telegraf = require('telegraf')
const { session } = require('telegraf')

const TgState = require('./src/TgState')

/**
 * Create the new Telegraf instance
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

app.use(session())

/**
 * Register logger middleware
 */
app.use((ctx, next) => {
  let start = new Date()
  return next().then(() => {
    let ms = new Date() - start
    let command = ctx.update[ctx.updateType].text || ctx.update[ctx.updateType].data
    console.log(
      `${command} ${ctx.from.first_name} @${ctx.from.username} | Response time %sms`,
      ms
    )
  })
})

/**
 * The start command
 */
app.start(ctx => state.getReply(ctx))

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
 * The first page action
 */
app.action('/first', ctx => {
  state.page = 0
  return state.getReply(ctx)
})

/**
 * The last page action
 */
app.action('/last', ctx => {
  state.page = state.total
  return state.getReply(ctx)
})

/**
 * Get a media file
 */
app.action(/^\/get\/(.*)$/, ctx => {
  let filename = state.folderFiles[ctx.match[1]]

  // console.log(`${filename} by ${ctx.from.first_name} @${ctx.from.username}`)

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
