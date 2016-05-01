const { EventEmitter } = require('events')
const irc = require('irc')

const formatMessage = event => ({
  raw: event,
  author: { name: event.from },
  text: event.message
})

function IRC (config) {
  const emitter = new EventEmitter()

  const client = new irc.Client(config.host, config.name, {
    channels: config.channels
  })

  const channelsIndex = config.channels.reduce((index, channel) => (index[channel] = true, index), {})
  const onError = err => emitter.emit('error', err)

  const onMessage = (from, to, message) =>
    channelsIndex[to] && emitter.emit('message', formatMessage({ from, to, message }))

  client.on('message', onMessage)
  client.on('error', onError)

  emitter.mention = user => user.name
  emitter.address = (user, text) => `${emitter.mention(user)}: ${text}`

  emitter.isMentionned = (user, message) =>
    message.text.toLowerCase().split(/\s+/).includes(user.name.toLowerCase())

  emitter.send = (message, text) =>
    client.say(message.raw.to, text)

  emitter.reply = (message, text) =>
    emitter.send(message, emitter.address(message.user, text))

  emitter.messageRoom = (room, text) =>
    client.say(room, text)

  emitter.end = () => client.end()

  return emitter
}

module.exports = IRC
