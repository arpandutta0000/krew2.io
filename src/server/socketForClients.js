global.maxAmountCratesInSea = 1100;
global.minAmountCratesInSea = 480;
// var serverjs = require('./server')
var thuglife = require('./thuglife/thuglife.js');
var login = require('./auth/login.js');
var xssFilters = require('xss-filters');
var https = require('https');
var http = require('http');
var request = require('request');
var fs = require('fs');
var Filter = require('bad-words'),
  filter = new Filter();
var mongo = require('./core/core_mongo_functions');
//var firebase = require('./core/core_firebase_connection');
lzString = require('./../client/assets/js/lz-string.min');

// Auth0 vars
var auth0AccessToken

var serverStartTimestamp = Date.now();
console.log('UNIX Timestamp for server start: ' + serverStartTimestamp);

// additional bad words which need to be filtered
var newBadWords = ['idiot', '2chOld', 'Yuquan'];
filter.addWords(...newBadWords);

// configure socket
if (global.io === undefined) {
  var server = process.env.NODE_ENV === 'production'? https.createServer({
       key: fs.readFileSync('/etc/letsencrypt/live/krew.io/privkey.pem'),
       cert: fs.readFileSync('/etc/letsencrypt/live/krew.io/fullchain.pem'),
       requestCert: false,
       rejectUnauthorized: false
      }) : http.createServer();

  global.io = require('socket.io')(server, { origins: '*:*' });
  server.listen(process.env.port);
}

// function for creating timestamp (for logging)
function get_timestamp() {
  return new Date().toUTCString() + ' | ';
}

// function to check if a string is alphanumeric
function isAlphaNumeric(str) {
  var code, i, len;

  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i);
    if (
      !(code > 47 && code < 58) && // numeric (0-9)
      !(code > 64 && code < 91) && // upper alpha (A-Z)
      !(code > 96 && code < 123)
    ) {
      // lower alpha (a-z)
      return false;
    }
  }
  return true;
}

// webhook for discord messages
if (!DEV_ENV) {
  var webhook = require('webhook-discord');
  var Hook = new webhook.Webhook(
    'https://discordapp.com/api/webhooks/630905060242620416/uJOe1iKmetl_SOxhXnSks1ktpPnuiPvBslueJdVW7Gx9rww02UjCtXuiA4BNcm54_fYm'
  );
}
console.log('listening to socket port', process.env.port);
console.log(process.env.port);
//io = require('socket.io').listen(process.env.port);

// define here (for server side) who is Admin and/or Mod
Admins = ['devclied', 'LeoLeoLeo', 'DamienVesper', 'itsdabomb'];
Mods = ['Fiftyyyyy', 'Sloth', 'Sjmun', 'TheChoco', 'Kekmw', 'Headkeeper'];
Devs = ['yaz'];

// create player in the world
// Test environment
if (TEST_ENV) {
  setTimeout(function () {
    var playerEntity;
    for (var i = 0; i < 100; i++) {
      playerEntity = core.createPlayer({});
      login.allocatePlayerToBoat(playerEntity);
    }
  }, 5000);
}

// Array for reported IPs
const reportedIps = [];
const gameCookies = {};

