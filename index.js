/**
 * Created by numminorihsf on 27.04.15.
 */
/**
 * Created by numminorihsf on 16.04.15.
 */

/**
 * Socker server module. Sends messages to others.
 */




/**
 * Created by numminorihsf on 20.04.15.
 */
var router = new (require('events')).EventEmitter();
var logger = require('./../utils/logger.js')('Socket server');
var iAm = 'socket-server';
var ready = false;
var crypter = require('./transport/crypter.js');
var retries = 20;
var baseTimeout = 100;
var maxRetryTimeout = 60000;
var connections = {
    'launcher': null,
    'dbTransport': null,
    'pbxManager': null
};
if (process.env.NAST_ALLOW_DEBUGGER) connections['debugger'] = null;

var shut_down = false;

router.on('broadcast', function(req){
    for (var i in connections){
        (function(connect) {
            send(connect, req.header, req.body, function (err, data) {
                if (err) return logger.error('send broadcast error', err);
                return logger.trace('send broadcast success');
            });
        })(connections[i]);

    }
});
router.on('authRequest', function(req){
    if (req.body && req.body.iAm){
        console.log(req.body.iAm);
        if (connections[req.body.iAm]) return logger.error('try authorize again', req);
        if (connections[req.body.iAm] === null){
            connections[req.body.iAm] = req.connection;
            req.connection.emit('authorized');
            logger.info('authorized', req.body.iAm);
            req.connection.iAm = req.body.iAm;
            req.connection.once('end', function(){
                connections[req.body.iAm] = null;
            });
        }
        else if (req.body.iAm.match(/^pbx\-worker\d+/)){
            connections[req.body.iAm] = req.connection;
            req.connection.emit('authorized');
            logger.info('authorized', req.body.iAm);
            req.connection.iAm = req.body.iAm;
            req.connection.once('end', function(){
                delete connections[req.body.iAm];
            });
        }
    }
});
router.on('subscribe', function(req){
    if (!connections[req.header.iAm]) return;
    var emit = function(emitted){
        send(req.connection, emitted.header, emitted.body, function(err, data){
            if (err) return logger.error('Can\'t send');
        });
    };
    router.on(req.body.event, emit);
    req.connection.setMaxListeners(50);
    req.connection.once('end', function(){
        router.removeListener(req.body.event, emit);
    });
});
router.on('unsubscribe', function(req){
//todo
    logger.fatal('router unsubscribe not ready yet');
});
router.setMaxListeners(100);

(function() {
    //Launch keep alive task
    router.on('pong', function(req){
        if (!req.body || !req.body.r || !req.body.time) return console.error('Undefined client!');
        //console.log(req.header.iAm, new Date() - req.body.time);
        clearTimeout(keepAliveTimeouts[req.connection.iAm]);
        delete keepAliveFailCounts[req.connection.iAm];
    });
    var keepAliveInterval = (process.env.NAST_KEEP_ALIVE_TIMEOUT || 30) * 1000;
    if (keepAliveInterval < 5000) keepAliveInterval = 5000;
    var keepAliveWait = keepAliveInterval / 2;
    var keepAliveTimeouts = {};
    var keepAliveFailCounts = {};
    setInterval(function () {
        for (var i in connections) {
            if (connections[i] && connections[i].iAm) (function (connect) {
                send(connect, {event: 'ping'}, {r: Math.random(), time: new Date().getTime()}, function (err, data) {
                    if (err) return logger.error('Can\'t ping');
                    keepAliveTimeouts[connect.iAm] = setTimeout(function () {
                        keepAliveFailCounts[connect.iAm] = keepAliveFailCounts[connect.iAm] + 1 || 1;
                        if (keepAliveFailCounts == 5) setImmediate(function () {
                            logger.warning('Client doesn\'t pong, close connection. DOES NEED CLOSE?');
                            connect.end();
                            delete keepAliveTimeouts[connect.iAm];
                            delete keepAliveFailCounts[connect.iAm];
                        });
                    }, keepAliveWait);
                });
            })(connections[i]);
        }
    }, keepAliveInterval).unref();
})();

function getRetryTime (count){
    return count*baseTimeout;
}

function send (connection, header, body, callback){
    if (!header || !header.event) return callback(new Error('Need event'));
    if (!ready) {
        var count = arguments[4];
        count = ++count || 1;
        if (count > retries) return callback(new Error('Can\'t send message: '+body));
        var time = getRetryTime(count);
        return setTimeout(function(){
            send(connection, header, body, callback, count);
        }, time);
    }
    else write(connection, header, body, function(err, data){
        if (err) {
            var count = arguments[4];
            count = ++count || 1;
            if (count > retries) return callback(new Error('Error:' + err + '\nCan\'t send message: ' + header + '\n' + body));
            var time = getRetryTime(count);
            return setTimeout(function () {
                send(connection, header, body, callback, count);
            }, time);
        }
        else return callback(null, data);
    });
}

function write (connection, header, body, callback){
    connection.write(crypter.makeMessage(header, body), 'utf-8', function(err, data){
        if (err) {
            return callback(err);
        }
        else return callback(null, data);
    });
}

function parse (message, connection){
    var mesArray = crypter.splitMessages(message);
    for (var i = 0; i < mesArray.length; i++){
        (function(message) {
            logger.info(iAm, message);
            var header = crypter.getHeader(message);
            if (!header) return logger.error('Has not header');
            else {
                if (!header.event) {
                    return logger.error('Need event in header.', header);
                }
                header.iAm = header.iAm || connection.iAm;
                router.emit(header.event, {connection:connection, header:header, body:crypter.getBody(message)});
            }
        })(mesArray[i]);
    }
}

var config = require('./transport/config.js')();
var timeouts = {};
var incr = 1;

var server = require('net').createServer(function(c) {
    if (shut_down) return c.close();
    var id = incr++;
    c.setEncoding('utf-8');

    c.write("Who are you?\r\n", 'utf-8');

    c.once('authorized', function(){
        clearTimeout(timeouts[id]);
        delete timeouts[id];
    });
    c.on('data', function(data){
        if (!shut_down) parse(data, c);
    });
    c.on('end', function() {
        clearTimeout(timeouts[id]);
        delete timeouts[id];
        return logger.info('client disconnected', id);
    });
    timeouts[id] = setTimeout(function(){
        c.end();
        delete timeouts[id];
    }, 5000);
});

if (config.type == 'unix') server.listen(config.path, function () {
    ready = true;
    require('fs').chmod(config.path, '700', function(err, data){});
    logger.info('server bound', config.path);
});
else server.listen(config.port, config.host, function () {
    ready = true;
    logger.info('server bound', config.host, config.port);
});
server.on('error', function(e){
    logger.error('Socket server error:', e);
    if (e.code == 'EADDRINUSE' && config.type =='unix') require('child_process').exec('rm '+config.path, function(err, data){});
});
server.on('close', function(e){
    logger.error('Socket server error:', e);
    if (!ready) {
        logger.error('Can\'t open unix socket, use net fallback.');
        config.type = 'net';
    }
    ready = false;
    if (config.type == 'unix') server.listen(config.path, function () {
        ready = true;
        require('fs').chmod(config.path, '700', function(err, data){});
        logger.info('server bound', config.path);
    });
    else server.listen(config.port, config.host, function () {
        ready = true;
        logger.info('server bound', config.host, config.port);

    });
});

exports.end = function(){
//todo
    logger.error('need shutdown function');
};

