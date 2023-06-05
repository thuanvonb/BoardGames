const argmax = arr => arr.indexOf(arr.reduce((a, b) => Math.max(a, b), Math.max()))
const gumbal_softmax = (arr, temperature) => {
  arr = arr.map(v => v/temperature)
  let mx = arr[argmax(arr)]
  arr = arr.map(v => Math.exp(v - mx))
  let s = arr.reduce((a, b) => a + b, 0);
  return arr.map(v => v / s);
}

class MCTS {
  constructor(state, rootTurn, turn=1, act=undefined) {
    this.state = state
    this.turn = turn
    this.rootTurn = rootTurn;
    this.successors = []
    this.validMoves = this.state.isDone() ? [] : Array.from(this.state.validMoves(turn*rootTurn))
    this.wins = 0
    this.visits = 0
    this.act = act;
  }

  rollout() {
    if (this.state.randomPlayout) {
      let r = this.state.randomPlayout(this.turn * this.rootTurn) * this.rootTurn
      if (r != 0)
        r = r > 0 ? 1 : 0;
      else
        r = 0.5
      this.wins += r;
      this.visits += 1;
      return r;
    }
    let state = this.state;
    let turn = this.rootTurn * this.turn;
    let t = 0;
    while (true) {
      let valids = state.validMoves(turn)
      if (state.isDone() || t > 400) {
        let r = state.terminalStatus()*this.rootTurn;
        if (r != 0)
          r = r > 0 ? 1 : 0;
        else
          r = 0.5
        this.wins += r;
        this.visits += 1;
        return r;
      }
      let mv = valids[Math.floor(Math.random() * valids.length)]
      state = state.step(mv);
      turn *= -1;
      t += 1;
    }
  }

  select(c, expandThreshold=1) {
    if (this.act != undefined && this.visits < expandThreshold)
      return this.rollout()

    if (this.validMoves.length > 0) {
      let r = this.expand();
      this.visits += 1;
      this.wins += r;
      return r;
    }
    if (this.state.isDone()) {
      let r = this.wins / this.visits;
      this.wins += r;
      this.visits += 1;
      return r;
    }
    let fx = x => x;
    if (this.turn == -1)
      fx = x => 1-x;
    let qs = this.successors.map(s => fx(s.wins/s.visits) + c * Math.log(this.visits)/(1e-9+s.visits))
    let act = argmax(qs);
    let r = this.successors[act].select(c, expandThreshold);
    this.wins += r
    this.visits += 1;
    return r;
  }

  expand() {
    let mv = this.validMoves.pop();
    let nextState = this.state.step(mv)
    let newNode = new MCTS(nextState, this.rootTurn, -this.turn, mv);
    this.successors.push(newNode);
    return newNode.rollout();
  }
}

class MctsAI {
  constructor(c=2, numSim=5000) {
    this.name = 'MCTS'
    this.numSim = numSim
    this.c = c;
    this.root = undefined
    this.expandThreshold = 1
    this.prevVal = undefined;
    this.rageMode = false;
  }

  search(state, turn) {
    let start = new MCTS(state, turn);
    if (this.root == undefined)
      this.root = start
    else {
      let next = undefined;
      this.root.successors.forEach(node => {
        if (node.state.isSameAs(state))
          next = node;
      })
      this.root = next;
      if (next == undefined)
        this.root = start
    }

    for (let i = 0; i < this.numSim; ++i)
      this.root.select(this.c, this.expandThreshold);

    return this.root.successors.map(t => [t.visits, t.act, t.wins/t.visits])
  }

  play(state, turn, temperature=0, debug=false) {
    let act_visits = this.search(state, turn);
    let visits = act_visits.map(t => t[0])
    let actions = act_visits.map(t => t[1])
    let act = undefined;
    if (temperature == 0) {
      let mx = Math.max(...visits)
      let id = visits.map((v, i) => v == mx ? i : -1).filter(x => x != -1)
      act = id[Math.floor(Math.random() * id.length)]
      this.root = this.root.successors[act]
      // return actions[act]//{act: actions[act], val: act_visits[act][2]};
    } else {
      let p = gumbal_softmax(visits, temperature)
      let acc_p = [p[0]]
      for (let i = 1; i < p.length; ++i)
        acc_p.push(acc_p[i-1] + p[i]);
      let r = Math.random();
      act = p.length-1;
      for (; act > 0; --act) {
        if (r >= acc_p[act-1])
          break;
      }
      // console.log(this.root)
      this.root = this.root.successors[act]
    }
    // console.log(act_visits[act][2])
    // if (this.rageMode && act_visits[act][2] > 1.2*this.prevVal)
    //   this.rageModeDeactivate()

    // if (this.rageMode || (this.prevVal != undefined && act_visits[act][2]/this.prevVal <= 0.8))
    //   this.rageModeActivate()
    // else
    //   this.prevVal = act_visits[act][2]
    if (debug)
      console.log(act_visits[act][2])
    return actions[act]//{act: actions[act], val: act_visits[act][2]};
  }
}