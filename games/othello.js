class Othello {
  static Move = class {
    constructor(r, c, isPass, turn) {
      this.r = r;
      this.c = c;
      this.isPass = isPass;
      this.turn = turn;
    }

    static standardMove(r, c, turn) {
      return new Othello.Move(r, c, false, turn);
    }

    static pass(turn) {
      return new Othello.Move(-1, -1, true, turn)
    }
  }

  static State = class {
    constructor(board) {
      this.data = cloneBoard(board);
      this.repr = Othello.State.export(board);
      this.possibleMoves = this.validMoves();
      this.blackMoves = this.possibleMoves.filter(m => m.turn == 1)
      this.whiteMoves = this.possibleMoves.filter(m => m.turn == -1)
    }

    isSameAs(otherState) {
      return this.repr == otherState.repr;
    }

    static export(board) {
      return board.map(row => row.map(v => v == 0 ? '-' : (v == 1 ? 'B' : 'W')).join("")).join("/")
    }

    static import(data) {
      return new Othello.State(data.split('/').map(v => v.split('').map(v => v == '-' ? 0 : (v == 'B' ? 1 : -1))))
    }

    validMoves(turn=0) {
      if (this.possibleMoves)
        return this.possibleMoves.filter(m => turn == 0 || turn == m.turn)
      let valid = insideCheck(8, 8)
      let n = 8;
      let board = this.data;
      let moves = new Array(8).fill(0).map(t => new Array(8).fill(0))
      let output = []
      let whiteHasMove = false;
      let blackHasMove = false;
      for (let r = 0; r < n; ++r) {
        for (let c = 0; c < n; ++c) if (board[r][c] == 0) {
          for (let dr = -1; dr < 2; ++dr) {
            for (let dc = -1; dc < 2; ++dc) if (dr != 0 || dc != 0) {
              let nr = r + dr;
              let nc = c + dc;
              if (!valid(nr, nc))
                continue;
              if (moves[r][c] == 2)
                break;
              if (board[nr][nc] == 0)
                continue;
              let tr = nr + dr;
              let tc = nc + dc;
              while (valid(tr, tc)) {
                let v = board[tr][tc];
                if (v == board[nr][nc]) {
                  tr += dr;
                  tc += dc;
                  continue;
                } 
                if (v == 0)
                  break;
                if (moves[r][c] == v)
                  break;
                if (moves[r][c] == -v)
                  moves[r][c] = 2;
                else
                  moves[r][c] = v;
                break;
              }
            }
          }

          if ((moves[r][c] == 1 || moves[r][c] == 2) && (turn >= 0))
            output.push(Othello.Move.standardMove(r, c, 1));
          if ((moves[r][c] == -1 || moves[r][c] == 2) && (turn <= 0))
            output.push(Othello.Move.standardMove(r, c, -1));

          blackHasMove ||= (moves[r][c] == 1 || moves[r][c] == 2);
          whiteHasMove ||= (moves[r][c] == -1 || moves[r][c] == 2);
        }
      }

      if (!blackHasMove && whiteHasMove && turn >= 0)
        output.push(Othello.Move.pass(1));
      if (!whiteHasMove && blackHasMove && turn <= 0)
        output.push(Othello.Move.pass(-1));

      return output;
    }

    terminalStatus() {
      let info = this.info();
      let v = info.blacks - info.whites
      return v == 0 ? 0 : (v / Math.abs(v));
    }

    isDone() {
      if (!this.possibleMoves)
        this.possibleMoves = this.validMoves()
      return this.possibleMoves.length == 0
    }

    step(m) {
      let next = cloneBoard(this.data)
      Othello.State.step(next, m)
      return new Othello.State(next);
    }

    static step(data, m) {
      let valid = insideCheck(8, 8)

      if (m.isPass)
        return;

      data[m.r][m.c] = m.turn;
      for (let dr = -1; dr < 2; ++dr) {
        for (let dc = -1; dc < 2; ++dc) if (dr != 0 || dc != 0) {
          let nr = m.r + dr;
          let nc = m.c + dc;
          while (valid(nr, nc) && data[nr][nc] == -m.turn) {
            nr += dr;
            nc += dc;
          }
          if (!valid(nr, nc))
            continue;
          if (data[nr][nc] == 0)
            continue;
          while (nr != m.r || nc != m.c) {
            data[nr][nc] = m.turn;
            nr -= dr;
            nc -= dc;
          }
        }
      }
    }

    info() {
      let flattened = [].concat(...this.data)
      let blacks = flattened.filter(v => v == 1).length
      let whites = flattened.filter(v => v == -1).length
      return {blacks, whites}
    }

    randomPlayout(startTurn) {
      let rolloutState = new Othello.State(this.data)

      let data = rolloutState.data;
      let t = startTurn
      while (!rolloutState.isDone()) {
        let moves = rolloutState.validMoves(t)
        // console.log(data)
        let act = moves[Math.floor(Math.random() * moves.length)]
        Othello.State.step(data, act)
        t *= -1;
        rolloutState.possibleMoves = undefined;
      }
      return rolloutState.terminalStatus()
    }
  }

  constructor(svgD3Container=undefined, ai1=undefined, ai2=undefined) {
    this.svg = svgD3Container
    this.drawBackground(board_size()[0]);
    this.reset();
    this.ai1 = ai1;
    this.ai2 = ai2;
    this.stateHistory = []
    this.actionHistory = []
    this.drawState();
    this.sideSwitched = false;
  }

  reset() {
    this.state = Othello.initialState
    this.turn = 1;
    this.stateHistory = []
    this.actionHistory = []
    this.prevMove = {r: -1, c: -1}
    this.drawState();
  }

  step(action) {
    this.prevMove = action
    this.actionHistory.push(action)
    this.stateHistory.push(this.state.data)
    this.state = this.state.step(action)
    this.turn *= -1;
    let r = 0;
    if (this.state.isDone())
      r = this.state.terminalStatus()
    return [this.state, r, this.state.isDone(), this.state.info()]
  }

  validMoves() {
    return this.state.validMoves(this.turn)
  }

  drawBackground(board_size) {
    if (!this.svg)
      return;
    let info_size = board_size*.1;
    this.info_size = info_size
    this.svg.selectChildren().filter((d, i) => i > 0).remove()
    this.svg.attr('id', 'othello')
    this.svg.attr('width', board_size).attr('height', board_size + info_size)
    this.board_size = board_size
    let tile_size = board_size/8
    let gBoard = this.svg.append('g')
    this.ingame = this.svg.append('g')
    this.svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', board_size)
      .attr('height', board_size)
      .attr('stroke', 'black')
      .attr('fill', 'none')
      .attr('stroke-width', 10)

    this.svg.append('rect')
      .attr('x', 0)
      .attr('y', board_size)
      .attr('width', board_size)
      .attr('height', info_size)
      .attr('fill', 'white')
      .attr('stroke', 'none')

    this.infoA = this.svg.append('g')
      .attr('transform', `translate(0, ${board_size})`)
    this.infoB = this.svg.append('g')
      .attr('transform', `translate(${board_size/2}, ${board_size})`)

    this.infoA.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', board_size/2)
      .attr('height', info_size)
      .attr('fill', 'lightgray')
      .attr('stroke', 'black')
      .classed('turn', true)

    this.infoB.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', board_size/2)
      .attr('height', info_size)
      .attr('fill', 'lightgray')
      .attr('stroke', 'black')
      .classed('turn', false)

    this.infoA.append('circle')
      .attr('cx', board_size/2 - info_size/2)
      .attr('cy', info_size/2)
      .attr('r', info_size*0.3)
      .classed('black_piece', true)

    this.infoA.append('text')
      .attr('x', board_size/2 - info_size*1.5)
      .attr('y', info_size/2)
      .classed('piece_status', true)
      .html(2)

    this.infoB.append('circle')
      .attr('cx', info_size/2)
      .attr('cy', info_size/2)
      .attr('r', info_size*0.3)
      .classed('white_piece', true)

    this.infoB.append('text')
      .attr('x', info_size*1.5)
      .attr('y', info_size/2)
      .classed('piece_status', true)
      .html(2)

    let board = new Array(8).fill(0).map(t => new Array(8).fill(0));
    gBoard.selectAll('g')
      .data(board)
      .join('g')
      .attr('transform', (d, i) => `translate(0, ${tile_size*i})`)
      .selectAll('rect')
      .data(d => d)
      .join('rect')
      .attr('x', (d, i) => tile_size*i)
      .attr('y', 0)
      .attr('width', tile_size)
      .attr('height', tile_size)
      .classed('board-tile', true)
  }

  static get initialState() {
    let board = new Array(8).fill(0).map(t => new Array(8).fill(0));
    board[3][3] = board[4][4] = -1;
    board[3][4] = board[4][3] = 1;
    return new Othello.State(board)
  }

  drawState() {
    if (!this.svg)
      return;
    let tile_size = this.board_size/8
    let board = cloneBoard(this.state.data);
    let possibleMoves = this.state.validMoves(this.turn)
    if (possibleMoves.length == 1 && possibleMoves[0].isPass) {
      this.step(possibleMoves[0])
      return this.drawState()
    }
    possibleMoves.forEach(m => board[m.r][m.c] = 2*m.turn)
    this.ingame.selectAll('g')
      .data(board)
      .join('g')
      .attr('transform', (d, i) => `translate(${tile_size/2}, ${tile_size*(i + 1/2)})`)
      .selectAll('circle')
      .data((d, i) => d.map((v, j) => ({val: v, r: i, c: j})))
      .join('circle')
      .attr('cx', d => tile_size * d.c)
      .attr('cy', 0)
      .attr('r', tile_size*0.4)
      .classed('black_piece', d => d.val > 0)
      .classed('white_piece', d => d.val < 0)
      .classed('empty_piece', d => d.val == 0)
      .classed('possible_move', d => Math.abs(d.val) == 2)
      .classed('previous_move', d => d.r == this.prevMove.r && d.c == this.prevMove.c)
      .on('click', (e, d) => {
        if (Math.abs(d.val) != 2)
          return;
        // console.log()
        this.step(Othello.Move.standardMove(d.r, d.c, this.turn))
        this.drawState()
      })

    this.drawInfo();

    if (this.turn == 1 && this.ai1 && !this.state.isDone()) {
      frameDelay.add(e => {
        if (!this.ai1)
          return;
        this.step(this.ai1.play(this.state, 1))
        this.drawState();
      }, 100)
    }
    if (this.turn == -1 && this.ai2 && !this.state.isDone()) {
      frameDelay.add(e => {
        if (!this.ai2)
          return;
        this.step(this.ai2.play(this.state, -1))
        this.drawState();
      }, 100);
    }

    if (possibleMoves.length == 0 && this.callback) {
      this.callback(this.state.terminalStatus(), this.state.info(), this.stateHistory, this.actionHistory);
    }
  }

  drawInfo() {
    let plA = this.sideSwitched ? 'B' : 'A'
    let plB = this.sideSwitched ? 'A' : 'B'

    let tx = this.infoA.select('#playerName')
    if (tx.empty())
      tx = this.infoA.append('text').attr('id', 'playerName')
    tx.attr('x', 16)
      .attr('y', this.info_size/2)
      .html((this.ai1 ? this.ai1.name : "Human") + " " + plA)

    tx = this.infoB.select('#playerName')
    if (tx.empty())
      tx = this.infoB.append('text').attr('id', 'playerName')
    tx.attr('x', this.board_size/2 - 16)
      .attr('y', this.info_size/2)
      .html((this.ai2 ? this.ai2.name : "Human") + " " + plB)
      .style('text-anchor', 'end')

    this.infoA.select('rect').classed('turn', this.turn == 1)
    this.infoB.select('rect').classed('turn', this.turn == -1)

    let info = this.state.info()

    this.infoA.select('.piece_status').html(info.blacks)
    this.infoB.select('.piece_status').html(info.whites)
  }

  onTerminated(callback) {
    this.callback = callback;
  }

  switchSide() {
    let t = this.ai1;
    this.ai1 = this.ai2;
    this.ai2 = t;
    this.sideSwitched = !this.sideSwitched
  }
}

