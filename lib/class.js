/**
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
"use strict";

var idIncrement = 1;
var defaultLogger = {
    trace: function(){/*console.log('TRACE '+ Array.prototype.join.call(arguments, ' '))*/;},
    debug: function(){/*console.log('DEBUG '+ Array.prototype.join.call(arguments, ' '))*/;},
    info: function(){/*console.log('INFO '+ Array.prototype.join.call(arguments, ' '));*/},
    warn: function(){console.error('WARN '+ Array.prototype.join.call(arguments, ' '));},
    error: function(){console.error('ERROR '+ Array.prototype.join.call(arguments, ' '));},
    fatal: function(){console.error('FATAL '+ Array.prototype.join.call(arguments, ' '));}
};
function HeraldServer (settings, needCrypt, key){
    HeraldServer.super_.call(this);
    settings = settings || {};
    this.connections = {};
    this.logger = settings.logger || defaultLogger;
    this.whiteList = settings.whiteList || [];
    this.timeouts = {};
    this.fails = {};
    this.connected = false;
    if (settings.pingInterval && settings.pingInterval > 5000) this.pingInterval = settings.pingInterval;
    else this.pingInterval = 30000;
    this.pingWaitTimeout = this.pingInterval/2;
    if (settings.pingMaxFails && settings.pingMaxFails < 100) this.pingMaxFails =  settings.pingMaxFails;
    else this.pingMaxFails = 5;
    this.welcomeMessage = settings.welcomeMessage || 'Welcome to Herald Server.\r\n\r\n';
    this.cm = settings.messageMaker || new (require('crypt-maker'))({algorithm: needCrypt|| 'no', key: key});
    this.whisperer = new (require('events')).EventEmitter();
    this.whisperer.setMaxListeners(1000);
    if (typeof settings.authorizeFunction === 'function') this.authorizeFunction = settings.authorizeFunction;
    else this.authorizeFunction = function(authData, callback){
        var message = this.cm.parseMessage(authData.message);
        if (!message) return callback(Error('no message'));
        if (message.header && message.header.event == 'authorize') {
            if (message.header.iAm) {
                if (this.whiteList.length && this.whiteList.indexOf(message.header.iAm) === -1) {
                    for (var i=0; i < this.whiteList.length; i++){
                        if (message.header.iAm.match(this.whiteList[i])) {
                            if (message.header.iAm === message.body.iAm) return callback(null, {name: message.header.iAm});
                            else return callback(null, false);
                        }
                    }
                    return callback(null, false);
                }
                if (message.body && message.body.iAm) {
                    if (message.header.iAm === message.body.iAm) return callback(null, {name: message.header.iAm});
                }
            }
        }
        return callback(null, false);
    }.bind(this);

    this.$ = require('net').createServer(function(connect) {
        var id = idIncrement++;
        var tail = '';
        this.logger.info('New connection. ID:', id);
        connect.setEncoding('utf-8');

        connect.write(this.welcomeMessage+"\r\n", 'utf-8');

        connect.once('data', function(data){
            this.logger.info('Try authorize: '+id, data);
            this.authorizeFunction({connect: connect, message: data}, function(err, isAuth){
                if (err) return connect.end();
                if (!isAuth) return connect.end();
                clearTimeout(this.timeouts[id]);
                delete this.timeouts[id];
                if (this.whisperer.listeners('send'+isAuth.name).length) return connect.end();
                this.logger.info('Authorized', isAuth.name);
                this.whisperer.on('send'+isAuth.name, function(message){
                    connect.emit('send', message);
                });
                connect.once('end', function(){
                    this.whisperer.removeAllListeners('send'+isAuth.name);
                }.bind(this));

                this.connections[id] = connect;
                connect.on('data', function(data){
                    this.logger.trace(id + ' sends:', data);
                    tail += data;
                    var array = this.cm.splitMessages(tail);
                    if (!array || array.length === 0) {
                        if (tail.length > 1048576) tail = '';
                    }
                    else {
                        var hs = this;
                        tail = '';
                        for (var i=0; i < array.length; i++){
                            (function(message){
                                setImmediate(function(){
                                    hs.parseMessage(message, connect);
                                });
                            })(array[i])
                        }
                    }
                }.bind(this));

                connect.on('ping', function(data){
                    if (this.connections[id]) connect.write(data);
                }.bind(this));

                connect.on('pong', function(time){
                    this.logger.debug('Ping: ', new Date() - time);
                    clearTimeout(this.timeouts[id]);
                    delete this.fails[id];
                }.bind(this));

                connect.on('send', function(message){
                    if (this.connections[id]) connect.write(message, 'utf-8');
                }.bind(this));

                connect.on('subscribe', function(eventName){
                    if (connect.listeners('pub'+eventName).length) return;
                    var worker = function(data){
                        connect.emit('send', data);
                    };
                    connect.on('pub'+eventName, worker);
                    connect.once('unsubscribe.'+eventName, function(){
                        connect.removeListener('pub'+eventName, worker);
                    })
                });

                connect.setMaxListeners(100);
            }.bind(this));
        }.bind(this));

        connect.on('end', function() {
            delete (this.connections[id]);
            this.logger.info('Connection close. ID:', id);
            clearTimeout(this.timeouts[id]);
            delete this.timeouts[id];
        }.bind(this));



        (this.timeouts[id] = setTimeout(function(){
            connect.end('Sorry anonymous are not allowed.');
        }.bind(this), 5000)).unref();
    }.bind(this));

    this.$.on('listening', function(o){
        this.connected = true;
        this.pingIntervalId = setInterval(function(){
            this.ping();
        }.bind(this), this.pingInterval);
        this.emit('listening', o);
    }.bind(this));

    this.$.on('connection', function(o){
        this.emit('connection', o);
    }.bind(this));

    this.$.on('close', function(o){
        this.connected = false;
        clearInterval(this.pingIntervalId);
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

HeraldServer.prototype.listen = function(){
    var args = Array.prototype.slice.call(arguments);
    if (args.length === 1) this.$.listen(args[0]);
    else if (args.length === 2) this.$.listen(args[0], args[1]);
    else if (args.length === 3) this.$.listen(args[0], args[1], args[2]);
    else if (args.length === 4) this.$.listen(args[0], args[1], args[2], args[3]);
};

HeraldServer.prototype.close = function(callback){
    for (var i in this.connections){
        this.connections[i].end();
    }
    return this.$.close(callback);
};

HeraldServer.prototype.maxConnections = function(){
    return this.$.maxConnections;
};

HeraldServer.prototype.ref = function(){
    return this.$.ref();
};

HeraldServer.prototype.unref = function(){
    return this.$.unref();
};

HeraldServer.prototype.getConnections = function(callback){
    this.$.getConnections(callback);
};

HeraldServer.prototype.address = function(){
    return this.$.address();
};

HeraldServer.prototype.ping = function(){
    var message = this.cm.makeMessage({header: {event:'ping', time: new Date().getTime()}, body: Math.floor(Math.random()*1000-500)});
    for (var i in this.connections){
        (function(id) {
            setImmediate(function(){
                this.connections[id].emit('ping', message);
                (this.timeouts[id] = setTimeout(function () {
                    this.fails[id] = ++this.fails[id] || 1;
                    if (this.fails[id] > this.pingMaxFails) this.connections[id].end();
                }.bind(this), this.pingWaitTimeout)).unref();
            }.bind(this));
        }.bind(this))(i);
    }
};

HeraldServer.prototype.publish = function(message){
    if (message && message.header) {
        var encrypt = this.cm.makeMessage(message);
        if (encrypt) {
            this.logger.debug('PUB '+ message.header.event, message);
            for (var i in this.connections) {
                this.connections[i].emit('pub' + message.header.event, encrypt);
            }
        }
    }
};

HeraldServer.prototype.publishMessage = function(event, message){
    this.logger.debug('PUBM '+ event, message);
    for (var i in this.connections) {
        this.connections[i].emit('pub' + event, message);
    }
};

HeraldServer.prototype.whisp = function(whom, message){
    this.logger.debug('WH '+ whom, message);
    var encrypt = this.cm.makeMessage(message);
    if (encrypt) {
        this.whisperer.emit('send'+whom, encrypt);
    }

};

HeraldServer.prototype.whispMessage = function(whom, message){
    this.logger.debug('WHM '+ whom, message);
    this.whisperer.emit('send'+whom, message);
};

HeraldServer.prototype.parseMessage = function(message, connect){
    this.counter++;
    var header = this.cm.getHeader(message);
    if (!header || !header.event) return;
    this.logger.debug('IN '+header, message);
    if (header.whisp) return this.whispMessage(header.whisp, message);
    if (header.event == 'pong') {
        return connect.emit('pong', header.time);
    }
    if (header.event == 'subscribe') {
        var event = this.cm.getBody(message);
        if (!event) return;
        return connect.emit('subscribe', event);
    }
    if (header.event == 'unsubscribe') {
        event = this.cm.getBody(message);
        if (!event) return;
        return connect.emit('unsubscribe.'+event);
    }
    else this.publishMessage(header.event, message);
};

module.exports = HeraldServer;