/**
 * Created by numminorihsf on 27.04.15.
 */
var shut_down = false;
var idIncrement = 1;

function HeraldServer (settings){
    HeraldServer.super__.call(this);
    this.connections = {};
    this.whiteList = settings.whiteList || [];
    this.timeouts = {};
    this.fails = {};
    this.connected = false;
    if (settings.pingInterval && settings.pingInterval > 5000) this.pingInterval = settings.pingInterval;
    else this.pingInterval = 30000;
    this.pingWaitTimeout = this.pingInterval/2;
    if (settings.pingMaxFails && settings.pingMaxFails < 100) this.pingMaxFails =  settings.pingMaxFails;
    else this.pingMaxFails = 5;
    this.welcomeMessage = settings.welcomeMessage || 'Welcome to Herald Server.';

    if (typeof settings.authorizeFunction === 'function') this.authorizeFunction = settings.authorizeFunction;
    else this.authorizeFunction = function(authData, callback){

    };

    this.$ = require('net').createServer(function(connect) {
        if (shut_down) return connect.close();
        var id = idIncrement++;

        connect.setEncoding('utf-8');

        connect.write(this.welcomeMessage+"\r\n", 'utf-8');

        connect.once('data', function(data){
            this.authorizeFunction({connect: connect, data: data}, function(err, isAuth){
                if (err) return connect.end();
                if (!isAuth) return connect.end();
                clearTimeout(this.timeouts[id]);
                delete this.timeouts[id];
                connect.on('data', function(data){
                    //todo if (!shut_down) this.parseMessages(data);
                }.bind(this));

                connect.on('ping', function(data){
                    connect.write(data);
                });

            }.bind(this));
        }.bind(this));

        connect.on('end', function() {
            clearTimeout(this.timeouts[id]);
            delete this.timeouts[id];
        }.bind(this));



        (this.timeouts[id] = setTimeout(function(){
            connect.write('Sorry anonymous are not allowed.');
            connect.end();
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
        this.emit('close', o);
    }.bind(this));

    this.$.on('error', function(err){
        this.emit('error', err);
    }.bind(this));

    return this;
}

(function(){
    require('util').inherits(HeraldServer, require('events').EventEmitter);
})();

HeraldServer.prototype.listen = function(){
    var args = Array.prototype.slice.call(arguments);
    if (args.length === 1) this.$.listen(args[0]);
    else if (args.length === 2) this.$.listen(args[0], args[1]);
    else if (args.length === 3) this.$.listen(args[0], args[1], args[2]);
    else if (args.length === 4) this.$.listen(args[0], args[1], args[2], args[3]);
};

HeraldServer.prototype.close = function(callback){
    return this.$.close(callback);
};

HeraldServer.prototype.maxConnections = this.$.maxConnections;

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
    var message = this.cm.makeMessage();
    for (var i in this.connections){
        this.connections[i].emit('ping', )
    }
};

HeraldServer.prototype.publish = function(message){};

HeraldServer.prototype.whisp = function(whom, message){};