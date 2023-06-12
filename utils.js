const borderCheck = (n, m) => (i, j) => i*j*(i-n+1)*(j-m+1) == 0
const cornerCheck = (n, m) => (i, j) => i*(i-n+1) + j*(j-m+1) == 0
const insideCheck = (n, m) => (a, b) => 0 <= a && a < n && 0 <= b && b < m
const scaleSize = coef => size => board_size()[0]/size / 50 * coef;

const cloneBoard = mat => mat[0].length == undefined ? Array.from(mat) : mat.map(t => cloneBoard(t))

let board_size = () => {
  let w = document.documentElement.clientWidth;
  let h = document.documentElement.clientHeight;
  let size;
  if (w > h)
    s = h * .9 * .9;
  else 
    s = w * .95
  s = Math.round(s)
  return [s, s]
}

const frameDelay = (() => {
  let stack = []

  function add(act, delay) {
    let t = {act, until: Date.now() + delay}
    for (let i = 0; i < stack.length; ++i) {
      if (stack[i].until > t.until) {
        stack.splice(i, 0, t)
        return obj;
      }
    }
    stack.push(t);
    return obj;
  }

  function log() {
    console.log(stack)
    return obj
  }

  function step() {
    while (stack.length > 0 && stack[0].until < Date.now()) {
      stack.shift().act();
    }
    requestAnimationFrame(step)
  }

  step();

  let obj = {
    add, log
  }

  return obj
})();

Array.prototype.convolve = function(filter) {
  let out = []
  for (let i = 0; i <= this.length - filter.length; ++i) {
    out.push(filter.map((v, id) => v*this[i+id]).reduce((acc, t) => acc+t, 0))
  }
  return out;
}