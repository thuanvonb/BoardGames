const borderCheck = (n, m) => (i, j) => i*j*(i-n+1)*(j-m+1) == 0
const cornerCheck = (n, m) => (i, j) => i*(i-n+1) + j*(j-m+1) == 0
const insideCheck = (n, m) => (a, b) => 0 <= a && a < n && 0 <= b && b < m

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