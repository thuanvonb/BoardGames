class UltimateTicTacToe {
  static Move = class {
    constructor(r, c, t) {
      this.r = r
      this.c = c
      this.section = {
        r: Math.floor(r/3),
        c: Math.floor(c/3)
      }
      this.coord = {
        r: r % 3,
        c: c % 3
      }
      this.turn = t
    }
  }

  static TicTacToe = class {
    constructor(board) {
      this.data = board
      this.ended = undefined
      this.cache = true;
    }

    terminalCheck() {
      if (this.ended != undefined && this.cache)
        return this.ended != 2

      let r = [0, 0, 0]
      let c = [0, 0, 0]
      let d = [0, 0]
      for (let i = 0; i < 3; ++i) {
        d[0] += this.data[i][i];
        d[1] += this.data[i][2-i];
        for (let j = 0; j < 3; ++j) {
          r[i] += this.data[i][j];
          c[j] += this.data[i][j];
        }
      }

      let u = r.concat(c, d)

      if (u.every(v => Math.abs(v) != 3) && this.data.some(row => row.some(c => c == 0))) {
        this.ended = 2;
        return false;
      }

      if (u.indexOf(3) != -1)
        this.ended = 1
      else if (u.indexOf(-3) != -1)
        this.ended = -1;
      else
        this.ended = 0;
      return true;
    }

    terminalStatus() {
      if (this.ended == undefined || !this.cache)
        this.terminalCheck()
      return this.ended;
    }
  }

  static State = class {
    constructor(board, prevMove=undefined) {
      this.data = cloneBoard(board);
      this.repr = UltimateTicTacToe.State.export(board);
      this.previousMove = prevMove
      this.tictactoe = this.data.map(row => row.map(subBoard => new UltimateTicTacToe.TicTacToe(subBoard)))
    }

    isSameAs(otherState) {
      return this.repr == otherState.repr
    }

    static export(board) {
      let out = new Array(9).fill(0).map(v => new Array(9).fill(0))
      for (let i = 0; i < 9; ++i) {
        for (let j = 0; j < 9; ++j) {
          out[i][j] = board[~~(i/3)][~~(j/3)][i%3][j%3];
        }
      }

      return out.map(r => r.map(v => v == 0 ? '-' : (v == 1 ? 'X' : "O")).join('')).join('\n')
    }

    static import(str) {
      let board2d = str.split('/').map(v => v.split('').map(t => {
        if (t != 'X' && t != 'O')
          return 0;
        return t == 'X' ? 1 : -1;
      }))

      let board4d = new Array(3).fill(0).map(v => new Array(3).fill(0).map(t => new Array(3).fill(0).map(u => new Array(3).fill(0))))
      for (let i = 0; i < 9; ++i) {
        for (let j = 0; j < 9; ++j)
          board4d[~~(i/3)][~~(j/3)][i%3][j%3] = board2d[i][j]
      }
      // console.log(board4d)
      return new UltimateTicTacToe.State(board4d)
    }

    validMoves(turn) {
      let cData = this.data;
      if (this.previousMove != undefined) {
        let pr = this.previousMove.coord.r
        let pc = this.previousMove.coord.c
        let b = this.tictactoe[pr][pc]
        if (!b.terminalCheck()) {
          let mv = []
          for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 3; ++j) {
              if (this.data[pr][pc][i][j] != 0)
                continue;
              let r = i + pr * 3;
              let c = j + pc * 3;
              mv.push(new UltimateTicTacToe.Move(r, c, turn))
            }
          }
          return mv
        }
      }

      let mv = []
      for (let i = 0; i < 3; ++i) {
        for (let j = 0; j < 3; ++j) {
          if (this.tictactoe[i][j].terminalCheck())
            continue;
          for (let r = 0; r < 3; ++r) {
            for (let c = 0; c < 3; ++c) {
              if (this.data[i][j][r][c] != 0)
                continue;
              mv.push(new UltimateTicTacToe.Move(r + i*3, c + j*3, turn))
            }
          }
        }
      }
      return mv
    }

    terminalStatus() {
      let b = this.tictactoe.map(row => row.map(c => c.terminalStatus()))

      let playable = b.some(r => r.some(v => v == 2))
      let t = new UltimateTicTacToe.TicTacToe(b.map(r => r.map(v => v == 2 ? 0 : v)))
      if (!playable) {
        // console.log(UltimateTicTacToe.State.export(this.data))
        let c = [].concat(...t.data).reduce((a, b) => a + b, 0)
        if (c != 0)
          c = c / Math.abs(c)
        return c;
      }

      if (t.terminalCheck())
        return t.terminalStatus()

      return 2
    }

    isDone() {
      return this.terminalStatus() != 2;
    }

    step(move) {
      let data2 = cloneBoard(this.data)
      data2[move.section.r][move.section.c][move.coord.r][move.coord.c] = move.turn
      return new UltimateTicTacToe.State(data2, move);
    }

    // other info of the state
    info() {
      return {}
    }

    // facilitate mcts rollout
    randomPlayout(startTurn) {
      let rolloutState = new UltimateTicTacToe.State(this.data)
      let data = rolloutState.data;
      // rolloutState.tictactoe.forEach(row => row.forEach(v => v.cache = false))
      let t = startTurn
      while (rolloutState.terminalStatus() == 2) {
        let moves = rolloutState.validMoves(t)
        let act = moves[Math.floor(Math.random() * moves.length)]
        data[act.section.r][act.section.c][act.coord.r][act.coord.c] = act.turn
        rolloutState.tictactoe[act.section.r][act.section.c].ended = undefined
        t *= -1;
      }
      return rolloutState.terminalStatus()
    }

    playableBoard() {
      if (this.previousMove != undefined) {
        let pr = this.previousMove.coord.r
        let pc = this.previousMove.coord.c
        if (!this.tictactoe[pr][pc].terminalCheck())
          return [{r: pr, c: pc}]
      }
      return [].concat(...this.tictactoe.map((r, i) => 
        r.map((_, j) => ({r: i, c: j}))
         .filter(t => !this.tictactoe[t.r][t.c].terminalCheck())))
    }
  }

  constructor(svgD3Container=undefined, ai1=undefined, ai2=undefined) {
    this.svg = svgD3Container
    this.drawBackground(600);
    this.ai1 = ai1;
    this.ai2 = ai2;
    this.stateHistory = []
    this.actionHistory = []
    this.reset();
    this.sideSwitched = false;
    this.previousMove = {r: -1, c: -1}
  }

  reset() {
    this.turn = 1;
    this.state = UltimateTicTacToe.initialState
    this.stateHistory = []
    this.actionHistory = []
    this.previousMove = {r: -1, c: -1}
    this.drawState()
  }

  step(move) {
    this.stateHistory.push(cloneBoard(this.state.data))
    this.actionHistory.push(move)
    this.state = this.state.step(move)
    this.turn *= -1;
    this.previousMove = move
    this.drawState();
  }

  validMoves() {
    return this.state.validMoves(this.turn)
  }

  static get initialState() {
    return UltimateTicTacToe.State.import(new Array(9).fill('---------').join('/'))
  };

  onTerminated(callback){
    this.callback = callback;
  };

  switchSide() {
    let t = this.ai1;
    this.ai1 = this.ai2;
    this.ai2 = t;
    this.sideSwitched = !this.sideSwitched
  }

  drawTTTBoard(group, tile_size, stw=2, c=.15) {
    group.append('line')
      .attr('x1', tile_size)
      .attr('x2', tile_size)
      .attr('y1', tile_size * c)
      .attr('y2', tile_size * (3-c))
      .attr('stroke-width', stw)

    group.append('line')
      .attr('x1', 2*tile_size)
      .attr('x2', 2*tile_size)
      .attr('y1', tile_size * c)
      .attr('y2', tile_size * (3-c))
      .attr('stroke-width', stw)

    group.append('line')
      .attr('y1', tile_size)
      .attr('y2', tile_size)
      .attr('x1', tile_size * c)
      .attr('x2', tile_size * (3-c))
      .attr('stroke-width', stw)

    group.append('line')
      .attr('y1', 2*tile_size)
      .attr('y2', 2*tile_size)
      .attr('x1', tile_size * c)
      .attr('x2', tile_size * (3-c))
      .attr('stroke-width', stw)

    group.append('rect')
      .datum(d => d)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 3*tile_size)
      .attr('height', 3*tile_size)
      .attr('fill', 'none')
      .attr('stroke', 'none')

    group.append('use')
      .datum(d => d)
      .attr('x', 3*tile_size/2)
      .attr('y', 3*tile_size/2)
      .attr('transform', (d, i) => `matrix(3, 0, 0, 3, ${-3*tile_size}, ${-3*tile_size})`)
  }

  drawBackgroundInfo(board_size) {
    let info_size = this.info_size
    this.svg.append('rect')
      .attr('x', 0)
      .attr('y', board_size)
      .attr('width', board_size)
      .attr('height', info_size)
      .attr('fill', 'white')
      .attr('stroke', 'none')

    this.infoA = this.svg.append('g')
      .attr('transform', `translate(0, ${board_size + .1*info_size})`)
    this.infoB = this.svg.append('g')
      .attr('transform', `translate(${board_size/2}, ${board_size + .1*info_size})`)

    info_size *= .9

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

    this.infoA.append('use')
      .attr('x', board_size/2 - info_size/2)
      .attr('y', info_size/2)
      .attr('href', '#x_piece_small')

    this.infoB.append('use')
      .attr('x', info_size/2)
      .attr('y', info_size/2)
      .attr('href', '#o_piece_small')
  }

  drawBackground(board_size) {
    if (!this.svg)
      return;
    let info_size = 50;
    this.info_size = info_size
    this.svg.attr('id', 'ultimatettt')
    this.svg.attr('width', board_size).attr('height', board_size + info_size)
    this.svg.selectChildren().filter((d, i) => i > 0).remove()
    this.board_size = board_size
    this.tile_size = this.board_size / 9

    this.drawBackgroundInfo(board_size)

    this.ingame = this.svg.append('g')
    this.gBoard = this.svg.append('g')
    this.gBoard.classed('board', true)
    for (let i = 0; i < 3; ++i) {
      for (let j = 0; j < 3; ++j) {
        let group = this.gBoard.append('g')
          .datum(d => ({r: i, c: j}))
          .attr('transform', `translate(${j*this.tile_size*3}, ${i*this.tile_size*3})`)
          .classed('sub-board', true)
        this.drawTTTBoard(group, this.tile_size)
      }
    }
    this.drawTTTBoard(this.gBoard, this.tile_size*3, 7, 0)

    let data = new Array(9).fill(0).map((v, i) => new Array(9).fill(0).map((_, j) => ({
      r: i%3,
      c: j%3,
      br: ~~(i/3),
      bc: ~~(j/3)
    })))

    this.ingame.selectAll('g')
      .data(data)
      .join('g')
      .attr('transform', (d, i) => `translate(0, ${i * this.tile_size})`)
      .selectAll('rect')
      .data(d => d)
      .join('rect')
      .attr('x', (d, i) => i*this.tile_size)
      .attr('y', 0)
      .attr('width', this.tile_size)
      .attr('height', this.tile_size)
      .classed('board-tile', true)
      .classed('playable', true)
      .on('click', (e, d) => {
        if (this.turn == 1 && this.ai1)
          return;
        if (this.turn == -1 && this.ai2)
          return;
        let t = d3.select(e.target)
        if (!t.classed('playable'))
          return;
        if (this.state.data[d.br][d.bc][d.r][d.c] != 0)
          return;
        this.step(new UltimateTicTacToe.Move(d.r + d.br*3, d.c + d.bc*3, this.turn))
      })
  }

  drawState() {
    if (!this.svg)
      return

    this.drawInfo()
    // this.ingame.selectAll('rect')
    //   .filter(d => this.state.data[d.br][d.bc][d.r][d.c] != 0)

    this.ingame.selectAll('g')
      .selectAll('use')
      .data(d => d)
      .join('use')
      .attr('x', (d, i) => this.tile_size*(i+.5))
      .attr('y', this.tile_size/2)
      .style('transform', (d, i) => `matrix(0.9, 0, 0, 0.9, ${this.tile_size*(i+.5)*(.1)}, ${this.tile_size/2*(.1)})`)
      .attr('href', "")
      .filter(d => this.state.data[d.br][d.bc][d.r][d.c] != 0)
      .attr('href', d => this.state.data[d.br][d.bc][d.r][d.c] == 1 ? '#x_piece' : "#o_piece")

    let playable = this.state.playableBoard()
    let playable_board = d3.selectAll('.sub-board')
      .classed('playable', false)
    let playable_ttt = this.ingame.selectAll('rect')
      .classed('playable', false)
      .filter(d => playable.some(t => t.r == d.br && t.c == d.bc))
      .filter(d => this.state.data[d.br][d.bc][d.r][d.c] == 0)

    playable_board.filter(d => playable.some(t => t.r == d.r && t.c == d.c))
      .classed('playable', true)

    playable_ttt.classed('playable', true)

    let completed = this.gBoard.selectAll('.sub-board')
      .filter(d => this.state.tictactoe[d.r][d.c].terminalCheck())
      
    completed.selectAll('use')
      .attr('href', d => this.state.tictactoe[d.r][d.c].terminalStatus() == 1 ? '#x_piece' : 
        (this.state.tictactoe[d.r][d.c].terminalStatus() == -1 ? '#o_piece' : ""))

    completed.selectAll('rect')
      .attr('fill', 'rgba(255, 255, 255, 0.8)')

    if (this.state.isDone()) {
      if (this.callback)
        this.callback(this.state.terminalStatus(), this.state.info(), this.stateHistory, this.actionHistory);
      return;
    }

    if (this.turn == 1 && this.ai1 && !this.state.isDone()) {
      setTimeout(e => {
        this.step(this.ai1.play(this.state, 1))
      }, 100)
    }
    if (this.turn == -1 && this.ai2 && !this.state.isDone()) {
      setTimeout(e => {
        this.step(this.ai2.play(this.state, -1))
      }, 100);
    }
  }

  drawInfo() {
    let plA = this.sideSwitched ? 'B' : 'A'
    let plB = this.sideSwitched ? 'A' : 'B'

    let tx = this.infoA.select('#playerName')
    if (tx.empty())
      tx = this.infoA.append('text').attr('id', 'playerName')
    tx.attr('x', 16)
      .attr('y', this.info_size*.9/2)
      .html((this.ai1 ? this.ai1.name : "Human") + " " + plA)

    tx = this.infoB.select('#playerName')
    if (tx.empty())
      tx = this.infoB.append('text').attr('id', 'playerName')
    tx.attr('x', this.board_size/2 - 16)
      .attr('y', this.info_size*.9/2)
      .html((this.ai2 ? this.ai2.name : "Human") + " " + plB)
      .style('text-anchor', 'end')

    this.infoA.select('rect').classed('turn', this.turn == 1)
    this.infoB.select('rect').classed('turn', this.turn == -1)
  }
}