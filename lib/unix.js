/**
 * Created by numminorihsf on 27.04.15.
 */

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


function heraldServer (settings){
    this.$
}


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

