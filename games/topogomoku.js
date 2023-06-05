class TopoGomoku {
  static Move = class {
    constructor(r, c, turn) {
      this.r = r;
      this.c = c;
      this.turn = turn;
    }
  }

  static State = class {
    constructor(board, prevMove=null) {
      this.data = cloneBoard(board)
      this.repr = TopoGomoku.State.export(board)
      this.end = null
      this.prevMove = prevMove
      this.winTiles = []
    }

    static import(str) {
      return new TopoGomoku.State(str.split('/').map(v => v.split('').map(t => {
        if (t != 'X' && t != 'O')
          return 0;
        return t == 'X' ? 1 : -1;
      })))
    }

    static export(board) {
      return board.map(r => r.map(v => v == 0 ? '-' : (v == 1 ? 'X' : "O")).join('')).join('\n')
    }

    isSameAs(otherState) {
      return this.repr == otherState.repr
    }

    validMoves(turn) {
      if (this.isDone())
        return []
      return this.data.map((r, i) => 
        r.map((v, j) => v != 0 ? null : new TopoGomoku.Move(i, j, turn))
         .filter(u => u)
      ).reduce((acc, e) => acc.concat(e), [])
    }

    terminalStatus() {
      if (this.end == null)
        this.isDone();

      return this.end;
    }

    coordAt(r, c, dr, dc) {
      let nr = r + dr;
      let nc = c + dc;
      if (nr < 0)
        nr += 8;
      if (nc < 0)
        nc += 8
      if (nr >= 8)
        nr -= 8;
      if (nc >= 8)
        nc -= 8;
      return [nr, nc]
    }

    check(r, c) {
      if (this.data[r][c] == 0)
        return false;
      let m = this.data[r][c];
      let dir = []
      for (let dr = -1; dr < 2; ++dr) {
        for (let dc = -1; dc < 2; ++dc) if (dr != 0 || dc != 0) {
          let p = {len: 0, blocked: false, tiles: []}
          let [nr, nc] = this.coordAt(r, c, dr, dc)
          while ((r != nr || c != nc) && this.data[nr][nc] == m) {
            p.len += 1;
            p.tiles.push([nr, nc]);
            [nr, nc] = this.coordAt(nr, nc, dr, dc)
          }
          p.blocked = this.data[nr][nc] == -m
          dir.push(p)
        }
      }
      let win = false;
      for (let i = 0; i < 4; ++i) {
        if ((dir[i].len + dir[7-i].len + 1 == 5 && (!dir[i].blocked || !dir[7-i].blocked)) ||
            (dir[i].len + dir[7-i].len + 1 >= 6)) {
          win = true;
          this.winTiles = this.winTiles.concat(dir[i].tiles).concat(dir[7-i].tiles)
        }
      }
      if (win) {
        this.winTiles.push([r, c])
        return m;
      }
      return false;
    }

    isDone() {
      if (this.end != null)
        return this.end === false ? false : true

      if (this.prevMove)
        this.end = this.check(this.prevMove.r, this.prevMove.c)
      else {
        for (let i = 0; i < 8; ++i) {
          for (let j = 0; j < 8; ++j) {
            let end = this.check(i, j)
            if (end === false)
              continue;

            if (this.end == null)
              this.end = end;
            else if (end != this.end) {
              this.end = 0;
              return true;
            }
          }
        }
        if (this.end == null)
          this.end = false;
      }

      if (this.end !== false)
        return true;


      if (this.data.every(row => row.every(v => v != 0))) {
        this.end = 0;
        return true;
      }

      this.end = false;
      return false;

    }

    step(move) {
      let nextBoard = cloneBoard(this.data)
      nextBoard[move.r][move.c] = move.turn
      return new TopoGomoku.State(nextBoard, move)
    }

    info() {
      return {}
    }

    randomPlayout(startTurn) {
      let rolloutState = new TopoGomoku.State(cloneBoard(this.data))
      let data = rolloutState.data;
      let t = startTurn
      while (!rolloutState.isDone()) {
        let moves = rolloutState.validMoves(t)
        let act = moves[Math.floor(Math.random() * moves.length)]
        data[act.r][act.c] = act.turn
        t *= -1;
        rolloutState.end = null
        rolloutState.prevMove = act
      }
      return rolloutState.terminalStatus()
    }
  }

  constructor(svgD3Container=undefined, ai1=undefined, ai2=undefined) {
    this.svg = svgD3Container
    this.drawBackground(board_size()[0]);
    this.ai1 = ai1;
    this.ai2 = ai2;
    this.stateHistory = []
    this.actionHistory = []
    this.reset();
    this.sideSwitched = false;
  }

  reset() {
    this.turn = 1;
    this.state = TopoGomoku.initialState
    this.stateHistory = []
    this.actionHistory = []
    this.svg.selectAll('.win').classed('win', false)
    this.prevMove = {r: -1, c: -1}
    this.drawState()
    this.gBoard.selectAll('rect').classed('playable', true)
  }

  step(move) {
    // console.log(move)
    this.prevMove = move
    this.stateHistory.push(cloneBoard(this.state.data))
    this.actionHistory.push(move)
    this.state = this.state.step(move)
    this.turn *= -1;
    // console.log(this.turn)
    d3.selectAll('.playable')
      .filter(d => d.r == move.r && d.c == move.c)
      .classed('playable', false)
    this.drawState()
  }

  validMoves() {
    return this.state.validMoves(this.turn);
  }

  static get initialState() {
    return new TopoGomoku.State(new Array(8).fill(0).map(v => new Array(8).fill(0)))
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
    let info_size = board_size*.1;
    this.info_size = info_size
    this.svg.attr('id', 'topogomoku')
    this.svg.attr('width', board_size).attr('height', board_size + info_size)
    this.svg.selectChildren().filter((d, i) => i > 0).remove()
    this.board_size = board_size
    let tile_size = board_size/8
    this.gBoard = this.svg.append('g')
    this.ingame = this.svg.append('g')
    this.svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', board_size)
      .attr('height', board_size)
      .attr('stroke', 'black')
      .attr('fill', 'none')
      .attr('stroke-width', 10)

    this.drawBackgroundInfo(board_size)

    let board = new Array(8).fill(0).map((t, i) => new Array(8).fill(0).map((c, j) => ({
      r: i,
      c: j
    })));
    this.gBoard.selectAll('g')
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
      .classed('playable', true)
      .on('click', (e, d) => {
        let t = d3.select(e.target)
        if (!t.classed('playable'))
          return;
        t.classed('playable', false)
        if (this.state.data[d.r][d.c] != 0)
          return;
        this.step(new TopoGomoku.Move(d.r, d.c, this.turn))
      })
  }

  drawState() {
    // console.log(this.prevMove)
    let tile_size = this.board_size / 8
    this.drawInfo()

    let pieces = this.state.data.map((row, i) => row.map((v, j) => ({
      r: i,
      c: j,
      v: v
    })).filter(t => t.v != 0)).reduce((acc, r) => acc.concat(r), []);
    this.ingame.selectAll('use')
      .data(pieces)
      .join('use')
      .attr('href', d => d.v == 1 ? '#x_piece' : '#o_piece')
      .attr('x', d => (d.c + 0.5) * tile_size)
      .attr('y', d => (d.r + 0.5) * tile_size)
      
    this.gBoard
      .selectAll('rect')
      .classed('previous_move', false)
      
    this.gBoard
      .selectAll('rect')
      .filter(d => d.r == this.prevMove.r && d.c == this.prevMove.c)
      .classed('previous_move', true)

    if (this.state.isDone()) {
      let wins = new Set(this.state.winTiles.map(t => t.join()))
      d3.selectAll('.board-tile')
        .classed('playable', false)
        .classed('win', d => wins.has([d.r, d.c].join()))
    }

    if (this.turn == 1 && this.ai1 && !this.state.isDone()) {
      // console.log("AI_Move A")
      setTimeout(e => {
        this.step(this.ai1.play(this.state, 1))
        // this.drawState();
      }, 100)
    }
    if (this.turn == -1 && this.ai2 && !this.state.isDone()) {
      // console.log("AI_Move B")
      setTimeout(e => {
        this.step(this.ai2.play(this.state, -1))
        // this.drawState();
      }, 100);
    }

    if (this.state.isDone() && this.callback) {
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
  }
}
