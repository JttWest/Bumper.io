/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = {
	"shared": {
		"port": 3000,
		"tickInterval": 50,
		"tickBufferSize": 5,
		"bulletSpeed": 20,
		"mapWidth": 800,
		"mapHeight": 600,
		"playerWidth": 10,
		"playerHeight": 10,
		"playerSpeed": 2
	},
	"server": {},
	"client": {
		"isDebugMode": "false",
		"playerColor": "#2274A5",
		"otherPlayersColor": "#F90C0C"
	}
};

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

__webpack_require__(2);
var configs = __webpack_require__(0);
var key = __webpack_require__(7).keyboardCodeMapping;
var GameState = __webpack_require__(8);
var debug = __webpack_require__(10);

var canvas = document.getElementById('canvas');

var keyRegister = {};

canvas.addEventListener('keydown', function (e) {
  keyRegister[e.keyCode] = true;
});

canvas.addEventListener('keyup', function (e) {
  keyRegister[e.keyCode] = false;
});

var Player = function Player(x, y) {
  _classCallCheck(this, Player);

  this.x = x;
  this.y = y;
};

var player = void 0;

var PlayerSnapshot = function () {
  function PlayerSnapshot(movement) {
    _classCallCheck(this, PlayerSnapshot);

    this.movement = movement;
  }

  _createClass(PlayerSnapshot, [{
    key: 'setFireAction',
    value: function setFireAction(shotAngle) {
      this.action = {
        actionType: 'fire',
        angle: shotAngle
      };
    }
  }]);

  return PlayerSnapshot;
}();

var syncingGameState = false; // drop all gameState packets from server when this is true
var joinedGame = false; // gameTick only runs when this is true
var currPlayerId = void 0;
var playerSnapshotQueue = [];
var initGame = true; // flag to begin render once first syncAck is received

var gameState = new GameState();

var wsHost = window.location.hostname === 'localhost' ? 'ws://localhost:' + configs.shared.port : 'ws://' + window.location.host;

var ws = new WebSocket(wsHost);

var sendSyncRequest = function sendSyncRequest() {
  syncingGameState = true;

  var syncData = {
    type: 'syncReq'
  };

  ws.send(JSON.stringify(syncData));
};

var sendJoinRequest = function sendJoinRequest() {
  var joinData = {
    type: 'joinReq',
    data: 'placeholderName'
  };

  ws.send(JSON.stringify(joinData));
};

ws.onopen = function () {
  // Web Socket is connected, send data using send()
  sendJoinRequest();
};

var processGameSnapshots = function processGameSnapshots(gameSnapshots) {
  gameSnapshots.forEach(function (playerSnapshots) {
    gameState.insertPlayerSnapshots(playerSnapshots.playerId, playerSnapshots.snapshots);

    // TODO: implement resync if deviation is too much
    // if (snapshotQueue.length > syncThreshold)
    //   requestResync
    var playerState = gameState.getPlayerState(playerSnapshots.playerId);
    // immediately process old snaphsots to ensure client game state is up to date
    if (playerState.snapshotQueue.length > configs.shared.tickBufferSize) {
      playerState.processSnapshots(playerState.snapshotQueue.splice(0, playerState.snapshotQueue.length - configs.shared.tickBufferSize));
    }
  });

  if (debug.isDebugMode) {
    var currPlayerSnapshotQueueLength = gameState.getPlayerState(currPlayerId).snapshotQueue.length;

    if (gameState.playerStates.some(function (p) {
      return p.snapshotQueue.length !== currPlayerSnapshotQueueLength;
    })) {
      console.log('Mismatch snapshot length between players in gameState');
    }

    if (gameState.playerStates.some(function (p) {
      return p.snapshotQueue.length > configs.shared.tickBufferSize;
    })) {
      console.log('Snapshots for player exceed tickBufferSize');
    }
  }
};

