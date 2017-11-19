'use strict'

require('dotenv').config()

const fs = require('fs')
const Telegraf = require('telegraf')
const { session } = require('telegraf')

const TgState = require('./src/TgState')
const TgLogger = require('./src/TgLogger')

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


/**
 * Register middlewares
 */
app.use(session())
app.use((ctx, next) => new TgLogger(ctx, next))

/**
 * The start command
 */
app.start(ctx => state.getReply(ctx))

/**
 * The refresh page action
 */
app.action('/refresh', ctx => {
  state.update
  return state.getReply(ctx)
})

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
  state.page = state.pagesTotal
  return state.getReply(ctx)
})

/**
 * Get a media file
 */
app.action(/^\/get\/(.*)$/, ctx => {
  let filename = state.folderFiles[ctx.match[1]]

  if (!filename) return ctx.reply('Error! File not found.')

  let stream = fs.createReadStream(
    `${state.path}/${filename}`,
    { encoding: 'UTF-8' }
  )

  let interval = 1024

  stream.on('data', () => {
    let kb = stream.bytesRead / 1024
    if (kb >= interval) {
      ctx.answerCbQuery(`Received ${kb} Kb`)
      // console.log(stream.bytesRead / 1024 + ' Kb')
      interval += 1024
    }
  })

  console.log()
  // console.log(`${filename} by ${ctx.from.first_name} @${ctx.from.username}`)

  if (fs.existsSync(`${state.path}/${filename}`)) {
    ctx.replyWithAudio({
      source: stream,
    })
  }
  // fs.readFile(`${state.path}/${filename}`, (err, data) => {
  //   if (err) throw err

  // })
})

fs.watch(process.env.BOT_ROOT_FOLDER, (eventType, filename) => {
  console.log(`event type is: ${eventType}`)
  if (filename) {
    console.log(`filename provided: ${filename}`)
  } else {
    console.log('filename not provided')
  }
})

/**
 * Start the bot
 */
app.startPolling()
