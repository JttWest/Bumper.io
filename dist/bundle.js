!function(e){function t(r){if(n[r])return n[r].exports;var o=n[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,t),o.l=!0,o.exports}var n={};t.m=e,t.c=n,t.d=function(e,n,r){t.o(e,n)||Object.defineProperty(e,n,{configurable:!1,enumerable:!0,get:r})},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},t.p="",t(t.s=1)}([function(e,t){e.exports={shared:{port:3e3,tickInterval:50,tickBufferSize:5,bulletSpeed:20,mapWidth:800,mapHeight:600,playerWidth:10,playerHeight:10,playerSpeed:2},server:{},client:{isDebugMode:"true",playerColor:"#2274A5",otherPlayersColor:"#F90C0C"}}},function(e,t,n){"use strict";function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var o=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}();n(2);var a=n(0),i=n(7).keyboardCodeMapping,s=n(8),u=n(10),c=document.getElementById("canvas"),l={};c.addEventListener("keydown",function(e){l[e.keyCode]=!0}),c.addEventListener("keyup",function(e){l[e.keyCode]=!1});var f=function e(t,n){r(this,e),this.x=t,this.y=n},p=void 0,d=function(){function e(t){r(this,e),this.movement=t}return o(e,[{key:"setFireAction",value:function(e){this.action={actionType:"fire",angle:e}}}]),e}(),h=!1,y=!1,v=void 0,g=[],m=!0,b=new s,w="localhost"===window.location.hostname?"ws://localhost:"+a.shared.port:"ws://"+window.location.host,S=new WebSocket(w),k=function(){h=!0;var e={type:"syncReq"};S.send(JSON.stringify(e))},x=function(){var e={type:"joinReq",data:"placeholderName"};S.send(JSON.stringify(e))};S.onopen=function(){x()};var P=function(e){if(e.forEach(function(e){b.insertPlayerSnapshots(e.playerId,e.snapshots);var t=b.getPlayerState(e.playerId);t.snapshotQueue.length>a.shared.tickBufferSize&&t.processSnapshots(t.snapshotQueue.splice(0,t.snapshotQueue.length-a.shared.tickBufferSize))}),u.isDebugMode){var t=b.getPlayerState(v).snapshotQueue.length;b.playerStates.some(function(e){return e.snapshotQueue.length!==t})&&console.log("Mismatch snapshot length between players in gameState"),b.playerStates.some(function(e){return e.snapshotQueue.length>a.shared.tickBufferSize})&&console.log("Snapshots for player exceed tickBufferSize")}};S.onmessage=function(e){var t=JSON.parse(e.data);switch(t.type){case"joinAck":y=!0,v=t.data.playerId,t.data.otherPlayersInGame.forEach(function(e){b.addNewPlayer(e)}),console.log("Joined game as player "+v);break;case"joinNack":alert(t.data);break;case"playerJoin":b.addNewPlayer(t.data);break;case"syncAck":if(h=!1,t.data.forEach(function(e){b.updatePlayerPosition(e.playerId,e.position)}),m){var n=b.getPlayerState(v);p=new f(n.position.x,n.position.y),M(),m=!1}break;case"syncTrig":console.log("Default snapshot was used on server");break;case"gameState":h||P(t.data);break;default:console.log("Invalid message received from server: "+t)}},S.onclose=function(){alert("socked connect to server closed")};var C=function(){var e={left:!1,right:!1,up:!1,down:!1};return l[i.W]&&(p.y-=a.shared.playerSpeed,e.up=!0),l[i.S]&&(p.y+=a.shared.playerSpeed,e.down=!0),l[i.A]&&(p.x-=a.shared.playerSpeed,e.left=!0),l[i.D]&&(p.x+=a.shared.playerSpeed,e.right=!0),e},R=function(e){var t=e.snapshotQueue.shift();if(t){var n=t.movement,r=a.shared.playerSpeed;n.left&&(e.position.x-=r),n.right&&(e.position.x+=r),n.up&&(e.position.y-=r),n.down&&(e.position.y+=r)}},j=function(e){var t={type:"playerState",data:e};S.send(JSON.stringify(t))};!function e(){if(setTimeout(e,a.shared.tickInterval),y){if(0===b.getPlayerState(v).snapshotQueue.length)return void(h||k());var t=C(),n=new d(t);g.push(n),g.length===a.shared.tickBufferSize&&(j(g),g=[]),b.getPlayerState(v).snapshotQueue.length>0&&b.playerStates.forEach(function(e){return R(e)}),u.logGameTickRate(a.shared.tickInterval+5)}}();var E=c.getContext("2d"),O=function(e,t,n){E.beginPath(),E.fillStyle=e,E.strokeStyle="black",E.rect(t,n,a.shared.playerWidth,a.shared.playerHeight),E.lineWidth=1,E.stroke(),E.fill()},M=function e(){E.clearRect(0,0,c.width,c.height),b.playerStates.forEach(function(e){var t=e.position;O(a.client.otherPlayersColor,t.x,t.y)}),O(a.client.playerColor,p.x,p.y),requestAnimationFrame(e)}},function(e,t,n){var r=n(3);"string"==typeof r&&(r=[[e.i,r,""]]);var o={};o.transform=void 0;n(5)(r,o);r.locals&&(e.exports=r.locals)},function(e,t,n){t=e.exports=n(4)(void 0),t.push([e.i,"body{margin:0}canvas{border:1px solid #000;position:relative;background:#447604}#holder{display:block;margin:20px auto 0;width:800px;height:600px}",""])},function(e,t,n){"use strict";function r(e,t){var n=e[1]||"",r=e[3];if(!r)return n;if(t&&"function"==typeof btoa){var a=o(r);return[n].concat(r.sources.map(function(e){return"/*# sourceURL="+r.sourceRoot+e+" */"})).concat([a]).join("\n")}return[n].join("\n")}function o(e){return"/*# sourceMappingURL=data:application/json;charset=utf-8;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(e))))+" */"}e.exports=function(e){var t=[];return t.toString=function(){return this.map(function(t){var n=r(t,e);return t[2]?"@media "+t[2]+"{"+n+"}":n}).join("")},t.i=function(e,n){"string"==typeof e&&(e=[[null,e,""]]);for(var r={},o=0;o<this.length;o++){var a=this[o][0];"number"==typeof a&&(r[a]=!0)}for(o=0;o<e.length;o++){var i=e[o];"number"==typeof i[0]&&r[i[0]]||(n&&!i[2]?i[2]=n:n&&(i[2]="("+i[2]+") and ("+n+")"),t.push(i))}},t}},function(e,t,n){function r(e,t){for(var n=0;n<e.length;n++){var r=e[n],o=h[r.id];if(o){o.refs++;for(var a=0;a<o.parts.length;a++)o.parts[a](r.parts[a]);for(;a<r.parts.length;a++)o.parts.push(l(r.parts[a],t))}else{for(var i=[],a=0;a<r.parts.length;a++)i.push(l(r.parts[a],t));h[r.id]={id:r.id,refs:1,parts:i}}}}function o(e,t){for(var n=[],r={},o=0;o<e.length;o++){var a=e[o],i=t.base?a[0]+t.base:a[0],s=a[1],u=a[2],c=a[3],l={css:s,media:u,sourceMap:c};r[i]?r[i].parts.push(l):n.push(r[i]={id:i,parts:[l]})}return n}function a(e,t){var n=v(e.insertInto);if(!n)throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");var r=b[b.length-1];if("top"===e.insertAt)r?r.nextSibling?n.insertBefore(t,r.nextSibling):n.appendChild(t):n.insertBefore(t,n.firstChild),b.push(t);else{if("bottom"!==e.insertAt)throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");n.appendChild(t)}}function i(e){if(null===e.parentNode)return!1;e.parentNode.removeChild(e);var t=b.indexOf(e);t>=0&&b.splice(t,1)}function s(e){var t=document.createElement("style");return e.attrs.type="text/css",c(t,e.attrs),a(e,t),t}function u(e){var t=document.createElement("link");return e.attrs.type="text/css",e.attrs.rel="stylesheet",c(t,e.attrs),a(e,t),t}function c(e,t){Object.keys(t).forEach(function(n){e.setAttribute(n,t[n])})}function l(e,t){var n,r,o,a;if(t.transform&&e.css){if(!(a=t.transform(e.css)))return function(){};e.css=a}if(t.singleton){var c=m++;n=g||(g=s(t)),r=f.bind(null,n,c,!1),o=f.bind(null,n,c,!0)}else e.sourceMap&&"function"==typeof URL&&"function"==typeof URL.createObjectURL&&"function"==typeof URL.revokeObjectURL&&"function"==typeof Blob&&"function"==typeof btoa?(n=u(t),r=d.bind(null,n,t),o=function(){i(n),n.href&&URL.revokeObjectURL(n.href)}):(n=s(t),r=p.bind(null,n),o=function(){i(n)});return r(e),function(t){if(t){if(t.css===e.css&&t.media===e.media&&t.sourceMap===e.sourceMap)return;r(e=t)}else o()}}function f(e,t,n,r){var o=n?"":r.css;if(e.styleSheet)e.styleSheet.cssText=S(t,o);else{var a=document.createTextNode(o),i=e.childNodes;i[t]&&e.removeChild(i[t]),i.length?e.insertBefore(a,i[t]):e.appendChild(a)}}function p(e,t){var n=t.css,r=t.media;if(r&&e.setAttribute("media",r),e.styleSheet)e.styleSheet.cssText=n;else{for(;e.firstChild;)e.removeChild(e.firstChild);e.appendChild(document.createTextNode(n))}}function d(e,t,n){var r=n.css,o=n.sourceMap,a=void 0===t.convertToAbsoluteUrls&&o;(t.convertToAbsoluteUrls||a)&&(r=w(r)),o&&(r+="\n/*# sourceMappingURL=data:application/json;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(o))))+" */");var i=new Blob([r],{type:"text/css"}),s=e.href;e.href=URL.createObjectURL(i),s&&URL.revokeObjectURL(s)}var h={},y=function(e){var t;return function(){return void 0===t&&(t=e.apply(this,arguments)),t}}(function(){return window&&document&&document.all&&!window.atob}),v=function(e){var t={};return function(n){return void 0===t[n]&&(t[n]=e.call(this,n)),t[n]}}(function(e){return document.querySelector(e)}),g=null,m=0,b=[],w=n(6);e.exports=function(e,t){if("undefined"!=typeof DEBUG&&DEBUG&&"object"!=typeof document)throw new Error("The style-loader cannot be used in a non-browser environment");t=t||{},t.attrs="object"==typeof t.attrs?t.attrs:{},t.singleton||(t.singleton=y()),t.insertInto||(t.insertInto="head"),t.insertAt||(t.insertAt="bottom");var n=o(e,t);return r(n,t),function(e){for(var a=[],i=0;i<n.length;i++){var s=n[i],u=h[s.id];u.refs--,a.push(u)}if(e){r(o(e,t),t)}for(var i=0;i<a.length;i++){var u=a[i];if(0===u.refs){for(var c=0;c<u.parts.length;c++)u.parts[c]();delete h[u.id]}}}};var S=function(){var e=[];return function(t,n){return e[t]=n,e.filter(Boolean).join("\n")}}()},function(e,t,n){"use strict";e.exports=function(e){var t="undefined"!=typeof window&&window.location;if(!t)throw new Error("fixUrls requires window.location");if(!e||"string"!=typeof e)return e;var n=t.protocol+"//"+t.host,r=n+t.pathname.replace(/\/[^\/]*$/,"/");return e.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi,function(e,t){var o=t.trim().replace(/^"(.*)"$/,function(e,t){return t}).replace(/^'(.*)'$/,function(e,t){return t});if(/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(o))return e;var a;return a=0===o.indexOf("//")?o:0===o.indexOf("/")?n+o:r+o.replace(/^\.\//,""),"url("+JSON.stringify(a)+")"})}},function(e,t,n){"use strict";e.exports={keyboardCodeMapping:{W:87,A:65,S:83,D:68}}},function(e,t,n){"use strict";function r(e){if(Array.isArray(e)){for(var t=0,n=Array(e.length);t<e.length;t++)n[t]=e[t];return n}return Array.from(e)}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var a=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),i=n(9);e.exports=function(){function e(){o(this,e),this.players={}}return a(e,[{key:"addNewPlayer",value:function(e){var t=e.playerId,n=e.name,r=e.position;this.players[t]=new i(n),r&&(this.players[t].position=r)}},{key:"updatePlayerPosition",value:function(e,t){this.players[e].position=t}},{key:"insertPlayerSnapshots",value:function(e,t){var n;(n=this.players[e].snapshotQueue).push.apply(n,r(t))}},{key:"getPlayerState",value:function(e){if(!this.players[e])throw new Error("Player with id "+e+" doesn't exist in game state");return this.players[e]}},{key:"playerStates",get:function(){return Object.values(this.players)}}]),e}()},function(e,t,n){"use strict";function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var o=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),a=n(0);e.exports=function(){function e(t){r(this,e),this.name=t,this.position=null,this.snapshotQueue=[]}return o(e,[{key:"processSnapshots",value:function(e){var t=this;e.forEach(function(e){t.processPlayerMove(e.movement)})}},{key:"processPlayerMove",value:function(e){e.left&&(this.position.x-=a.shared.playerSpeed),e.right&&(this.position.x+=a.shared.playerSpeed),e.up&&(this.position.y-=a.shared.playerSpeed),e.down&&(this.position.y+=a.shared.playerSpeed)}}]),e}()},function(e,t,n){"use strict";var r=n(0),o={playerPacketSend:null,gameStatePacketReceive:null,gameTick:null},a=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null;if(o[e]){var n=performance.now()-o[e];t&&n>t?console.log(e+" took "+Math.round(n)+"ms. Exceeded threshold of "+t):t||console.log(e+" took "+Math.round(n)+"ms"),o[e]=performance.now()}else o[e]=performance.now()};e.exports={isDebugMode:function(){return window.isDebugMode||r.client.isDebugMode},logPlayerPacketSendRate:function(e){a("playerPacketSend",e)},logGameStatePacketReceiveRate:function(e){a("gameStatePacketReceive",e)},logGameTickRate:function(e){a("gameTick",e)}}}]);