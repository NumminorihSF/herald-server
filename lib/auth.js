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
 * Module check auth of connection.
 *      Модуль проверки возможности авторизации.
 * @class HeraldServer.Authorizer
 * @alternateClassName Authorizer
 * @member HeraldServer
 */

/**
 * Constructor.
 *      Конструктор.
 * @method constructor
 * @param {CryptMaker} parser Object, that can parse messages.
 *      Объект для парсинга сообщений
 * @param {Logger | Object} [logger] Logger object. Default is {@link Logger Logger} with {@link Logger#name Logger.name} = "Auth".
 *      Объект для логгирования. По умолчанию - {@link Logger Logger} с {@link Logger#name Logger.name} = "Auth".
 * @param {String[] | RegExp[]} [whiteList]
 * List of applications can connect. If list is empty - any is allowed. Can be RegExp's.
 *      Список приложений, которые могут подключаться. Если список пустой - разрешены все. Можно использовать регулярные выражения.
 * @returns {Authorizer}
 */
function Authorizer (parser, logger, whiteList){
  if (whiteList && !(whiteList instanceof Array)) throw Error('WRONG_ARGS');
  this.parser = parser;
  //if (typeof logger === 'string') this.logger = require(__dirname+'/logger.js').getLogger(logger);
  this.logger = logger || require(__dirname+'/logger.js').getLogger('Auth');
  this.whiteList = whiteList || [];

  return this;
}

/**
 * Check if connection is valid if not valid - return Error.
 *      Проверяет авторизацию соединения, если не получается, или не авторизован - возвращает Error.
 * @param {String} message Authorize message. By default should be rpc call with action 'authorize'.
 *      Сообщение авторизации. По умолчанию должно быть rpc с действием 'authorize'.
 * @param {Function} callback If not authorized - return Error. If authorized - second argument is an header from message
 *      Если авторизация не удалась - первый аргумент - ошибка. Если удалась - первый аргумент null, второй - заголовок сообщения.
 * @returns {Authorizer}
 */
Authorizer.prototype.check = function(message, callback){
  var mes = this.parser.parseMessage(message);
  if (!mes) return callback(new Error('NO_MESS'));
  if (!mes.header) return callback(new Error('NO_HEAD'));
  if (!mes.header.name) return callback(new Error('NO_ANON'));
  if (!mes.header.uid) return callback(new Error('NO_ANON'));
  if (mes.header.rpc !== 'herald-server') return callback(new Error('NEED_RPC'));
  if (mes.header.action !== 'authorize') return callback(new Error('NEED_RPC'));
  if (!mes.header.messId) return callback(new Error('NEED_MESS_ID'));
  if (!mes.header.actionId) return callback(new Error('NEED_ACTION_ID'));

  if (!mes.body) return callback(new Error('EMPTY_BODY'));
  if (!mes.body.args) return callback(new Error('EMPTY_BODY_ARGS'));
  if (mes.header.name !== mes.body.args.name) return callback(new Error('WRONG_KEY'));
  if (mes.header.uid !== mes.body.args.uid) return callback(new Error('WRONG_KEY'));


  //If whileList is not empty - try find application name in it, if not found - try check by regexps.
  if (this.whiteList.length) {
    var inWhiteList = false;
    if (this.whiteList.indexOf(mes.header.name) === -1){
      for (var i = 0; i < this.whiteList.length; i++){
        if (mes.header.name.match(this.whiteList[i])) {
          inWhiteList = true;
          break;
        }
      }
    }
    else inWhiteList = true;
    if (!inWhiteList) return callback(new Error('ACCESS_DENY'));
  }
  this.logger.info('Access granted to ' + mes.header.name + ' : ' + mes.header.uid);

  callback(null, mes.header);

  return this;
};

/**
 * Create and return HeraldServer.Authorizer
 * @param {CryptMaker} parser Object, that can parse messages.
 *      Объект для парсинга сообщений
 * @param {Logger | Object} [logger] Logger object. Default is {@link Logger Logger} with {@link Logger#name Logger.name} = "Auth".
 *      Объект для логгирования. По умолчанию - {@link Logger Logger} с {@link Logger#name Logger.name} = "Auth".
 * @param {String[] | RegExp[]} [whiteList]
 * List of applications can connect. If list is empty - any is allowed. Can be RegExp's.
 *      Список приложений, которые могут подключаться. Если список пустой - разрешены все. Можно использовать регулярные выражения.
 * @static
 * @returns {Authorizer}
 */
Authorizer.createAuthorizer = function (parser, logger, whiteList){
  return new Authorizer(parser, logger, whiteList);
};


module.exports = Authorizer;