ws.onmessage = function (evt) {
  var payload = JSON.parse(evt.data);

  switch (payload.type) {
    case 'joinAck':
      joinedGame = true;
      currPlayerId = payload.data.playerId;

      // players in game before you joined
      payload.data.otherPlayersInGame.forEach(function (p) {
        gameState.addNewPlayer(p);
      });

      console.log('Joined game as player ' + currPlayerId);
      break;

    case 'joinNack':
      alert(payload.data /* reason for fail join*/);
      break;

    case 'playerJoin':
      // new player has joined the game
      gameState.addNewPlayer(payload.data);
      break;

    case 'syncAck':
      syncingGameState = false;

      // TODO: update this to clear gameState
      payload.data.forEach(function (playerSyncData) {
        gameState.updatePlayerPosition(playerSyncData.playerId, playerSyncData.position);
      });

      // TODO: temp fix for now
      if (initGame) {
        var currentPlayerData = gameState.getPlayerState(currPlayerId);
        player = new Player(currentPlayerData.position.x, currentPlayerData.position.y);

        // begin rendering game
        renderLoop();
        initGame = false;
      }
      break;

    case 'syncTrig':
      // TODO: implement this; still need??
      console.log('Default snapshot was used on server');
      break;

    case 'gameState':
      debug.logGameStatePacketReceiveRate(configs.shared.tickBufferSize * configs.shared.tickInterval + 50);

      // only take in game state if its not outdated
      if (!syncingGameState) processGameSnapshots(payload.data);

      break;

    default:
      console.log('Invalid message received from server: ' + payload);
  }
};

ws.onclose = function () {
  // websocket is closed.
  alert('socked connect to server closed');
};

var playerMoveTick = function playerMoveTick() {
  var movementData = { left: false, right: false, up: false, down: false };

  if (keyRegister[key.W]) {
    player.y -= configs.shared.playerSpeed;
    movementData.up = true;
  }

  if (keyRegister[key.S]) {
    player.y += configs.shared.playerSpeed;
    movementData.down = true;
  }

  if (keyRegister[key.A]) {
    player.x -= configs.shared.playerSpeed;
    movementData.left = true;
  }

  if (keyRegister[key.D]) {
    player.x += configs.shared.playerSpeed;
    movementData.right = true;
  }

  return movementData;
};

var updatePlayerState = function updatePlayerState(playerState) {
  var snapshot = playerState.snapshotQueue.shift();

  if (!snapshot) return;

  var movement = snapshot.movement;
  var speed = configs.shared.playerSpeed;

  if (movement.left) playerState.position.x -= speed;

  if (movement.right) playerState.position.x += speed;

  if (movement.up) playerState.position.y -= speed;

  if (movement.down) playerState.position.y += speed;
};

var sendPlayerState = function sendPlayerState(playerSnapshots) {
  var playerStatePayload = {
    type: 'playerState',
    data: playerSnapshots
  };

  ws.send(JSON.stringify(playerStatePayload));
};

/*
Game Tick:
1 update current player state based on game control input
2 send playerState to server when playerSnapshotQueue reach tickBufferSize
3 update the game state using data from gameState
4 TODO: confirm player position using server game state server (and apply unchecked gameStates)
5 TODO: drop until last tickBufferSize in gameState[anyPlayer].snapshotQueue if deviate too much
*/
var gameTick = function gameTick() {
  debug.logGameTickRate(configs.shared.tickInterval + 5);

  setTimeout(gameTick, configs.shared.tickInterval);

  // game doesn't start until receiving joinAck from server
  if (!joinedGame) return;

  debug.logEmptySnapshotQueueDuration(gameState.getPlayerState(currPlayerId).snapshotQueue.length);

  // lag occured -> resync client with server
  if (gameState.getPlayerState(currPlayerId).snapshotQueue.length === 0) {
    if (window.isDebugMode) console.log('Player gameSnapshotQueue empty');

    // request sync from server if haven't already
    if (!syncingGameState) sendSyncRequest();

    return;
  }

  // (1) update player state based on movement and record player tick data
  var movementData = playerMoveTick();
  var currPlayerSnapshot = new PlayerSnapshot(movementData);
  playerSnapshotQueue.push(currPlayerSnapshot);

  // (2) send playerState to server when ready
  if (playerSnapshotQueue.length === configs.shared.tickBufferSize) {
    sendPlayerState(playerSnapshotQueue);
    playerSnapshotQueue = [];
  }

  // update the game state using data from gameSnapshotQueue
  if (gameState.getPlayerState(currPlayerId).snapshotQueue.length > 0) {
    gameState.playerStates.forEach(function (playerState) {
      return updatePlayerState(playerState);
    });
  }
};

