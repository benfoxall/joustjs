'use strict';

var _marked = [points].map(regeneratorRuntime.mark);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Orientation = function Orientation(gamma, alpha, beta, last) {
  _classCallCheck(this, Orientation);

  this.gamma = gamma;
  this.alpha = alpha;
  this.beta = beta;

  this.timestamp = window.performance.now();

  if (last) last.next = this;
};

function points(p) {
  return regeneratorRuntime.wrap(function points$(_context) {
    while (1) switch (_context.prev = _context.next) {
      case 0:
        _context.next = 2;
        return p;

      case 2:
        if (p = p.next) {
          _context.next = 0;
          break;
        }

      case 3:
      case 'end':
        return _context.stop();
    }
  }, _marked[0], this);
}

var range = function range(start) {

  var g_min = undefined,
      g_max = undefined,
      a_min = undefined,
      a_max = undefined,
      b_min = undefined,
      b_max = undefined,
      first = true;

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = start[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var p = _step.value;

      if (first) {
        g_min = g_max = p.gamma;
        a_min = a_max = p.alpha;
        b_min = b_max = p.beta;
        first = false;
        continue;
      }

      if (p.gamma < g_min) {
        g_min = p.gamma;
      } else if (p.gamma > g_max) {
        g_max = p.gamma;
      }

      if (p.alpha < a_min) {
        a_min = p.alpha;
      } else if (p.alpha > a_max) {
        a_max = p.alpha;
      }

      if (p.beta < b_min) {
        b_min = p.beta;
      } else if (p.beta > b_max) {
        b_max = p.beta;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return {
    gamma: { min: g_min, max: g_max },
    alpha: { min: a_min, max: a_max },
    beta: { min: b_min, max: b_max }
  };
};

var extent = function extent(r) {
  var gamma = r.gamma.max - r.gamma.min,
      alpha = r.alpha.max - r.alpha.min,
      beta = r.beta.max - r.beta.min;

  return { gamma: gamma, alpha: alpha, beta: beta };
};

var distance = function distance(e) {
  return Math.sqrt(Math.pow(e.gamma, 2) + Math.pow(e.alpha, 2) + Math.pow(e.beta, 2));
};

// scale by 70% and limit to <1
var scale = function scale(d) {
  return Math.min(1, d * .7);
};

var tooFast = function tooFast(s) {
  return s >= 1;
};

var hue = function hue(d) {
  return (1 - d) * 120;
};

var colour = function colour(h) {
  return 'hsl(' + ~ ~hue(h) + ', 100%, 45%)';
};

var READY = 1,
    STARTED = 2,
    LOST = 4;
var state = READY;

var button = document.createElement('button');
button.textContent = '▶︎';

var _start = function _start() {
  if (state & READY | LOST) {
    state = STARTED;
    button.className = 'hidden';
  }
};

var _lose = function _lose() {
  if (state & STARTED) {
    state = LOST;
    button.className = '';

    // vibrate and play a noise
    if (navigator.vibrate) navigator.vibrate(800);
    boom();
  }
};

// gather points
var current = null;

window.addEventListener('deviceorientation', function (e) {
  if (e.gamma !== null) {
    current = new Orientation(Math.sin(2 * Math.PI * (e.gamma / 180)), Math.sin(2 * Math.PI * (e.alpha / 360)), Math.sin(2 * Math.PI * (e.beta / 360)), current);
  }
});

// track point 1.5s ago
var first = null;

var traverse = function traverse(timestamp) {

  if (!current) return;

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = points(first || current)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      first = _step2.value;

      if (first.timestamp > timestamp - 1500) break;
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }
};

// handy to save distance for other stuff
var _distance = 0;

var _first = undefined,
    _current = undefined;

var render = function render(timestamp) {
  // if there is no start point, or game has been lost
  if (!first) return;

  // optimisation to not have to redraw same thing
  if (_first == first && _current == current) return;
  _first = first;
  _current = current;

  _distance = scale(distance(extent(range(points(first)))));

  document.body.style.background = colour(_distance);

  if (tooFast(_distance)) _lose();
};

var loop = function loop(timestamp) {
  requestAnimationFrame(loop);
  traverse(timestamp);
  render(timestamp);

  // we didn't really discuss this one
  visualise(timestamp);
};

requestAnimationFrame(loop);

// hook up button
var handle = function handle(e) {
  e.preventDefault();
  _start();
};

button.addEventListener('click', handle, false);
button.addEventListener('touchstart', handle, false);

/*
  Stuff I didn't have time to cover…

  1. drawing a line - only gamma/beta for now, thickness
     based on distance covered

  2. playing a sound with the web audio api
     (audio generated with as3sfxr)

*/

var size = Math.min(window.innerWidth, window.innerHeight) * 0.9;

var canvas = document.createElement('canvas');
canvas.width = canvas.height = size;
var ctx = canvas.getContext('2d');
ctx.translate(size / 2, size / 2);
ctx.lineWidth = 10;
ctx.lineJoin = ctx.lineCap = 'round';
ctx.strokeStyle = '#fff';

var x = function x(p) {
  return p.gamma * size / 2.3;
};
var y = function y(p) {
  return p.beta * size / 2.3;
};

var _vfirst = undefined,
    _vcurrent = undefined;
var visualise = function visualise(timestamp) {

  if (_vfirst == first && _vcurrent == current) return;
  _vfirst = first;
  _vcurrent = current;

  ctx.clearRect(-size / 2, -size / 2, size, size);
  ctx.save();

  // works out weird
  // ctx.rotate(-current.alpha)

  ctx.lineWidth = _distance * 11;

  ctx.beginPath();
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = points(first)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var p = _step3.value;

      ctx.lineTo(x(p), y(p));
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  ctx.stroke();
  ctx.restore();
};

// initial setup, check for events before displaying button
if (!('DeviceOrientationEvent' in window)) warning.textContent = 'device orientation not supported';else new Promise(function (done) {
  var check = function check(e) {
    if (e.gamma) {
      window.removeEventListener('deviceorientation', check);
      done(e);
    }
  };
  window.addEventListener('deviceorientation', check);
}).then(function () {
  var centre = warning.parentNode;
  centre.removeChild(warning);
  centre.appendChild(canvas);

  document.body.appendChild(button);
});

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();

var player = function player(url) {
  var buffer = null;

  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  request.onload = function () {
    context.decodeAudioData(request.response, function (_buffer) {
      return buffer = _buffer;
    }, console.log.bind(console, 'failed to load ' + url));
  };
  request.send();

  return function () {
    if (buffer) {
      var source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start(0);
    }
  };
};

var boom = player('lose.wav');