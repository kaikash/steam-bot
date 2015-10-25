(function() {
  module.exports = function() {
    var Steam, SteamTradeOffers, config, e, error, events, fs, logOnOptions, offers, steam, thon, thtrigger, yaml;
    Steam = require('steam');
    SteamTradeOffers = require('steam-tradeoffers');
    yaml = require('js-yaml');
    fs = require('fs');
    this.ready = false;
    events = [];
    this.on = (function(_this) {
      return function(eventNames, func) {
        var eventName, j, len, ref, results;
        ref = eventNames.split(",");
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          eventName = ref[j];
          if (events[eventName] === void 0) {
            events[eventName] = [];
          }
          results.push(events[eventName].push(func));
        }
        return results;
      };
    })(this);
    this.trigger = (function(_this) {
      return function(eventName, args, th) {
        var func, j, len, ref, results;
        if (events[eventName] !== void 0) {
          ref = events[eventName];
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            func = ref[j];
            if (th !== void 0) {
              results.push(func.call(th, args));
            } else {
              results.push(func.call(th, args));
            }
          }
          return results;
        }
      };
    })(this);
    thon = this.on;
    thtrigger = this.trigger;
    try {
      config = yaml.safeLoad(fs.readFileSync('./config.yaml', 'utf8'));
    } catch (error) {
      e = error;
      console.log(e);
    }
    logOnOptions = {
      accountName: config.account_name,
      password: config.password
    };
    if (require('fs').existsSync(config.sentry_filname)) {
      logOnOptions['shaSentryfile'] = require('fs').readFileSync(config.sentry_filname);
    }
    steam = new Steam.SteamClient;
    offers = new SteamTradeOffers;
    steam.logOn(logOnOptions);
    steam.on('debug', console.log);
    steam.on('loggedOn', function(result) {
      console.log('Logged in!');
      return steam.setPersonaState(Steam.EPersonaState.Online);
    });
    steam.on('webSessionID', function(sessionID) {
      return steam.webLogOn(function(newCookie) {
        return offers.setup({
          sessionID: sessionID,
          webCookie: newCookie
        }, function(err) {
          if (err) {
            throw err;
          }
          this.ready = true;
          console.log('You are ready!');
          return thtrigger('ready');
        });
      });
    });
    this.getInventory = function(appId, callback) {
      if (!this.ready) {
        return callback({
          error: 1,
          error_message: 'Bot is not ready'
        }, 500);
      }
      return offers.loadMyInventory({
        appId: appId,
        contextId: 2,
        language: 'russian',
        tradableOnly: true
      }, function(err, items) {
        if (err) {
          return callback({
            error: 1,
            error_message: err.message
          }, 500);
        }
        return callback(items, 200);
      });
    };
    this.sendRandomItem = function(steamId, accessToken, appId, message, callback) {
      if (!this.ready) {
        return callback({
          error: 1,
          error_message: 'Bot is not ready'
        }, 500);
      }
      return offers.loadMyInventory({
        appId: appId,
        language: 'russian',
        tradableOnly: true,
        contextId: 2
      }, function(err, items) {
        var i, item;
        item = void 0;
        i = 0;
        while (i < items.length) {
          if (items[i].tradable) {
            item = items[i];
            break;
          }
          i++;
        }
        if (item) {
          return offers.makeOffer({
            partnerSteamId: steamId,
            accessToken: accessToken,
            itemsFromMe: [
              {
                appid: appId,
                contextid: 2,
                amount: 1,
                assetid: item.id
              }
            ],
            itemsFromThem: [],
            message: 'This is a test'
          }, function(err, response) {
            if (err) {
              return callback({
                error: 1,
                error_message: err.message
              }, 500);
            }
            return callback(response, 200);
          });
        } else {
          return callback({
            error: 1,
            error_message: 'No items'
          }, 400);
        }
      });
    };
    this.sendItem = function(itemId, steamId, accessToken, appId, message, callback) {
      if (!this.ready) {
        return callback({
          error: 1,
          error_message: 'Bot is not ready'
        }, 500);
      }
      return offers.makeOffer({
        partnerSteamId: steamId,
        accessToken: accessToken,
        itemsFromMe: [
          {
            appid: appId,
            contextid: 2,
            amount: 1,
            assetid: itemId
          }
        ],
        itemsFromThem: [],
        message: message
      }, function(err, response) {
        if (err) {
          return callback({
            error: 1,
            error_message: err.message
          }, 500);
        }
        return callback(response, 200);
      });
    };
    steam.on('sentry', function(data) {
      require('fs').writeFileSync(config.sentry_filname, data);
    });
    return this;
  };

}).call(this);
