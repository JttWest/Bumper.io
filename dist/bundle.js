!function(t){function e(r){if(n[r])return n[r].exports;var o=n[r]={i:r,l:!1,exports:{}};return t[r].call(o.exports,o,o.exports,e),o.l=!0,o.exports}var n={};e.m=t,e.c=n,e.i=function(t){return t},e.d=function(t,n,r){e.o(t,n)||Object.defineProperty(t,n,{configurable:!1,enumerable:!0,get:r})},e.n=function(t){var n=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(n,"a",n),n},e.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},e.p="",e(e.s=2)}([function(t,e){t.exports={client_server:{gameTickInterval:50,bulletSpeed:25,mapWidth:800,mapHeight:600,playerWidth:10,playerHeight:10},server:{serverPacketInterval:100},client:{clientPacketInterval:100,playerColor:"#2274A5",otherPlayersColor:"#F90C0C",bulletColor:"#FFD400"}}},function(t,e,n){var r=n(5);"string"==typeof r&&(r=[[t.i,r,""]]);n(6)(r,{});r.locals&&(t.exports=r.locals)},function(t,e,n){"use strict";function r(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function o(){var t={type:"move",data:{left:!1,right:!1,up:!1,down:!1}};m[87]&&(t.data.up=!0),m[83]&&(t.data.down=!0),m[65]&&(t.data.left=!0),m[68]&&(t.data.right=!0),h.send(JSON.stringify(t))}function i(){v.forEach(function(t){g.beginPath(),g.fillStyle=l.client.bulletColor,g.rect(t.position.x,t.position.y,5,5),g.fill()})}function a(t,e,n){g.beginPath(),g.fillStyle=t,g.strokeStyle="black",g.rect(e,n,p.w,p.h),g.lineWidth=1,g.stroke(),g.fill()}function s(){g.clearRect(0,0,b.width,b.height),y.forEach(function(t){a(l.client.otherPlayersColor,t.x,t.y)}),i(),a(l.client.playerColor,p.x,p.y),requestAnimationFrame(s)}function c(t){x=t.offsetX,w=t.offsetY}function u(t){var e={type:"fire",data:{angle:t}};h.send(JSON.stringify(e))}n(1);var l=n(0),f=function t(e,n){r(this,t),this.x=e,this.y=n,this.h=l.client_server.playerHeight,this.w=l.client_server.playerWidth},p=new f(395,295),d="ws://"+window.location.host,h=new WebSocket(d),v=[],y=[];h.onopen=function(){},h.onmessage=function(t){var e=JSON.parse(t.data);p.x=e.player.x,p.y=e.player.y,v=e.bullets,y=e.otherPlayers},h.onclose=function(){};var b=document.getElementById("canvas"),g=b.getContext("2d"),m={};b.addEventListener("keydown",function(t){m[t.keyCode]=!0}),b.addEventListener("keyup",function(t){m[t.keyCode]=!1}),setInterval(o,100),s();var x=void 0,w=void 0;b.addEventListener("mousemove",c),b.addEventListener("click",function(){var t=x-p.x,e=w-p.y;u(Math.atan2(e,t))})},function(t,e,n){"use strict";function r(t,e){var n=t[1]||"",r=t[3];if(!r)return n;if(e&&"function"==typeof btoa){var i=o(r);return[n].concat(r.sources.map(function(t){return"/*# sourceURL="+r.sourceRoot+t+" */"})).concat([i]).join("\n")}return[n].join("\n")}function o(t){return"/*# sourceMappingURL=data:application/json;charset=utf-8;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(t))))+" */"}t.exports=function(t){var e=[];return e.toString=function(){return this.map(function(e){var n=r(e,t);return e[2]?"@media "+e[2]+"{"+n+"}":n}).join("")},e.i=function(t,n){"string"==typeof t&&(t=[[null,t,""]]);for(var r={},o=0;o<this.length;o++){var i=this[o][0];"number"==typeof i&&(r[i]=!0)}for(o=0;o<t.length;o++){var a=t[o];"number"==typeof a[0]&&r[a[0]]||(n&&!a[2]?a[2]=n:n&&(a[2]="("+a[2]+") and ("+n+")"),e.push(a))}},e}},function(t,e,n){"use strict";t.exports=function(t){var e="undefined"!=typeof window&&window.location;if(!e)throw new Error("fixUrls requires window.location");if(!t||"string"!=typeof t)return t;var n=e.protocol+"//"+e.host,r=n+e.pathname.replace(/\/[^\/]*$/,"/");return t.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi,function(t,e){var o=e.trim().replace(/^"(.*)"$/,function(t,e){return e}).replace(/^'(.*)'$/,function(t,e){return e});if(/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(o))return t;var i;return i=0===o.indexOf("//")?o:0===o.indexOf("/")?n+o:r+o.replace(/^\.\//,""),"url("+JSON.stringify(i)+")"})}},function(t,e,n){e=t.exports=n(3)(void 0),e.push([t.i,"body{margin:0}canvas{border:1px solid #000;position:relative;background:#447604}#holder{display:block;margin:20px auto 0;width:800px;height:600px}",""])},function(t,e,n){function r(t,e){for(var n=0;n<t.length;n++){var r=t[n],o=h[r.id];if(o){o.refs++;for(var i=0;i<o.parts.length;i++)o.parts[i](r.parts[i]);for(;i<r.parts.length;i++)o.parts.push(l(r.parts[i],e))}else{for(var a=[],i=0;i<r.parts.length;i++)a.push(l(r.parts[i],e));h[r.id]={id:r.id,refs:1,parts:a}}}}function o(t){for(var e=[],n={},r=0;r<t.length;r++){var o=t[r],i=o[0],a=o[1],s=o[2],c=o[3],u={css:a,media:s,sourceMap:c};n[i]?n[i].parts.push(u):e.push(n[i]={id:i,parts:[u]})}return e}function i(t,e){var n=y(t.insertInto);if(!n)throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");var r=m[m.length-1];if("top"===t.insertAt)r?r.nextSibling?n.insertBefore(e,r.nextSibling):n.appendChild(e):n.insertBefore(e,n.firstChild),m.push(e);else{if("bottom"!==t.insertAt)throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");n.appendChild(e)}}function a(t){t.parentNode.removeChild(t);var e=m.indexOf(t);e>=0&&m.splice(e,1)}function s(t){var e=document.createElement("style");return t.attrs.type="text/css",u(e,t.attrs),i(t,e),e}function c(t){var e=document.createElement("link");return t.attrs.type="text/css",t.attrs.rel="stylesheet",u(e,t.attrs),i(t,e),e}function u(t,e){Object.keys(e).forEach(function(n){t.setAttribute(n,e[n])})}function l(t,e){var n,r,o;if(e.singleton){var i=g++;n=b||(b=s(e)),r=f.bind(null,n,i,!1),o=f.bind(null,n,i,!0)}else t.sourceMap&&"function"==typeof URL&&"function"==typeof URL.createObjectURL&&"function"==typeof URL.revokeObjectURL&&"function"==typeof Blob&&"function"==typeof btoa?(n=c(e),r=d.bind(null,n,e),o=function(){a(n),n.href&&URL.revokeObjectURL(n.href)}):(n=s(e),r=p.bind(null,n),o=function(){a(n)});return r(t),function(e){if(e){if(e.css===t.css&&e.media===t.media&&e.sourceMap===t.sourceMap)return;r(t=e)}else o()}}function f(t,e,n,r){var o=n?"":r.css;if(t.styleSheet)t.styleSheet.cssText=w(e,o);else{var i=document.createTextNode(o),a=t.childNodes;a[e]&&t.removeChild(a[e]),a.length?t.insertBefore(i,a[e]):t.appendChild(i)}}function p(t,e){var n=e.css,r=e.media;if(r&&t.setAttribute("media",r),t.styleSheet)t.styleSheet.cssText=n;else{for(;t.firstChild;)t.removeChild(t.firstChild);t.appendChild(document.createTextNode(n))}}function d(t,e,n){var r=n.css,o=n.sourceMap,i=void 0===e.convertToAbsoluteUrls&&o;(e.convertToAbsoluteUrls||i)&&(r=x(r)),o&&(r+="\n/*# sourceMappingURL=data:application/json;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(o))))+" */");var a=new Blob([r],{type:"text/css"}),s=t.href;t.href=URL.createObjectURL(a),s&&URL.revokeObjectURL(s)}var h={},v=function(t){var e;return function(){return void 0===e&&(e=t.apply(this,arguments)),e}}(function(){return window&&document&&document.all&&!window.atob}),y=function(t){var e={};return function(n){return void 0===e[n]&&(e[n]=t.call(this,n)),e[n]}}(function(t){return document.querySelector(t)}),b=null,g=0,m=[],x=n(4);t.exports=function(t,e){if("undefined"!=typeof DEBUG&&DEBUG&&"object"!=typeof document)throw new Error("The style-loader cannot be used in a non-browser environment");e=e||{},e.attrs="object"==typeof e.attrs?e.attrs:{},void 0===e.singleton&&(e.singleton=v()),void 0===e.insertInto&&(e.insertInto="head"),void 0===e.insertAt&&(e.insertAt="bottom");var n=o(t);return r(n,e),function(t){for(var i=[],a=0;a<n.length;a++){var s=n[a],c=h[s.id];c.refs--,i.push(c)}if(t){r(o(t),e)}for(var a=0;a<i.length;a++){var c=i[a];if(0===c.refs){for(var u=0;u<c.parts.length;u++)c.parts[u]();delete h[c.id]}}}};var w=function(){var t=[];return function(e,n){return t[e]=n,t.filter(Boolean).join("\n")}}()}]);