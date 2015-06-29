/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 (NumminorihSF) Konstantine Petryaev
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

/**
 * HeraldServer class.
 *      Класс HeraldServer
 * @class HeraldServer
 */

/**
 * Constructor.
 *      Конструктор.
 * @method constructor
 * @param {Object} [settings] Settings for HeraldServer.
 *      Настройки для HeraldServer.
 * @param {Logger|Object} [settings.logger] Object for log events.
 *      Объект для логгирования событий.
 * @param {String} [settings.welcomeMessage] Server will send it to every new connect.
 *      Отправляется сервером каждому новому подключению.
 * @param {String[] | RegExp[]} [settings.whiteList=[]] White list of application names, what can connect to server.
 * If list is empty - allow every connect.
 *      Белый список имен приложений, доступных для подключения. Если спосик пуст - разрешено любое подключение.
 * @param {CryptMaker | Object} [settings.messageMaker] Object with make and parse logic.
 *      Объект, реализующий логику создания сообщений и их парсинга.
 * @param {String} [needCrypt='no'] If need crypt messages - algorithm for crypt. By default doesn't encrypt.
 *      Если необходимо шифровать сообщения - алогоритм шифрования. По умолчанию не шифрует.
 * @param {String} [key] Encryption key.
 *      Ключ шифрования.
 * @returns {HeraldServer}
 */
function HeraldServer (settings, needCrypt, key){
  HeraldServer.super_.call(this);
  if (typeof settings === 'string') {
    key = needCrypt;
    needCrypt = settings;
    settings = {};
  }
  settings = settings || {};
  this.welcomeMessage = settings.welcomeMessage || "Welcome to herald server";
  this.logger = settings.logger || require(__dirname+'/logger.js').getLogger('H_Server');


  this.rpcs = new HeraldServer.RPC();
  this.router = new HeraldServer.Router();
  this.messageParser = new HeraldServer.MessageParser(this.rpcs, settings.messageMaker, needCrypt, key);
  this.auth = new HeraldServer.Authorizer(this.messageParser, this.logger, settings.whiteList);


  this._connectionLastId = 1;

  var self = this;

  this.rpcs.addRpcWorker('subscribe', function(uid, args, callback){
    self.router.addEvent(uid, args.event);
    return callback(null, 'OK');
  });

  this.rpcs.addRpcWorker('unsubscribe', function(uid, args, callback){
    self.router.removeEvent(uid, args.event);
    return callback(null, 'OK');
  });

  this.timeouts = {};

  this.$ = require('net').createServer(this._serverListener.bind(this));

  this.$.on('listening', function(o){
    this.connected = true;
    this.emit('listening', o);
  }.bind(this));

  this.$.on('connection', function(o){
    this.emit('connection', o);
  }.bind(this));

  this.$.on('close', function(o){
    this.connected = false;
    this.emit('close', o);
  }.bind(this));

  this.$.on('error', function(err){
    this.emit('error', err);
  }.bind(this));

  this.counter = 0;

  return this;
}

(function(){
  require('util').inherits(HeraldServer, (require('events')).EventEmitter);
})();


HeraldServer.Authorizer = require(__dirname+'/auth.js');
HeraldServer.Router = require(__dirname+'/router.js');
HeraldServer.MessageParser = require(__dirname+'/messageParser.js');
HeraldServer.RPC = require(__dirname+'/rpc.js');

/**
 * Add function to remote call. See {@link HeraldServer.RPCWorker#addRpcWorker}.
 *      Добавляет функцию для удаленного вызова. См. {@link HeraldServer.RPCWorker#addRpcWorker}.
 * @param {String} actionName Action name. Название действия.
 * @param {Function} callback Function to call. Функция вызова.
 * @returns {Boolean}
 */
HeraldServer.prototype.addRpcWorker = function(actionName, callback){
  return this.rpcs.addRpcWorker(actionName, callback);
};

/**
 * Remove rpc function. Удаляет функцию из используемых.
 * @param {String} actionName Action name. Название действия.
 * @returns {Boolean} true if was such function. Else returns false.
 *    true если такая функция была. false, если нет.
 */
HeraldServer.prototype.removeRpcWorker = function(actionName){
  return this.rpcs.removeRpcWorker(actionName);
};

