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

if (module.parent) {
    module.exports = require(__dirname+'/lib/class.js');
}
else {
    console.log('SPID: ',process.pid);
    var hs = new (require('./lib/class.js'))({}, 'no');
    hs.on('error', function(error){
        console.log('HS error:', error);
    });
    hs.on('listening', function(){
        console.log('HS listening on', hs.address());
    });
    hs.listen(8765);
    var time = new Date().getTime();
    var count = hs.counter;
    setInterval(function(){
        var c = (hs.counter - count)/(new Date() - time)*1000;
        hs.publish({header: {event: 'counts'}, body: {time: time, count: c}});
        if (c) console.log(c);
        count = hs.counter;
        time = new Date().getTime();
    }, 1000);
    process.on('SIGINT', function(){
        hs.close(function(){
            process.exit();
        });
    });
    process.on('SIGTERM', function(){
        hs.close(function(){
            process.exit();
        });
    });
}