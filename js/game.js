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
};

requestAnimationFrame(loop);

// hook up button
var handle = function handle(e) {
  e.preventDefault();
  _start();
};

button.addEventListener('click', handle, false);
button.addEventListener('touchstart', handle, false);

document.body.appendChild(button);