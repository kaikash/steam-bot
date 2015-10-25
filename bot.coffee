module.exports = () ->
  Steam = require('steam')
  SteamTradeOffers = require('steam-tradeoffers')
  yaml = require('js-yaml')
  fs = require('fs')

  @ready = false
  events = []
  # eventNames: []
  @on = (eventNames, func) =>
    for eventName in eventNames.split(",")
      if events[eventName] == undefined
        events[eventName] = []
      events[eventName].push func
  @trigger = (eventName, args, th) =>
    if events[eventName] != undefined
      for func in events[eventName]
        if th != undefined
          func.call(th, args)
        else
          func.call(th, args)
  thon = @on
  thtrigger = @trigger
  
  try
    config = yaml.safeLoad(fs.readFileSync('./config.yaml', 'utf8'))
  catch e
    console.log e
  logOnOptions = 
    accountName: config.account_name
    password: config.password
  if require('fs').existsSync(config.sentry_filname)
    logOnOptions['shaSentryfile'] = require('fs').readFileSync(config.sentry_filname)
  steam = new (Steam.SteamClient)
  offers = new SteamTradeOffers
  steam.logOn logOnOptions
  steam.on 'debug', console.log
  steam.on 'loggedOn', (result) ->
    console.log 'Logged in!'
    steam.setPersonaState Steam.EPersonaState.Online
  steam.on 'webSessionID', (sessionID) ->
    steam.webLogOn (newCookie) ->
      offers.setup {
        sessionID: sessionID
        webCookie: newCookie
      }, (err) ->
        if err
          throw err
        @ready = true
        console.log 'You are ready!'
        thtrigger 'ready'

  @getInventory = (appId, callback) ->
    unless @ready
      return callback {error: 1, error_message: 'Bot is not ready'}, 500
    offers.loadMyInventory {
      appId: appId
      contextId: 2
      language: 'russian'
      tradableOnly: true
    }, (err, items) ->
      if err
        return callback {error: 1, error_message: err.message}, 500
      callback items, 200

  @sendRandomItem = (steamId, accessToken, appId, message, callback) ->
    unless @ready
      return callback {error: 1, error_message: 'Bot is not ready'}, 500
    offers.loadMyInventory {
      appId: appId
      language: 'russian'
      tradableOnly: true
      contextId: 2
    }, (err, items) ->
      item = undefined
      i = 0
      while i < items.length
        if items[i].tradable
          item = items[i]
          break
        i++
      if item
        offers.makeOffer {
          partnerSteamId: steamId
          accessToken: accessToken
          itemsFromMe: [ {
            appid: appId
            contextid: 2
            amount: 1
            assetid: item.id
          } ]
          itemsFromThem: []
          message: 'This is a test'
        }, (err, response) ->
          if err
            return callback {error: 1, error_message: err.message}, 500
          return callback response, 200
      else
        callback {error: 1, error_message: 'No items'}, 400

  @sendItem = (itemId, steamId, accessToken, appId, message, callback) ->
    unless @ready
      return callback {error: 1, error_message: 'Bot is not ready'}, 500
    offers.makeOffer {
      partnerSteamId: steamId
      accessToken: accessToken
      itemsFromMe: [ {
        appid: appId
        contextid: 2
        amount: 1
        assetid: itemId
      } ]
      itemsFromThem: []
      message: message
    }, (err, response) ->
      if err
        return callback {error: 1, error_message: err.message}, 500
      callback response, 200

  steam.on 'sentry', (data) ->
    require('fs').writeFileSync config.sentry_filname, data
    return
  return @



