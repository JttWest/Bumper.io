!(function (e) { function t(r) { if (n[r]) return n[r].exports; let o = n[r] = { i: r, l: !1, exports: {} }; return e[r].call(o.exports, o, o.exports, t), o.l = !0, o.exports; } var n = {}; t.m = e, t.c = n, t.d = function (e, n, r) { t.o(e, n) || Object.defineProperty(e, n, { configurable: !1, enumerable: !0, get: r }); }, t.n = function (e) { let n = e && e.__esModule ? function () { return e.default; } : function () { return e; }; return t.d(n, 'a', n), n; }, t.o = function (e, t) { return Object.prototype.hasOwnProperty.call(e, t); }, t.p = '', t(t.s = 1); }([function (e, t) { e.exports = { shared: { port: 3e3, tickInterval: 50, tickBufferSize: 3, bulletSpeed: 20, mapWidth: 800, mapHeight: 600, playerWidth: 10, playerHeight: 10, playerSpeed: 2 }, server: {}, client: { isDebugMode: !1, playerColor: '#2274A5', otherPlayersColor: '#F90C0C' } }; }, function (e, t, n) {
  function r(e, t) { if (!(e instanceof t)) throw new TypeError('Cannot call a class as a function'); } let o = (function () { function e(e, t) { for (let n = 0; n < t.length; n++) { let r = t[n]; r.enumerable = r.enumerable || !1, r.configurable = !0, 'value' in r && (r.writable = !0), Object.defineProperty(e, r.key, r); } } return function (t, n, r) { return n && e(t.prototype, n), r && e(t, r), t; }; }()); n(2); let a = n(0),
    i = n(7).keyboardCodeMapping,
    s = n(8),
    u = n(10),
    c = document.getElementById('canvas'),
    l = {}; c.addEventListener('keydown', (e) => { l[e.keyCode] = !0; }), c.addEventListener('keyup', (e) => { l[e.keyCode] = !1; }); let f = function e(t, n) { r(this, e), this.x = t, this.y = n; },
      p = void 0,
      d = (function () { function e(t) { r(this, e), this.movement = t; } return o(e, [{ key: 'setFireAction', value: function (e) { this.action = { actionType: 'fire', angle: e }; } }]), e; }()),
      h = !1,
      y = !1,
      v = void 0,
      g = [],
      m = !0,
      b = new s(),
      S = window.location.hostname === 'localhost' ? `ws://localhost:${a.shared.port}` : `ws://${window.location.host}`,
      w = new WebSocket(S),
      k = function () { h = !0; let e = { type: 'syncReq' }; w.send(JSON.stringify(e)); },
      x = function () { let e = { type: 'joinReq', data: 'placeholderName' }; w.send(JSON.stringify(e)); }; w.onopen = function () { x(); }; let P = function (e) { if (e.forEach((e) => { b.insertPlayerSnapshots(e.playerId, e.snapshots); let t = b.getPlayerState(e.playerId); t.snapshotQueue.length > 2 * a.shared.tickBufferSize && t.processSnapshots(t.snapshotQueue.splice(0, t.snapshotQueue.length - 2 * a.shared.tickBufferSize)); }), u.isDebugMode()) { let t = b.getPlayerState(v).snapshotQueue.length; b.playerStates.some(e => e.snapshotQueue.length !== t) && console.log('Mismatch snapshot length between players in gameState'), b.playerStates.some(e => e.snapshotQueue.length > 2 * a.shared.tickBufferSize) && console.log('Snapshots for player exceed tickBufferSize * 2'); } }; w.onmessage = function (e) { let t = JSON.parse(e.data); switch (t.type) { case 'joinAck':y = !0, v = t.data.playerId, t.data.otherPlayersInGame.forEach((e) => { b.addNewPlayer(e); }), console.log(`Joined game as player ${v}`); break; case 'joinNack':alert(t.data); break; case 'playerJoin':b.addNewPlayer(t.data); break; case 'syncAck':if (h = !1, t.data.forEach((e) => { b.updatePlayerPosition(e.playerId, e.position), b.insertPlayerSnapshots(e.playerId, e.bufferSnapshots); }), m) { let n = b.getPlayerState(v); p = new f(n.position.x, n.position.y), M(), m = !1; } break; case 'syncTrig':console.log('Default snapshot was used on server'); break; case 'gameState':h || (u.logGameStatePacketReceiveRate(a.shared.tickBufferSize * a.shared.tickInterval + 50), P(t.data)); break; default:console.log(`Invalid message received from server: ${t}`); } }, w.onclose = function () { alert('socked connect to server closed'); }; let R = function () { let e = { left: !1, right: !1, up: !1, down: !1 }; return l[i.W] && (p.y -= a.shared.playerSpeed, e.up = !0), l[i.S] && (p.y += a.shared.playerSpeed, e.down = !0), l[i.A] && (p.x -= a.shared.playerSpeed, e.left = !0), l[i.D] && (p.x += a.shared.playerSpeed, e.right = !0), e; },
        C = function (e) {
          let t = e.snapshotQueue.shift(); if (t) {
            let n = t.movement,
              r = a.shared.playerSpeed; n.left && (e.position.x -= r), n.right && (e.position.x += r), n.up && (e.position.y -= r), n.down && (e.position.y += r);
          }
        },
        E = function (e) { let t = { type: 'playerState', data: e }; w.send(JSON.stringify(t)); }; !(function e() {
          if (u.logGameTickRate(a.shared.tickInterval + 10), setTimeout(e, a.shared.tickInterval), y) {
            if (u.logEmptySnapshotQueueDuration(b.getPlayerState(v).snapshotQueue.length), b.getPlayerState(v).snapshotQueue.length === 0) return void (h || k()); let t = R(),
              n = new d(t); g.push(n), g.length === a.shared.tickBufferSize && (E(g), g = []), b.getPlayerState(v).snapshotQueue.length > 0 && b.playerStates.forEach(e => C(e));
          }
        }()); var j = c.getContext('2d'),
          O = function (e, t, n) { j.beginPath(), j.fillStyle = e, j.strokeStyle = 'black', j.rect(t, n, a.shared.playerWidth, a.shared.playerHeight), j.lineWidth = 1, j.stroke(), j.fill(); },
          M = function e() { j.clearRect(0, 0, c.width, c.height), b.playerStates.forEach((e) => { let t = e.position; O(a.client.otherPlayersColor, t.x, t.y); }), O(a.client.playerColor, p.x, p.y), requestAnimationFrame(e); };
}, function (e, t, n) { let r = n(3); typeof r === 'string' && (r = [[e.i, r, '']]); let o = {}; o.transform = void 0; n(5)(r, o); r.locals && (e.exports = r.locals); }, function (e, t, n) { t = e.exports = n(4)(void 0), t.push([e.i, 'body{margin:0}canvas{border:1px solid #000;position:relative;background:#447604}#holder{display:block;margin:20px auto 0;width:800px;height:600px}', '']); }, function (e, t, n) {
  function r(e, t) {
    let n = e[1] || '',
      r = e[3]; if (!r) return n; if (t && typeof btoa === 'function') { let a = o(r); return [n].concat(r.sources.map(e => `/*# sourceURL=${r.sourceRoot}${e} */`)).concat([a]).join('\n'); } return [n].join('\n');
  } function o(e) { return `/*# sourceMappingURL=data:application/json;charset=utf-8;base64,${btoa(unescape(encodeURIComponent(JSON.stringify(e))))} */`; }e.exports = function (e) { let t = []; return t.toString = function () { return this.map((t) => { let n = r(t, e); return t[2] ? `@media ${t[2]}{${n}}` : n; }).join(''); }, t.i = function (e, n) { typeof e === 'string' && (e = [[null, e, '']]); for (var r = {}, o = 0; o < this.length; o++) { let a = this[o][0]; typeof a === 'number' && (r[a] = !0); } for (o = 0; o < e.length; o++) { let i = e[o]; typeof i[0] === 'number' && r[i[0]] || (n && !i[2] ? i[2] = n : n && (i[2] = `(${i[2]}) and (${n})`), t.push(i)); } }, t; };
}, function (e, t, n) {
  function r(e, t) {
    for (let n = 0; n < e.length; n++) {
      let r = e[n],
        o = h[r.id]; if (o) { o.refs++; for (var a = 0; a < o.parts.length; a++)o.parts[a](r.parts[a]); for (;a < r.parts.length; a++)o.parts.push(l(r.parts[a], t)); } else { for (var i = [], a = 0; a < r.parts.length; a++)i.push(l(r.parts[a], t)); h[r.id] = { id: r.id, refs: 1, parts: i }; }
    }
  } function o(e, t) {
    for (var n = [], r = {}, o = 0; o < e.length; o++) {
      let a = e[o],
        i = t.base ? a[0] + t.base : a[0],
        s = a[1],
        u = a[2],
        c = a[3],
        l = { css: s, media: u, sourceMap: c }; r[i] ? r[i].parts.push(l) : n.push(r[i] = { id: i, parts: [l] });
    } return n;
  } function a(e, t) { let n = v(e.insertInto); if (!n) throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid."); let r = b[b.length - 1]; if (e.insertAt === 'top')r ? r.nextSibling ? n.insertBefore(t, r.nextSibling) : n.appendChild(t) : n.insertBefore(t, n.firstChild), b.push(t); else { if (e.insertAt !== 'bottom') throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'."); n.appendChild(t); } } function i(e) { if (e.parentNode === null) return !1; e.parentNode.removeChild(e); let t = b.indexOf(e); t >= 0 && b.splice(t, 1); } function s(e) { let t = document.createElement('style'); return e.attrs.type = 'text/css', c(t, e.attrs), a(e, t), t; } function u(e) { let t = document.createElement('link'); return e.attrs.type = 'text/css', e.attrs.rel = 'stylesheet', c(t, e.attrs), a(e, t), t; } function c(e, t) { Object.keys(t).forEach((n) => { e.setAttribute(n, t[n]); }); } function l(e, t) {
    let n,
      r,
      o,
      a; if (t.transform && e.css) { if (!(a = t.transform(e.css))) return function () {}; e.css = a; } if (t.singleton) { let c = m++; n = g || (g = s(t)), r = f.bind(null, n, c, !1), o = f.bind(null, n, c, !0); } else e.sourceMap && typeof URL === 'function' && typeof URL.createObjectURL === 'function' && typeof URL.revokeObjectURL === 'function' && typeof Blob === 'function' && typeof btoa === 'function' ? (n = u(t), r = d.bind(null, n, t), o = function () { i(n), n.href && URL.revokeObjectURL(n.href); }) : (n = s(t), r = p.bind(null, n), o = function () { i(n); }); return r(e), function (t) { if (t) { if (t.css === e.css && t.media === e.media && t.sourceMap === e.sourceMap) return; r(e = t); } else o(); };
  } function f(e, t, n, r) {
    let o = n ? '' : r.css; if (e.styleSheet)e.styleSheet.cssText = w(t, o); else {
      let a = document.createTextNode(o),
        i = e.childNodes; i[t] && e.removeChild(i[t]), i.length ? e.insertBefore(a, i[t]) : e.appendChild(a);
    }
  } function p(e, t) {
    let n = t.css,
      r = t.media; if (r && e.setAttribute('media', r), e.styleSheet)e.styleSheet.cssText = n; else { for (;e.firstChild;)e.removeChild(e.firstChild); e.appendChild(document.createTextNode(n)); }
  } function d(e, t, n) {
    let r = n.css,
     o = n.sourceMap,
     a = void 0 === t.convertToAbsoluteUrls && o; (t.convertToAbsoluteUrls || a) && (r = S(r)), o && (r += `\n/*# sourceMappingURL=data:application/json;base64,${btoa(unescape(encodeURIComponent(JSON.stringify(o))))} */`); let i = new Blob([r], { type: 'text/css' }),
      s = e.href; e.href = URL.createObjectURL(i), s && URL.revokeObjectURL(s);
  } var h = {},
   y = (function (e) { let t; return function () { return void 0 === t && (t = e.apply(this, arguments)), t; }; }(() => window && document && document.all && !window.atob)),
   v = (function (e) { let t = {}; return function (n) { return void 0 === t[n] && (t[n] = e.call(this, n)), t[n]; }; }(e => document.querySelector(e))),
   g = null,
   m = 0,
   b = [],
   S = n(6); e.exports = function (e, t) {
    if (typeof DEBUG !== 'undefined' && DEBUG && typeof document !== 'object') throw new Error('The style-loader cannot be used in a non-browser environment'); t = t || {}, t.attrs = typeof t.attrs === 'object' ? t.attrs : {}, t.singleton || (t.singleton = y()), t.insertInto || (t.insertInto = 'head'), t.insertAt || (t.insertAt = 'bottom'); let n = o(e, t); return r(n, t), function (e) {
      for (var a = [], i = 0; i < n.length; i++) {
        var s = n[i],
          u = h[s.id]; u.refs--, a.push(u);
      } if (e) { r(o(e, t), t); } for (var i = 0; i < a.length; i++) { var u = a[i]; if (u.refs === 0) { for (let c = 0; c < u.parts.length; c++)u.parts[c](); delete h[u.id]; } }
    };
  }; var w = (function () { let e = []; return function (t, n) { return e[t] = n, e.filter(Boolean).join('\n'); }; }());
}, function (e, t, n) {
  e.exports = function (e) {
    let t = typeof window !== 'undefined' && window.location; if (!t) throw new Error('fixUrls requires window.location'); if (!e || typeof e !== 'string') return e; let n = `${t.protocol}//${t.host}`,
      r = n + t.pathname.replace(/\/[^\/]*$/, '/'); return e.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, (e, t) => { let o = t.trim().replace(/^"(.*)"$/, (e, t) => t).replace(/^'(.*)'$/, (e, t) => t); if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(o)) return e; let a; return a = o.indexOf('//') === 0 ? o : o.indexOf('/') === 0 ? n + o : r + o.replace(/^\.\//, ''), `url(${JSON.stringify(a)})`; });
  };
}, function (e, t, n) {
  e.exports = { keyboardCodeMapping: { W: 87, A: 65, S: 83, D: 68 } };
}, function (e, t, n) {
  function r(e) { if (Array.isArray(e)) { for (var t = 0, n = Array(e.length); t < e.length; t++)n[t] = e[t]; return n; } return Array.from(e); } function o(e, t) { if (!(e instanceof t)) throw new TypeError('Cannot call a class as a function'); } let a = (function () { function e(e, t) { for (let n = 0; n < t.length; n++) { let r = t[n]; r.enumerable = r.enumerable || !1, r.configurable = !0, 'value' in r && (r.writable = !0), Object.defineProperty(e, r.key, r); } } return function (t, n, r) { return n && e(t.prototype, n), r && e(t, r), t; }; }()),
    i = n(9); e.exports = (function () {
      function e() { o(this, e), this.players = {}; } return a(e, [{ key: 'addNewPlayer',
        value: function (e) {
          let t = e.playerId,
            n = e.name,
            r = e.position; this.players[t] = new i(n), r && (this.players[t].position = r);
        } }, { key: 'updatePlayerPosition', value: function (e, t) { this.players[e].position = t; } }, { key: 'insertPlayerSnapshots', value: function (e, t) { let n; (n = this.players[e].snapshotQueue).push.apply(n, r(t)); } }, { key: 'getPlayerState', value: function (e) { if (!this.players[e]) throw new Error(`Player with id ${e} doesn't exist in game state`); return this.players[e]; } }, { key: 'playerStates', get: function () { return Object.values(this.players); } }]), e;
    }());
}, function (e, t, n) {
  function r(e, t) { if (!(e instanceof t)) throw new TypeError('Cannot call a class as a function'); } let o = (function () { function e(e, t) { for (let n = 0; n < t.length; n++) { let r = t[n]; r.enumerable = r.enumerable || !1, r.configurable = !0, 'value' in r && (r.writable = !0), Object.defineProperty(e, r.key, r); } } return function (t, n, r) { return n && e(t.prototype, n), r && e(t, r), t; }; }()),
    a = n(0); e.exports = (function () { function e(t) { r(this, e), this.name = t, this.position = null, this.snapshotQueue = []; } return o(e, [{ key: 'processSnapshots', value: function (e) { let t = this; e.forEach((e) => { t.processPlayerMove(e.movement); }); } }, { key: 'processPlayerMove', value: function (e) { e.left && (this.position.x -= a.shared.playerSpeed), e.right && (this.position.x += a.shared.playerSpeed), e.up && (this.position.y -= a.shared.playerSpeed), e.down && (this.position.y += a.shared.playerSpeed); } }]), e; }());
}, function (e, t, n) {
  let r = n(0),
    o = function () { return window.isDebugMode || r.client.isDebugMode; },
    a = { playerPacketSend: null, gameStatePacketReceive: null, gameTick: null },
    i = function (e) { let t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : null; if (o()) if (a[e]) { let n = performance.now() - a[e]; t && n > t ? console.log(`${e} took ${Math.round(n)}ms. Exceeded threshold of ${t}`) : t || console.log(`${e} took ${Math.round(n)}ms`), a[e] = performance.now(); } else a[e] = performance.now(); },
    s = void 0; e.exports = { isDebugMode: o, logPlayerPacketSendRate: function (e) { i('playerPacketSend', e); }, logGameStatePacketReceiveRate: function (e) { i('gameStatePacketReceive', e); }, logGameTickRate: function (e) { i('gameTick', e); }, logEmptySnapshotQueueDuration: function (e) { o() && (e !== 0 || s ? e !== 0 && s && (console.log(`GameState snapshot queue was empty for ${Math.round(performance.now() - s)}ms`), s = null) : s = performance.now()); } };
}]));