// socket connection between client and server
io.on('connection', function (socket) {

  var krewioData;

  var socketId = serializeId(socket.id);

  // send a handshake to say hello. contains player id
  socket.emit('handshake', {
    socketId: socketId,
  });

  var playerEntity;

  function initSocketForPlayer(data) {
    if (playerEntity) {
      // console.log(get_timestamp() + 'fraudulent creation message, we already made a player entity for this socket');
      return;
    }
    if (!data.name) {
      data.name = '';
    }

    // check if player IP is in (temporary) ban list. If yes, disconnect
    let projection = { _id: 0, IP: 1, playerName: 1 };
    mongo.ReturnAll('bannedips', projection, function (callback) {
      for (let i in callback) {
        if (socket.handshake.address === callback[i]['IP'] || data.name === callback[i]['playerName']) {
          console.log(get_timestamp() + 'Detected banned IP ' + socket.handshake.address + ' attempting to connect. Disconnecting ' + data.name);
          socket.emit('showCenterMessage', 'You have been banned... Contact us on Discord', 1, 60000);
          socket.banned = true;
          socket.disconnect();
        }
      }
      // VPN checking logic (only for players who are NOT logged in and who are playing on server 1)
      if (socket.banned !== true && data.name === '' && socket.handshake.headers['host'].substr(-4) === '2000') {
        mongo.ReturnSingleValue('ipwhitelist', {IP: socket.handshake.address}, function (callback) {
          if (callback) {
            console.log(get_timestamp() + 'CACHE HIT, NO VPN:', socket.handshake.address);
          } else {
            // check if player is using VPN to hide
            request('http://check.getipintel.net/check.php?ip=' + socket.handshake.address.substring(7) + '&contact=dzony@gmx.de&flags=f&format=json', {json: true}, (err, res, body) => {
              if (err) {
                return console.log(err);
              }
              if (body && body['status'] === 'success' && parseInt(body['result']) === 1) {
                socket.emit('showCenterMessage', 'Disable VPN to play this game', 1, 60000);
                console.log(get_timestamp() + 'VPN connection. Disconnecting IP', socket.handshake.address);
                // add the IP to the temporary ban list to prevent exploiters from spamming join requests (API call limit for VPN check)
                let obj = {
                  timestamp: new Date(new Date().toISOString()),
                  IP: socket.handshake.address,
                  comment: 'auto VPN temp ban',
                };
                mongo.InsertOne('bannedips', obj);
                socket.disconnect();
              } else {
                if (body) {
                  if (body['status'] !== 'success') {
                    console.log(get_timestamp() + 'API CALL FAILED:', body);
                  } else {
                    console.log(get_timestamp() + 'IP address is ok. Adding to cached whitelist | IP:', socket.handshake.address);
                    mongo.ReturnResultAndUpdate(
                      'ipwhitelist',
                      {IP: socket.handshake.address},
                      {
                        $set: {
                          IP: socket.handshake.address,
                          timestamp: new Date(new Date().toISOString()),
                        },
                      },
                      true,
                      function (callback) {
                        if (callback['ok'] !== 1) {
                          console.log(get_timestamp() + 'MONGO ERROR: Could not add IP to whitelist:', socket.handshake.address
                          );
                        }
                      }
                    );
                  }
                } else {
                  console.log(get_timestamp() + 'No response from getipintel. Assuming that IP address is ok. No whitelisting | IP:', socket.handshake.address);
                }
              }
            });
          }
        });
      }
    });

    if (!DEV_ENV) {
      // check if cookie has been blocked
      if (data.cookie !== undefined && data.cookie !== '') {
        // check if the cookie has already created a player
        if (Object.values(gameCookies).includes(data.cookie)) {
          console.log(get_timestamp() + 'Trying to spam multiple players...', socket.handshake.address);
          return;
        }
        // add the players cookie to the cookie dictionary
        gameCookies[socketId] = data.cookie;
      }
    }

    // create player in the world
    data.socketId = socketId;
    playerEntity = core.createPlayer(data);
    playerEntity.socket = socket;
    // check if logged in user is coming from "last_ip"
    if (process.env.NODE_ENV !== 'dev' && data.last_ip && !(playerEntity.socket.handshake.address.includes(data.last_ip))) {
      console.log(get_timestamp() + 'Player', playerEntity.name, 'connecting from different IP than login. Kick | IP:', playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber)
      playerEntity.socket.disconnect()
      return;
    }
    // which server is the player playing
    playerEntity.serverNumber = playerEntity.socket.handshake.headers['host'].substr(-4) === '2001' ? 1 : 2;
    playerEntity.sellCounter = 0;
    if (playerEntity.socket.request.headers['user-agent'] && playerEntity.socket.handshake.address) {
      console.log(get_timestamp() + 'Creation of new player:', playerEntity.name, '| IP:', playerEntity.socket.handshake.address, '| UA:', playerEntity.socket.request.headers['user-agent'], 'Origin:', playerEntity.socket.request.headers['origin'], '| Server' + playerEntity.serverNumber);
    }
    if (data.hacker === true) {
      console.log(get_timestamp() + 'Exploit detected (modified client script / wrong emit). Player name:', playerEntity.name, '| IP:', socket.handshake.address);
      var hackerQuery = { IP: playerEntity.socket.handshake.address };
      if (playerEntity.isLoggedIn === true) {
        // create a record in mongoDB for the logged in player to remember him as hacker
        var hackerObj = {
          $setOnInsert: {
            // playerNames: [playerEntity.name],
            IP: playerEntity.socket.handshake.address,
          },
          $inc: { loginCount: 1 },
          $push: { playerNames: playerEntity.name },
          $set: { lastLogin: new Date(new Date().toISOString()) },
        };
      } else {
        // check if the IP is already in hackers mongoDB list
        hackerObj = {
          $setOnInsert: {
            playerNames: [],
            IP: playerEntity.socket.handshake.address,
          },
          $inc: { loginCount: 1 },
          $set: { lastLogin: new Date(new Date().toISOString()) },
        };
      }
      mongo.UpdateOneWithQuery(
        'hackers',
        hackerQuery,
        hackerObj,
        true,
        function (callback) {
          // TODO: validate callback from mongo
        }
      );

    }

    if (playerEntity.isLoggedIn === true) {
      // create a record in mongoDB in case player does not exist there yet
      var query = { playerName: playerEntity.name };
      var myobj = {
        $setOnInsert: {
          playerName: playerEntity.name,
          isAdmin: false,
          gold: 0,
          highscore: 0,
          playerLevel: 0,
          overall_kills: 0,
          deaths: 0,
          clan: '',
          clanLeader: false,
          clanOwner: false,
          clanRequest: '',
          firstLogin: new Date(new Date().toISOString()),
          restore: {
            tempTimestamp: 0,
            tempGold: 0,
            tempXP: 0,
            tempFireRate: 0,
            tempDistance: 0,
            tempDamage: 0,
            tempScore: 50,
            tempShipsSank: 0,
            tempDeaths: 0,
            tempIsCaptain: false,
            tempShipId: 0,
            tempItemId: 0,
            tempFireRateBonus: 0,
            tempDistanceBonus: 0,
            tempDamageBonus: 0,
            tempMovementSpeedBonus: 0,
          },
        },
        $inc: { loginCount: 1 },
        $set: { lastLogin: new Date(new Date().toISOString()) },
      };
      mongo.UpdateOneWithQuery('players', query, myobj, true, function (
        callback
      ) {
        // TODO: validate callback from mongo
      });

      // only start restore process if server start was less than 5 minutes ago
      if (Date.now() - serverStartTimestamp < 300000) {
        var playerQuery = { playerName: playerEntity.name };
        var playerobj = {
          $set: {
            restore: {
              tempTimestamp: 0,
              tempGold: 0,
              tempXP: 0,
              tempFireRate: 0,
              tempDistance: 0,
              tempDamage: 0,
              tempScore: 50,
              tempShipsSank: 0,
              tempDeaths: 0,
              tempIsCaptain: false,
              tempShipId: 0,
              tempItemId: 0,
              tempFireRateBonus: 0,
              tempDistanceBonus: 0,
              tempDamageBonus: 0,
              tempMovementSpeedBonus: 0,
            },
          },
        };
        // update players gold in the bank (from mongo db) and stored state (in case available)
        mongo.ReturnResultAndUpdate('players', playerQuery, playerobj, false, function (callback) {
            let result = callback['value'];
            if (result) {
              playerEntity.bank.deposit = result['gold'];
              playerEntity.highscore =
                result['highscore'] !== undefined ? result['highscore'] : 0;
              playerEntity.clan = result['clan'] !== '' ? result['clan'] : '';
              playerEntity.clanOwner = result['clanOwner'] === true;
              playerEntity.clanLeader = result['clanLeader'];
              playerEntity.clanRequest = result['clanRequest'];
              playerEntity.firstLogin = result['firstLogin'];
              if (playerEntity.isCaptain === true) {
                playerEntity.parent.clan =
                  callback['clan'] !== '' ? callback['clan'] : '';
              }
              if (result['banned'] !== undefined && result['banned'] === true) {
                console.log(
                  get_timestamp() +
                    'Detected banned player account: ' +
                    playerEntity.name +
                    ' | IP: ' +
                    socket.handshake.address
                );
                playerEntity.socket.emit(
                  'showCenterMessage',
                  'Your account has been banned... Contact us on Discord',
                  1,
                  60000
                );
                playerEntity.socket.disconnect();
              }
              // update only if !!save command was less than 5 minutes ago
              if (Date.now() - result['restore']['tempTimestamp'] < 300000) {
                playerEntity.gold = result['restore']['tempGold'];
                playerEntity.experience = result['restore']['tempXP'];
                playerEntity.points['fireRate'] =
                  result['restore']['tempFireRate'];
                playerEntity.points['distance'] =
                  result['restore']['tempDistance'];
                playerEntity.points['damage'] = result['restore']['tempDamage'];
                playerEntity.score = result['restore']['tempScore'];
                playerEntity.shipsSank = result['restore']['tempShipsSank'];
                playerEntity.deaths = result['restore']['tempDeaths'];
                // refund player's ship price
                if (result['restore']['tempIsCaptain'] === true) {
                  playerEntity.gold +=
                    core.boatTypes[result['restore']['tempShipId']].price;
                }
                // restore player's item and bonus stats
                playerEntity.itemId = result['restore']['tempItemId'];
                playerEntity.attackSpeedBonus =
                  result['restore']['tempFireRateBonus'];
                playerEntity.attackDistanceBonus =
                  result['restore']['tempDistanceBonus'];
                playerEntity.attackDamageBonus =
                  result['restore']['tempDamageBonus'];
                playerEntity.movementSpeedBonus =
                  result['restore']['tempMovementSpeedBonus'];
              }
            }
          }
        );
      } else {
        mongo.ReturnSingleValue(
          'players',
          { playerName: playerEntity.name },
          function (callback) {
            playerEntity.bank.deposit = callback['gold'];
            playerEntity.highscore = callback['highscore'] !== undefined ? callback['highscore'] : 0;
            playerEntity.clan = callback['clan'] !== '' ? callback['clan'] : '';
            playerEntity.clanLeader = callback['clanLeader'];
            playerEntity.clanOwner = callback['clanOwner'] === true;
            playerEntity.clanRequest = callback['clanRequest'];
            playerEntity.firstLogin = callback['firstLogin'];
            if (playerEntity.isCaptain === true) {
              playerEntity.parent.clan = callback['clan'] !== '' ? callback['clan'] : '';
            }
            if (
              callback['banned'] !== undefined &&
              callback['banned'] === true
            ) {
              console.log(get_timestamp() + 'Detected banned player account: ' + playerEntity.name + ' | IP: ' + socket.handshake.address);
              playerEntity.socket.disconnect();
            }
          }
        );
      }
    }

    // depending on data.spawn: allocate player to a random krew, spawn on the sea or on a random island
    login.allocatePlayerToBoat(playerEntity, data.boatId, data.spawn);

    // received snapshot of entity
    socket.on('u', function (data) {
      playerEntity.parseSnap(data);
    });

    function check_player_status() {
      // check if player is on land
      if (playerEntity.parent.shipState === 1 || playerEntity.parent.shipState === 0) {
        console.log(get_timestamp() + 'Possible Exploit detected (buying from sea)', playerEntity.name, '| IP: ' + playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
      }
    }

    socket.on('get-stats', function (fn) {
      // gather all stats and return them to the client
      var stats = {};
      stats.shipsSank = playerEntity.shipsSank;
      stats.shotsFired = playerEntity.shotsFired;
      stats.shotsHit = playerEntity.shotsHit;
      stats.shotAccuracy = playerEntity.shotsHit / playerEntity.shotsFired;
      stats.overall_cargo = playerEntity.overall_cargo;
      stats.crew_overall_cargo = playerEntity.parent.overall_cargo;
      stats.overall_kills = playerEntity.parent.overall_kills;
      var json_stats = JSON.stringify(stats);
      fn(json_stats);
    });

    socket.on('chat message', function (msgData) {
      // check for spam
      if (msgData.message.length > 65 && !Mods.includes(playerEntity.name) && !Admins.includes(playerEntity.name)) {
        console.log(get_timestamp() + 'Exploit detected (spam). Player:', playerEntity.name, 'Adding IP ' + playerEntity.socket.handshake.address + ' to bannedIPs', '| Server' + playerEntity.serverNumber);
        console.log('Spam message:', msgData.message);
        if (playerEntity.socket.handshake.address.length > 5) {
          // add IP address to the temporary ban list
          myobj = {
            timestamp: new Date(new Date().toISOString()),
            IP: playerEntity.socket.handshake.address,
          };
          mongo.InsertOne('bannedips', myobj);
        }
        playerEntity.socket.disconnect();
      }

      var charLimit = function (text, chars, suffix) {
        chars = chars || 140;
        suffix = suffix || '';
        text = ('' + text).replace(/(\t|\n)/gi, '').replace(/\s\s/gi, ' ');
        if (text.length > chars) {
          return text
            .slice(0, chars - suffix.length)
            .replace(/(\.|\,|:|-)?\s?\w+\s?(\.|\,|:|-)?$/, suffix);
        }
        return text;
      };

      if((msgData.message.startsWith('//mute') || msgData.message.startsWith('//report') ||
        msgData.message.startsWith('//tempban') || msgData.message.startsWith('//ban')) &&
        !Mods.includes(playerEntity.name) && !playerEntity.isMod && !Admins.includes(playerEntity.name))
      {
        var hackerObjj = {
          IP: playerEntity.socket.handshake.address,
          loginCount: 0,
          playerName: playerEntity.name,
          comment: 'Tried to impersonate',
          lastLogin: new Date(new Date().toISOString())
        };
        firebase.UpdateOneWithQuery('hackers',playerEntity.socket.handshake.address,hackerObjj,true,function(callback){
            firebase.IncrementAndUpdate('hackers',playerEntity.socket.handshake.address,'loginCount',1,function(callback) {
                  var myobj = {
                      timestamp: new Date(new Date().toISOString()),
                      IP: playerEntity.socket.handshake.address,
                      comment: 'impersonation!'
                  };
                  firebase.InsertOne('bannedips',playerEntity.socket.handshake.address,myobj);
                  playerEntity.socket.disconnect();
            });
        });        
      }
      // implement reporting / kicking system for mods and give possibility to mute players
      if (msgData.message.startsWith('//report') && (Mods.includes(playerEntity.name) || Admins.includes(playerEntity.name))) {
        let reportedPlayer = msgData.message.split('.')[1];
        let reportReason = msgData.message.split('.')[2];
        for (let p in core.players) {
          if ('seadog' + reportedPlayer === core.players[p].name || reportedPlayer === core.players[p].name) {
            // check if player already has been reported. If yes --> kick
            if (reportedIps.includes(core.players[p].socket.handshake.address)) {
              core.players[p].socket.emit('showCenterMessage', 'You have been warned...', 1);
              console.log(get_timestamp() + 'Reporter ' + playerEntity.name + ' reported ' + core.players[p].name + ' second time --> kick | IP: ' + core.players[p].socket.handshake.address, '| Server' + playerEntity.serverNumber);
              Hook.warn('Second Report --> Kick', get_timestamp() + 'Reporter ' + playerEntity.name + ' reported ' + reportedPlayer + ' second time --> kick | IP: ' + core.players[p].socket.handshake.address, '| Server' + playerEntity.serverNumber);
              playerEntity.socket.emit('showCenterMessage', 'You kicked ' + core.players[p].name, 3, 10000);
              let reportedPlayerIp = core.players[p].socket.handshake.address;
              for (let a in core.players) {
                if (core.players[a].socket.handshake.address === reportedPlayerIp) {
                  core.players[a].socket.disconnect();
                }
              }
            } else {
              // display warning message to the reported player & add to reported IPs list
              core.players[p].socket.emit('showCenterMessage', 'You have been reported. Last warning!', 1);
              reportedIps.push(core.players[p].socket.handshake.address);
              playerEntity.socket.emit('showCenterMessage', 'You reported ' + core.players[p].name, 3, 10000);
              // log report and send to Discord web hook
              console.log(get_timestamp() + 'Reporter: ' + playerEntity.name + ' | Player reported: ' + core.players[p].name + ' --> ' + core.players[p].id + ' | Reason: ' + reportReason + ' | IP: ' + core.players[p].socket.handshake.address, '| Server' + playerEntity.serverNumber);
              Hook.warn('Reported Player', get_timestamp() + 'Reporter: ' + playerEntity.name + ' | Player reported: ' + reportedPlayer + ' --> ' + core.players[p].id + ' | Reason: ' + reportReason + ' | IP: ' + core.players[p].socket.handshake.address, '| Server' + playerEntity.serverNumber
              );
            }
          }
        }
        return;
      } else if (msgData.message.startsWith('//mute') && (Mods.includes(playerEntity.name) || Admins.includes(playerEntity.name))) {
        let mutedPlayer = msgData.message.split('.')[1];
        for (let p in core.players) {
          if (mutedPlayer === core.players[p].name || 'seadog' + mutedPlayer === core.players[p].name) {
            let mutedPlayerIp = core.players[p].socket.handshake.address;
            for (let a in core.players) {
              if (core.players[a].socket.handshake.address === mutedPlayerIp) {
                core.players[a].lastMessageSentAt = Date.now() + 300000; // no talkie for next 5 minutes
              }
            }
            core.players[p].socket.emit('showCenterMessage', 'You have been muted!', 1);
            console.log(get_timestamp() + 'Admin/Mod: ' + playerEntity.name + ' muted ' + core.players[p].name + ' --> ' + core.players[p].id + ' | IP: ' + core.players[p].socket.handshake.address, '| Server' + playerEntity.serverNumber);
            playerEntity.socket.emit('showCenterMessage', 'You muted ' + core.players[p].name, 3);
            Hook.warn('Muted Player', get_timestamp() + 'Admin/Mod: ' + playerEntity.name + ' muted ' + core.players[p].name + ' --> ' + core.players[p].id + ' | IP: ' + core.players[p].socket.handshake.address, '| Server' + playerEntity.serverNumber);
          }
        }
        return;
      }

      // implement //tempban command
      if (msgData.message.startsWith('//tempban') && (Mods.includes(playerEntity.name) || Admins.includes(playerEntity.name))) {
        let tempban_id = msgData.message.split('.')[1];
        let tempban_reason = msgData.message.split('.')[2];
        for (let p in core.players) {
          otherPlayer = core.players[p];
          if (tempban_id === otherPlayer.id || 'seadog' + tempban_id === otherPlayer.name || tempban_id === otherPlayer.name) {
            if (tempban_reason === undefined) {
              otherPlayer.socket.emit('showCenterMessage', 'You have been banned', 1);
              console.log(get_timestamp() + 'Admin/Mod: ' + playerEntity.name + ' temporary banned ' + otherPlayer.name + ' | IP: ' + core.players[p].socket.handshake.address, '| Server' + playerEntity.serverNumber);
            } else if (tempban_reason === 'no_message') {
              // do not display any message
            } else {
              otherPlayer.socket.emit('showCenterMessage', 'You have been banned. Reason: ' + tempban_reason, 1);
              console.log(get_timestamp() + 'Admin/Mod: ' + playerEntity.name + ' temporary banned ' + otherPlayer.name, '| Reason: ' + tempban_reason + ' | IP: ' + otherPlayer.socket.handshake.address, '| Server' + playerEntity.serverNumber);
            }
            // add IP address to the temporary ban list (add TTL timestamp in mongoDB). If player is logged in, add player name as well
            if (!otherPlayer.isLoggedIn === true) {
              myobj = {
                timestamp: new Date(new Date().toISOString()),
                playerName: otherPlayer.name,
                IP: otherPlayer.socket.handshake.address,
              };
            } else {
              myobj = {
                timestamp: new Date(new Date().toISOString()),
                IP: otherPlayer.socket.handshake.address,
              };
            }
            mongo.InsertOne('bannedips', myobj);
            // now kick all players who have the same IP as the violator
            let tempBanIp = otherPlayer.socket.handshake.address;
            for (let a in core.players) {
              if (core.players[a].socket.handshake.address === tempBanIp) {
                core.players[a].socket.disconnect();
              }
            }
            playerEntity.socket.emit('showCenterMessage', 'You temporary banned ' + otherPlayer.name, 3, 10000);
            Hook.warn('Temporary Ban Player', get_timestamp() + 'Admin/Mod: ' + playerEntity.name + ' temporary banned ' + otherPlayer.name + ' | IP: ' + otherPlayer.socket.handshake.address, '| Server' + playerEntity.serverNumber);
          }
        }
        return;
      }

      // implement //ban command for mods
      if (msgData.message.startsWith('//ban') && (Mods.includes(playerEntity.name) || Admins.includes(playerEntity.name))) {
        let ban_id = msgData.message.split('.')[1];
        let ban_reason = msgData.message.split('.')[2];

        for (let p in core.players) {
          otherPlayer = core.players[p];
          // only works for logged in users
          if (ban_id === otherPlayer.name && otherPlayer.isLoggedIn === true) {
            if (ban_reason === undefined) {
              otherPlayer.socket.emit('showCenterMessage', 'You have been banned', 1);
              console.log(get_timestamp() + 'Admin/Mod: ' + playerEntity.name + ' banned user account ' + otherPlayer.name + ' | IP: ' + core.players[p].socket.handshake.address, '| Server' + playerEntity.serverNumber);
            } else {
              otherPlayer.socket.emit('showCenterMessage', 'You have been banned. Reason: ' + ban_reason, 1);
              console.log(get_timestamp() + 'Admin/Mod: ' + playerEntity.name + ' banned user account' + otherPlayer.name, '| Reason: ' + ban_reason + ' | IP: ' + otherPlayer.socket.handshake.address, '| Server' + playerEntity.serverNumber);
            }
            // update player record in mongoDB to "banned: true"
            mongo.UpdateOneWithQuery('players', { playerName: otherPlayer.name }, { $set: { banned: true } }, false, function (res) {
                if (res['modifiedCount'] === 1) {
                  console.log(get_timestamp() + 'ADMIN BAN: Player account:', otherPlayer.name, '| Server' + playerEntity.serverNumber);
                } else {
                  console.log(get_timestamp() + 'Mongo Error: ban player account FAILED');
                }
              }
            );
            // now kick all players who have the same IP as the violator
            let banIp = otherPlayer.socket.handshake.address;
            for (let a in core.players) {
              if (core.players[a].socket.handshake.address === banIp) {
                core.players[a].socket.disconnect();
              }
            }
            playerEntity.socket.emit('showCenterMessage', 'You permanently banned ' + otherPlayer.name, 3, 10000);
            Hook.warn('Permanent Ban Player account', get_timestamp() + 'Admin/Mod: ' + playerEntity.name + ' banned user account ' + otherPlayer.name + ' | IP: ' + otherPlayer.socket.handshake.address, '| Server' + playerEntity.serverNumber);
          }
        }
        return;
      }

      // implement admin !!login
      if (msgData.message.startsWith('!!login') && Admins.includes(playerEntity.name)) {
        let loginMessage = msgData.message.split('.')[1];
        if (loginMessage === '2choven') {
          console.log(get_timestamp() + 'ADMIN LOGGED IN: ' + playerEntity.name + ' | IP: ' + playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
          playerEntity.isAdmin = true;
          playerEntity.socket.emit('showCenterMessage', 'Logged in successfully', 3, 10000);
        } else {
          console.log(get_timestamp() + 'ADMIN LOGIN FAILED! | IP: ' + playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
        }
        return;
      }

      if (
        msgData.message.startsWith('!!modlogin') &&
        Mods.includes(playerEntity.name)
      ) {
        let loginMessage = msgData.message.split('.')[1];
        if (loginMessage === 'pc123!@#') {
          console.log(
            get_timestamp() +
              'Mod LOGGED IN: ' +
              playerEntity.name +
              ' | IP: ' +
              playerEntity.socket.handshake.address,
            '| Server' + playerEntity.serverNumber
          );
          playerEntity.isMod = true;
          playerEntity.socket.emit(
            'showCenterMessage',
            'Logged in successfully',
            3,
            10000
          );
        } else {
          console.log(
            get_timestamp() +
              'Mod LOGIN FAILED! | IP: ' +
              playerEntity.socket.handshake.address,
            '| Server' + playerEntity.serverNumber
          );
        }
        return;
      }

      if (
        msgData.message.startsWith('!!devlogin') &&
        Devs.includes(playerEntity.name)
      ) {
        let loginMessage = msgData.message.split('.')[1];
        if (loginMessage === 'devishere!') {
          console.log(
            get_timestamp() +
              'Mod LOGGED IN: ' +
              playerEntity.name +
              ' | IP: ' +
              playerEntity.socket.handshake.address,
            '| Server' + playerEntity.serverNumber
          );
          playerEntity.isDev = true;
          playerEntity.socket.emit(
            'showCenterMessage',
            'Logged in successfully',
            3,
            10000
          );
        } else {
          console.log(
            get_timestamp() +
              'Dev LOGIN FAILED! | IP: ' +
              playerEntity.socket.handshake.address,
            '| Server' + playerEntity.serverNumber
          );
        }
        return;
      }      
      // implement !!say command for ADMIN communication
      if (msgData.message.startsWith('!!say') && playerEntity.isAdmin === true) {
        let adminMessage = msgData.message.split('.')[1];
        console.log(get_timestamp() + 'ADMIN SAY: ' + adminMessage + ' | IP: ' + playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
        io.emit('showAdminMessage', adminMessage);
        return;
      }

      // implement !!restart command for ADMIN gold recompense for server restart
      if (msgData.message.startsWith('!!restart') && playerEntity.isAdmin === true) {
        let restartMessage = msgData.message.split('.')[1];
        for (let p in core.players) {
          core.players[p].gold += parseInt(restartMessage);
        }
        console.log(get_timestamp() + 'ADMIN RECOMPENSED ' + restartMessage + ' GOLD ' + ' | IP: ' + playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
        io.emit('showAdminMessage', 'You have received gold recompense for server restart!');
        return;
      }

      // implement !!set_name command for admin communication in the chat
      if (msgData.message.startsWith('!!set_name') && playerEntity.isAdmin === true) {
        let adminName = msgData.message.split('.')[1];
        if (adminName !== undefined) {
          console.log(get_timestamp() + 'ADMIN SET NAME: ' + adminName + ' | IP: ' + playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
          playerEntity.name = adminName;
          return;
        }
      }

      // implement !!whois command for ADMIN checks
      // TODO: enable whois command for players with modd.io account
      if (msgData.message.startsWith('!!whois') && playerEntity.isAdmin === true) {
        let input = msgData.message.split('.')[1];
        if (input.startsWith('seadog')) {
          for (let p in core.players) {
            if (input === core.players[p].name) {
              console.log(get_timestamp() + 'ADMIN WHOIS SEADOG: ' + input + ' --> ' + core.players[p].id + ' | IP: ' + core.players[p].socket.handshake.address, '| Server' + playerEntity.serverNumber);
              var output = core.players[p].id;
            }
          }
        } else {
          for (k in core.boats) {
            if (input === core.boats[k].crewName) {
              console.log(get_timestamp() + 'ADMIN WHOIS CAPTAIN: ' + input + ' --> ' + core.boats[k].captainId + ' | Player name: ' + core.players[p].name + ' | IP: ' + core.players[p].socket.handshake.address, '| Server' + playerEntity.serverNumber);
              output = core.boats[k].captainId;
            }
          }
        }
        playerEntity.socket.emit('showCenterMessage', output, 4, 10000);
        return;
      }

      // implement !!kick command
      if (msgData.message.startsWith('!!kick') && playerEntity.isAdmin === true) {
        let kick_id = msgData.message.split('.')[1];
        let kick_reason = msgData.message.split('.')[2];
        for (let p in core.players) {
          var kickOtherPlayer = core.players[p];
          if (kick_id === kickOtherPlayer.id || 'seadog' + kick_id === kickOtherPlayer.name || kick_id === kickOtherPlayer.name) {
            if (kick_reason === undefined) {
              kickOtherPlayer.socket.emit('showCenterMessage', 'You have been kicked', 1, 10000);
              console.log(get_timestamp() + 'ADMIN KICK: playerId: ' + kick_id + ' | Player name:', playerEntity.name, '| Reason: No reason passed | IP: ' + kickOtherPlayer.socket.handshake.address, '| Server' + playerEntity.serverNumber);
            } else if (kick_reason === 'no_message') {
              // do not display any message
            } else {
              kickOtherPlayer.socket.emit('showCenterMessage', 'You have been kicked. Reason: ' + kick_reason, 1, 10000);
              console.log(get_timestamp() + 'ADMIN KICK: playerId: ' + kick_id + ' | Player name:', playerEntity.name, '| Reason: ' + kick_reason + ' | IP: ' + kickOtherPlayer.socket.handshake.address, '| Server' + playerEntity.serverNumber);
            }
            let kickOtherPlayerIp = kickOtherPlayer.socket.handshake.address;
            for (let a in core.players) {
              if (core.players[a].socket.handshake.address === kickOtherPlayerIp) {
                core.players[a].socket.disconnect();
              }
            }
            playerEntity.socket.emit('showCenterMessage', 'You kicked ' + kickOtherPlayer.name, 3, 10000);
          }
        }
        return;
      }

      // implement !!ban command
      if (msgData.message.startsWith('!!ban') && playerEntity.isAdmin === true) {
        let ban_id = msgData.message.split('.')[1];
        let ban_reason = msgData.message.split('.')[2];
        for (let p in core.players) {
          var otherPlayer = core.players[p];
          if (ban_id === otherPlayer.id || 'seadog' + ban_id === otherPlayer.name || ban_id === otherPlayer.name) {
            if (ban_reason === undefined) {
              otherPlayer.socket.emit('showCenterMessage', 'You have been banned', 1);
              console.log(get_timestamp() + 'ADMIN BAN: Player name:', otherPlayer.name, '| Reason: No reason passed | IP: ' + otherPlayer.socket.handshake.address, '| Server' + playerEntity.serverNumber);
            } else if (ban_reason === 'no_message') {
              // do not display any message
            } else {
              otherPlayer.socket.emit('showCenterMessage', 'You have been banned. Reason: ' + ban_reason, 1);
              console.log(get_timestamp() + 'ADMIN BAN: Player name:', otherPlayer.name, '| Reason: ' + ban_reason + ' | IP: ' + otherPlayer.socket.handshake.address, '| Server' + playerEntity.serverNumber);
            }
            // if player is logged in, update player record in mongoDB to "banned: true"
            if (otherPlayer.isLoggedIn) {
              mongo.UpdateOneWithQuery('players', { playerName: otherPlayer.name }, { $set: { banned: true } }, false, function (res) {
                if (res['modifiedCount'] === 1) {
                  console.log(get_timestamp() + 'ADMIN BAN: Player account:', otherPlayer.name, '| Server' + playerEntity.serverNumber);
                } else {
                  console.log(get_timestamp() + 'Mongo Error: ban player account FAILED'
                  );
                }
              });
            }
            // add IP address to the permanent ban list (no TTL timestamp in mongoDB)
            myobj = { IP: otherPlayer.socket.handshake.address };
            mongo.InsertOne('bannedips', myobj);
            let banPlayerIp = otherPlayer.socket.handshake.address;
            for (let a in core.players) {
              if (core.players[a].socket.handshake.address === banPlayerIp) {
                core.players[a].socket.disconnect();
              }
            }
            playerEntity.socket.emit('showCenterMessage', 'You banned ' + otherPlayer.name, 3, 10000);
          }
        }
        return;
      }

      // implement !!save command (before server restart)
      if (msgData.message.startsWith('!!save') && playerEntity.isAdmin === true) {
        for (let p in core.players) {
          let otherPlayer = core.players[p];
          if (otherPlayer.isLoggedIn === true) {
            var query = { playerName: otherPlayer.name };
            var myobj = {
              $set: {
                restore: {
                  tempTimestamp: Date.now(),
                  tempGold: otherPlayer.gold,
                  tempXP: otherPlayer.experience,
                  tempFireRate: otherPlayer.points.fireRate,
                  tempDistance: otherPlayer.points.distance,
                  tempDamage: otherPlayer.points.damage,
                  tempScore: otherPlayer.score,
                  tempShipsSank: otherPlayer.shipsSank,
                  tempDeaths: otherPlayer.deaths !== undefined ? otherPlayer.deaths : 0,
                  // restore player's ship (if he was captain)
                  tempIsCaptain: otherPlayer.isCaptain,
                  tempShipId: otherPlayer.parent ? otherPlayer.parent.shipclassId: null,
                  // restore player's item and bonus stats
                  tempItemId: otherPlayer.itemId,
                  tempFireRateBonus: otherPlayer.attackSpeedBonus,
                  tempDistanceBonus: otherPlayer.attackDistanceBonus,
                  tempDamageBonus: otherPlayer.attackDamageBonus,
                  tempMovementSpeedBonus: otherPlayer.movementSpeedBonus,
                },
              },
            };

            mongo.UpdateOneWithQuery('players', query, myobj, false, function (callback) {
              // TODO: validate callback from mongo
            });
            console.log('Stored data for player ' + otherPlayer.name, '| IP:', otherPlayer.socket.handshake.address, '| Server' + otherPlayer.serverNumber);
          }
          // Disconnect player for clean server restart
          otherPlayer.socket.disconnect();
        }
        playerEntity.socket.emit('showCenterMessage', 'Successfully stored all player data', 3, 10000);
      }

      // do not show message in the chat if mod/admin writes // or !!
      if ((msgData.message.startsWith('!!') || msgData.message.startsWith('//')) && (Mods.includes(playerEntity.name) || Admins.includes(playerEntity.name))) {
        return;
      }

      if (!isSpamming(playerEntity, msgData.message)) {
        let msg = xssFilters.inHTMLData(msgData.message);

        // clean message from bad words
        msg = filter.clean(msg);

        if (msgData.recipient === 'global') {
          io.emit('chat message', {
            playerId: playerEntity.id,
            playerName: playerEntity.name,
            recipient: 'global',
            message: charLimit(msg, 150),
          });
        } else if (msgData.recipient === 'local' && entities[playerEntity.parent.id]) {
          for (let z in entities[playerEntity.parent.id].children) {
            entities[playerEntity.parent.id].children[z].socket.emit('chat message',
              {
                playerId: playerEntity.id,
                playerName: playerEntity.name,
                recipient: 'local',
                message: charLimit(msg, 150),
              }
            );
          }
        } else if (msgData.recipient === 'clan' && playerEntity.clan !== '' && typeof playerEntity.clan !== 'undefined') {
          let clan = playerEntity.clan;
          for (let z in entities) {
            if (entities[z].netType === 0 && entities[z].clan === clan) {
              entities[z].socket.emit('chat message', {
                playerId: playerEntity.id,
                playerName: playerEntity.name,
                recipient: 'clan',
                message: charLimit(msg, 150),
              });
            }
          }
        }
      } else if (msgData.message.length > 1) {
        socket.emit('showCenterMessage', 'You have been muted', 1);
      }
    });

    playerNames = {};
    for (let id in core.players) {
      let playerName = xssFilters.inHTMLData(core.players[id].name);
      playerName = filter.clean(playerName);
      playerNames[id] = playerName;
    }

    socket.emit('playerNames', playerNames, socketId);

    socket.on('changeWeapon', function (index) {
      index = xssFilters.inHTMLData(index);
      index = parseInt(index);
      if (playerEntity !== undefined && (index === 0 || index === 1 || index === 2)) {
        playerEntity.activeWeapon = index;
        playerEntity.isFishing = false;
      }
    });

    // if player disconnects
    socket.on('disconnect', function (data) {
      console.log(get_timestamp() + 'Player:', playerEntity.name, 'disconnected from the game | IP:', playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);

      // remove the player's cookie from the cookie list in memory
      if (!DEV_ENV) {
        delete gameCookies[playerEntity.id];
      }

      // update player highscore in mongo db if it is new record
      if (playerEntity.isLoggedIn === true && playerEntity.serverNumber === 1 && playerEntity.gold > playerEntity.highscore) {
        console.log(get_timestamp() + 'Update highscore for player:', playerEntity.name, '| Old highscore:', playerEntity.highscore, '| New highscore:', +playerEntity.gold, '| IP:', playerEntity.socket.handshake.address);
        playerEntity.highscore = playerEntity.gold;
        let myobj = { $set: { highscore: Math.round(playerEntity.highscore) } };
        let query = { playerName: playerEntity.name };
        mongo.UpdateOneWithQuery('players', query, myobj, false, function (
          callback
        ) {
          // TODO: validate callback from mongo
        });
      }

      // wait 15 seconds before removing player & ship if player tries to chicken out
      if (playerEntity.parent.netType === 1 && (playerEntity.parent.shipState !== 4 || playerEntity.parent.shipState !== 3) && playerEntity.isCaptain && Object.keys(playerEntity.parent.children).length === 1 && playerEntity.parent.hp < playerEntity.parent.maxHp) {
        console.log(get_timestamp() + 'Player', playerEntity.name, 'tried to chicken out --> Ghost ship | IP: ' + playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
        playerEntity.parent.hp = 1;
        setTimeout(function () {
          core.removeEntity(playerEntity);
          playerEntity.parent.updateProps();
          core.removeEntity(playerEntity.parent);
        }, 15000);
      } else {
        core.removeEntity(playerEntity);

        if (playerEntity && playerEntity.parent) {
          delete playerEntity.parent.children[playerEntity.id];
          // if player was on a boat, delete it from the boat.
          if (playerEntity.parent.netType === 1) {
            playerEntity.parent.updateProps();
            if (Object.keys(playerEntity.parent.children).length === 0) {
              core.removeEntity(playerEntity.parent);
            }
          }
        }
      }
    });

    socket.on('updateKrewName', function (name) {
      // do not allow [](){}/ in the krew name (because of clan tags)
      name = name.replace(/[\[\]{}()/\\]/g, '');
      
      if (name != null && name.length > 1) {
        console.log(get_timestamp() + 'updateKrewName:', name + ' | Player name:', playerEntity.name, '| IP: ' + playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);

        if (name.length > 60) {
          console.log(get_timestamp() + 'Exploit detected (crew name). Player', playerEntity.name, 'kicked | Adding IP ' + playerEntity.socket.handshake.address + ' to bannedIPs', '| Server' + playerEntity.serverNumber);
          if (playerEntity.socket.handshake.address.length > 5) {
            // add IP address to the permanent ban list (no TTL timestamp in mongoDB)
            myobj = { IP: playerEntity.socket.handshake.address };
            mongo.InsertOne('bannedips', myobj);
          }
          playerEntity.socket.disconnect(); // kick exploiter
          return;
        }

        name = xssFilters.inHTMLData(name);
        name = filter.clean(name);
        name = name.substring(0, 20);
        // make sure that player is the captain of the krew
        var boat = playerEntity.parent;
        if (core.boats[boat.id] !== undefined && playerEntity && playerEntity.parent && playerEntity.parent.captainId === playerEntity.id) {
          if (krewioData) {
            krewioService.save(krewioData.user, { krewname: name }).then((data) => (krewioData = data));
          }
          core.boats[boat.id].crewName = name;
        }
      }
    });

    socket.on('deletePickup', function (pickupId) {
      core.removeEntity(core.entities[pickupId]);
    });
    //for test perfomance
    socket.on('amountPickup', function (type) {
      let typeEntity = type;
      var count = 0;
      for (let i in entities) {
        if (entities[i].type == typeEntity) {
          count++;
        }
      }
      socket.emit(count);
    });
    socket.on('removeAllCrates', function () {
      for (let i in entities) {
        if (entities[i].type == 0) {
          core.removeEntity(core.entities[i]);
        }
      }
    });
    socket.on('maxAmountCratesInSea', function (amount) {
      maxAmountCratesInSea = amount;
    });
    socket.on('minAmountCratesInSea', function (amount) {
      minAmountCratesInSea = amount;
    });

    // for test perfomance END
    socket.on('departure', function (departureCounter) {
      // check if player who sends exitIsland command is docked at island
      if (playerEntity.parent.anchorIslandId === undefined) {
        console.log(get_timestamp() + 'Exploit detected (docking at sea). Player ' + playerEntity.name + '| IP: ' + playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
      } else {
        // check if player has already clicked sail button. If yes, do nothing
        if (playerEntity.parent.shipState === 4) {
        }
        if (playerEntity.parent.shipState === 3) {
          for (p in core.players) {
            var otherPlayer = core.players[p];
            if (otherPlayer && otherPlayer.parent &&
              ((otherPlayer.parent.netType === 1 && otherPlayer.parent.anchorIslandId === playerEntity.parent.anchorIslandId) ||
                (otherPlayer.parent.netType === 5 && otherPlayer.parent.id === playerEntity.parent.anchorIslandId))) {
              if (otherPlayer.parent.id !== playerEntity.parent.id) {
                // if conditions are fulfilled and parent.id is not my parent.id, let the krew list button glow
                otherPlayer.socket.emit('departureWarning');
              }
            }
          }

          if (playerEntity && playerEntity.parent && playerEntity.parent.captainId === playerEntity.id) {
            var boat = playerEntity.parent;
            boat.shipState = 4;
            boat.lastMoved = new Date();
            boat.recruiting = true;
            boat.dock_countdown = undefined;

            if (departureCounter === 1) {
              boat.departureTime = 25;
              for (var i in boat.children) {
                var boatMember = boat.children[i];
                if (boatMember !== undefined && boatMember.netType === 0) {
                  boatMember.socket.emit('showAdinplayCentered');
                }
              }
            }
          }
        }
      }
    });

    // if player chooses to depart from island
    socket.on('exitIsland', function (data) {
      var boat = playerEntity.parent;

      // if captain sends to exit island request
      if (playerEntity && playerEntity.parent && playerEntity.parent.captainId === playerEntity.id) {
        boat.exitIsland();

        // make all crew members close their shopping windows
        for (i in boat.children) {
          var boatMember = boat.children[i];
          if (boatMember !== undefined && boatMember.netType == 0) {
            boatMember.socket.emit('exitIsland', { captainId: boat.captainId });
            boatMember.sentDockingMsg = false;
          }
        }
      }
    });

    // if player chooses to depart from island
    socket.on('abandonShip', function (data) {
      var motherShip = playerEntity.parent;

      // only non-kaptains can abandon ship
      if (motherShip) {
        if (motherShip.captainId !== playerEntity.id) {
          if (motherShip.shipState === 0) {
            var boat = core.createBoat(playerEntity.id, (krewioData || {}).krewname, false);
            boat.addChildren(playerEntity);
            boat.setShipClass(0);
            boat.exitMotherShip(motherShip);
            boat.speed += parseFloat(playerEntity.movementSpeedBonus / 10);
            boat.turnspeed += parseFloat((0.05 * playerEntity.movementSpeedBonus) / 10);
            boat.updateProps();
            boat.shipState = 0;
          } else {
            entities[motherShip.anchorIslandId] && entities[motherShip.anchorIslandId].addChildren(playerEntity);
          }

          delete motherShip.children[playerEntity.id]; // delete him from the previous krew
          motherShip.updateProps && motherShip.updateProps();

          // recalculate amount of killed ships (by all crew members)
          var crew_kill_count = 0;
          var crew_trade_count = 0;
          for (y in core.players) {
            var otherPlayer = core.players[y];
            if (otherPlayer.parent !== undefined && motherShip.id === otherPlayer.parent.id) {
              crew_kill_count += otherPlayer.shipsSank;
              crew_trade_count += otherPlayer.overall_cargo;
            }
          }
          motherShip.overall_kills = crew_kill_count;
          motherShip.overall_cargo = crew_trade_count;
        }
      }
    });

    socket.on('lock-krew', function (lockBool) {
      if (playerEntity.isCaptain === true && lockBool === true) {
        playerEntity.parent.isLocked = true;
        playerEntity.parent.recruiting = false;
      } else if (playerEntity.isCaptain === true && lockBool === false) {
        playerEntity.parent.isLocked = false;
        if (playerEntity.parent.shipState === 2 || playerEntity.parent.shipState === 3 || playerEntity.parent.shipState === 4) {
          playerEntity.parent.recruiting = true;
        }
      }
    });

    socket.on('clan', function (action, callback) {
      // validate the input
      if (action.id) {
        if ((action['action'] === 'create' || action['action'] === 'join') && (action.id.length > 4 || isAlphaNumeric(action.id) !== true)) {
          console.log(get_timestamp() + 'Exploit: Player', playerEntity.name, 'tried XSS in clan field:', action['action'], action.id, '| Adding to ban list | IP:', playerEntity.socket.handshake.address);
          // add IP address to the permanent ban list (no TTL timestamp in mongoDB)
          myobj = { IP: playerEntity.socket.handshake.address };
          mongo.InsertOne('bannedips', myobj);
          let banPlayerIp = playerEntity.socket.handshake.address;
          for (let a in core.players) {
            if (core.players[a].socket.handshake.address === banPlayerIp) {
              core.players[a].socket.disconnect();
            }
          }
          playerEntity.socket.disconnect();
        }
        // filter for XSS
        action.id = xssFilters.inHTMLData(action.id);
      }

      // only players who are logged in can perform clan actions
      if (playerEntity.isLoggedIn !== true) {
        console.log(get_timestamp() + 'Exploit: Player', playerEntity.name, 'tried clan action without login | IP:', playerEntity.socket.handshake.address);
        callback(false);
      }
      // clan actions where the player already has a clan (leave, get-data, promote, kick, accept, decline)
      else if (playerEntity.clan && playerEntity.clan !== '') {
        // get-data needs to be possible for clan leaders and clan members
        if (action === 'get-data') {
          let clanQuery = { clanName: playerEntity.clan };
          mongo.ReturnSingleValue('clans', clanQuery, function (res) {
            let clanInfo = {};
            clanInfo['clanLeader'] = res['clanLeader'];
            clanInfo['clanMembers'] = res['clanMembers'];
            clanInfo['clanOwner'] = res['clanOwner'];
            if (playerEntity.clanLeader === true) {
              clanInfo['clanRequests'] = res['clanRequests'];
            }
            callback(clanInfo);
          });
        }
        // clan actions for players who don't have to be clan leaders (leave)
        if (playerEntity.clanLeader !== true) {
          if (action === 'leave') {
            let clan = playerEntity.clan;
            mongo.ManagePlayerInClan('kick', playerEntity.name, playerEntity.clan, function (res) {
              if (res['result']['nModified'] === 1) {
                playerEntity.clan = '';
                callback(true);
                console.log(get_timestamp() + 'Player', playerEntity.name, 'left clan', clan, '| IP:', playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
                // inform all clan members that a member left the clan
                for (let p in core.players) {
                  if (clan === core.players[p].clan) {
                    core.players[p].socket.emit('showCenterMessage', 'Player ' + playerEntity.name + ' has left your clan [' + clan + ']', 1, 5000);
                  }
                }
              } else {
                callback(false);
                console.log(get_timestamp() + 'Mongo Error: leave clan FAILED | Player:', playerEntity.name, '| Clan:', clan, '| IP:', playerEntity.socket.handshake.address);
              }
            });
          }
        }
        // here come the actions for clan leaders (leave, promote, kick, accept, decline)
        else {
          if (action === 'leave') {
            // TODO: should we work with callback here as well? I think it would make sense
            let clan = playerEntity.clan;
            let clanQuery = { clanName: playerEntity.clan };
            let clanObj = {
              $pull: {
                clanLeader: playerEntity.name,
                clanMembers: playerEntity.name,
              },
            };
            mongo.ReturnResultAndUpdate('clans', clanQuery, clanObj, false, function (res) {
              let result = res['value'];
              // if he is the only or last clan leader, delete the clan and update the clan members
              if (result['clanLeader'].length === 1 && result['clanLeader'][0] === playerEntity.name) {
                mongo.DeleteOne('clans', clanQuery, function (res) {
                  if (res['result']['ok'] === 1) {
                    console.log(get_timestamp() + 'Deleted clan', clan, 'because last clan leader', playerEntity.name, 'left | IP:', playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
                  } else {
                    console.log(get_timestamp() + 'Mongo Error: Delete clan', clan, 'FAILED');
                  }
                });

                // remove the clan tag from all remaining players
                if (result['clanMembers'].length > 1) {
                  for (let p in result['clanMembers']) {
                    let updateQuery = {
                      playerName: result['clanMembers'][p],
                    };
                    let updateObj = { $set: { clan: '' } };
                    mongo.UpdateOneWithQuery('players', updateQuery, updateObj, false, function (res) {
                      if (res['result']['nModified'] === 1) {
                        console.log(get_timestamp() + 'Updated (removed) clan for player', result['clanMembers'][p]);
                      } else {
                        console.log(get_timestamp() + 'Mongo Error: Update (remove) clan for player', result['clanMembers'][p], 'FAILED');
                      }
                    });
                  }
                }
              }
              // promote next leader to be clan owner as soon as clan leader leaves the clan
              else if (playerEntity.clanOwner === true && result['clanLeader'].length > 1) {
                let updateQuery = { playerName: result['clanLeader'][1] };
                let updateObj = { $set: { clanOwner: true } };
                mongo.UpdateOneWithQuery('players', updateQuery, updateObj, false, function (res) {
                  if (res['result']['nModified'] === 1) {
                    playerEntity.clanOwner = false;
                    // update entity of new clan owner
                    for (let p in core.players) {
                      if (result['clanLeader'][1] === core.players[p].name) {
                        core.players[p].clanOwner = true;
                      }
                    }
                    console.log(get_timestamp() + 'Player', result['clanLeader'][1], 'is clan owner now (Previous clan owner', playerEntity.name, 'left the clan)');
                  } else {
                    console.log(get_timestamp() + 'Mongo Error: Update clan owner FAILED -->', playerEntity.clan, playerEntity.name, result['clanLeader'][1]);
                  }
                });
                // now update the clan collection
                mongo.UpdateOneWithQuery('clans', { clanName: clan }, { $set: { clanOwner: result['clanLeader'][1] } }, false, function (res) {
                  if (res['result']['nModified'] !== 1) {
                    console.log(get_timestamp() + 'Mongo Error: Update clan owner FAILED -->', playerEntity.clan, playerEntity.name, result['clanLeader'][1]);
                  }
                });
              }
              // Update player item in mongoDB (remove clan)
              mongo.UpdateOneWithQuery('players', { playerName: playerEntity.name }, { $set: { clan: '', clanLeader: false, clanOwner: false } }, false, function (res) {
                if (res['result']['nModified'] === 1) {
                  callback(true);
                  console.log(get_timestamp() + 'Clan leader', playerEntity.name, 'left', clan, '| IP:', playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
                  // inform all clan members that the leader left the clan
                  for (let p in core.players) {
                    if (clan === core.players[p].clan) {
                      core.players[p].socket.emit('showCenterMessage', 'Clan leader ' + playerEntity.name + ' left your clan [' + clan + ']', 1, 5000);
                    }
                  }
                } else {
                  console.log(get_timestamp() + 'Mongo Error: Removing clan leader from clan FAILED');
                }
              });
            });

            // if the player is captain, update the clan of his boat as well
            if (playerEntity.parent.netType === 1 && playerEntity.isCaptain === true) {
              playerEntity.parent.clan = '';
            }

            // after leaving a clan you can't be clan leader
            playerEntity.clanLeader = false;
            playerEntity.clan = '';
          } else if (action['action'] === 'promote' || action['action'] === 'kick') {
            // check if the player who sent the emit is in the same clan
            mongo.ReturnSingleValue('players', { playerName: action['id'] }, function (res) {
              if (res && res['clan'] === playerEntity.clan) {
                if (action['action'] === 'kick') {
                  let newAction = res['clanLeader'] === true ? 'kick-leader' : action['action'];
                  mongo.ManagePlayerInClan(newAction, action['id'], playerEntity.clan, function (res) {
                    if (res['result']['nModified'] === 1) {
                      // update the playerEntity of kicked player on server side
                      for (let p in core.players) {
                        if (core.players[p].isLoggedIn === true && core.players[p].name === action['id']) {
                          // inform player that he has been kicked
                          core.players[p].socket.emit('showCenterMessage', 'Clan leader ' + playerEntity.name + ' kicked you from clan [' + core.players[p].clan + ']', 1, 5000);
                          core.players[p].clan = '';
                          break;
                        }
                      }
                      callback(true);
                      console.log(get_timestamp() + 'Clan leader', playerEntity.name, 'kicked player', action['id'], 'from clan', playerEntity.clan, '| IP:', playerEntity.socket.handshake.address);
                    } else {
                      callback(false);
                      console.log(get_timestamp() + 'Mongo Error: Kicking player from clan FAILED');
                    }
                  });
                }
                else if (action['action'] === 'promote' && playerEntity.clanOwner === true) {
                  mongo.ManagePlayerInClan(action['action'], action['id'], playerEntity.clan, function (res) {
                    if (res['result']['nModified'] === 1) {
                      callback(true);
                      // update the playerEntity of promoted player on server side
                      for (let p in core.players) {
                        if (core.players[p].name === action['id'] && core.players[p].isLoggedIn === true) {
                          core.players[p].clanLeader = true;
                          console.log(get_timestamp() + 'Clan leader', playerEntity.name, 'promoted player', core.players[p].name, 'to leader of clan', core.players[p].clan, '| IP:', playerEntity.socket.handshake.address);
                          // inform player that he has been promoted
                          core.players[p].socket.emit('showCenterMessage', 'You have been promoted to be clan leader of [' + core.players[p].clan + ']', 3, 5000);
                          break;
                        }
                      }
                    } else {
                      callback(false);
                      console.log(get_timestamp() + 'Mongo Error: Promote player to be clan leader FAILED');
                    }
                  });
                }
              } else {
                console.log(get_timestamp() + 'Exploit detected: Player', playerEntity.name, 'tried to kick/promote player', action['id'], 'without being in same clan | IP:', playerEntity.socket.handshake.address);
              }
            });
          } else if (action['action'] === 'accept') {
            mongo.ManagePlayerInClan(action['action'], action['id'], playerEntity.clan, function (res) {
              if (res['result']['nModified'] === 1) {
                callback(true);
                // update the playerEntity of accepted player on server side
                for (let p in core.players) {
                  if (core.players[p].name === action['id'] && core.players[p].isLoggedIn === true) {
                    core.players[p].clan = playerEntity.clan;
                    core.players[p].clanRequest = '';
                    // inform player that his request has been accepted
                    core.players[p].socket.emit('showCenterMessage', 'Clan leader ' + playerEntity.name + ' accepted your request to join [' + playerEntity.clan + ']', 3, 5000);
                    console.log(get_timestamp() + 'Clan leader', playerEntity.name, 'accepted player', core.players[p].name, 'to join clan', playerEntity.clan, '| IP:', playerEntity.socket.handshake.address);
                    break;
                  }
                }
              } else {
                callback(false);
                console.log(get_timestamp() + 'Mongo Error: Accept join clan request FAILED');
              }
            });
          } else if (action['action'] === 'decline') {
            mongo.ManagePlayerInClan(action['action'], action['id'], playerEntity.clan, function (res) {
              if (res['result']['nModified'] === 1) {
                callback(true);
                // update the playerEntity of declined player on server side
                for (let p in core.players) {
                  if (core.players[p].isLoggedIn === true && core.players[p].name === action['id']) {
                    core.players[p].clanRequest = '';
                    // inform player that his request has been rejected
                    core.players[p].socket.emit('showCenterMessage', 'Clan leader ' + playerEntity.name + ' rejected your request to join [' + playerEntity.clan + ']', 1, 5000);
                    console.log(get_timestamp() + 'Clan leader', playerEntity.name, 'declined player', core.players[p].name, 'to join clan', playerEntity.clan, '| IP:', playerEntity.socket.handshake.address);
                    break;
                  }
                }
              } else {
                callback(false);
                console.log(get_timestamp() + 'Mongo Error: Decline join clan request FAILED');
              }
            });
          }
        }
      } else {
        // clan actions where the player does not have any clan up to now (create, join, cancel-request)
        if (action['action'] === 'create' && (playerEntity.clan === '' || !playerEntity.clan) && (!playerEntity.clanRequest || playerEntity.clanRequest === '')) {
          // check if player's account is "old" enough to create a new clan
          if (false) {
            console.log(get_timestamp() + 'Player', playerEntity.name, 'tried to create a clan, with too new user account | IP:', playerEntity.socket.handshake.address);
            callback(403);
          } else {
            // check if the clan (or a similar one) already exists
            mongo.ReturnAll('clans', { _id: 0, clanName: 1 }, function (res) {
              let duplicateClan = false;  
              for (let i in res) {
                if (action['id'].toUpperCase() === res[i]['clanName'].toUpperCase()) {
                  console.log(get_timestamp() + 'Player', playerEntity.name, 'tried to create (DUPLICATE) clan:', action['id'], '| IP:', playerEntity.socket.handshake.address);
                  duplicateClan = true;
                }
              }
              if (duplicateClan === false) {
                mongo.ManagePlayerInClan(action['action'], playerEntity.name, action['id'], function (res) {
                  if (res && res['result']['ok'] === 1) {
                    playerEntity.clan = action['id'];
                    playerEntity.clanLeader = true;
                    playerEntity.clanOwner = true;
                    console.log(get_timestamp() + 'Player', playerEntity.name, 'created new clan', action['id'], '| IP:', playerEntity.socket.handshake.address);
                    callback(true);
                  } else {
                    callback(false);
                    console.log(get_timestamp() + 'Mongo Error: Create a new clan FAILED');
                  }
                });
              } else {
                callback(409);
              }
            });
          }
        } else if (action['action'] === 'join' && (playerEntity.clan === '' || !playerEntity.clan)) {
          // check if player already sent a clan join request
          if (!playerEntity.clanRequest || playerEntity.clanRequest === '') {
            // check in mongoDB if the clan which the player requests to join exists
            mongo.ReturnSingleValue('clans', { clanName: action['id'] }, function (res) {
              if (res) {
                mongo.ManagePlayerInClan(action['action'], playerEntity.name, action['id'], function (result) {
                  if (result && result['result']['nModified'] === 1) {
                    playerEntity.clanRequest = action['id'];
                    callback(true);
                    console.log(get_timestamp() + 'Player', playerEntity.name, 'requested to join clan', action['id'], '| IP:', playerEntity.socket.handshake.address);

                    // inform all clan leaders (if they are online) that there is a new request
                    for (let p in core.players) {
                      if (action['id'] === core.players[p].clan && core.players[p].clanLeader === true) {
                        core.players[p].socket.emit('showCenterMessage', 'Player ' + playerEntity.name + ' wants to join your clan [' + action['id'] + ']', 4, 5000);
                      }
                    }
                  } else {
                    callback(false);
                    console.log(get_timestamp() + 'Mongo Error: Join clan request FAILED');
                  }
                });
              } else {
                callback(404);
              }
            });
          } else {
            callback(409);
            console.log(get_timestamp() + 'Exploit: Player', playerEntity.name, 'tried to create multiple clan requests | IP:', playerEntity.socket.handshake.address);
          }
        } else if (action['action'] === 'cancel-request' && (playerEntity.clan === '' || !playerEntity.clan) && playerEntity.clanRequest === action['id']) {
          mongo.ManagePlayerInClan('decline', playerEntity.name, action['id'], function (res) {
            if (res && res['result']['nModified'] === 1) {
              playerEntity.clanRequest = '';
              callback(true);
              console.log(get_timestamp() + 'Player', playerEntity.name, 'cancelled request to join', action['id'], '| IP:', playerEntity.socket.handshake.address);
            } else {
              callback(false);
              console.log(get_timestamp() + 'Mongo Error: Cancel clan request FAILED');
            }
          });
        }
      }
    });

    socket.on('respawn', function (callback) {
      if (!(playerEntity.parent.hp <= 0)) {
        console.log(get_timestamp(), 'Player', playerEntity.name, 'tried to respawn while his boat still got HP, IP', playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
        return;
      }
      var time_now = Date.now();
      // check for timestamp of last respawn and kick if it was less than 2 seconds ago
      if (socket.timestamp !== undefined && time_now - socket.timestamp < 2000) {
        console.log(get_timestamp() + 'Exploit detected (multiple respawn). Player name:', playerEntity.name, '| Adding IP ' + playerEntity.socket.handshake.address + ' to bannedIPs', '| Server' + playerEntity.serverNumber);
        if (playerEntity.socket.handshake.address.length > 5) {
          // add IP address to the permanent ban list (no TTL timestamp in mongoDB)
          myobj = { IP: playerEntity.socket.handshake.address };
          mongo.InsertOne('bannedips', myobj);
        }
        playerEntity.socket.disconnect();
      } else {
        console.log(get_timestamp() + 'Respawn by Player ' + playerEntity.name + ' | IP: ' + playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
        playerEntity.gold = parseFloat(Math.max(0, (playerEntity.gold * 0.3).toFixed(0)));
        playerEntity.gold += 1300; // give player gold for raft 2 after respawn
        playerEntity.dequip();
        playerEntity.itemId = -1;
        playerEntity.cargoUsed = 0;

        for (var g in playerEntity.goods) {
          playerEntity.goods[g] = 0;
        }

        // respawn player on the sea (on raft 2)
        login.allocatePlayerToBoat(playerEntity, data.boatId);
        playerEntity.sentDockingMsg = false;

        // set timestamp for next respawn
        socket.timestamp = Date.now();
      }
    });

    // if player chooses to kick crew member
    socket.on('bootMember', function (kickedPlayerId) {
      var kickedPlayer = core.players[kickedPlayerId];
      if (kickedPlayer) {
        var motherShip = kickedPlayer.parent;

        if (motherShip) {
          // only captains can boot
          if (motherShip.captainId === playerEntity.id && playerEntity.id !== kickedPlayer.id) {
            if (motherShip.shipState === 0) {
              var boat = core.createBoat(kickedPlayer.id, (krewioData || {}).krewname, false);
              boat.setShipClass(0);
              boat.addChildren(kickedPlayer);
              boat.exitMotherShip(motherShip);
              boat.speed += parseFloat(playerEntity.movementSpeedBonus / 10);
              boat.turnspeed += parseFloat((0.05 * playerEntity.movementSpeedBonus) / 10);
              boat.updateProps();
              boat.shipState = 0;
            } else {
              entities[motherShip.anchorIslandId] && entities[motherShip.anchorIslandId].addChildren(kickedPlayer);
            }

            delete motherShip.children[kickedPlayerId]; // delete him from the previous krew
            motherShip.updateProps();

            // recalculate amount of killed ships (by all crew members)
            var crew_kill_count = 0;
            var crew_trade_count = 0;
            for (y in core.players) {
              var otherPlayer = core.players[y];
              if (otherPlayer.parent !== undefined && motherShip.id === otherPlayer.parent.id) {
                crew_kill_count += otherPlayer.shipsSank;
                crew_trade_count += otherPlayer.overall_cargo;
              }
            }
            motherShip.overall_kills = crew_kill_count;
            motherShip.overall_cargo = crew_trade_count;
          }
        }
      }
    });

    socket.on('transferShip', function (transferedPlayerId) {
      var transferedPlayer = core.players[transferedPlayerId];
      if (transferedPlayer) {
        var motherShip = playerEntity.parent;
        if (motherShip.captainId === playerEntity.id && playerEntity.id !== transferedPlayer.id) {
          if (transferedPlayer.parent.id === motherShip.id) {
            playerEntity.parent.captainId = transferedPlayerId;
          }
        }
      }
    });

    // Join a krew if there's enough capacity
    socket.on('joinKrew', function (boatId, callback) {
      var targetBoat = core.boats[boatId];
      if (targetBoat !== undefined && targetBoat.isLocked !== true) {
        var playerBoat = playerEntity.parent; // Player's boat or anchored island if they don't own a boat
        var krewCargoUsed = 0;
        for (var p in targetBoat.children) {
          krewCargoUsed += targetBoat.children[p].cargoUsed;
        }
        var joinCargoAmount = krewCargoUsed + playerEntity.cargoUsed;
        var maxShipCargo = core.boatTypes[targetBoat.shipclassId].cargoSize;
        var emitJoinKrew = function (id) {
          if (entities[id] && entities[id].socket && entities[id].parent && entities[id].parent.crewName) {
            entities[id].socket.emit('showCenterMessage', 'You have joined "' + entities[id].parent.crewName + '"', 3);
          }
        };

        var movedIds = {};

        var emitNewKrewMembers = function () {
          var names = '';
          for (var k in movedIds) {
            names += ' ' + movedIds[k] + ',';
          }

          names = names.replace(/,$/gi, '').trim();

          for (var id in targetBoat.children) {
            if (entities[id] && entities[id].socket && movedIds[id] === undefined) {
              if (Object.keys(movedIds).length === 1) {
                for (var k in movedIds) {
                  entities[id].socket.emit('showCenterMessage', 'New krew member "' + movedIds[k] + '" has joined your krew!', 3);
                }
              }

              if (Object.keys(movedIds).length > 1) {
                entities[id].socket.emit('showCenterMessage', 'New krew members "' + names + '" have joined your krew!', 3);
              }
            }
          }
        };
        if (
          targetBoat &&
          (targetBoat.shipState === 3 ||
            targetBoat.shipState === 2 ||
            targetBoat.shipState === -1 ||
            targetBoat.shipState === 4) &&
          playerBoat &&
          (playerBoat.shipState === 3 ||
            playerBoat.shipState === 2 ||
            playerBoat.shipState === -1 ||
            playerBoat.shipState == 4 ||
            playerBoat.netType === 5) &&
          targetBoat !== playerBoat
        ) {
          if (joinCargoAmount > maxShipCargo) {
            // TODO: return message to player and captain telling them why player can't join
            callback(1);
          } else {
            callback(0);
            // if player doesn't own a ship
            if (playerBoat.netType === 5) {
              targetBoat.addChildren(playerEntity);
              targetBoat.updateProps();

              emitJoinKrew(playerEntity.id);
              movedIds[playerEntity.id] = playerEntity.name;
            } else {
              // check if there's enough capacity in target boat
              if (Object.keys(targetBoat.children).length < targetBoat.maxKrewCapacity) {
                delete playerBoat.children[playerEntity.id];
                playerBoat.updateProps();
                targetBoat.addChildren(playerEntity);
                targetBoat.updateProps();

                if (playerBoat.captainId === playerEntity.id) {
                  playerEntity.isCaptain = false;

                  // Check if the boat has enough space for all player's krew
                  if (Object.keys(playerBoat.children).length + Object.keys(targetBoat.children).length <= targetBoat.maxKrewCapacity) {
                    for (var id in playerBoat.children) {
                      var krewPlayer = playerBoat.children[id];
                      targetBoat.addChildren(krewPlayer);
                      targetBoat.updateProps();
                      krewPlayer.isCaptain = false;
                      delete playerBoat.children[krewPlayer.id];
                      playerBoat.updateProps();
                      emitJoinKrew(krewPlayer.id);
                      movedIds[id] = krewPlayer.name;
                    }

                    core.removeEntity(playerBoat);
                  }
                } else {
                  delete playerBoat.children[playerEntity.id];
                  playerBoat.updateProps();
                  emitJoinKrew(playerEntity.id);
                  movedIds[playerEntity.id] = playerEntity.name;
                  if (Object.keys(playerBoat.children).length === 0) {
                    core.removeEntity(playerBoat);
                  }
                }
              }
            }
            emitNewKrewMembers();

            // recalculate amount of killed ships and traded cargo (by all crew members)
            var crew_kill_count = 0;
            var crew_trade_count = 0;
            for (y in core.players) {
              var otherPlayer = core.players[y];
              if (otherPlayer.parent !== undefined && playerEntity.parent.id === otherPlayer.parent.id) {
                crew_kill_count += otherPlayer.shipsSank;
                crew_trade_count += otherPlayer.overall_cargo;
              }
            }
            playerEntity.parent.overall_kills = crew_kill_count;
            playerEntity.parent.overall_cargo = crew_trade_count;
          }
        }
      }
    });

    socket.on('dock', function () {
      if (playerEntity.parent.shipState === 1 && playerEntity.parent.captainId === playerEntity.id) {
        playerEntity.parent.dock_countdown = new Date();
      }
    });

    socket.on('anchor', function () {
      let timeNow = new Date();
      if (playerEntity.parent.dock_countdown < timeNow - 8000 && playerEntity.parent.shipState === 1 && playerEntity.parent.captainId === playerEntity.id) {
        playerEntity.parent.shipState = 2;
      }
    });

    socket.on('purchase', function (item, callback) {
      check_player_status();
      console.log(get_timestamp() + 'Player: ' + playerEntity.name + ' is buying ', item, ' while having ' + playerEntity.gold + ' gold | IP:', playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
      // check if id is an integer > 0
      if (!isNormalInteger(item.id)) {
        return;
      }

      // ship
      if (item.type === 0 && playerEntity.parent.shipState !== 4) {
        if (playerEntity) {
          var ships = {};

          var cargoUsed = 0;
          for (var i in playerEntity.goods) {
            cargoUsed += playerEntity.goods[i] * core.goodsTypes[i].cargoSpace;
          }

          playerEntity.cargoUsed = cargoUsed;

          // put together item.id and item.type and send them back to the client
          var response = item.type + item.id;
          callback(response);
          playerEntity.other_quest_level = playerEntity.other_quest_level === undefined ? 0 : playerEntity.other_quest_level;
          // console.log("initial lvl: " + playerEntity.other_quest_level);
          // give the rewards for the quests
          if (playerEntity.gold >= core.boatTypes[item.id].price) {
            var quest_2_list = ['04', '05', '06', '07', '015', '016']; // trader or boat
            var quest_3_list = ['08', '09', '010', '012', '013', '018', '019']; // destroyer, calm spirit or royal fortune
            var quest_4_list = ['014', '020']; // queen's barb justice

            if (quest_2_list.includes(response) && playerEntity.other_quest_level === 0) {
              playerEntity.socket.emit('showCenterMessage', 'Achievement peaceful sailor: +5,000 gold & 500 XP', 3);
              playerEntity.gold += 5000;
              playerEntity.experience += 500;
              playerEntity.other_quest_level += 1;
            }
            if (quest_3_list.includes(response) && playerEntity.other_quest_level === 1) {
              playerEntity.socket.emit('showCenterMessage', 'Achievement aggressive pirate: +10,000 gold & 1,000 XP', 3);
              playerEntity.gold += 10000;
              playerEntity.experience += 1000;
              playerEntity.other_quest_level = playerEntity.other_quest_level === 1 ? 2 : playerEntity.other_quest_level;
            }
            if (quest_4_list.includes(response) && playerEntity.other_quest_level === 2) {
              playerEntity.socket.emit('showCenterMessage', 'Achievement king of the sea: +50,000 gold & 5,000 XP', 3);
              playerEntity.gold += 50000;
              playerEntity.experience += 5000;
              playerEntity.other_quest_level = playerEntity.other_quest_level === 2 ? 3 : playerEntity.other_quest_level;
            }
          }

          playerEntity.purchaseShip(item.id, (krewioData || {}).krewname);

          // calculate other_quest_level of captain
          for (y in core.players) {
            otherPlayer = core.players[y];
            if (otherPlayer.parent !== undefined && playerEntity.parent.id === otherPlayer.parent.id && otherPlayer.isCaptain === true) {
              var other_quest_level = otherPlayer.other_quest_level;
            }
          }
          playerEntity.parent.other_quest_level = other_quest_level;
        }
      } else if (item.type === 1) {
        // item
        callback(item.id);
        // check conditions for buying demolisher
        if (item.id === '11' && playerEntity.gold >= 100000) {
          if (playerEntity.overall_cargo >= 100000 && playerEntity.shipsSank >= 10) {
            playerEntity.purchaseItem(item.id);
            console.log(get_timestamp() + 'Player: ' + playerEntity.name + ' is buying item ', item, ' (Demolisher) while having ' + playerEntity.gold + ' gold | IP:', playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
          }
        } else if (item.id === '14' && playerEntity.gold >= 150000) {
          // player can buy this item only once
          if (playerEntity.statsReset !== true) {
            // reset stats
            for (k in playerEntity.points) {
              playerEntity.points[k] = 0;
            }
            playerEntity.availablePoints = playerEntity.level;
            playerEntity.statsReset = true;
            playerEntity.purchaseItem(item.id);
            console.log(get_timestamp() + 'Player: ' + playerEntity.name + ' is buying item ', item, ' (Fountain of youth) while having ' + playerEntity.gold + ' gold | IP:', playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
          }
        } else {
          playerEntity.purchaseItem(item.id);
          console.log(get_timestamp() + 'Player: ' + playerEntity.name + ' is buying item ', item, ' while having ' + playerEntity.gold + ' gold | IP:', playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
        }
      }

      // recalculate amount of killed ships and traded cargo (by all crew members)
      var crew_kill_count = 0;
      var crew_trade_count = 0;
      for (y in core.players) {
        var otherPlayer = core.players[y];
        if (otherPlayer.parent !== undefined && playerEntity.parent.id === otherPlayer.parent.id) {
          crew_kill_count += otherPlayer.shipsSank;
          crew_trade_count += otherPlayer.overall_cargo;
        }
      }
      playerEntity.parent.overall_kills = crew_kill_count;
      playerEntity.parent.overall_cargo = crew_trade_count;
    });

    socket.on('getShips', function (callback) {
      if (playerEntity && playerEntity.parent) {
        var ships = {};
        var island = core.entities[playerEntity.parent.anchorIslandId || playerEntity.parent.id];

        if (!island || island.netType !== 5) {
          return (callback && callback.call && callback('Ooops, it seems you are not in an island.'));
        }

        var cargoUsed = 0;
        for (let i in playerEntity.goods) {
          cargoUsed += playerEntity.goods[i] * core.goodsTypes[i].cargoSpace;
        }

        playerEntity.cargoUsed = cargoUsed;

        for (let i in core.boatTypes) {
          if (
            (!island.onlySellOwnShips &&
              (core.boatTypes[i].availableAt === undefined ||
                core.boatTypes[i].availableAt.indexOf(island.name) !== -1)) ||
            (core.boatTypes[i].availableAt &&
              core.boatTypes[i].availableAt.indexOf(island.name) !== -1)
          ) {
            ships[i] = core.boatTypes[i];
            ships[i].purchasable =
              playerEntity.gold >= ships[i].price &&
              ships[i].cargoSize >= playerEntity.cargoUsed;
          }
        }

        callback && callback.call && callback(undefined, ships);
      }

      callback && callback.call && callback("Ooops, it seems you don't have a boat.");
    });

    socket.on('getItems', function (callback) {
      if (playerEntity && playerEntity.parent) {
        var items = {};
        var island = core.entities[playerEntity.parent.anchorIslandId || playerEntity.parent.id];

        if (!island || island.netType !== 5) {
          return (callback && callback.call && callback('Ooops, it seems you are not in an island.'));
        }

        for (var i in core.itemTypes) {
          var itemProb = Math.random().toFixed(2);

          if (playerEntity.itemId === core.itemTypes[i].id || (playerEntity.checkedItemsList && playerEntity.rareItemsFound.includes(core.itemTypes[i].id))) {
            itemProb = 0;
          }

          if (playerEntity.checkedItemsList && !playerEntity.rareItemsFound.includes(core.itemTypes[i].id)) {
            itemProb = 1;
          }

          if (itemProb <= core.itemTypes[i].rarity &&
            (core.itemTypes[i].availableAt === undefined ||
              core.itemTypes[i].availableAt.indexOf(island.name) !== -1 ||
              (core.itemTypes[i].availableAt &&
                core.itemTypes[i].availableAt.indexOf(island.name) !== -1))
          ) {
            items[i] = core.itemTypes[i];

            if (!playerEntity.checkedItemsList && core.itemTypes[i].rarity !== 1) {
              playerEntity.rareItemsFound.push(core.itemTypes[i].id);
            }

            items[i].purchasable = false;
            if (playerEntity.gold >= items[i].price) {
              items[i].purchasable = true;
            }
          }
        }
        playerEntity.checkedItemsList = true;
        callback && callback.call && callback(undefined, items);
      }

      callback && callback.call && callback("Ooops, it seems you don't have items.");
    });

    socket.on('getGoodsStore', function (callback) {
      if (playerEntity && playerEntity.parent && playerEntity.parent.anchorIslandId) {
        if (core.entities[playerEntity.parent.anchorIslandId] === undefined) {
          callback && callback.call && callback("Ooops, it seems you don't have an anchored boat.");
          return;
        }

        var data = {};
        data.cargo = core.boatTypes[playerEntity.parent.shipclassId].cargoSize;
        data.gold = playerEntity.gold;
        data.goods = playerEntity.goods;
        data.goodsPrice = core.entities[playerEntity.parent.anchorIslandId].goodsPrice;
        data.cargoUsed = 0;

        for (var p in playerEntity.parent.children) {
          var child = playerEntity.parent.children[p];
          if (child && child.netType === 0 && core.entities[child.id] !== undefined) {
            var cargoUsed = 0;
            for (var i in child.goods) {
              cargoUsed += child.goods[i] * core.goodsTypes[i].cargoSpace;
            }

            data.cargoUsed += cargoUsed;
            if (core.entities[child.id]) {
              core.entities[child.id].cargoUsed = cargoUsed;
            }
          }
        }
        callback && callback.call && callback(undefined, data);
      }

      callback && callback.call && callback("Ooops, it seems you don't have an anchored boat.");
    });

    socket.on('buy-goods', function (transaction, callback) {
      // add a timestamp to stop hackers from spamming buy/sell emits
      if (Date.now() - playerEntity.goodsTimestamp < 800) {
        ++playerEntity.sellCounter;
        if (playerEntity.sellCounter > 3) {
          console.log(get_timestamp() + 'Player ' + playerEntity.name + ' is spamming buy/sell emits --> Kicking | IP: ' + playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
          playerEntity.socket.disconnect();
        }
      } else {
        playerEntity.sellCounter = 0;
      }
      playerEntity.goodsTimestamp = Date.now();
      check_player_status();
      console.log(get_timestamp() + 'Operation:', transaction.action, '-', transaction, '| Player:', playerEntity.name, 'Gold:', playerEntity.gold, '| IP:', playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
      if (playerEntity && playerEntity.parent && playerEntity.parent.anchorIslandId && (playerEntity.parent.shipState === 3 || playerEntity.parent.shipState === 4)) {
        Object.assign(transaction, {
          goodsPrice: entities[playerEntity.parent.anchorIslandId].goodsPrice,
          gold: playerEntity.gold,
          goods: playerEntity.goods,
          cargo: core.boatTypes[playerEntity.parent.shipclassId].cargoSize,
          cargoUsed: 0,
        });

        for (var p in playerEntity.parent.children) {
          var child = playerEntity.parent.children[p];
          if (child && child.netType === 0 && core.entities[child.id] !== undefined) {
            var cargoUsed = 0;
            for (var i in child.goods) {
              cargoUsed += child.goods[i] * core.goodsTypes[i].cargoSpace;
            }

            transaction.cargoUsed += cargoUsed;
            core.entities[child.id].cargoUsed = cargoUsed;
          }
        }

        transaction.quantity = parseInt(transaction.quantity);

        // Start quantity validation
        var island = core.entities[playerEntity.parent.anchorIslandId || playerEntity.parent.id];
        if (transaction.action === 'buy') {
          playerEntity.last_island = island.name;
          var max = parseInt(transaction.gold / transaction.goodsPrice[transaction.good]);
          var maxCargo = (transaction.cargo - transaction.cargoUsed) / core.goodsTypes[transaction.good].cargoSpace;

          if (max > maxCargo) {
            max = maxCargo;
          }

          max = Math.floor(max);

          if (transaction.quantity > max) {
            transaction.quantity = max;
          }
        }

        if (transaction.quantity.action === 'sell' && transaction.quantity > transaction.goods[transaction.good]) {
          transaction.quantity = transaction.goods[transaction.good];
        }

        if (transaction.quantity < 0) {
          transaction.quantity = 0;
        }

        // End quantity validation

        // Start transaction
        if (transaction.action === 'buy') {
          // Remove gold and add goods
          let gold = transaction.quantity * transaction.goodsPrice[transaction.good];
          transaction.gold -= gold;
          transaction.goods[transaction.good] += transaction.quantity;
        }

        if (transaction.action === 'sell') {
          // Add gold and remove goods
          // This is a stub of validation to stop active exploits
          // Consider to expand this to player-owned only goods
          if (transaction.cargoUsed < transaction.quantity) {
            console.log(get_timestamp() + 'Exploit detected (sell more than you have). Kicking:', playerEntity.name, '| IP:', playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
            playerEntity.socket.disconnect();
            return;
          }
          let gold = transaction.quantity * transaction.goodsPrice[transaction.good];
          transaction.gold += gold;
          transaction.goods[transaction.good] -= transaction.quantity;
          if (playerEntity.last_island !== island.name) {
            playerEntity.overall_cargo += gold;
          }
          if (transaction.goods[transaction.good] < 0 || playerEntity.goods[transaction.good] < 0) {
            console.log(get_timestamp() + 'Exploit detected (sell wrong goods) | IP:', playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
            console.log('Exploit (sell wrong goods) reason: ' + JSON.stringify(playerEntity.goods), '| Server' + playerEntity.serverNumber);
            playerEntity.socket.disconnect();
            return;
          }

          // trading achievement
          playerEntity.trade_level = playerEntity.trade_level === undefined ? 0 : playerEntity.trade_level;
          if (playerEntity.overall_cargo >= 1000 && playerEntity.trade_level === 0) {
            playerEntity.socket.emit('showCenterMessage', 'Achievement trading beginner: +1,000 gold +100 XP', 3);
            transaction.gold += 1000;
            playerEntity.experience += 100;
            playerEntity.trade_level += 1;
          }
          if (playerEntity.overall_cargo >= 6000 && playerEntity.trade_level === 1) {
            playerEntity.socket.emit('showCenterMessage', 'Achievement trading master: +2,000 gold +200 XP', 3);
            transaction.gold += 2000;
            playerEntity.experience += 200;
            playerEntity.trade_level += 1;
          }
          if (playerEntity.overall_cargo >= 15000 && playerEntity.trade_level === 2) {
            playerEntity.socket.emit('showCenterMessage', 'Achievement trading champion: +5,000 gold +500 XP', 3);
            transaction.gold += 5000;
            playerEntity.experience += 500;
            playerEntity.trade_level += 1;
          }
          if (playerEntity.overall_cargo >= 30000 && playerEntity.trade_level === 3) {
            playerEntity.socket.emit('showCenterMessage', 'Achievement trading king: +10,000 gold +1,000 XP', 3);
            transaction.gold += 10000;
            playerEntity.experience += 1000;
            playerEntity.trade_level += 1;
          }
        }
        // End transaction

        // calculate amount of traded cargo (by all crew members)
        var crew_trade_count = 0;
        for (y in core.players) {
          var otherPlayer = core.players[y];
          if (otherPlayer.parent !== undefined && playerEntity.parent.id === otherPlayer.parent.id) {
            crew_trade_count += otherPlayer.overall_cargo;
          }
        }
        playerEntity.parent.overall_cargo = crew_trade_count;

        // Update player
        playerEntity.gold = transaction.gold;
        playerEntity.goods = transaction.goods;

        // update player highscore in mongo db
        if (playerEntity.isLoggedIn === true && playerEntity.serverNumber === 1 && playerEntity.last_island !== island.name && playerEntity.gold > playerEntity.highscore) {
          console.log(get_timestamp() + 'Update highscore for player:', playerEntity.name, '| Old highscore:', playerEntity.highscore, '| New highscore:', +playerEntity.gold, '| IP:', playerEntity.socket.handshake.address);
          playerEntity.highscore = playerEntity.gold;
          let myobj = {
            $set: { highscore: Math.round(playerEntity.highscore) },
          };
          let query = { playerName: playerEntity.name };
          mongo.UpdateOneWithQuery('players', query, myobj, false, function (
            callback
          ) {
            // TODO: validate callback from mongo
          });

        }

        callback && callback.call && callback(undefined, {
            gold: transaction.gold,
            goods: transaction.goods,
          });

        for (p in playerEntity.parent.children) {
          child = playerEntity.parent.children[p];
          if (child && child.netType === 0 && core.entities[child.id] !== undefined) {
            cargoUsed = 0;
            for (var i in child.goods) {
              cargoUsed += child.goods[i] * core.goodsTypes[i].cargoSpace;
            }

            transaction.cargoUsed += cargoUsed;
            core.entities[child.id].cargoUsed = cargoUsed;
            if (child.id !== playerEntity.id) {
              child.socket.emit('cargoUpdated');
            }
          }
        }
        console.log(get_timestamp() + 'After Operation:', transaction.action, '-', '| Player:', playerEntity.name, 'Gold:', playerEntity.gold, '| IP:', playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
        return;
      }

      callback && callback.call && callback(new Error("Ooops, it seems you don't have a boat."));
    });

    socket.on('getExperiencePoints', function (callback) {
      if (playerEntity && playerEntity.parent) {
        playerEntity.updateExperience();
        var obj = {};

        obj.experience = playerEntity.experience;
        obj.points = playerEntity.points;
        obj.availablePoints = playerEntity.availablePoints;

        callback && callback.call && callback(undefined, obj);
      }

      callback && callback.call && callback("Ooops, it seems you don't have a boat.");
    });

    socket.on('allocatePoints', function (points, callback) {
      // check amount of already allocated points
      let countPoints = 0;
      for (k in playerEntity.points) {
        countPoints += playerEntity.points[k];
      }
      // Validate the player's stats
      if (countPoints > 50)
        console.log(get_timestamp() + 'HACK! ALLOCATED POINTS > 50 |', 'Player: ' + playerEntity.name + ' | IP: ' + playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
      if (playerEntity.availablePoints > 50)
        console.log(get_timestamp() + 'HACK! POINTS > 50 |', 'Player: ' + playerEntity.name + ' | IP: ' + playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
      // check if player has availablePoints (not more than 50) and if he already allocated 51 points
      if (playerEntity && playerEntity.parent && playerEntity.availablePoints > 0 && playerEntity.availablePoints <= 50 && countPoints < 51) {
        console.log(get_timestamp() + 'Points allocated:', points, '| Overall allocated points: ', countPoints + 1, '| Player: ' + playerEntity.name + ' | IP: ' + playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
        var i;
        let countAllocatedPoints = 0;
        for (i in points) {
          // sum up all allocated points
          countAllocatedPoints += points[i];
          // check for point allocation exploit by checking for:
          // negative values, value error, correct index name, multiple points
          if (points[i] < 0 || Number.isInteger(points[i]) === false || !(i === 'fireRate' || i === 'distance' || i === 'damage') || countAllocatedPoints > 1) {
            console.log(get_timestamp() + 'Exploit detected (stats hacking). Player ' + playerEntity.name + ' | IP: ' + playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
          }
          else if (points[i] !== undefined && typeof points[i] == 'number' && playerEntity.availablePoints > 0 && points[i] <= playerEntity.availablePoints) {
            playerEntity.points[i] += points[i];
            playerEntity.availablePoints -= points[i];
          }
        }

        playerEntity.updateExperience();

        callback && callback.call && callback(undefined);
      }

      callback && callback.call && callback("Ooops, it seems you don't have a boat.");
    });
    socket.on('bank', function (data) {
      if (playerEntity.isLoggedIn) {
        if (playerEntity.parent.name === 'Labrador' || (playerEntity.parent.anchorIslandId && core.Landmarks[playerEntity.parent.anchorIslandId].name === 'Labrador')) {
          var setBankData = function () {
            var bankData = {};
            bankData.my = playerEntity.bank.deposit;
            bankData.total = 0;
            for (var z in core.players) {
              if (core.players[z].bank.deposit !== 0 && core.players[z].bank.deposit > 50000 && core.players[z].bank.deposit !== undefined) {
                bankData.total += core.players[z].bank.deposit - 50000;
              }
            }
            // get the sum of all cold bank accounts (from mongo db)
            var bankQuery = { name: 'bank' };
            mongo.ReturnSingleValue('bank', bankQuery, function (callback) {
              bankData.total += callback['overallSum'];
              socket.emit('setBankData', bankData);
            });
          };
          if (data) {
            // set vars for mongo db actions
            var query = { playerName: playerEntity.name };
            if (data.deposit && playerEntity.gold >= data.deposit && data.deposit >= 1 && data.deposit <= 1e5 && typeof data.deposit == 'number' && data.deposit + playerEntity.bank.deposit <= 150000) {
              var integerdeposit = Math.trunc(data.deposit);
              playerEntity.gold -= integerdeposit;
              // check if players gold is "cold" (mongo db) or "hot" (memory)
              if (playerEntity.bank.deposit >= 50000) {
                playerEntity.bank.deposit += integerdeposit;
                setBankData();
              } else if (playerEntity.bank.deposit + integerdeposit > 50000) {
                // update the overallSum in bank database (increase)
                let addAmount = 50000 - playerEntity.bank.deposit;
                playerEntity.bank.deposit += integerdeposit;
                let bankObj = { $inc: { overallSum: addAmount } };
                mongo.ReturnResultAndUpdate('bank', bankQuery, bankObj, false, function (callback) {
                  console.log(get_timestamp() + 'Player ' + playerEntity.name + ' increased overallSum in bank (database) to: ' + (callback['value']['overallSum'] + integerdeposit) + ' | plus ' + integerdeposit, '| Server' + playerEntity.serverNumber);
                  setBankData();
                });
              } else {
                playerEntity.bank.deposit += integerdeposit;
                // update the overallSum in bank database (increase)
                let bankObj = { $inc: { overallSum: integerdeposit } };
                mongo.ReturnResultAndUpdate('bank', bankQuery, bankObj, false, function (callback) {
                  console.log(get_timestamp() + 'Player ' + playerEntity.name + ' increased overallSum in bank (database) to: ' + (callback['value']['overallSum'] + integerdeposit) + ' | plus ' + integerdeposit, '| Server' + playerEntity.serverNumber);
                  setBankData();
                });
              }
              // update stored gold in mongo db (for player)
              let myobj = {
                $set: {
                  gold: playerEntity.bank.deposit > 50000 ? 50000 : playerEntity.bank.deposit,
                },
              };
              console.log(get_timestamp() + 'Player: ' + playerEntity.name + " | Increase player's overall gold in the bank (hot & cold): " + playerEntity.bank.deposit, '| Server' + playerEntity.serverNumber);
              mongo.UpdateOneWithQuery('players', query, myobj, false, function (callback) {
                // TODO: validate callback from mongo
              });
            }
            if (data.takedeposit && playerEntity.bank.deposit >= data.takedeposit && data.takedeposit >= 1 && data.takedeposit <= 1e5 && typeof data.takedeposit == 'number') {
              integerdeposit = Math.trunc(data.takedeposit);
              // take 10% fee for bank transaction
              let earnedFee = integerdeposit * 0.1;
              playerEntity.gold += integerdeposit * 0.9;
              // check if player gold is "cold" (mongo db) or "hot" (memory)
              let bankQuery = { name: 'bank' };
              if (playerEntity.bank.deposit <= 50000) {
                playerEntity.bank.deposit -= integerdeposit;
                let bankObj = {
                  $inc: {
                    overallSum: -integerdeposit,
                    earnedWithFees: earnedFee,
                  },
                };
                mongo.ReturnResultAndUpdate('bank', bankQuery, bankObj, false, function (callback) {
                  console.log(get_timestamp() + 'Player ' + playerEntity.name + ' decreased overallSum in bank (database) to: ' + (callback['value']['overallSum'] - integerdeposit) + ' | minus ' + integerdeposit, '| Server' + playerEntity.serverNumber);
                  setBankData();
                });
              } else if (playerEntity.bank.deposit - integerdeposit < 50000) {
                // update the overallSum in bank database (decrease)
                playerEntity.bank.deposit -= integerdeposit;
                let subtractAmount = 50000 - playerEntity.bank.deposit;
                let bankObj = {
                  $inc: {
                    overallSum: -subtractAmount,
                    earnedWithFees: earnedFee,
                  },
                };
                mongo.ReturnResultAndUpdate('bank', bankQuery, bankObj, false, function (callback) {
                  console.log(get_timestamp() + 'Player ' + playerEntity.name + ' decreased overallSum in bank (database) to: ' + (callback['value']['overallSum'] - integerdeposit) + ' | minus ' + integerdeposit, '| Server' + playerEntity.serverNumber);
                  setBankData();
                });
              }
              else {
                playerEntity.bank.deposit -= integerdeposit;
                let bankObj = { $inc: { earnedWithFees: earnedFee } };
                mongo.UpdateOneWithQuery('bank', bankQuery, bankObj, false, function (callback) {
                  // TODO: validate callback from mongo
                });
                setBankData();
              }
              // update stored gold in mongo db (of the player)
              let myobj = {
                $set: {
                  gold: playerEntity.bank.deposit > 50000 ? 50000 : playerEntity.bank.deposit,
                },
                $inc: { feePaid: earnedFee },
              };
              console.log(get_timestamp() + 'Player: ' + playerEntity.name + " | Decrease player's overall gold in the bank (hot & cold): " + playerEntity.bank.deposit, '| Server' + playerEntity.serverNumber);
              mongo.UpdateOneWithQuery('players', query, myobj, false, function (callback) {
                // TODO: validate callback from mongo
              });
            }
          } else {
            setBankData();
          }
        }
      } else {
        socket.emit('setBankData', { warn: 1 });
      }
    });
    socket.on('addMarker', function (data) {
      if (playerEntity.clan !== '' && typeof playerEntity.clan !== 'undefined') {
        if (playerEntity.markerMapCount < new Date() - 5000) {
          if (
            data.x &&
            data.y &&
            data.x < 1700 &&
            data.x > 0 &&
            data.y < 1700 &&
            data.y > 0 &&
            typeof data.x === 'number' &&
            typeof data.y === 'number'
          ) {
            playerEntity.markerMapCount = new Date();
            var clan = playerEntity.clan;
            for (var z in entities) {
              if (entities[z].netType === 0 && entities[z].clan === clan) {
                entities[z].socket.emit('chat message', {
                  playerId: playerEntity.id,
                  playerName: playerEntity.name,
                  recipient: 'clan',
                  message: 'Attention to the map!',
                });
                entities[z].socket.emit('clanMarker', data);
              }
            }
          }
        }
      }
    });
  }

  // catch players with local script modification
  socket.on('createPIayer', function (data) {
    data.hacker = true;
    console.log(get_timestamp() + "Possible exploit detected (modified client script). Player name:", data.name , "| IP:", socket.handshake.address);
    createThePlayer(data);
    // console.log(get_timestamp() + "Exploit detected (modified client script) | Adding IP "+socket.handshake.address+" to bannedIPs ("+bannedIPs.length+")");
    // socket.emit('showCenterMessage', 'You have been banned... Contact us on Discord', 6);

    // if (socket.handshake.address.length > 5) {
    //     add_to_banlist(playerEntity.socket.handshake.address);
    // } else {
    //     console.log(get_timestamp() + "chat msg: failed to add IP. IP invalid")
    // }
  });

  // assign player Data sent from the client
  socket.on('createPlayer', function (data) {
    if (data.name && auth0AccessToken === undefined) {
      var options = {
        method: 'POST',
        url: 'https://' + process.env.AUTH0_DOMAIN + '/oauth/token',
        headers: {'content-type': 'application/x-www-form-urlencoded'},
        form: {
          grant_type: 'client_credentials',
          client_id: process.env.AUTH0_API_CLIENT_ID,
          client_secret: process.env.AUTH0_API_CLIENT_SECRET,
          audience: 'https://' + process.env.AUTH0_DOMAIN + '/api/v2/'
        }
      };

      function getAccessToken() {
        return new Promise(function (resolve, reject) {
          request(options, function (error, response, body) {
            if (error) throw new Error(error);
            resolve(JSON.parse(body).access_token)
          });
        });
      }

      getAccessToken().then(function (val) {
        auth0AccessToken = val
        createThePlayer(data);
      })
    }
    else {
      createThePlayer(data)
    }
  });

  var createThePlayer = function (data) {
    if (data.token && data.name) {
      // decode base64 token
      let buff = new Buffer.from(data.token, 'base64');
      let decodedToken = buff.toString('ascii');

      const options = {
        url: 'https://' + process.env.AUTH0_DOMAIN + '/api/v2/users/' + decodedToken,
        headers: {"Content-Type": "application/json", "Authorization": "Bearer " + auth0AccessToken}
      }

      function callback (error, response, body) {
        if (!error && response.statusCode === 200) {
          try {
            let info = JSON.parse(body);
            // validate if user sent the correct token
            if (info.user_id === decodedToken) {
              var name = info.username;
              if(!info.username || info.username === '') {
                name = info.name;
                if(!info.name || info.name === '') {
                  name = info.nickname;
                }
              }

              name = xssFilters.inHTMLData(name);
              name = filter.clean(name);
              name = name.substring(0, 24);
              data.name = name;
              data.last_ip = info.last_ip
              if (Object.keys(core.players).length !== 0) {
                for (let player in core.players) {
                  if (core.players[player].name === name) {
                    console.log(get_timestamp() + 'Player ' + name + ' tried to login multiple times');
                    return;
                  }
                }
                initSocketForPlayer(data);
              } else {
                initSocketForPlayer(data);
              }
            }
            else {
              data.name = undefined
              initSocketForPlayer(data);    
              console.log("Player tried to login with invalid username. Creating player as seadog")
            }
          } catch (e) {
            console.log('Error IN AUTH0 CALLBACK', e);
          }
        }
        else {
          data.name = undefined
          initSocketForPlayer(data);
          // TODO: add proper logging
          console.log("Player passed wrong cookie or Auth0 get user info failed. Creating player as seadog")
        }
      }

      function somes() {
        types = request(options, callback);
      }
      somes()
    }
    else {
      initSocketForPlayer(data)
    }
  };

  // send full world information - force full data. first snapshot (compress with lz-string)
  socket.emit('s', lzString.compress(JSON.stringify(core.compressor.getSnapshot(true))));

  //admin stuff
  socket.on('openAdminPanel',function(callback) {
    if(Admins.includes(playerEntity.name) || Mods.includes(playerEntity.name) || Devs.includes(playerEntity.name)) {
      callback(true);
    }
  });
  socket.on('loginWithPin', function(data) {
    // console.log(thuglife);
    thuglife.pincodeLogin(data, socket.id, function(callback) {
      let result = callback;
      if(result === 401) // dummy code for mods
        playerEntity.isMod = true;
      else if(result == 402) //dummy code for devs
        playerEntity.isDev = true;
      else if(result == 403) { // dummy code for admins
          playerEntity.isAdmin = true;
      }
  
      playerEntity.socket.emit('showCenterMessage', 'Logged in successfully', 3, 10000);
      socket.emit('accessAdminPanel', result);
    });
  });

  socket.on('loginInAdminPanel', function (data) {
    socket.emit('loginStatus', thuglife.login(data, socket.id));
  });

  socket.on('getPlayers', function () {
    if (thuglife.isAdmin(socket.id)) {
      let data = {};
      for (let z in entities) {
        if (entities[z].netType === 0) {
          data[z] = {
            name: entities[z].name,
            parent: entities[z].parent.id,
            ip: entities[z].socket.handshake.address,
          };
        }
      }
      socket.emit('players', data);
    }
  });

  socket.on('getBoats', function () {
    if (thuglife.isAdmin(socket.id)) {
      let data = {};
      for (let z in entities) {
        if (entities[z].netType === 1) {
          data[z] = {
            crewname: entities[z].crewName,
            id: entities[z].id,
            captainid: entities[z].captainId,
          };
        }
      }
      socket.emit('boats', data);
    }
  });

  socket.on('disconnect', function () {
    if (JSON.stringify(thuglife.onlineAdmins) !== '{}') {
      for (let z in thuglife.onlineAdmins) {
        if (thuglife.onlineAdmins[z].socketId === socket.id) {
          thuglife.logout(socket.id);
          socket.disconnect();
        }
      }
    }
  });
  //admin stuff END
});

// check if string is an integer greater than 0
var isNormalInteger = function (str) {
  var n = ~~Number(str);
  return String(n) === str && n >= 0;
};

var serializeId = function (id) {
  return id.substring(2, 6);
};

// emit a snapshot every 100 ms
var snapCounter = 0;
exports.send = function () {
  snapCounter = snapCounter > 10 ? 0 : snapCounter + 1;
  var msg;

  // if more than 10 snapShots are queued, then send the entire world's Snapshot. Otherwise, send delta
  msg = snapCounter === 10 ? core.compressor.getSnapshot(false) : core.compressor.getDelta();

  if (msg) {
    // compress snapshot data with lz-string
    msg = lzString.compress(JSON.stringify(msg));
    io.emit('s', msg);
  }
};

// added by Jaeyun (improved Itsdabomb, lol) to prevent spammers
var isSpamming = function (playerEntity, message) {
  if (typeof message !== 'string') {
    return true;
  }
  if (message.length > 60 && !Mods.includes(playerEntity.name) && !Admins.includes(playerEntity.name) && !Devs.includes(playerEntity.name)) {
    mutePlayer(playerEntity);
    return true;
  }

  now = new Date();
  // if this is the user's first message. init
  if (playerEntity.lastMessageSentAt === undefined) {
    playerEntity.lastMessageSentAt = now;
    playerEntity.sentMessages = [];
    return false;
  }

  // prevent user from sending messages every second
  if (now - playerEntity.lastMessageSentAt > 1000 && message.length > 1) {
    playerEntity.lastMessageSentAt = now;

    playerEntity.sentMessages.push({
      time: new Date(),
      message: message,
    });

    totalTimeElapsed = 0;
    var charCount = 0;

    for (i in playerEntity.sentMessages) {
      totalTimeElapsed += now - playerEntity.sentMessages[i].time;
      charCount = charCount + Math.max(playerEntity.sentMessages[i].message.length, 20);
    }

    if (charCount > 80 && totalTimeElapsed < 6000) {
      console.log(get_timestamp() + 'Spam detected from player ' + playerEntity.name + ' sending ' + charCount + ' characters in last ' + totalTimeElapsed / 1000 + ' seconds', '| Server' + playerEntity.serverNumber);
      mutePlayer(playerEntity);
      return true;
    } else if (totalTimeElapsed > 4000) {
      charCount = 0;
    }

    if (playerEntity.sentMessages.length > 2) {
      // If the last three messages of the player are the same - mute him
      if (playerEntity.sentMessages[0].message === playerEntity.sentMessages[1].message && playerEntity.sentMessages[0].message === playerEntity.sentMessages[2].message) {
        console.log(get_timestamp() + 'Spam detected from player ' + playerEntity.name + ' sending same messages multiple times', '| Server' + playerEntity.serverNumber);
        mutePlayer(playerEntity);
        playerEntity.sentMessages = []; // zero the players message array so that the following checks do not cause conflicts

        return true;
      }
    }

    if (playerEntity.sentMessages.length >= 4) {
      // If a player sent 4 messages in 5 seconds -  muted him
      if (playerEntity.sentMessages[3].time - playerEntity.sentMessages[0].time <= 5000) {
        console.log('Spam detected from the user' + playerEntity.name + ' sending ' + charCount + ' characters in last ' + totalTimeElapsed / 1000 + ' seconds', '| Server' + playerEntity.serverNumber);
        mutePlayer(playerEntity);
        playerEntity.sentMessages = []; // zero the players message array so that the following checks do not cause conflicts
        return true;
      }
    }

    if (playerEntity.sentMessages.length > 4) {
      playerEntity.sentMessages.shift(); // remove the first element
    }
    // console.log(playerEntity.sentMessages);
    return false; // no spamming
  } else if (now - playerEntity.lastMessageSentAt < 1000 && now - playerEntity.lastMessageSentAt > 0 && message.length > 1) {
    // If a player sent 4 messages in a row in less than 4 seconds, muted him
    if (playerEntity.sentMessages.length >= 4) {
      if (playerEntity.sentMessages[3].time - playerEntity.sentMessages[0].time < 4000) {
        console.log(get_timestamp() + 'Spam detected from player' + playerEntity.name + ' sending ' + message.length + ' messages in last ' + totalTimeElapsed / 1000 + ' seconds', '| Server' + playerEntity.serverNumber);
        mutePlayer(playerEntity);
        playerEntity.sentMessages = []; // zero the players message array so that the following checks do not cause conflicts
        return true;
      }
    }
  } else if (now - playerEntity.lastMessageSentAt < 0 && message.length > 1) {
    //If a player use permanent spam after muted, kick him
    if (playerEntity.spamCount === undefined) {
      playerEntity.spamCount = 1;
    }
    playerEntity.spamCount++;
    if (playerEntity.spamCount === 15) {
      console.log(get_timestamp() + 'Excessive spam by player' + playerEntity.name + ' --> KICK | IP: ' + playerEntity.socket.handshake.address, '| Server' + playerEntity.serverNumber);
      playerEntity.socket.disconnect();
    }
    return true;
  } else {
    return true;
  }
};

var mutePlayer = function (playerEntity) {
  console.log(get_timestamp() + 'Muting player ' + playerEntity.name, '| Server' + playerEntity.serverNumber);
  playerEntity.lastMessageSentAt = new Date(now.getTime() + 120000); // no talkie for next 5 minutes
};

exports.io = io;
