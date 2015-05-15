/**
 * Created by numminorihsf on 15.05.15.
 */
var cp = require('child_process');


console.log('PID:', process.pid);
try{
    require('herald-client');
    console.log('Here is hclient. Start server.');
}
catch(e) {
    console.log('Get hclient for test.');

    cp.spawnSync('npm', ['install', 'herald-client']);

    console.log('Got. Start server.');
}

cp.fork(__dirname+'/index.js');

setTimeout(function(){
    var hc = new (require('herald-client'))({
        logger: {
            trace: function(){},
            debug: function(){},
            info: function(){},
            warn: function(){},
            error: function(){},
            fatal: function(){}
        }
    });
    hc.on('error', function(error){
        console.error('fail test', error);
        process.exit(1);
    });

    var testUnsubscribed = function(count, callback){
        hc.subscribe('counts', function(body){
            if (body.count !== 0) return;
            console.log('start unsubscribed');
            hc.unsubscribe('counts');
            var c = 0;
            hc.subscribe('counts', function(body){
                if (body.count > c) c = body.count;
            });
            hc.subscribe('endOfCount', function(){
                setTimeout(function(){
                    console.log('Without subscribe: %d m/sec', c);
                    hc.unsubscribe('counts');
                    hc.unsubscribe('endOfCount');
                    return callback(null, count);
                }, 5000);
            });
            var mes = hc.cm.makeMessage({header: {event:'uns'}, body: 'C1: 1234dgdgfbgfjg'});
            for (var i = 0; i < count; i ++){
                setImmediate(function() {
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);

                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);

                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);

                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);

                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);

                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);

                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);

                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);

                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);

                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                    hc.writeMessage(mes);
                });
            }
            setTimeout(function(){
                hc.publish('endOfCount', 'huray!');
            }, 1000);
        });

    };

    var testSubscribed = function(count, callback){
        hc.subscribe('counts', function(body){
            if (body.count !== 0) return;
            console.log('start subscribed');
            var time = body.time;
            hc.unsubscribe('counts');
            var c = 0;
            hc.subscribe('counts', function(body){
                if (body.count > c) c = body.count;
            });
            hc.subscribe('endOfCount', function(){
                setTimeout(function(){
                    console.log('With subscribe: %d m/sec', c);
                    hc.unsubscribe('counts');
                    hc.unsubscribe('endOfCount');
                    return callback(null, count);
                }, 5000);
            });
            hc.subscribe('sub', function(){});
            var mes = hc.cm.makeMessage({header: {event:'sub'}, body: 'C1: 1234dgdgfbgfjg'});
            for (var i = 0; i < count; i ++){
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
            }
            hc.publish('endOfCount', 'huray!');
        });

    };

    var testUnsubscribed4K = function(count, callback){
        var mes = '';
        for(var i = 0; i < 4096; i++){
            mes += '1234567890'[Math.floor(Math.random()*10)];
        }
        mes = hc.cm.makeMessage({header: {event:'unsBig'}, body: mes});
        hc.subscribe('counts', function(body){
            if (body.count !== 0) return;
            console.log('start unsubscribed 4K');
            hc.unsubscribe('counts');
            var c = 0;
            hc.subscribe('counts', function(body){
                if (body.count > c) c = body.count;
            });
            hc.subscribe('endOfCount', function(){
                setTimeout(function(){
                    console.log('Without subscribe (4K): %d m/sec', c);
                    hc.unsubscribe('counts');
                    hc.unsubscribe('endOfCount');
                    return callback(null, count);
                }, 5000);
            });
            for (var i = 0; i < count; i ++){
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
            }
            hc.publish('endOfCount', 'huray!');
        });

    };

    var testSubscribed4K = function(count, callback){
        var mes = '';
        for(var i = 0; i < 4096; i++){
            mes += '1234567890'[Math.floor(Math.random()*10)];
        }
        mes = hc.cm.makeMessage({header: {event:'subBig'}, body: mes});
        hc.subscribe('counts', function(body){
            if (body.count !== 0) return;
            console.log('start subscribed 4K');
            var time = body.time;
            hc.unsubscribe('counts');
            var c = 0;
            hc.subscribe('counts', function(body){
                if (body.count > c) c = body.count;
            });
            hc.subscribe('endOfCount', function(){
                setTimeout(function(){
                    console.log('With subscribe(4K): %d m/sec', c);
                    hc.unsubscribe('counts');
                    hc.unsubscribe('endOfCount');
                    return callback(null, count);
                }, 5000);
            });
            hc.subscribe('subBig', function(){});
            for (var i = 0; i < count; i ++){
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);

                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
                hc.writeMessage(mes);
            }
            hc.publish('endOfCount', 'huray!');
        });

    };



    console.log('Start test for 1000k messages.');

    testUnsubscribed(10000, function(err, count){
        testSubscribed(count, function(err, count){
            count /= 10;
            testUnsubscribed4K(count, function(err, count){
                testSubscribed4K(count, function(err, data){
                    console.log('\nEnd test.');

                    console.log('If need - remove hclient form node_modules dir');

                    setTimeout(function(){
                        process.kill(process.pid, 'SIGTERM');
                    },1000);

                });
            });
        });
    });
}, 1000);
