herald-server
===========================

**v1 is not backward compatible with v0** 

Use node.js socket server (udp, tcp, unix) for transport messages (or encrypted messages) through applications.

Install with:

    npm install herald-server

Dependencies:

    crypt-maker

[Documentation by jsDuck. Also in RUS](http://numminorihsf.github.io/herald). 

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

# Changes

 - Add rpc support.
 - Ping removed (tcp ans unix socket know about connection close). Udp is not recommended.
 - Some procedures can be spawned on server easily.
 - Add JSDuck doc.

# Methods

## new HeraldSever(options[, algorithm[, key]])

`options` is an Object. May be `{}`. Contains properties:
* `.logger` - Logger object - to log inner events
* `.whiteList` - Array of strings or regexps. Default `[]`
* `.welcomeMessage` - String. Then connection opens - send this to socket. Default `'Welcome to Herald Server.'`
* `.messageMaker` - Object. Some module, that make and parse messages. See below. Default `crypt-maker`

`algorithm` - If need crypt messages - algorithm for crypt. By default doesn't encrypt.
`key` Encryption key.

If use `crypt-maker` and if `algorithm && algorithm !== 'no'` and no key passed to constructor - throws error.


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

For all info about this see: [https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback](https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback)

## hs.close([callback])

Stops the server from accepting new connections and keeps existing
connections.

## hs.unref() Experimental

Calling `unref` on a server will allow the program to exit if this is the only
active server in the event system. If the server is already `unref`d calling
`unref` again will have no effect.

## hs.ref() Experimental

Opposite of `unref`, calling `ref` on a previously `unref`d server will *not*
let the program exit if it's the only server left (the default behavior). If
the server is `ref`d calling `ref` again will have no effect.

# Events

## 'listening'

Emitted when the server has been bound after calling `hs.listen`.

## 'connection'

* {Socket Object} The connection object

Emitted when a new connection is made. `socket` is an instance of
`net.Socket`. Also where if `socket.header` with header of auth message.

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


## Authorize

**Be careful** by default without any encrypt algorithm any can connect to your server if he know format.

Example of message to authorize (without encrypt):

```
    '{"rpc":"herald-server","action":"authorize","actionId":7,"name":"156512",
    "uid":"156512_86835","messId":76688,"retry":5,"timeout":15000}\r\n
     {"args":{"wellKnown":"pHrAsE","name":"156512","uid":"156512_86835","rand":459}}\r\n\r\n' 
```

If there is some connection with same uid - will not authorize new connection and close it.



## Message header format

Fields:
* `messId` Number - id of message.
* `name` String - connection name. Used for whispering and rpc.
* `uid` String - connection uid. Used for whispering and rpc. Unique for every connect.
* `retry` Number [optional] - Count of retries of sending this message. If no field - will not retry.
*Now it is ignored by server. Will work soon.*
* `timeout` Number [optional] - Duration in ms to wait answer from client. If no field - will not retry.
*Now it is ignored by server. Will work soon.*

Event:
* `whisp` String [optional] - name of connection to send event message.
* `whispUid` String [optional] - uid of connection to send event message.
* `event` String - event name. If no `whisp` or `whispUid` sends to all subscribers.

RPC:
* `actionId` Number - id of action.
* `action` String - name of action.
* `rpc` String [optional] - name of connection to send rpc message.
* `rpcUid` String [optional] - uid of connection to send rpc message.
* `rpcRegExp` String|RegExp [optional] - regexp to find connections by name to send rpc message.


## Message body format

Body can by plain string, json, number or something else, except functions.

## Message examples

Examples shown without any encryption.

RPC by client name message:
```js
     '{"rpc":"applicationToCall","action":"actionToCall","actionId":numberActionIdFromSender,
     "name":"nameOfSender","uid":"uidOfSender","messId":numberMessageId}\r\n
         {"args":{argsObject}}\r\n\r\n' 
```

RPC by client UID message:
```js
     '{"rpcUid":"applicationToCall","action":"actionToCall","actionId":numberActionIdFromSender,
     "name":"nameOfSender","uid":"uidOfSender","messId":numberMessageId}\r\n
         {"args":{argsObject}}\r\n\r\n' 
```

Whispering message:
```js
    '{"whisp":"nameOfAppToWhisp","event":"someSecretEvent","name":"nameOfSender","uid":"uidOfSender",
    "messId":numberMessageId}\r\n"eventBody"\r\n\r\n'
```

Event message:
```js
    '{"event":"someEvent","name":"nameOfSender","uid":"uidOfSender","messId":numberMessageId}\r\n"eventBody"\r\n\r\n'
```

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