class MinimaxAI {
  constructor(maxDepth, heuristicVal=undefined, moveOrdering=undefined) {
    this.name = 'Minimax'
    this.maxDepth = maxDepth;
    this.heuristicVal = heuristicVal ?? (state => 0);
    this.moveOrdering = moveOrdering ?? ((a, b) => 1);
    this.debug = false
  }

  minimax(state, turn, depth=this.maxDepth, alpha=-Infinity, beta=Infinity) {
    if (state.isDone())
      return [state.terminalStatus()*999, undefined];
    if (depth == 0)
      return [this.heuristicVal(state), undefined]
    let returnV = -999999*turn;
    let moves = state.validMoves(turn)
    moves.sort(x => Math.random() - 0.5)
    moves.sort(this.moveOrdering)
    let act = undefined
    moves.forEach(m => {
      let [val, action] = this.minimax(state.step(m), -turn, depth-1, alpha, beta);
      if (depth == this.maxDepth && this.debug)
        console.log(val, m)
      if (turn == 1)
        alpha = Math.max(alpha, val);
      else
        beta = Math.min(beta, val);
      if (returnV*turn < val*turn) {
        returnV = val;
        act = m;
      }
      if (beta <= alpha)
        return;
    })
    return [returnV, act]
  }

  play(state, turn) {
    return this.minimax(state, turn)[1];
  }
}