/* vim: set et ts=2 sts=2 sw=2: */
var plugins = {};
var native = {};

// Function.bind polyfill from MDN
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function

      throw new TypeError('Function.prototype.bind - ' +
        'what is trying to be bound is not callable');
    }

    var aArgs = Array.prototype.slice.call(arguments, 1),
      fToBind = this,
      fNOP = function () {},
      fBound = function () {
        return fToBind.apply(this instanceof Function && oThis ? this : oThis,
          aArgs.concat(Array.prototype.slice.call(arguments)));
      };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

function capture(upload, uuid, config) {
  this.state.capturing = true;
  this.state.config = config || {};



  var uploading = upload || false;
  var uuid = uuid || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
  }); //Generate random UUID if not provided

  this.state.log = this.log = {
    events: []
  };

  for (var k in plugins) {
    plugins[k].capture(this.state.log, config);
  }

  var self = this;

if(uploading) {
  window.setInterval(function(){
    $.ajax({
    url: "./reanimator.php",
    type: "POST",
    data: {"uuid": uuid, "log": JSON.stringify(self.flush())},
    dataType: "html"
    });
  }, 5000); //Upload every 5 seconds

}
}

function replay(log, config) {
  this.state.replaying = true;
  this.state.config = replay.config = config = config || {};
  this.state.log = replay.log = log;

  for (var k in plugins) {
    if (plugins[k].beforeReplay) {
      plugins[k].beforeReplay(log, config);
    }
  }

  log.events = (log.events || []).slice().reverse();

  if (log.events.length > 0) {
    native.setTimeout.call(global, replay.loop, 0);
  }
}

replay.loop = function replayLoop() {
  var log = replay.log;
  var event = log.events.pop();
  var delay, now;

  var replayer = plugins[event.type].replay;
  if (!replayer) {
    throw 'Cannot replay event of type "' + event.type + '"';
  }

  // if the replayer accepts a second argument, it must be a callback
  var async = replayer.length > 1;
  if (async) {
    replayer(event, log.events.length > 0 ? replayLoop : function () {});
  } else {
    replayer(event);

    if (log.events.length > 0) {
      delay = 0;
      if (replay.config.delay === 'realtime') {
        now = native.Date.now();
        delay = log.events[log.events.length - 1].time - event.time;

        if (replay.lastEventTime) {
          // crude correction for skew during replay
          delay -= (now - replay.lastEventTime) - replay.expectedDelay;
        }

        replay.lastEventTime = now;
        replay.expectedDelay = delay;
      } else {
        delay = replay.config.delay || 0;
      }

      native.setTimeout.call(global, replay.loop, delay);
    }
  }
};

function flush() {
  if (!this.state.log) {
    throw 'Must call capture before calling flush';
  }

  //console.log(stringify(this.state.log));
  //return JSON.parse(JSON.stringify(this.state.log, replacerForJSON));
  return JSON.parse(stringify(this.state.log, null, 2));
}

function cleanUp() {
  this.state.capturing = this.state.replaying = false;
  for (var k in plugins) {
    plugins[k].cleanUp();
  }
}

function plug(type, plugin) {
  plugins[type] = plugin;
  plugin.init(native);

  if (this.state.capturing && plugin.capture) {
    plugin.capture(this.state.log, this.state.config);
  } else if (this.state.replaying && plugin.beforeReplay) {
    plugin.beforeReplay(this.state.log, this.state.config);
  }
}

//Remove circular references in the DOM
//https://github.com/isaacs/json-stringify-safe
function stringify(obj, replacer, spaces, cycleReplacer) {
  return JSON.stringify(obj, serializer(replacer, cycleReplacer), spaces)
}

function serializer(replacer, cycleReplacer) {
  var stack = [], keys = []

  if (cycleReplacer == null) cycleReplacer = function(key, value) {
    if (stack[0] === value) return "[Circular ~]"
    return "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]"
  }

  return function(key, value) {
    if (stack.length > 0) {
      var thisPos = stack.indexOf(this)
      ~thisPos ? stack.splice(thisPos + 1) : stack.push(this)
      ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key)
      if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value)
    }
    else stack.push(value)

    return replacer == null ? value : replacer.call(this, key, value)
  }
}

module.exports = global.Reanimator = {
  state: {
    capturing: false,
    replaying: false,
    uploading: false
  },

  /**
   * ## Reanimator.capture
   * **Capture non-deterministic input**
   *
   * Call this method to begin logging non-deterministic input to your
   * JavaScript application. To capture a useful log, you must call
   * `Reanimator.capture` before such input occurs, but after libraries like
   * jQuery have been loaded.
   *
   * The log is reset whenever this method is called.
   */
  capture: capture,

  /**
   * ## Reanimator.replay
   * **Replay a log of non-deterministic input**
   *
   * ### Arguments
   *
   * - `log` - *object* - the log to replay, in the format emitted by
   *   `Reanimator.flush`
   * - `config` - *object* - configuration object
   *   - `config.delay` - *string* | *integer* - how long Reanimator should wait
   *     before replaying the next event in the log
   *
   *       For a fixed delay, specify the number of ms between steps (the
   *       default is 0). If the string `'realtime'` is specified, Reanimator
   *       will make a good faith effort to replay the events with the actual
   *       delays recorded in the log.
   */
  replay: replay,

  /**
   * ## Reanimator.flush
   * **Return a copy of the current log**
   *
   * Returns a copy of the current log as an object with the following
   * properties:
   *
   * - `dates` - [ *number* ] - captured dates, specified in ms since the epoch
   * - `random` - [ *number* ] - captured random numbers generated by
   *   `Math.random`
   * - `events` - [ *object* ] - captured callback invocations
   *
   *     Each element is an object with the following properties:
   *   - `type` - *string* - the type of the recorded callback
   *   - `time` - *number* - the time the callback was fired (ms since the epoch)
   *   - `details` - *any* - any additional details necessary to replay the
   *     callback
   */
  flush: flush,

  /**
   * ## Reanimator.cleanUp
   * **Stop capturing or replaying and restore native methods and objects**
   *
   * This method does *not* clear the most recent log.
   */
  cleanUp: cleanUp,

  /**
   * ## Reanimator.plug
   * **Install a plugin to capture and replay some non-deterministic input**
   *
   * ### Arguments
   *
   * - `type` - *string* - a unique string corresponding to the `type` property
   *   of any events the plugin will log
   * - `plugin` - *object* - the plugin to install
   *
   * A plugin is an object that implements the following methods:
   *
   * - `init`: initialize the plugin
   *
   *     Called once, by `plug`
   *
   *     Arguments
   *   - `native` - *object* - an object to store a reference to any native
   *     methods or objects the plugin interposes on
   *
   * - `capture`: prepare to capture the input the plugin is responsible for
   *
   *     Called by `Reanimator.capture`
   *
   * - `cleanUp` - restore any native methods or objects the plugin interposed
   *   on
   *
   * - `beforeReplay` - prepare to replay
   *
   *     **Optional**; called by `Reanimator.replay` immediately before the
   *     first event is replayed
   *
   *     Arguments
   *   - `log` - *object* - the log to be replayed
   *   - `config` - *object* - the replay configuration
   *
   * - `replay` - replay a captured event
   *
   *     **Required** if the plugin logs to `events`, **optional** otherwise
   *
   *     Arguments
   *   - `event` - *object* - the event to replay, in the format specified above
   *     in `Reanimator.flush`
   */
  plug: plug
};
