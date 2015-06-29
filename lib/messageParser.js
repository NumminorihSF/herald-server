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
 * Module to parse and make messages.
 *      Модуль, для парсинга и создания сообщений.
 * @class HeraldServer.MessageParser
 * @alternateClassName MessageParser
 * @member HeraldServer
 */

/**
 * Constructor.
 *      Конструктор.
 * @method constructor
 * @param {RPCWorker} rpcWorker Object to do rpc.
 *      Объект для испольнения rpc.
 * @param {CryptMaker|Object} [messageMaker] Object with make and parse logic.
 *      Объект, реализующий логику создания сообщений и их парсинга.
 * @param {String} [alg='no'] Algorithm to encrypt messages.
 *      Алгоритм шифрования сообщений.
 * @param {String} [key] Key to encrypt messages.
 *      Ключ шифрования.
 * @returns {MessageParser} MessageParser object.
 *      Объект MessageParser.
 */
function MessageParser (rpcWorker, messageMaker, alg, key){
  this.rpcWorker = rpcWorker;
  this.cm = messageMaker || new (require('crypt-maker'))({algorithm: alg || 'no', key: key});
  this.lastMessageId = 1;
  return this;
}

/**
 * Wrapper. Обертка.
 * @param {String} message
 * @returns {Object|null}
 * @private
 */
MessageParser.prototype._getHeader = function(message){
  return this.cm.getHeader(message);
};

/**
 * Wrapper. Обертка.
 * @param {String} message
 * @returns {Object|null}
 * @private
 */
MessageParser.prototype._getBody = function(message){
  return this.cm.getBody(message);
};

/**
 * Wrapper
 * @param {Object} header
 * @param {String} message
 * @returns {String}
 * @private
 */
MessageParser.prototype._replaceHeader = function(header, message){
  return this.cm.replaceHeader(header, message);
};

/**
 * Get info about message. Возвращает информацию о сообщении.
 * @param {String} message Raw (encrypted) message. Сырое (зашифрованное) сообщение.
 * @returns {Object} rule
 * @returns {Object} rule.uidType How find socket
 * @returns {Object} rule.mask There are fields: uidType (how search socket), mesType (type of message),
 * mask (mask for Router to find sockets), regExp (true if mask is regexp),
 * header (header of message). Содержит поля: uidType (правило поиска сокета), mesType (тип сообщения),
 * mask (маска поиска сокета), regExp (true если маска это регулярное выражение),
 * header (заголовок сообщения).
 */
MessageParser.prototype.getRule = function(message){
  var header = this._getHeader(message);
  if (header.rpc) {
    if (header.rpc === 'herald-server') return {uidType: 'self', mesType: 'rpc', header: header, body: this._getBody(message)};
    return {uidType: 'name', mesType:'rpc', mask: header.rpc, regExp: null, header: header, raw: message};
  }

  if (header.whisp) return {uidType: 'name', mesType:'event', mask: header.whisp, regExp: null, header: header, raw: message};
  if (header.whispUid) return {uidType: 'uid', mesType:'event', mask: header.whispUid, regExp: null, header: header, raw: message};

  if (header.event) return {uidType: 'event', mesType:'event', mask: header.event, regExp: null, header: header, raw: message};

  if (header.rpcRes) return {uidType: 'uid', mesType:'rpcRes', mask: header.rpcRes, regExp: null, header: header, raw: message};
  if (header.rpcUid) return {uidType: 'uid', mesType:'rpc', mask: header.rpcUid, regExp: null, header: header, raw: message};

  if (header.rpcRegExp) return {uidType: 'name', mesType:'rpc', mask: header.rpcRegExp, regExp: true, header: header, raw: message};
  if (header.rpcBroad) return {uidType: 'name', mesType:'rpc', mask: '.*', regExp: true, header: header, raw: message};

  return {uidType:'fail', header: header};
};

/**
 * Prepare message to send. Fix header, replace it on raw message.
 *      Готовит сообщение. Правит заголовок и подставляет его в сырое сообщение.
 * @param {Object} messageRule Object, that {@link MessageParser#getRule} method returns.
 *      Объект, возвращаемый методом {@link MessageParser#getRule}.
 * @returns {Object|null}
 */