//HeraldServer.prototype._authorizeFunction = function(message, callback){
//  message = this.cm.parseMessage(message);
//  if (!message) return callback(new Error('NO_MESS'));
//  if (!message.header) return callback(new Error('NO_HEAD'));
//  if (!message.header.name) return callback(new Error('NO_ANON'));
//  if (!message.header.uid) return callback(new Error('NO_ANON'));
//  if (message.header.rpc !== 'herald-server') return callback(new Error('NEED_RPC'));
//  if (message.header.action !== 'authorize') return callback(new Error('NEED_RPC'));
//  if (!message.header.messId) return callback(new Error('NEED_MESSID'));
//  if (!message.header.actionId) return callback(new Error('NEED_ACTIONID'));
//
//  if (!message.body) return callback(new Error('EMPTY_BODY'));
//  if (!message.body.args) return callback(new Error('EMPTY_BODY_ARGS'));
//  if (message.header.name !== message.body.args.name) return callback(new Error('WRONG_KEY'));
//  if (message.header.uid !== message.body.args.uid) return callback(new Error('WRONG_KEY'));
//
//  if (this.mapUidToConnection[message.header.uid]) return callback(new Error('NOT_UINIQ_UID'));
//
//  if (this.whiteList.length) {
//    var inWhiteList = false;
//    if (this.whiteList.indexOf(message.header.name) === -1){
//      for (var i = 0; i < this.whiteList.length; i++){
//        if (message.header.name.match(this.whiteList[i])) {
//          inWhiteList = true;
//          break;
//        }
//      }
//    }
//    else inWhiteList = true;
//    if (!inWhiteList) return callback(new Error('ACCESS_DENY'));
//  }
//
//  this.logger.info('access granted to %s : %s', message.header.name, message.header.uid);
//  return callback(null, message.header);
//
//};
//

/**
 *
 * @param connect
 * @private
 */
HeraldServer.prototype._serverListener = function(connect) {
  var id = this._connectionLastId++;
  var self = this;

  (this.timeouts[id] = setTimeout(function(){
    connect.end('Doesn\'t know you. Sorry.');
  }, 5000)).unref();

  this.logger.info('New connection. ID:', id);
  connect.setEncoding('utf-8');
  connect.write(self.welcomeMessage+"\r\n\r\n", 'utf-8');

  connect.once('data', function(string){
    self.logger.info('Try authorize: '+id, string);
    self.auth.check(string, function(err, header){
      if (err) {
        self.logger.warn('failed authorize', err.message, connect.address, string);
        return connect.connected && connect.end('Doesn\'t know you. Sorry.');
      }

      clearTimeout(self.timeouts[id]);
      self.router.addConnect(header.name, header.uid, connect, function(){});
      connect.header = header;
      self.emit('connection', connect);

      self.messageParser.listen(connect, function(messageData){
        if (messageData.regExp === true) return self.router.getByNameRegExp(messageData.mask, function(err, sockets){
          if (!sockets) return;
          sockets.map(function(c){
            c.write(messageData.raw, 'utf8', function(err){
              if (err) return self.logger.error('Socket write error.', err);
            });
          });
        });

        if (messageData.uidType === 'name') return self.router.getByName(messageData.mask, function(err, sockets){
          if (!sockets) return;
          sockets.map(function(c){
            c.write(messageData.raw, 'utf8', function(err){
              if (err) return self.logger.error('Socket write error.', err);
            });
          });
        });

        if (messageData.uidType === 'uid') return self.router.getByUid(messageData.mask, function(err, sockets){
          if (!sockets) return;
          sockets.map(function(c){
            c.write(messageData.raw, 'utf8', function(err){
              if (err) return self.logger.error('Socket write error.', err);
            });
          });
        });

        if (messageData.uidType === 'event') return self.router.getByEvent(messageData.mask, function(err, sockets){
          if (!sockets) return;
          sockets.map(function(c){
            c.write(messageData.raw, 'utf8', function(err){
              if (err) return self.logger.error('Socket write error.', err);
            });
          });
        });

      });
    });
  }.bind(this));

  connect.on('end', function() {
    this.logger.info('Connection close. ID:', id);
    clearTimeout(this.timeouts[id]);
    delete this.timeouts[id];
  }.bind(this));

  connect.on('error', function(e){
    this.logger.error('Socket error event:', e);
  }.bind(this));
};


/**
 * Use:
 * `hs.listen(port[, host][, backlog][, callback])`
 * `hs.listen(path[, callback])`
 * `hs.listen(handle[, callback])`
 * `hs.listen(options[, callback])`

 * Options are:
 * `options` {Object} - Required. Supports the following properties:
 * `port` {Number} - Optional.
 * `host` {String} - Optional.
 * `backlog` {Number} - Optional.
 * `path` {String} - Optional.
 * `exclusive` {Boolean} - Optional.
 * `callback` {Function} - Optional.

 *For all info about this see: https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback
 */
HeraldServer.prototype.listen = function(){
  var args = Array.prototype.slice.call(arguments);
  if (args.length === 0) this.$.listen({port: 8765});
  else if (args.length === 1) this.$.listen(args[0]);
  else if (args.length === 2) this.$.listen(args[0], args[1]);
  else if (args.length === 3) this.$.listen(args[0], args[1], args[2]);
  else if (args.length === 4) this.$.listen(args[0], args[1], args[2], args[3]);
};

/**
 * Close all connections to server.
 * @param {Function} callback
 * @returns {*|void}
 */
HeraldServer.prototype.close = function(callback){
  for (var i in this.router.uid){
    this.router.uid[i].end();
  }
  return this.$.close(callback);
};

//
//HeraldServer.prototype.maxConnections = function(){
//  return this.$.maxConnections;
//};

/**
 * Ref server.
 * @experimental
 * @returns {*}
 */
