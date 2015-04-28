herald-server
===========================

Use node.js socket server (udp, tcp, unix) for transport messages (or encrypted messages) through applications.

Install with:

    npm install herald-server

Dependencies:

    crypt-maker


# Usage

Simple example:

```js

    var HeraldServer = require('herald-server');
    var hs = new HeraldServer({}, 'no');
    hs.on('error', function(){
        console.log('HS error:', error);
    });
    hs.on('listening', function(){
        console.log('HS listening on', hs.address());
    });
    hs.listen(8765);
    process.on('SIGINT', function(){
        hs.close();
    });
    process.on('SIGTERM', function(){
        hs.close();
    });
```


# Methods

## new HeraldSever(options[, algorithm[, key]])

`options` is an Object. May be `{}`. Contains properties:
* `.logger` - Logger object - to log inner events
* `.whiteList` - Array of strings or regexps. Default `[]`
* `.pingInterval` - Numeric (ms). How often will tests connections. If < 5000 set to 5000. Default `30000`
* `.pingMaxFails` - Numeric. If ping of some connection fails more than `.pingMaxFails` times - close connection. Default: `5`
* `.welcomeMessage` - String. Then connection opens - send this to socket. Default `'Welcome to Herald Server.'`
* `.messageMaker` - Object. Some module, that make and parse messages. See below. Default `crypt-maker`
* `.authorizeFunction` - function. Some function tests, that new connect can stay connected. See below.

If use `crypt-maker` and if `algorithm !== 'no'` and no key passed to constructor - throws error.


## hs.listen() 

Arguments passed to method are seems as net.Server.listen method of node.js standard api. Use like:

* `hs.listen(port[, host][, backlog][, callback])`
* `hs.listen(path[, callback])`
* `hs.listen(handle[, callback])`
* `hs.listen(options[, callback])`

Options are:
* `options` {Object} - Required. Supports the following properties:
  * `port` {Number} - Optional.
  * `host` {String} - Optional.
  * `backlog` {Number} - Optional.
  * `path` {String} - Optional.
  * `exclusive` {Boolean} - Optional.
* `callback` {Function} - Optional.

For all info about this see: https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback

## hs.close([callback])

Stops the server from accepting new connections and keeps existing
connections.

## hs.unref()

Calling `unref` on a server will allow the program to exit if this is the only
active server in the event system. If the server is already `unref`d calling
`unref` again will have no effect.

## hs.ref()

Opposite of `unref`, calling `ref` on a previously `unref`d server will *not*
let the program exit if it's the only server left (the default behavior). If
the server is `ref`d calling `ref` again will have no effect.

# Events

## 'listening'

Emitted when the server has been bound after calling `hs.listen`.

## 'connection'

* {Socket object} The connection object

Emitted when a new connection is made. `socket` is an instance of
`net.Socket`.

## 'close'

Emitted when the server closes. Note that if connections exist, this
event is not emitted until all connections are ended.

## 'error'

* {Error Object}

Emitted when an error occurs.  The `'close'` event will be called directly
following this event.  See example in discussion of `hs.listen`.


# Message format

Every message should has `header` and `body`.
If there is no `header` or `body` - message will not sent.
After the connect, client should send authorize request to server.
Server passed this data to `authorizeFunction`.

## Default authorize request format

Header should has an field `event == 'authorize'`.
Also there should be field `iAm` with name of application.
Body also should has encrypted field `iAm` with same value. 
**Be careful** by default without any encrypt algorithm any can connect to your server if he know format.

Example of message to authorize (without encrypt):

```
    '{"event":"authorize","iAm":"Dev"}\r\n{"iAm":"Dev"}\r\n\r\n' 
```

If there is some connection with same name - will not authorize new connection and close it.
If header.iAm !== body.iAm - close connect.


## Message header format

Fields:
* `whisp` String - name of connection, where will try to whisper some message 
(event field will be ignore and passed to connection)
* `event` String - an event name, that will be publish. Except `'ping'`, `'pong'`, `'subscribe'`, `'unsubscribe'`
* `time` Numeric [optional] - timestamp of ping event create date.
* `iAm` String [optional] - connection name. Used for whispering. Unique for every connect.

### Special header events

`ping` - create only by HS. Every client should answer "pong" message with body of accepted message.
`pong` - answer for "ping" message.
`subscribe` - connection will subscribe to some events. name of event should be passed at body of message.
`unsubscribe` - connection will unsubscribe from some events. name of event should be passed at body of message.

## Message body format

Body can by plain string, json, number or something else, except functions.

## Message examples

Examples shown without any 

Authorize message:
```js
    '{"event":"authorize","iAm":"Dev"}\r\n{"iAm":"Dev"}\r\n\r\n'
    //  {"event":"authorize","iAm":"Dev"}
    //  {"iAm":"Dev"}
```

Ping message:
```js
    '{"event":"ping","time":1430200822338}\r\n{}\r\n\r\n'
    //  {"event":"ping", "time":1430200822338}
    //  {}
```

Pong message:
```js
    '{"event":"pong","time":1430200822338}\r\n{}\r\n\r\n'
    //  {"event":"pong", "time":1430200822338}
    //  {}
```

Subscribe message:
```js
    '{"event":"subscribe"}\r\n"eventName"\r\n\r\n'
    //  {"event":"subscribe"}
    //  "eventName"
```

Unsubscribe message:
```js
    '{"event":"unsubscribe"}\r\n"eventName"\r\n\r\n'
    //  {"event":"unsubscribe"}
    //  "eventName"
```

Whispering message:
```js
    '{"whisp":"nameOfAppToWhisp","event":"someSecretEvent"}\r\n"eventBody"\r\n\r\n'
    //  {"whisp":"nameOfAppToWhisp","event":"someSecretEvent"}
    //  "eventBody"
```

# authorize function

You may make authorize function. Parameters to this functions are:
* `authData` Object
* `authData.message` - message, that socket write to server
* `authData.connect` - new.Socket object of this connect
* `callback` Function - If success - second param should be Object with field `'name'`. 
By this name whispering will works.

Example: 

```js
    authorizeFunction = function(authData, callback){
        var message = parseMessage(authData.message);
        if (!message) return callback(Error('no message'));
        if (message.header && message.header.event == 'authorize') {
            if (message.header.iAm) {
                for (var i=0; i < whiteList.length; i++){
                    if (message.header.iAm.match(this.whiteList[i])) {
                        if (message.header.iAm === message.body.iAm) return callback(null, {name: message.header.iAm});
                        else return callback(null, false);
                    }
                }
            return callback(null, false);                   
            if (message.body && message.body.iAm) {
                if (message.header.iAm === message.body.iAm) return callback(null, {name: message.header.iAm});
            }
        }
        return callback(null, false);
    };
```


# messageMaker

Message maker can be passed to server. It should has this methods:

## .makeMessage(message)

`message` is an Object. It should contains:
+ `message.header` - Object. Header of messages
    * `message.header.event` - String. Event, or doing
    * `message.header.iAm` - String. Optional
+ `message.body` - Object. May be `{}`

Returns string formed to write into socket.

## .parseMessage(message)

`message` - encrypted formed string.
Returns {header: headerObject, body: bodyObject}


## .splitMessages(rawString)

`rawString` some string, that socket connection sends. 
If doesn't ends by some message separator - should return `null` or `[]`
If ends by message separator - return array of messages (not parsed and not decrypted)

## .getHeader(message)

Returns header object from raw message.

## .getBody(message)

Returns body object from raw message.

# LICENSE - "MIT License"

Copyright (c) 2015 Konstantine Petryaev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.