class AbstractGame {
  static Move = class {
    // for: expressing the move and the player making it

    // standard move prototype
    static standardMoves(){}
    // special move prototype (if any)
    static specialMoves(){}
  }

  static State = class {
    // for: storing the state, calculate the valid moves (actions) and determine if the state is terminated or not.

    // check if this state is equivalent to the other state
    isSameAs(otherState){}

    // export the board to the jsonifiable string
    static export(board){}
    // read the string created by the export function to form a the state
    static import(data){}

    // list of valid moves depended on turn
    validMoves(turn){}
    // the utility value of the state
    terminalStatus(){}
    // check if the state is terminal
    isDone(){}
    // make the move
    step(move){}

    // other info of the state
    // info(){}

    // facilitate mcts rollout
    randomPlayout(startTurn){}
  }

  // for: tracking the game: the current state, current turn; the game history of states and actions; render the game onto the screen.

  // reset the game to the initial state
  reset(){}
  // make the move
  step(move){}

  // list of valid moves corresponding to the current turn
  validMoves(){}

  // get the initial state
  get initialState(){};

  // set up a callback to call when the game is ended
  onTerminated(callback){};

  // swap side of AIs
  switchSide(){};

  // and other methods to render the game
}