HeraldServer.prototype.ref = function(){
  return this.$.ref();
};

/**
 * Unref server.
 * @experimental
 * @returns {*}
 */
HeraldServer.prototype.unref = function(){
  return this.$.unref();
};

/**
 * Return server connections. Возвращает подключения к серверу.
 * @param callback
 */
HeraldServer.prototype.getConnections = function(callback){
  this.$.getConnections(callback);
};

/**
 * Return address, that server listen. Возвращает адрес, прослушиваемый сервером.
 * @returns {Object}
 */
HeraldServer.prototype.address = function(){
  return this.$.address();
};

//HeraldServer.prototype.ping = function(){
//  var message = this.cm.makeMessage({header: {event:'ping', time: new Date().getTime()}, body: Math.floor(Math.random()*1000-500)});
//  for (var i in this.connections){
//    (function(id) {
//      setImmediate(function(){
//        this.connections[id].emit('ping', message);
//        (this.timeouts[id] = setTimeout(function () {
//          this.fails[id] = ++this.fails[id] || 1;
//          if (this.fails[id] > this.pingMaxFails) this.connections[id].end();
//        }.bind(this), this.pingWaitTimeout)).unref();
//      }.bind(this));
//    }.bind(this))(i);
//  }
//};

//HeraldServer.prototype.publish = function(message){
//  if (message && message.header) {
//    var encrypt = this.cm.makeMessage(message);
//    if (encrypt) {
//      this.logger.debug('PUB '+ message.header.event, message);
//      for (var i in this.connections) {
//        this.connections[i].emit('pub' + message.header.event, encrypt);
//      }
//    }
//  }
//};

//HeraldServer.prototype.publishMessage = function(event, message){
//  this.logger.debug('PUBM '+ event, message);
//  for (var i in this.connections) {
//    this.connections[i].emit('pub' + event, message);
//  }
//};
//
//HeraldServer.prototype.whisp = function(whom, message){
//  this.logger.debug('WH '+ whom, message);
//  var encrypt = this.cm.makeMessage(message);
//  if (encrypt) {
//    this.whisperer.emit('send'+whom, encrypt);
//  }
//
//};
//
//HeraldServer.prototype.whispMessage = function(whom, message){
//  this.logger.debug('WHM '+ whom, message);
//  this.whisperer.emit('send'+whom, message);
//};

//HeraldServer.prototype._getConnectByName = function(name){
//  if (this.mapNameToUid[name]) return this._getConnectByUid(this.mapNameToUid[name][0]);
//};
//
//HeraldServer.prototype._getConnectByUid = function(uid){
//  return this.mapUidToConnection[uid];
//};
//
////HeraldServer.prototype._parseMessage = function(message, connect){
////  var header = this.cm.getHeader(message);
////
////  if (!header || !header.messId) return;
////  if (header.rpc === 'herald-server') {
////    this.emit('_clientWant_'+header.action, {header: header, body: this.cm.getBody}, function(err, res){
////      var body = {error: err, response: res};
////      var h = header;
////      header.uid =
////      this._trySend(connect, message);
////    }.bind(this));
////  }
////
////  if (header.rpcUid) {
////    header.rpc = header.rpcUid;
////    return this._trySend(this._getConnectByUid(header.rpcUid), this.cm.replaceHeader(header, message));
////  }
////
////  if (header.whispUid) return this._trySend(this._getConnectByUid(header.whispUid), message);
////
////  if (header.event) return this.emit('_clientEvent', header.event, message);
////
////  if (header.rpc) return this._trySend(this._getConnectByName(header.rpc), message);
////
////  if (header.whisp) return this._trySend(this._getConnectByName(header.whisp), message);
////
////  if (header.rpcRes) return this._trySend(this._getConnectByUid(header.rpcRes), message);
////
////
////  this.logger.error('Doesn\'t know such message', header);
////  //
////  //
////  //
////  //if (!header || !header.event) return;
////  //this.logger.debug('IN '+header, message);
////  //if (header.whisp) return this.whispMessage(header.whisp, message);
////  //if (header.event == 'pong') {
////  //  return connect.emit('pong', header.time);
////  //}
////  //if (header.event == 'subscribe') {
////  //  var event = this.cm.getBody(message);
////  //  if (!event) return;
////  //  return connect.emit('subscribe', event);
////  //}
////  //if (header.event == 'unsubscribe') {
////  //  event = this.cm.getBody(message);
////  //  if (!event) return;
////  //  return connect.emit('unsubscribe.'+event);
////  //}
////  //else this.publishMessage(header.event, message);
////};
//
//HeraldServer.prototype._trySend = function(connection, message){
//  if (!message) return;
//  console.log(message);
//  if (!this.messageQueue[connection.uid].length) if (this.isSocketReady[connection.uid]) {
//    return this.isSocketReady[connection.uid] = connection.write(message, 'utf-8', function(){});
//  }
//  this.messageQueue[connection.uid].push({m: message, c: function(){}});
//  return false;
//};

module.exports = HeraldServer;