// run game loop
// setInterval(gameTick, configs.shared.tickInterval)
gameTick();

var ctx = canvas.getContext('2d');
var drawPlayer = function drawPlayer(color, x, y) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.strokeStyle = 'black';
  ctx.rect(x, y, configs.shared.playerWidth, configs.shared.playerHeight);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fill();
};

var renderLoop = function renderLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // TODO: the player class should have a render method
  gameState.playerStates.forEach(function (playerState) {
    var playerPos = playerState.position;

    drawPlayer(configs.client.otherPlayersColor, playerPos.x, playerPos.y);
  });

  drawPlayer(configs.client.playerColor, player.x, player.y);

  requestAnimationFrame(renderLoop);
};

/*
let mouseX
let mouseY

function mouseMove(e) {
  mouseX = e.offsetX
  mouseY = e.offsetY
}

function sendFireData(angle) {
  const fireBulletData = {
    type: 'fire',
    data: { angle }
  }

  ws.send(JSON.stringify(fireBulletData))
}

canvas.addEventListener('mousemove', mouseMove)
canvas.addEventListener('click', () => {
  const deltaX = mouseX - player.x
  const deltaY = mouseY - player.y
  const fireAngle = Math.atan2(deltaY, deltaX)
  sendFireData(fireAngle)
})*/

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(3);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(5)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../node_modules/css-loader/index.js!./app.css", function() {
			var newContent = require("!!../../node_modules/css-loader/index.js!./app.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(4)(undefined);
// imports


// module
exports.push([module.i, "body {\n  margin: 0;\n}\n\ncanvas {\n  border: solid 1px black;\n  position: relative;\n  background: #447604;\n}\n\n#holder {\n  display: block;\n  margin: 20px auto 0 auto;\n  width: 800px;\n  height: 600px;\n}\n", ""]);

// exports


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function (useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if (item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function (modules, mediaQuery) {
		if (typeof modules === "string") modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for (var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if (typeof id === "number") alreadyImportedModules[id] = true;
		}
		for (i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if (typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if (mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if (mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */';
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var stylesInDom = {};

var	memoize = function (fn) {
	var memo;

	return function () {
		if (typeof memo === "undefined") memo = fn.apply(this, arguments);
		return memo;
	};
};

var isOldIE = memoize(function () {
	// Test for IE <= 9 as proposed by Browserhacks
	// @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
	// Tests for existence of standard globals is to allow style-loader
	// to operate correctly into non-standard environments
	// @see https://github.com/webpack-contrib/style-loader/issues/177
	return window && document && document.all && !window.atob;
});

var getElement = (function (fn) {
	var memo = {};

	return function(selector) {
		if (typeof memo[selector] === "undefined") {
			memo[selector] = fn.call(this, selector);
		}

		return memo[selector]
	};
})(function (target) {
	return document.querySelector(target)
});

var singleton = null;
var	singletonCounter = 0;
var	stylesInsertedAtTop = [];

var	fixUrls = __webpack_require__(6);

module.exports = function(list, options) {
	if (typeof DEBUG !== "undefined" && DEBUG) {
		if (typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};

	options.attrs = typeof options.attrs === "object" ? options.attrs : {};

	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (!options.singleton) options.singleton = isOldIE();

	// By default, add <style> tags to the <head> element
	if (!options.insertInto) options.insertInto = "head";

	// By default, add <style> tags to the bottom of the target
	if (!options.insertAt) options.insertAt = "bottom";

	var styles = listToStyles(list, options);

	addStylesToDom(styles, options);

	return function update (newList) {
		var mayRemove = [];

		for (var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];

			domStyle.refs--;
			mayRemove.push(domStyle);
		}

		if(newList) {
			var newStyles = listToStyles(newList, options);
			addStylesToDom(newStyles, options);
		}

		for (var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];

			if(domStyle.refs === 0) {
				for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j]();

				delete stylesInDom[domStyle.id];
			}
		}
	};
};

function addStylesToDom (styles, options) {
	for (var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];

		if(domStyle) {
			domStyle.refs++;

			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}

			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];

			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}

			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles (list, options) {
	var styles = [];
	var newStyles = {};

	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = options.base ? item[0] + options.base : item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};

		if(!newStyles[id]) styles.push(newStyles[id] = {id: id, parts: [part]});
		else newStyles[id].parts.push(part);
	}

	return styles;
}

function insertStyleElement (options, style) {
	var target = getElement(options.insertInto)

	if (!target) {
		throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
	}

	var lastStyleElementInsertedAtTop = stylesInsertedAtTop[stylesInsertedAtTop.length - 1];

	if (options.insertAt === "top") {
		if (!lastStyleElementInsertedAtTop) {
			target.insertBefore(style, target.firstChild);
		} else if (lastStyleElementInsertedAtTop.nextSibling) {
			target.insertBefore(style, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			target.appendChild(style);
		}
		stylesInsertedAtTop.push(style);
	} else if (options.insertAt === "bottom") {
		target.appendChild(style);
	} else {
		throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
	}
}

function removeStyleElement (style) {
	if (style.parentNode === null) return false;
	style.parentNode.removeChild(style);

	var idx = stylesInsertedAtTop.indexOf(style);
	if(idx >= 0) {
		stylesInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement (options) {
	var style = document.createElement("style");

	options.attrs.type = "text/css";

	addAttrs(style, options.attrs);
	insertStyleElement(options, style);

	return style;
}

function createLinkElement (options) {
	var link = document.createElement("link");

	options.attrs.type = "text/css";
	options.attrs.rel = "stylesheet";

	addAttrs(link, options.attrs);
	insertStyleElement(options, link);

	return link;
}

function addAttrs (el, attrs) {
	Object.keys(attrs).forEach(function (key) {
		el.setAttribute(key, attrs[key]);
	});
}

function addStyle (obj, options) {
	var style, update, remove, result;

	// If a transform function was defined, run it on the css
	if (options.transform && obj.css) {
	    result = options.transform(obj.css);

	    if (result) {
	    	// If transform returns a value, use that instead of the original css.
	    	// This allows running runtime transformations on the css.
	    	obj.css = result;
	    } else {
	    	// If the transform function returns a falsy value, don't add this css.
	    	// This allows conditional loading of css
	    	return function() {
	    		// noop
	    	};
	    }
	}

	if (options.singleton) {
		var styleIndex = singletonCounter++;

		style = singleton || (singleton = createStyleElement(options));

		update = applyToSingletonTag.bind(null, style, styleIndex, false);
		remove = applyToSingletonTag.bind(null, style, styleIndex, true);

	} else if (
		obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function"
	) {
		style = createLinkElement(options);
		update = updateLink.bind(null, style, options);
		remove = function () {
			removeStyleElement(style);

			if(style.href) URL.revokeObjectURL(style.href);
		};
	} else {
		style = createStyleElement(options);
		update = applyToTag.bind(null, style);
		remove = function () {
			removeStyleElement(style);
		};
	}

	update(obj);

	return function updateStyle (newObj) {
		if (newObj) {
			if (
				newObj.css === obj.css &&
				newObj.media === obj.media &&
				newObj.sourceMap === obj.sourceMap
			) {
				return;
			}

			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;

		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag (style, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (style.styleSheet) {
		style.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = style.childNodes;

		if (childNodes[index]) style.removeChild(childNodes[index]);

		if (childNodes.length) {
			style.insertBefore(cssNode, childNodes[index]);
		} else {
			style.appendChild(cssNode);
		}
	}
}

function applyToTag (style, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		style.setAttribute("media", media)
	}

	if(style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		while(style.firstChild) {
			style.removeChild(style.firstChild);
		}

		style.appendChild(document.createTextNode(css));
	}
}

function updateLink (link, options, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	/*
		If convertToAbsoluteUrls isn't defined, but sourcemaps are enabled
		and there is no publicPath defined then lets turn convertToAbsoluteUrls
		on by default.  Otherwise default to the convertToAbsoluteUrls option
		directly
	*/
	var autoFixUrls = options.convertToAbsoluteUrls === undefined && sourceMap;

	if (options.convertToAbsoluteUrls || autoFixUrls) {
		css = fixUrls(css);
	}

	if (sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = link.href;

	link.href = URL.createObjectURL(blob);

	if(oldSrc) URL.revokeObjectURL(oldSrc);
}


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * When source maps are enabled, `style-loader` uses a link element with a data-uri to
 * embed the css on the page. This breaks all relative urls because now they are relative to a
 * bundle instead of the current page.
 *
 * One solution is to only use full urls, but that may be impossible.
 *
 * Instead, this function "fixes" the relative urls to be absolute according to the current page location.
 *
 * A rudimentary test suite is located at `test/fixUrls.js` and can be run via the `npm test` command.
 *
 */

module.exports = function (css) {
	// get current location
	var location = typeof window !== "undefined" && window.location;

	if (!location) {
		throw new Error("fixUrls requires window.location");
	}

	// blank or null?
	if (!css || typeof css !== "string") {
		return css;
	}

	var baseUrl = location.protocol + "//" + location.host;
	var currentDir = baseUrl + location.pathname.replace(/\/[^\/]*$/, "/");

	// convert each url(...)
	/*
 This regular expression is just a way to recursively match brackets within
 a string.
 	 /url\s*\(  = Match on the word "url" with any whitespace after it and then a parens
    (  = Start a capturing group
      (?:  = Start a non-capturing group
          [^)(]  = Match anything that isn't a parentheses
          |  = OR
          \(  = Match a start parentheses
              (?:  = Start another non-capturing groups
                  [^)(]+  = Match anything that isn't a parentheses
                  |  = OR
                  \(  = Match a start parentheses
                      [^)(]*  = Match anything that isn't a parentheses
                  \)  = Match a end parentheses
              )  = End Group
              *\) = Match anything and then a close parens
          )  = Close non-capturing group
          *  = Match anything
       )  = Close capturing group
  \)  = Match a close parens
 	 /gi  = Get all matches, not the first.  Be case insensitive.
  */
	var fixedCss = css.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function (fullMatch, origUrl) {
		// strip quotes (if they exist)
		var unquotedOrigUrl = origUrl.trim().replace(/^"(.*)"$/, function (o, $1) {
			return $1;
		}).replace(/^'(.*)'$/, function (o, $1) {
			return $1;
		});

		// already a full url? no change
		if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(unquotedOrigUrl)) {
			return fullMatch;
		}

		// convert the url to a full url
		var newUrl;

		if (unquotedOrigUrl.indexOf("//") === 0) {
			//TODO: should we add protocol?
			newUrl = unquotedOrigUrl;
		} else if (unquotedOrigUrl.indexOf("/") === 0) {
			// path should be relative to the base url
			newUrl = baseUrl + unquotedOrigUrl; // already starts with '/'
		} else {
			// path should be relative to current directory
			newUrl = currentDir + unquotedOrigUrl.replace(/^\.\//, ""); // Strip leading './'
		}

		// send back the fixed url(...)
		return "url(" + JSON.stringify(newUrl) + ")";
	});

	// send back the fixed css
	return fixedCss;
};

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = {
  keyboardCodeMapping: {
    W: 87,
    A: 65,
    S: 83,
    D: 68
  }
};

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PlayerState = __webpack_require__(9);

module.exports = function () {
  function GameState() {
    _classCallCheck(this, GameState);

    this.players = {};
  }

  /* GameState Entry model
   id: {
    name: string,
    position: {x: number, y: number},
    snapshotQueue: [playerSnapshot]
  }
  */

  _createClass(GameState, [{
    key: 'addNewPlayer',
    value: function addNewPlayer(joinData) {
      // TODO: maybe throw error if player already exists
      var playerId = joinData.playerId;
      var name = joinData.name;
      var position = joinData.position;

      this.players[playerId] = new PlayerState(name);

      // happens when new player joins game you are already in
      if (position) this.players[playerId].position = position;
    }
  }, {
    key: 'updatePlayerPosition',
    value: function updatePlayerPosition(playerId, position) {
      this.players[playerId].position = position;
    }
  }, {
    key: 'insertPlayerSnapshots',
    value: function insertPlayerSnapshots(playerId, snapshots) {
      var _players$playerId$sna;

      (_players$playerId$sna = this.players[playerId].snapshotQueue).push.apply(_players$playerId$sna, _toConsumableArray(snapshots));
    }

    /**
     * Returns an array of PlayerState
     */

  }, {
    key: 'getPlayerState',
    value: function getPlayerState(playerId) {
      if (!this.players[playerId]) throw new Error('Player with id ' + playerId + ' doesn\'t exist in game state');

      return this.players[playerId];
    }
  }, {
    key: 'playerStates',
    get: function get() {
      return Object.values(this.players);
    }
  }]);

  return GameState;
}();

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var configs = __webpack_require__(0);

module.exports = function () {
  function PlayerState(name) {
    _classCallCheck(this, PlayerState);

    this.name = name;
    this.position = null;
    this.snapshotQueue = [];
  }

  _createClass(PlayerState, [{
    key: 'processSnapshots',
    value: function processSnapshots(snapshots) {
      var _this = this;

      snapshots.forEach(function (snapshot) {
        _this.processPlayerMove(snapshot.movement);
      });
    }
  }, {
    key: 'processPlayerMove',
    value: function processPlayerMove(movement) {
      if (movement.left) this.position.x -= configs.shared.playerSpeed;

      if (movement.right) this.position.x += configs.shared.playerSpeed;

      if (movement.up) this.position.y -= configs.shared.playerSpeed;

      if (movement.down) this.position.y += configs.shared.playerSpeed;
    }
  }]);

  return PlayerState;
}();

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var configs = __webpack_require__(0);

var isDebugMode = function isDebugMode() {
  return window.isDebugMode || configs.client.isDebugMode;
};

var lastTimeTracker = {
  playerPacketSend: null,
  gameStatePacketReceive: null,
  gameTick: null
};

var logTargetRate = function logTargetRate(target) {
  var threshold = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

  if (!isDebugMode) return;

  if (!lastTimeTracker[target]) {
    lastTimeTracker[target] = performance.now();
  } else {
    var elapseTime = performance.now() - lastTimeTracker[target];
    if (threshold && elapseTime > threshold) console.log(target + ' took ' + Math.round(elapseTime) + 'ms. Exceeded threshold of ' + threshold);else if (!threshold) console.log(target + ' took ' + Math.round(elapseTime) + 'ms');

    lastTimeTracker[target] = performance.now();
  }
};

var emptySnapshotQueueStartTime = void 0;

module.exports = {
  isDebugMode: isDebugMode,

  logPlayerPacketSendRate: function logPlayerPacketSendRate(threshold) {
    logTargetRate('playerPacketSend', threshold);
  },

  logGameStatePacketReceiveRate: function logGameStatePacketReceiveRate(threshold) {
    logTargetRate('gameStatePacketReceive', threshold);
  },

  logGameTickRate: function logGameTickRate(threshold) {
    logTargetRate('gameTick', threshold);
  },

  logEmptySnapshotQueueDuration: function logEmptySnapshotQueueDuration(length) {
    if (!isDebugMode) return;

    if (length === 0 && !emptySnapshotQueueStartTime) {
      // start timer
      emptySnapshotQueueStartTime = performance.now();
    } else if (length !== 0 && emptySnapshotQueueStartTime) {
      // there was timer in process
      console.log('GameState snapshot queue was empty for ' + Math.round(performance.now() - emptySnapshotQueueStartTime) + 'ms');
      emptySnapshotQueueStartTime = null; // reset timer
    }
  }
};

/***/ })
/******/ ]);