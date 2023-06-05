const borderCheck = (n, m) => (i, j) => i*j*(i-n+1)*(j-m+1) == 0
const cornerCheck = (n, m) => (i, j) => i*(i-n+1) + j*(j-m+1) == 0
const insideCheck = (n, m) => (a, b) => 0 <= a && a < n && 0 <= b && b < m

const cloneBoard = mat => mat[0].length == undefined ? Array.from(mat) : mat.map(t => cloneBoard(t))