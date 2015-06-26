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
 * Module that managed rpc.
 *      Модуль, управляющий удаленным вызовом процедур.
 * @class HeraldServer.RPCWorker
 * @alternateClassName RPCWorker
 * @member HeraldServer
 */

/**
 * Constructor.
 *      Конструктор.
 * @method constructor
 * @returns {RPCWorker} RPCWorker object.
 *      Объект RPCWorker.
 */
function RPCWorker(){
  /**
   * Object for route rpc.
   *      Объект для управления rpc.
   * @type {{name: Function}}
   */
  this.rpcFunction = {};
  return this;
}


/**
 * Function for remote calling. It is callback for {@link HeraldServer.RPCWorker#addRpcWorker HeraldServer.RPCWorker.addRpcWorker()} method.
 *      Функция для удаленного вызова. Передается как callback в метод {@link HeraldServer.RPCWorker#addRpcWorker HeraldServer.RPCWorker.addRpcWorker()}.
 * @method remoteProcedure
 * @member HeraldServer.RPCWorker
 * @param {String} uid Uid of application that want to call this.
 *      Uid приложения, которое пытается вызвать данную функцию.
 * @param {Object} args Arguments for call. Аргументы для вызова.
 * @param {Function} callback Callback function to return result. First arg is Error object or null. Second response data if is.
 *      Функция для возврата результатов. Первый аргумент - объект ошибки или null. Второй - результат.
 */




/**
 * Add function to work with rpc calls.
 *      Добавляет функцию для удаленного использования.
 * @param {String} actionName Action name. Название действия.
 * @param {Function} callback Function to call. {@link HeraldServer.RPCWorker#remoteProcedure Should be like this}.
 *      Вызываемая функция. {@link HeraldServer.RPCWorker#remoteProcedure Должна соответствовать этому шаблону}.
 * @returns {Boolean} True if added. false if was function with such name.
 * False means, that you should remove old rpc function with such actionName.
 *      True если добавленно. false если есть функция с таким именем.
 *      False означает, что Вам необходимо удалить старую функцию с таким названием действия.
 */
RPCWorker.prototype.addRpcWorker = function(actionName, callback){
  if (this.rpcFunction[actionName]) return false;
  this.rpcFunction[actionName] = callback;
  return true;
};


/**
 * Remove rpc function. Удаляет функцию из используемых.
 * @param {String} actionName Action name. Название действия.
 * @returns {Boolean} true if was such function. Else returns false.
 *    true если такая функция была. false, если нет.
 */
RPCWorker.prototype.removeRpcWorker = function(actionName){
  var answer = actionName in this.rpcFunction;
  delete this.rpcFunction[actionName];
  return answer;
};

/**
 * Call rpcWorker with name, arguments and callback.
 *      Вызывает функцию с соответсвующим именем, прокидывая аргументы и callback.
 * @param {String} action Action name. Название действия.
 * @param {Object} body Message body. Тело сообщения.
 * @param {Object} body.args Arguments object for call function.
 *      Объект аргументов для вызова процедуры.
 * @param {Function} callback
 * @protected
 * @returns {*}
 */
RPCWorker.prototype.do = function(action, body, callback){
  if (!body || !body.args) return callback(new Error('WRONG_ARGS'));
  if (!body || !body.uid) return callback(new Error('INTERNAL_SERVER_ERROR'));
  if (!this.rpcFunction[action]) return callback(new Error('WRONG_ACTION'));
  return this.rpcFunction[action](body.uid, body.args, callback);
};

module.exports = RPCWorker;