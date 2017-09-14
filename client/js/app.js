require('../css/app.css')
const configs = require('../../game-configs.json')
const control = require('./control')
const key = require('./control').keyboardCodeMapping
const debug = require('./debug')
const graphics = require('./graphics')
const global = require('./global')

const GameState = require('../../shared/models/game-state')
const BotManager = require('../../shared/models/bot-manager')

// going to be gradually replancing the old 1 with this
// intended for single player / client side for now
const gameState = new GameState()

const canvas = document.getElementById('canvas')

// const keyRegister = {}

// canvas.addEventListener('keydown', (e) => {
//   keyRegister[e.keyCode] = true
// })

// canvas.addEventListener('keyup', (e) => {
//   keyRegister[e.keyCode] = false
// })

canvas.addEventListener('keydown', control.onKeydown)

canvas.addEventListener('keyup', control.onKeyup)

class PlayerSnapshot {
  // constructor() {
  //   this.movement = null
  //   this.action = null
  // }

  setAction(action) {
    this.action = action
  }

  setMovement(movement) {
    this.movement = movement
  }
}

global.register('gameState', gameState)

const player = gameState.join()

// const bots = []
// bots.push(new BotPlayer(gameState.join()))
const numBots = 5
const botManager = new BotManager(gameState)
botManager.createBots(numBots)

// TODO: join game here or above

/*
Game Tick:
1. grab current user input for this tick and generate player snapshot from it
2. insert snapshot into Player object returned
3. process game state tick
*/
const gameTick = () => {
  setTimeout(gameTick, configs.shared.tickInterval)

  botManager.tick()

  const userInputs = control.getUserInputData()

  // TODO: action
  player.insertSnapshot(userInputs.movement, userInputs.action)
  gameState.tick()
}

// run game loop
// setInterval(gameTick, configs.shared.tickInterval)
gameTick()

graphics.renderLoop()
