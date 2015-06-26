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
 * Module for message routing.
 *      Модуль для роутинга сообщений.
 * @class HeraldServer.Router
 * @alternateClassName Router
 * @member HeraldServer
 */


/**
 * Constructor.
 *      Конструктор.
 * @method constructor
 * @returns {Router} Router object.
 *      Объект роутера.
 */
function Router (){
  /**
   * Object with events subscribers. Key is name of event, value is array of sockets' uids.
   * @type {{name: String[]}}
   */
  this.event = {};
  /**
   * Object for mapping name to uid. Key is name of application, value is array of sockets' uids.
   * @type {{name: String[]}}
   */
  this.name = {};
  /**
   * Object for mapping uid to socket.
   * @type {{uid: net.Socket}}
   */
  this.uid = {};

  /**
   * @type {{uid: Number}}
   * @private
   */
  this._nameLastUsed = {};

  return this;
}

/**
 * Add connection for server messaging.
 *      Добавляет сокет к пересылке сообщений.
 * @param {String} name Client (application) name. Название клиента (приложения).
 * @param {String} uid Connection UID. UID подключения.
 * @param {net.Socket} socket
 * @param {Function} callback `function(err[, count])`  err: Error|null, count: Number - counter of clients with such name.
 *      `function(err[, count])`  err: Error|null, count: Number - количество подключений с таким именем.
 * @returns {*}
 */
Router.prototype.addConnect = function(name, uid, socket, callback){
  if (this.uid[uid]) return callback(new Error('NOT_UNIQ'));

  //add uid to naming routes
  this.name[name] = this.name[name] || [];
  if (typeof this._nameLastUsed[name] === 'undefined') this._nameLastUsed[name] = 0;
  var length = this.name[name].push(uid);

  this.uid[uid] = socket;

  socket.once('close', function(){
    this._removeConnect(name, uid);
  }.bind(this));
  return callback(null, length);
};

/**
 * Remove connection form server messaging.
 * @param {String} name
 * @param {String} uid
 * @returns {String[]}
 * @private
 */
Router.prototype._removeConnect = function(name, uid){
  if (!this.uid[uid]) return [];

  if (this.name[name].indexOf(uid) !== -1) this.name[name].splice(this.name[name].indexOf(uid), 1);
  if (this.name[name].length === 0) {
    delete this._nameLastUsed[name];
    delete this.name[name];
  }

  delete this.uid[uid];
  return Object.keys(this.event).map(function(e){
    if (this.event[e].indexOf(uid) !== -1) this.event[e].splice(this.event[e].indexOf(uid), 1);
    if (this.event[e].length === 0) delete this.event[e];
    return e;
  }.bind(this));
};

/**
 * Get sockets array with one or without elements to send message.
 *      Возвращает в callback массив сокетов для отправки сообщений из одного элемента или пустой.
 * @param {string} name Name of connection. Имя подключения.
 * @param {Function} callback
 * @returns {*}
 */
Router.prototype.getByName = function(name, callback){
  if (!this.name[name]) return callback(null, []);
  this._nameLastUsed[name]++;
  if (this._nameLastUsed[name] >= this.name[name].length) this._nameLastUsed[name] = 0;
  if (!this.name[name][this._nameLastUsed[name]]) return callback(null, []);
  if (!this.uid[this.name[name][this._nameLastUsed[name]]]) return callback(null, []);
  return callback(null, [this.uid[this.name[name][this._nameLastUsed[name]]]]);
};

/**
 * Get sockets array with all connections with such name to send message.
 *      Возвращает в callback массив Всех сокетов для отправки сообщений, где название соответвует переданному.
 * @param {string} name Name of connection. Имя подключения.
 * @param {Function} callback
 * @returns {*}
 */
