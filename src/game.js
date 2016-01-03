class Orientation {
  constructor (gamma, alpha, beta, last) {
    this.gamma = gamma
    this.alpha = alpha
    this.beta = beta

    this.timestamp = window.performance.now()

    if (last) last.next = this
  }
}


function* points(p) {
    do yield p
    while (p = p.next)
}


const range = (start) => {

    let g_min, g_max, a_min, a_max, b_min, b_max, first = true

    for(let p of start) {
        if(first){
            g_min = g_max = p.gamma
            a_min = a_max = p.alpha
            b_min = b_max = p.beta
            first = false
            continue
        }

        if (p.gamma < g_min) {g_min = p.gamma}
        else if (p.gamma > g_max ) {g_max = p.gamma}

        if (p.alpha < a_min) {a_min = p.alpha}
        else if (p.alpha > a_max) {a_max = p.alpha}

        if (p.beta < b_min) {b_min = p.beta}
        else if (p.beta > b_max) {b_max = p.beta}
    }

    return {
      gamma: {min: g_min, max: g_max},
      alpha: {min: a_min, max: a_max},
      beta:  {min: b_min, max: b_max}
    }

}


const extent = (r) => {
  const gamma = r.gamma.max - r.gamma.min,
        alpha = r.alpha.max - r.alpha.min,
        beta  = r.beta.max - r.beta.min

  return {gamma, alpha, beta}
}


const distance = (e) =>
  Math.sqrt(
    Math.pow(e.gamma, 2) +
    Math.pow(e.alpha, 2) +
    Math.pow(e.beta, 2)
  )

// scale by 70% and limit to <1
const scale = (d) => Math.min(1, d * .7)

const tooFast = (s) => s >= 1

const hue = d => (1-d) * 120

const colour = h => `hsl(${~~hue(h)}, 100%, 45%)`


const READY = 1, STARTED = 2, LOST = 4
let state = READY

const button = document.createElement('button')
button.textContent = '▶︎'

const _start = () => {
  if(state & READY | LOST) {
    state = STARTED
    button.className = 'hidden'
  }
}


const _lose = () => {
  if(state & STARTED) {
    state = LOST
    button.className = ''

    // vibrate and play a noise
    if(navigator.vibrate) navigator.vibrate(800)
    boom()

  }
}



// gather points
let current = null


window.addEventListener('deviceorientation', e => {
  if(e.gamma !== null){
    current = new Orientation(
        Math.sin(2*Math.PI*(e.gamma / 180)),
        Math.sin(2*Math.PI*(e.alpha / 360)),
        Math.sin(2*Math.PI*(e.beta / 360)),
        current
      )
  }
})


// track point 1.5s ago
let first = null

const traverse = timestamp => {

  if(!current) return

  for(first of points(first || current))
    if(first.timestamp > timestamp - 1500)
      break
}


// handy to save distance for other stuff
let _distance = 0

let _first, _current

const render = timestamp => {
  // if there is no start point, or game has been lost
  if(!first) return


  // optimisation to not have to redraw same thing
  if((_first == first) && (_current == current)) return
  [_first, _current] = [first, current]


  _distance = scale(
    distance(
      extent(
        range(
          points(
            first
          )
        )
      )
    )
  )

  document.body.style.background = colour(_distance)

  if(tooFast(_distance)) _lose()

}


const loop = (timestamp) => {
  requestAnimationFrame(loop)
  traverse(timestamp)
  render(timestamp)

  // we didn't really discuss this one
  visualise(timestamp)
}

requestAnimationFrame(loop)


// hook up button
const handle = e => {
  e.preventDefault()
  _start()
}

button.addEventListener('click', handle, false)
button.addEventListener('touchstart', handle, false)


/*
  Stuff I didn't have time to cover…

  1. drawing a line - only gamma/beta for now, thickness
     based on distance covered

  2. playing a sound with the web audio api
     (audio generated with as3sfxr)

*/


const size = Math.min(window.innerWidth, window.innerHeight) * 0.9

const canvas = document.createElement('canvas')
canvas.width = canvas.height = size
const ctx = canvas.getContext('2d')
ctx.translate(size/2,size/2);
ctx.lineWidth = 10
ctx.lineJoin = ctx.lineCap = 'round'
ctx.strokeStyle = '#fff'

const x = p => p.gamma * size/2.3
const y = p => p.beta * size/2.3

let _vfirst, _vcurrent;
const visualise = timestamp => {

  if((_vfirst == first) && (_vcurrent == current)) return
  [_vfirst, _vcurrent] = [first, current]

  ctx.clearRect(-size/2, -size/2, size, size)
  ctx.save()

  // works out weird
  // ctx.rotate(-current.alpha)

  ctx.lineWidth = (_distance * 11)

  ctx.beginPath();
  for(let p of points(first)) {
    ctx.lineTo(x(p), y(p))
  }
  ctx.stroke();
  ctx.restore();
}


// initial setup, check for events before displaying button
if(!('DeviceOrientationEvent' in window))
  warning.textContent = 'device orientation not supported'

else
  new Promise(done => {
    const check = (e) => {
      if(e.gamma) {
        window.removeEventListener('deviceorientation', check)
        done(e)
      }
    }
    window.addEventListener('deviceorientation', check)
  })
  .then(() => {
    var centre = warning.parentNode
    centre.removeChild(warning)
    centre.appendChild(canvas)

    document.body.appendChild(button)
  })


window.AudioContext = window.AudioContext || window.webkitAudioContext;
const context = new AudioContext();

const player = (url) => {
  let buffer = null

  const request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  request.onload = function() {
    context.decodeAudioData(
      request.response,
      (_buffer) => buffer = _buffer,
      console.log.bind(console, 'failed to load ' + url)
    )
  }
  request.send();

  return () => {
    if (buffer) {
      const source = context.createBufferSource()
      source.buffer = buffer
      source.connect(context.destination)
      source.start(0)
    }
  }
}

const boom = player('lose.wav')
