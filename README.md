# AI for abstract strategy games

### What is this about?
- This is a part of the project for the course CS106 - Artificial Intelligence at University of Information Technology - VNU-HCM.
- It is a web app consisting of various games played by some AI techniques. The users may play with the others or with the AIs that can be adjusted difficulties.
- The app is available to test at [here](https://thuanvonb.github.io/BoardGames).

### Games:
- Currently, the web supports 3 games:
  - Othello
  - Ultimate Tic-tac-toe
  - TopoGomoku - a variant of the game Gomoku that is played on a flat torus.

### AI types:
- There are 2 types of AI implemented:
  - Minimax with genetic algorithm-powered evaluation function (except Ultimate tic tac toe).
  - Vanilla Monte Carlo tree search with a fixed UCT exploration constant `2.4`.