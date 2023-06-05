let game = new Othello(d3.select("svg[name='svg-game']"))
game.onTerminated((...params) => onTerminated(...params))

const pv = positionalValue(4)(2)(1)
const moveOrdering = (m1, m2) => pv(m2.r, m2.c) - pv(m1.r, m1.c)
let err = false

let mcts_default = v => d3.selectAll("input[name='mcts_sim']").property('value', v)

function onTerminated(r, info, stateHistory) {
  if (r > 0)
    alert('First player wins')
  if (r < 0)
    alert('Second player wins')
  if (r == 0)
    alert('Draw')
}

const createAgent = name => {
  let player = $("#" + name + " select[name='agent']").val()
  let mctsConf = +$("#" + name + " input[name='mcts_sim']").val()
  let minimaxConf = +$("#" + name + " input[name='minimax_depth']").val()
  if (player != 'minimax' && player != 'mcts')
    return null

  let ai = undefined;

  if (player == 'mcts')
    return new MctsAI(2.4, mctsConf)
  else {
    ai = new MinimaxAI(minimaxConf)
    ai.moveOrdering = moveOrdering
  }
  if (game instanceof Othello) {
    ai.heuristicVal = othello_heuristicEvaluate({
      corner: 0.68,
      edge: 0.264,
      center: 0.026,
      moves: 0.4955,
      imposter: 0.818
    })
  } else {
    ai = undefined;
    if (!err)
      alert("Minimax AI is currently not supported for this game")
    err = true
    $("#" + name + " .minimax_conf").addClass('hide')
    $("#" + name + " select[name='agent']").val('human')
  }
  return ai
}

let log = []

const analyzeFunc = othello_heuristicEvaluate({
  corner: 0.68,
  edge: 0.264,
  center: 0.026,
  moves: 0.4955,
  imposter: 0.818
})

$("button[name='btn_reset']").click(e => {
  $("button[name='btn_new_game']").get()[0].disabled = false

  let playerA = createAgent('first-player')
  let playerB = createAgent('second-player')
  err = false;

  game.ai1 = playerA
  game.ai2 = playerB

  let n = +$("input[name='games']").val()
  let nSwitch = +$("input[name='switchside']").val()
  // let auto = $("input[name='autostart']").get()[0].checked

  log = new Array(n).fill(0).map((v, i) => ({
    result: undefined,
    switched: (nSwitch == 0 ? false : (Math.floor(i / nSwitch) % 2 == 1))
  }))

  renderMatchHistory()

  onTerminated = (r, info, stateHistory) => {
    // console.log(stateHistory.map(d => analyzeFunc(new Othello.State(d))))
    let remain = log.filter(v => v.result == undefined)
    if (remain.length == 0)
      return;

    remain[0].result = r
    renderMatchHistory()

    if (remain.length <= 1) {
      $("button[name='btn_new_game']").get()[0].disabled = true
      return;
    }

    if (remain[1].switched != remain[0].switched)
      game.switchSide();

    if ($("input[name='autostart']").get()[0].checked)
      game.reset();
  }

  game.sideSwitched = false;
  game.reset();
})

function renderMatchHistory() {
  let data = []
  let c = -3
  let totalA = 0;
  let totalB = 0;
  log.forEach((d, i) => {
    if (i % 15 == 0) {
      data = data.concat([['Player'], ['A'], ['B']])
      c += 3;
    }
    data[c].push(i+1)
    if (d.result == undefined) {
      data[c+1].push("")
      data[c+2].push("")
    } else {
      let resA = d.result == 0 ? 0.5 : (d.result == 1 ^ d.switched)
      data[c+1].push(resA)
      data[c+2].push(1-resA)
      totalA += resA;
      totalB += 1-resA;
    }
  })

  if (log.every(p => p.result != undefined)) {
    data[c].push('R')
    data[c+1].push(totalA)
    data[c+2].push(totalB)
  }

  d3.select('#matches-result')
    .select('tbody')
    .selectAll('tr')
    .data(data)
    .join('tr')
    .classed('title', (d, i) => i % 3 == 0)
    .selectAll('td')
    .data((d, i) => d.map(data => ({row: i, data})))
    .join('td')
    .html(d => d.data)
    .filter(d => d.row % 3 == 0)
    .classed('switched', d => log[d.data-1] ? log[d.data-1].switched : false)
}

$("select[name='agent']").on('change', e => {
  let v = e.target.value;
  let minimax_conf = $(e.target.parentNode.parentNode.children[2])
  let mcts_conf = $(e.target.parentNode.parentNode.children[3])

  minimax_conf.addClass('hide')
  mcts_conf.addClass('hide')

  if (v == 'minimax')
    minimax_conf.removeClass('hide')
  if (v == 'mcts')
    mcts_conf.removeClass('hide')
})

$("select[name='game']").on('change', e => {
  if (e.target.value == 'othello') {
    game = new Othello(d3.select("svg[name='svg-game']"))
    mcts_default(10000)
  }
  if (e.target.value == 'topogomoku') {
    game = new TopoGomoku(d3.select("svg[name='svg-game']"))
    mcts_default(25000)
  }
  if (e.target.value == 'ultimatettt') {
    game = new UltimateTicTacToe(d3.select("svg[name='svg-game']"))
    mcts_default(20000)
  }
  game.onTerminated((...params) => onTerminated(...params))
})

$("button[name='btn_reset']").click()
$("button[name='btn_new_game']").click(e => {
  game.reset()
})

$("button[name='btn_switch_side']").click(e => {
  let remain = log.filter(v => v.result == undefined)
  if (remain.length == 0)
    return;
  remain[0].switched = !remain[0].switched
  renderMatchHistory();
  game.switchSide()
})