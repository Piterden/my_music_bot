require('dotenv').config()

const fs = require('fs')
const Telegraf = require('telegraf')
const { Markup, Extra } = require('telegraf')

const app = new Telegraf(
  process.env.BOT_TOKEN,
  { username: process.env.BOT_NAME }
)

app.$options = {
  pageSize: 10,
}

app.$state = {
  path: '/home/den/Music',
  page: 0,
  folderButtons: [],
  folderFiles: () => app.$state.folderButtons.map(button => button.text),
  length: () => app.$state.folderButtons.length,
  pagesCount: () => parseInt(app.$state.length / app.$options.pageSize)
}

const addNavigationButtons = (list) => {
  list.push({ text: 'Next >', callback_data: '/next', hide: app.$state.page === app.$state.pagesCount() })
  list.push({ text: 'Last >>>', callback_data: '/last', hide: app.$state.page === app.$state.pagesCount() })

  list = list.reverse()

  list.push({ text: '< Prev', callback_data: '/prev', hide: app.$state.page === 0 })
  list.push({ text: '<<< First', callback_data: '/first', hide: app.$state.page === 0 })

  return list.reverse()
}

const getKeyboard = (path, page) => {
  if (!app.$state.folderButtons.length) {
    app.$state.folderButtons = fs.readdirSync(path).map((file, idx) => ({
      text: file,
      callback_data: `/get/${idx}`,
      hide: false,
    }))
  }

  return addNavigationButtons(
    app.$state.folderButtons.slice(
      page * app.$options.pageSize,
      page * app.$options.pageSize + app.$options.pageSize
    )
  )
}

const getMarkup = (ctx) =>
  Extra.HTML().markup(markup =>
    markup.inlineKeyboard(
      getKeyboard(ctx.path, ctx.page),
      { wrap: (btn, index, currentRow) => currentRow.length <= 1 }
    )
  )

const getStateInfo = (state) =>
  JSON.stringify({ path: state.path, page: state.page })

const getReply = (ctx) =>
  ctx.reply(getStateInfo(app.$state), getMarkup(app.$state))

const getAudioReply = (ctx) =>
  ctx.replyWithAudio()

const getState = () =>
  app.$state

app.command('start', ctx =>
  getReply(ctx)
)

app.action('/next', ctx => {
  app.$state.page += 1
  return getReply(ctx)
})

app.action('/prev', ctx => {
  app.$state.page -= 1
  return getReply(ctx)
})

app.action('/first', ctx => {
  app.$state.page = 0
  return getReply(ctx)
})

app.action('/last', ctx => {
  app.$state.page = app.$state.pagesCount()
  return getReply(ctx)
})

app.action(/^\/get\/(.*)$/, ctx => {
  let filename = app.$state.folderFiles()[ctx.match[1]]
  console.log(filename)
  if (typeof filename === 'undefined') return ctx.reply('Error')
  return ctx.replyWithAudio({ source: fs.readFileSync(`${app.$state.path}/${filename}`) })
})

app.startPolling()