Router.prototype.getAllByName = function(name, callback){
  if (!this.name[name]) return callback(null, []);
  var self = this;
  return callback(null, this.name[name].reduce(function(res, uid){
    if (!self.uid[uid]) return res;
    res.push(self.uid[uid]);
    return res;
  }, []));
};

/**
 * Get sockets array with all connections with such name match repExp to send message.
 *      Возвращает в callback массив Всех сокетов для отправки сообщений, где название соответвует регулярному выражению.
 * @param {String | RegExp} regExp RegExp to test names. Регулярное выражение для проверки названий.
 * @param {Function} callback
 * @returns {*}
 */
Router.prototype.getByNameRegExp = function(regExp, callback){
  var uids = Object.keys(this.name).reduce(function(res, name){
    if (name.match(regExp)) res.push(name);
    return name;
  }, []);

  var self = this;
  return callback(null, uids.reduce(function(res, uid){
    if (!self.uid[uid]) return [];
    res.push(self.uid[uid]);
    return res;
  },[]));
};


/**
 * Get sockets array with one or without elements to send message.
 *      Возвращает в callback массив сокетов для отправки сообщений из одного элемента или пустой.
 * @param {String} uid UID of connection. UID подключения.
 * @param {Function} callback
 * @returns {*}
 */
Router.prototype.getByUid = function(uid, callback){
  if (this.uid[uid]) return callback(null, [this.uid[uid]]);
  return callback(null, []);
};


/**
 * Get sockets array with all connections that subscribed to event to send message.
 *      Возвращает в callback массив Всех сокетов для отправки сообщений, которые подписанны на событие.
 * @param {string} event Name of event. Имя события.
 * @param {Function} callback
 * @returns {*}
 */
Router.prototype.getByEvent = function(event, callback){
  if (!this.event[event]) return callback(null, []);
  var self = this;
  return callback(null, this.event[event].reduce(function(res, uid){
    if (!self.uid[uid]) return [];
    res.push(self.uid[uid]);
    return res;
  }, []));
};

/**
 * Subscribe socket to event. Подписывает сокет на событие
 * @param {String} uid UID of connection. UID подключения.
 * @param {String} event Name of event. Имя события.
 */
Router.prototype.addEvent = function(uid, event){
  this.event[event] = this.event[event] || [];
  if (this.event[event].indexOf(uid) === -1) this.event[event].push(uid);
};

/**
 * Subscribe socket to event. Подписывает сокет на событие
 * @param {String} uid UID of connection. UID подключения.
 * @param {String} event Name of event. Имя события.
 */
Router.prototype.subscribe = Router.prototype.addEvent;

/**
 * Unsubscribe socket from event. Отписывает сокет отсобытия
 * @param {String} uid UID of connection. UID подключения.
 * @param {String} event Name of event. Имя события.
 */
Router.prototype.removeEvent = function(uid, event){
  if (!this.event[event]) return;
  if (this.event[event].indexOf(uid) !== -1) this.event[event].splice(this.event[event].indexOf(uid), 1);
};

/**
 * Unsubscribe socket from event. Отписывает сокет отсобытия
 * @param {String} uid UID of connection. UID подключения.
 * @param {String} event Name of event. Имя события.
 */
Router.prototype.unsubscribe = Router.prototype.removeEvent;

/**
 * Get all events that are subscribed. Возвращает все события, на которые есть подписка.
 * @returns {String[]}
 */
Router.prototype.getEvents = function(){
  return Object.keys(this.event);
};

/**
 * Get all sockets array. Возвращает массив всех сокетов.
 * @param {Function} callback Second argument is net.Socket[]. Второй аргумент - net.Socket[].
 * @returns {*}
 */
Router.prototype.getAll = function(callback){
  var self = this;
  return callback(null, Object.keys(this.uid).map(function(uid){return self.uid[uid];}));
};
/**
 * One more constructor. Еще один конструктор.
 * @static
 * @returns {Router}
 */
Router.getRouter = function(){
  return new Router();
};


module.exports = Router;