const positionalValue = corner => edge => center => (i, j) => {
  return cornerCheck(8, 8)(i, j) ? corner : (borderCheck(8, 8)(i, j) ? edge : center)
}

const imposterCount = state => {
  let b = state.data;
  let v = 0;
  for (let i = 1; i < 7; ++i) {
    v += b[i][0]*(b[i-1][0]*b[i][0] < 0 && b[i+1][0]*b[i][0] < 0)
    v += b[i][7]*(b[i-1][7]*b[i][7] < 0 && b[i+1][7]*b[i][7] < 0)
    v += b[0][i]*(b[0][i-1]*b[0][i] < 0 && b[0][i+1]*b[0][i] < 0)
    v += b[7][i]*(b[7][i-1]*b[7][i] < 0 && b[7][i+1]*b[7][i] < 0)
  }
  return v
}

const othello_heuristicEvaluate = settings => state => {
  if (state.isDone())
    return state.terminalStatus() * 999;

  const relu = x => Math.max(0, x)
  let board = state.data;
  let b2 = board.map((r, i) => r.map((c, j) => Math.abs(c) != 1 ? 0 : c*positionalValue(settings.corner)(settings.edge)(settings.center)(i, j)))
  let blackP = b2.reduce((acc, r) => acc + r.reduce((acc2, c) => acc2 + relu(c), 0), 0)
  let whiteP = b2.reduce((acc, r) => acc + r.reduce((acc2, c) => acc2 + relu(-c), 0), 0)

  let allMoves = state.validMoves()
  let a = settings.moves * allMoves.filter(m => m.turn == 1 && !m.isPass).length;
  let b = settings.moves * allMoves.filter(m => m.turn == -1 && !m.isPass).length

  a += blackP
  b += whiteP

  return a - b + imposterCount(state) * settings.imposter;
}