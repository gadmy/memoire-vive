"use strict";
/* ================================================================
   MEMOIRE VIVE - 01-utils.js
   Le hasard, les bornes, et les trois raccourcis DOM dont tout le
   reste se sert. Aucune regle de jeu ici.
   ================================================================ */

/* ---- LE HASARD, MAIS REPRODUCTIBLE ----
   Un seul flux, reseede a chaque nouvelle partie. Deux parties lancees
   sur la meme graine donnent le meme equipage et la meme usure : c'est
   ce qui rend une partie racontable, et un bug retrouvable. */
var GRAINE = 0;
var _etatRng = 1;

function seed(n) {
    GRAINE = n | 0;
    _etatRng = (GRAINE || 1) >>> 0;
}

function rnd() {
    /* mulberry32 : court, suffisant, et deterministe */
    _etatRng = (_etatRng + 0x6D2B79F5) >>> 0;
    var t = _etatRng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function rndInt(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
function pick(liste) { return liste[Math.floor(rnd() * liste.length)]; }

/* ---- BORNES ET FORMATS ---- */
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function pc(v) { return Math.round(v) + " %"; }

function nb(v) {
    /* les reserves se lisent en entiers ; les flux gardent une decimale */
    if (Math.abs(v) >= 100) return String(Math.round(v));
    return (Math.round(v * 10) / 10).toString().replace(".", ",");
}

function signe(v) {
    var s = nb(v);
    return v > 0 ? "+" + s : s;
}

/* ---- DOM ---- */
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

function bal(nom, cls, txt) {
    var e = document.createElement(nom);
    if (cls) e.className = cls;
    if (txt !== undefined && txt !== null) e.textContent = txt;
    return e;
}

var SVGNS = "http://www.w3.org/2000/svg";
function svgel(nom, attrs) {
    var e = document.createElementNS(SVGNS, nom), k;
    for (k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) {
        e.setAttribute(k, attrs[k]);
    }
    return e;
}