MessageParser.prototype.prepareMessage = function(messageRule){
  if (!messageRule) return null;


  if (messageRule.uidType === 'event') {}
  else if (messageRule.mesType === 'event') {
    if (messageRule.header.whisp) messageRule.header.event = 'whisp';
    else if (messageRule.header.whispUid) messageRule.header.event = 'whisp';
  }
  else if (messageRule.mesType === 'rpcRes') {}
  else if (messageRule.mesType === 'rpc'){
    if (messageRule.header.rpc) {}
    else if (messageRule.header.rpcUid) messageRule.header.rpc = messageRule.header.rpcUid;
    else if (messageRule.header.rpcRegExp) messageRule.header.rpc = messageRule.header.rpcRegExp;
    else if (messageRule.header.rpcBroad) messageRule.header.rpc = messageRule.header.rpcBroad;
  }

  messageRule.raw = this._replaceHeader(messageRule.header, messageRule.raw);
  return messageRule;
};



/**
 * Listen socket and parse messages. Слушает сокет и парсит сообщение.
 * @param {net.Socket} socket
 * @param {Object} socket.header Authorize message header. Заголовок сообщения авторизации.
 * @param {Function} callback Function spawned for every message. Функция вызывается на каждое сообщение.
 * @returns {*}
 */
MessageParser.prototype.listen = function(socket, callback){
  if (!socket) return;

  var mes = this.prepareMessage({
    uidType: 'uid',
    mesType: 'rpcRes',
    mask: socket.header.uid,
    regExp: false,
    header: {rpcRes: socket.header.uid, messId: socket.header.messId, actionId: socket.header.actionId, action: socket.header.action},
    body: {error: null, result: 'OK'},
    raw: this.cm.makeMessage({
      header: {rpcRes: socket.header.uid, actionId: socket.header.actionId, action: socket.header.action},
      body: {error: null, result: 'OK'}
    })
  });
  callback(mes);

  var self = this;
  var tail = '';
  function onData (chunk){
    tail += chunk.replace(/\r\n\r\n[\r\n]*/g, '\r\n\r\n');
    var array = self.cm.splitMessagesForce(tail);
    tail = array.pop();
    if (tail > 1048576) tail = '';
    array.map(function(raw){
      return self.getRule(raw);
    }).filter(function(m){
      if (m.uidType === 'fail') return false;
      if (m.uidType === 'self') {
        m.body = m.body || {};
        m.body.uid = m.header.uid;
        self.rpcWorker.do(m.header.action, m.body, function(err, data){
          callback({
            uidType: 'uid',
            mesType: 'rpcRes',
            mask: m.header.uid,
            regExp: false,
            header: {rpcRes: m.header.uid, actionId: m.header.actionId, action: m.header.action, messId: self.lastMessageId++},
            body: {error: (err instanceof Error) ? err.message : err, result: data},
            raw: self.cm.makeMessage({
              header: {rpcRes: m.header.uid, actionId: m.header.actionId, action: m.header.action, messId: self.lastMessageId++},
              body: {error: (err instanceof Error) ? err.message : err, result: data}
            })
          });
        });
        return false;
      }
      return true;
    }).map(function(m){
      var rule = self.prepareMessage(m);
      if (rule) callback(rule);
    });
  }

  socket.on('data', onData);
  socket.once('close', function(){
    socket.removeListener('data', onData);
  });
  return true;
};


/**
 * Parse message. Парсит сообщение.
 * @param {String} message
 * @returns {Object|null}
 */
MessageParser.prototype.parseMessage = function(message){
  return this.cm.parseMessage(message);
};


/**
 * Another constructor. Еще один конструктор
 * @param {RPCWorker} rpcWorker Object to do rpc.
 *      Объект для испольнения rpc.
 * @param {CryptMaker|Object} [messageMaker] Object with make and parse logic.
 *      Объект, реализующий логику создания сообщений и их парсинга.
 * @param {String} [alg='no'] Algorithm to encrypt messages.
 *      Алгоритм шифрования сообщений.
 * @param {String} [key] Key to encrypt messages.
 *      Ключ шифрования.
 * @static
 * @returns {MessageParser}
 */
MessageParser.createParser = function(rpcWorker, messageMaker, alg, key){
  return new MessageParser(rpcWorker, messageMaker, alg, key);
};

module.exports = MessageParser;