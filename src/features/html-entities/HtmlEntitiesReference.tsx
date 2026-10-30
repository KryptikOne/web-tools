"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ClipboardDocumentIcon,
  CheckIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import styles from "./HtmlEntitiesReference.module.scss";

interface HtmlEntity {
  name: string;
  char: string;
  unicode: string;
  htmlEntity: string;
  htmlCode: string;
  cssCode: string;
  jsCode: string;
}

interface EntityCategory {
  name: string;
  entities: HtmlEntity[];
}

const ENTITY_DATA: EntityCategory[] = [
  {
    name: "Common Symbols",
    entities: [
      { name: "Copyright", char: "©", unicode: "U+00A9", htmlEntity: "&copy;", htmlCode: "&#169;", cssCode: "\\00A9", jsCode: "\\u00A9" },
      { name: "Registered", char: "®", unicode: "U+00AE", htmlEntity: "&reg;", htmlCode: "&#174;", cssCode: "\\00AE", jsCode: "\\u00AE" },
      { name: "Trademark", char: "™", unicode: "U+2122", htmlEntity: "&trade;", htmlCode: "&#8482;", cssCode: "\\2122", jsCode: "\\u2122" },
      { name: "Degree", char: "°", unicode: "U+00B0", htmlEntity: "&deg;", htmlCode: "&#176;", cssCode: "\\00B0", jsCode: "\\u00B0" },
      { name: "Plus/Minus", char: "±", unicode: "U+00B1", htmlEntity: "&plusmn;", htmlCode: "&#177;", cssCode: "\\00B1", jsCode: "\\u00B1" },
      { name: "Micro", char: "µ", unicode: "U+00B5", htmlEntity: "&micro;", htmlCode: "&#181;", cssCode: "\\00B5", jsCode: "\\u00B5" },
      { name: "Pilcrow", char: "¶", unicode: "U+00B6", htmlEntity: "&para;", htmlCode: "&#182;", cssCode: "\\00B6", jsCode: "\\u00B6" },
      { name: "Section", char: "§", unicode: "U+00A7", htmlEntity: "&sect;", htmlCode: "&#167;", cssCode: "\\00A7", jsCode: "\\u00A7" },
    ],
  },
  {
    name: "Currency",
    entities: [
      { name: "Dollar", char: "$", unicode: "U+0024", htmlEntity: "&dollar;", htmlCode: "&#36;", cssCode: "\\0024", jsCode: "\\u0024" },
      { name: "Cent", char: "¢", unicode: "U+00A2", htmlEntity: "&cent;", htmlCode: "&#162;", cssCode: "\\00A2", jsCode: "\\u00A2" },
      { name: "Pound", char: "£", unicode: "U+00A3", htmlEntity: "&pound;", htmlCode: "&#163;", cssCode: "\\00A3", jsCode: "\\u00A3" },
      { name: "Yen", char: "¥", unicode: "U+00A5", htmlEntity: "&yen;", htmlCode: "&#165;", cssCode: "\\00A5", jsCode: "\\u00A5" },
      { name: "Euro", char: "€", unicode: "U+20AC", htmlEntity: "&euro;", htmlCode: "&#8364;", cssCode: "\\20AC", jsCode: "\\u20AC" },
      { name: "Currency", char: "¤", unicode: "U+00A4", htmlEntity: "&curren;", htmlCode: "&#164;", cssCode: "\\00A4", jsCode: "\\u00A4" },
      { name: "Bitcoin", char: "₿", unicode: "U+20BF", htmlEntity: "&#8383;", htmlCode: "&#8383;", cssCode: "\\20BF", jsCode: "\\u20BF" },
      { name: "Rupee", char: "₹", unicode: "U+20B9", htmlEntity: "&#8377;", htmlCode: "&#8377;", cssCode: "\\20B9", jsCode: "\\u20B9" },
    ],
  },
  {
    name: "Math Operators",
    entities: [
      { name: "Multiply", char: "×", unicode: "U+00D7", htmlEntity: "&times;", htmlCode: "&#215;", cssCode: "\\00D7", jsCode: "\\u00D7" },
      { name: "Divide", char: "÷", unicode: "U+00F7", htmlEntity: "&divide;", htmlCode: "&#247;", cssCode: "\\00F7", jsCode: "\\u00F7" },
      { name: "Not Equal", char: "≠", unicode: "U+2260", htmlEntity: "&ne;", htmlCode: "&#8800;", cssCode: "\\2260", jsCode: "\\u2260" },
      { name: "Less or Equal", char: "≤", unicode: "U+2264", htmlEntity: "&le;", htmlCode: "&#8804;", cssCode: "\\2264", jsCode: "\\u2264" },
      { name: "Greater or Equal", char: "≥", unicode: "U+2265", htmlEntity: "&ge;", htmlCode: "&#8805;", cssCode: "\\2265", jsCode: "\\u2265" },
      { name: "Plus/Minus", char: "±", unicode: "U+00B1", htmlEntity: "&plusmn;", htmlCode: "&#177;", cssCode: "\\00B1", jsCode: "\\u00B1" },
      { name: "Infinity", char: "∞", unicode: "U+221E", htmlEntity: "&infin;", htmlCode: "&#8734;", cssCode: "\\221E", jsCode: "\\u221E" },
      { name: "Square Root", char: "√", unicode: "U+221A", htmlEntity: "&radic;", htmlCode: "&#8730;", cssCode: "\\221A", jsCode: "\\u221A" },
      { name: "Summation", char: "∑", unicode: "U+2211", htmlEntity: "&sum;", htmlCode: "&#8721;", cssCode: "\\2211", jsCode: "\\u2211" },
      { name: "Product", char: "∏", unicode: "U+220F", htmlEntity: "&prod;", htmlCode: "&#8719;", cssCode: "\\220F", jsCode: "\\u220F" },
      { name: "Integral", char: "∫", unicode: "U+222B", htmlEntity: "&int;", htmlCode: "&#8747;", cssCode: "\\222B", jsCode: "\\u222B" },
      { name: "Approximately", char: "≈", unicode: "U+2248", htmlEntity: "&asymp;", htmlCode: "&#8776;", cssCode: "\\2248", jsCode: "\\u2248" },
      { name: "Partial Diff", char: "∂", unicode: "U+2202", htmlEntity: "&part;", htmlCode: "&#8706;", cssCode: "\\2202", jsCode: "\\u2202" },
      { name: "Delta", char: "Δ", unicode: "U+0394", htmlEntity: "&Delta;", htmlCode: "&#916;", cssCode: "\\0394", jsCode: "\\u0394" },
      { name: "Pi", char: "π", unicode: "U+03C0", htmlEntity: "&pi;", htmlCode: "&#960;", cssCode: "\\03C0", jsCode: "\\u03C0" },
      { name: "Empty Set", char: "∅", unicode: "U+2205", htmlEntity: "&empty;", htmlCode: "&#8709;", cssCode: "\\2205", jsCode: "\\u2205" },
    ],
  },
  {
    name: "Arrows",
    entities: [
      { name: "Left Arrow", char: "←", unicode: "U+2190", htmlEntity: "&larr;", htmlCode: "&#8592;", cssCode: "\\2190", jsCode: "\\u2190" },
      { name: "Up Arrow", char: "↑", unicode: "U+2191", htmlEntity: "&uarr;", htmlCode: "&#8593;", cssCode: "\\2191", jsCode: "\\u2191" },
      { name: "Right Arrow", char: "→", unicode: "U+2192", htmlEntity: "&rarr;", htmlCode: "&#8594;", cssCode: "\\2192", jsCode: "\\u2192" },
      { name: "Down Arrow", char: "↓", unicode: "U+2193", htmlEntity: "&darr;", htmlCode: "&#8595;", cssCode: "\\2193", jsCode: "\\u2193" },
      { name: "Left Right Arrow", char: "↔", unicode: "U+2194", htmlEntity: "&harr;", htmlCode: "&#8596;", cssCode: "\\2194", jsCode: "\\u2194" },
      { name: "Up Down Arrow", char: "↕", unicode: "U+2195", htmlEntity: "&#8597;", htmlCode: "&#8597;", cssCode: "\\2195", jsCode: "\\u2195" },
      { name: "Double Left", char: "⇐", unicode: "U+21D0", htmlEntity: "&lArr;", htmlCode: "&#8656;", cssCode: "\\21D0", jsCode: "\\u21D0" },
      { name: "Double Right", char: "⇒", unicode: "U+21D2", htmlEntity: "&rArr;", htmlCode: "&#8658;", cssCode: "\\21D2", jsCode: "\\u21D2" },
      { name: "Double Up", char: "⇑", unicode: "U+21D1", htmlEntity: "&uArr;", htmlCode: "&#8657;", cssCode: "\\21D1", jsCode: "\\u21D1" },
      { name: "Double Down", char: "⇓", unicode: "U+21D3", htmlEntity: "&dArr;", htmlCode: "&#8659;", cssCode: "\\21D3", jsCode: "\\u21D3" },
      { name: "Double Left Right", char: "⇔", unicode: "U+21D4", htmlEntity: "&hArr;", htmlCode: "&#8660;", cssCode: "\\21D4", jsCode: "\\u21D4" },
    ],
  },
  {
    name: "Punctuation & Quotes",
    entities: [
      { name: "Non-Breaking Space", char: " ", unicode: "U+00A0", htmlEntity: "&nbsp;", htmlCode: "&#160;", cssCode: "\\00A0", jsCode: "\\u00A0" },
      { name: "En Dash", char: "–", unicode: "U+2013", htmlEntity: "&ndash;", htmlCode: "&#8211;", cssCode: "\\2013", jsCode: "\\u2013" },
      { name: "Em Dash", char: "—", unicode: "U+2014", htmlEntity: "&mdash;", htmlCode: "&#8212;", cssCode: "\\2014", jsCode: "\\u2014" },
      { name: "Left Single Quote", char: "'", unicode: "U+2018", htmlEntity: "&lsquo;", htmlCode: "&#8216;", cssCode: "\\2018", jsCode: "\\u2018" },
      { name: "Right Single Quote", char: "'", unicode: "U+2019", htmlEntity: "&rsquo;", htmlCode: "&#8217;", cssCode: "\\2019", jsCode: "\\u2019" },
      { name: "Left Double Quote", char: "\u201C", unicode: "U+201C", htmlEntity: "&ldquo;", htmlCode: "&#8220;", cssCode: "\\201C", jsCode: "\\u201C" },
      { name: "Right Double Quote", char: "\u201D", unicode: "U+201D", htmlEntity: "&rdquo;", htmlCode: "&#8221;", cssCode: "\\201D", jsCode: "\\u201D" },
      { name: "Single Low Quote", char: "‚", unicode: "U+201A", htmlEntity: "&sbquo;", htmlCode: "&#8218;", cssCode: "\\201A", jsCode: "\\u201A" },
      { name: "Double Low Quote", char: "\u201E", unicode: "U+201E", htmlEntity: "&bdquo;", htmlCode: "&#8222;", cssCode: "\\201E", jsCode: "\\u201E" },
      { name: "Left Angle Quote", char: "«", unicode: "U+00AB", htmlEntity: "&laquo;", htmlCode: "&#171;", cssCode: "\\00AB", jsCode: "\\u00AB" },
      { name: "Right Angle Quote", char: "»", unicode: "U+00BB", htmlEntity: "&raquo;", htmlCode: "&#187;", cssCode: "\\00BB", jsCode: "\\u00BB" },
      { name: "Single Left Angle", char: "‹", unicode: "U+2039", htmlEntity: "&lsaquo;", htmlCode: "&#8249;", cssCode: "\\2039", jsCode: "\\u2039" },
      { name: "Single Right Angle", char: "›", unicode: "U+203A", htmlEntity: "&rsaquo;", htmlCode: "&#8250;", cssCode: "\\203A", jsCode: "\\u203A" },
      { name: "Ellipsis", char: "…", unicode: "U+2026", htmlEntity: "&hellip;", htmlCode: "&#8230;", cssCode: "\\2026", jsCode: "\\u2026" },
      { name: "Bullet", char: "•", unicode: "U+2022", htmlEntity: "&bull;", htmlCode: "&#8226;", cssCode: "\\2022", jsCode: "\\u2022" },
      { name: "Middle Dot", char: "·", unicode: "U+00B7", htmlEntity: "&middot;", htmlCode: "&#183;", cssCode: "\\00B7", jsCode: "\\u00B7" },
      { name: "Inverted Exclamation", char: "¡", unicode: "U+00A1", htmlEntity: "&iexcl;", htmlCode: "&#161;", cssCode: "\\00A1", jsCode: "\\u00A1" },
      { name: "Inverted Question", char: "¿", unicode: "U+00BF", htmlEntity: "&iquest;", htmlCode: "&#191;", cssCode: "\\00BF", jsCode: "\\u00BF" },
      { name: "Dagger", char: "†", unicode: "U+2020", htmlEntity: "&dagger;", htmlCode: "&#8224;", cssCode: "\\2020", jsCode: "\\u2020" },
      { name: "Double Dagger", char: "‡", unicode: "U+2021", htmlEntity: "&Dagger;", htmlCode: "&#8225;", cssCode: "\\2021", jsCode: "\\u2021" },
    ],
  },
  {
    name: "HTML Reserved Characters",
    entities: [
      { name: "Less Than", char: "<", unicode: "U+003C", htmlEntity: "&lt;", htmlCode: "&#60;", cssCode: "\\003C", jsCode: "\\u003C" },
      { name: "Greater Than", char: ">", unicode: "U+003E", htmlEntity: "&gt;", htmlCode: "&#62;", cssCode: "\\003E", jsCode: "\\u003E" },
      { name: "Ampersand", char: "&", unicode: "U+0026", htmlEntity: "&amp;", htmlCode: "&#38;", cssCode: "\\0026", jsCode: "\\u0026" },
      { name: "Double Quote", char: "\"", unicode: "U+0022", htmlEntity: "&quot;", htmlCode: "&#34;", cssCode: "\\0022", jsCode: "\\u0022" },
      { name: "Single Quote", char: "'", unicode: "U+0027", htmlEntity: "&apos;", htmlCode: "&#39;", cssCode: "\\0027", jsCode: "\\u0027" },
    ],
  },
  {
    name: "Greek Letters",
    entities: [
      { name: "Alpha (upper)", char: "Α", unicode: "U+0391", htmlEntity: "&Alpha;", htmlCode: "&#913;", cssCode: "\\0391", jsCode: "\\u0391" },
      { name: "Alpha (lower)", char: "α", unicode: "U+03B1", htmlEntity: "&alpha;", htmlCode: "&#945;", cssCode: "\\03B1", jsCode: "\\u03B1" },
      { name: "Beta (upper)", char: "Β", unicode: "U+0392", htmlEntity: "&Beta;", htmlCode: "&#914;", cssCode: "\\0392", jsCode: "\\u0392" },
      { name: "Beta (lower)", char: "β", unicode: "U+03B2", htmlEntity: "&beta;", htmlCode: "&#946;", cssCode: "\\03B2", jsCode: "\\u03B2" },
      { name: "Gamma (upper)", char: "Γ", unicode: "U+0393", htmlEntity: "&Gamma;", htmlCode: "&#915;", cssCode: "\\0393", jsCode: "\\u0393" },
      { name: "Gamma (lower)", char: "γ", unicode: "U+03B3", htmlEntity: "&gamma;", htmlCode: "&#947;", cssCode: "\\03B3", jsCode: "\\u03B3" },
      { name: "Delta (upper)", char: "Δ", unicode: "U+0394", htmlEntity: "&Delta;", htmlCode: "&#916;", cssCode: "\\0394", jsCode: "\\u0394" },
      { name: "Delta (lower)", char: "δ", unicode: "U+03B4", htmlEntity: "&delta;", htmlCode: "&#948;", cssCode: "\\03B4", jsCode: "\\u03B4" },
      { name: "Epsilon (upper)", char: "Ε", unicode: "U+0395", htmlEntity: "&Epsilon;", htmlCode: "&#917;", cssCode: "\\0395", jsCode: "\\u0395" },
      { name: "Epsilon (lower)", char: "ε", unicode: "U+03B5", htmlEntity: "&epsilon;", htmlCode: "&#949;", cssCode: "\\03B5", jsCode: "\\u03B5" },
      { name: "Lambda (upper)", char: "Λ", unicode: "U+039B", htmlEntity: "&Lambda;", htmlCode: "&#923;", cssCode: "\\039B", jsCode: "\\u039B" },
      { name: "Lambda (lower)", char: "λ", unicode: "U+03BB", htmlEntity: "&lambda;", htmlCode: "&#955;", cssCode: "\\03BB", jsCode: "\\u03BB" },
      { name: "Mu (upper)", char: "Μ", unicode: "U+039C", htmlEntity: "&Mu;", htmlCode: "&#924;", cssCode: "\\039C", jsCode: "\\u039C" },
      { name: "Mu (lower)", char: "μ", unicode: "U+03BC", htmlEntity: "&mu;", htmlCode: "&#956;", cssCode: "\\03BC", jsCode: "\\u03BC" },
      { name: "Pi (upper)", char: "Π", unicode: "U+03A0", htmlEntity: "&Pi;", htmlCode: "&#928;", cssCode: "\\03A0", jsCode: "\\u03A0" },
      { name: "Pi (lower)", char: "π", unicode: "U+03C0", htmlEntity: "&pi;", htmlCode: "&#960;", cssCode: "\\03C0", jsCode: "\\u03C0" },
      { name: "Sigma (upper)", char: "Σ", unicode: "U+03A3", htmlEntity: "&Sigma;", htmlCode: "&#931;", cssCode: "\\03A3", jsCode: "\\u03A3" },
      { name: "Sigma (lower)", char: "σ", unicode: "U+03C3", htmlEntity: "&sigma;", htmlCode: "&#963;", cssCode: "\\03C3", jsCode: "\\u03C3" },
      { name: "Theta (upper)", char: "Θ", unicode: "U+0398", htmlEntity: "&Theta;", htmlCode: "&#920;", cssCode: "\\0398", jsCode: "\\u0398" },
      { name: "Theta (lower)", char: "θ", unicode: "U+03B8", htmlEntity: "&theta;", htmlCode: "&#952;", cssCode: "\\03B8", jsCode: "\\u03B8" },
      { name: "Omega (upper)", char: "Ω", unicode: "U+03A9", htmlEntity: "&Omega;", htmlCode: "&#937;", cssCode: "\\03A9", jsCode: "\\u03A9" },
      { name: "Omega (lower)", char: "ω", unicode: "U+03C9", htmlEntity: "&omega;", htmlCode: "&#969;", cssCode: "\\03C9", jsCode: "\\u03C9" },
    ],
  },
  {
    name: "Fractions & Superscripts",
    entities: [
      { name: "One Half", char: "½", unicode: "U+00BD", htmlEntity: "&frac12;", htmlCode: "&#189;", cssCode: "\\00BD", jsCode: "\\u00BD" },
      { name: "One Third", char: "⅓", unicode: "U+2153", htmlEntity: "&#8531;", htmlCode: "&#8531;", cssCode: "\\2153", jsCode: "\\u2153" },
      { name: "One Quarter", char: "¼", unicode: "U+00BC", htmlEntity: "&frac14;", htmlCode: "&#188;", cssCode: "\\00BC", jsCode: "\\u00BC" },
      { name: "Three Quarters", char: "¾", unicode: "U+00BE", htmlEntity: "&frac34;", htmlCode: "&#190;", cssCode: "\\00BE", jsCode: "\\u00BE" },
      { name: "Two Thirds", char: "⅔", unicode: "U+2154", htmlEntity: "&#8532;", htmlCode: "&#8532;", cssCode: "\\2154", jsCode: "\\u2154" },
      { name: "Superscript 1", char: "¹", unicode: "U+00B9", htmlEntity: "&sup1;", htmlCode: "&#185;", cssCode: "\\00B9", jsCode: "\\u00B9" },
      { name: "Superscript 2", char: "²", unicode: "U+00B2", htmlEntity: "&sup2;", htmlCode: "&#178;", cssCode: "\\00B2", jsCode: "\\u00B2" },
      { name: "Superscript 3", char: "³", unicode: "U+00B3", htmlEntity: "&sup3;", htmlCode: "&#179;", cssCode: "\\00B3", jsCode: "\\u00B3" },
    ],
  },
  {
    name: "Miscellaneous Symbols",
    entities: [
      { name: "Check Mark", char: "✓", unicode: "U+2713", htmlEntity: "&#10003;", htmlCode: "&#10003;", cssCode: "\\2713", jsCode: "\\u2713" },
      { name: "Heavy Check", char: "✔", unicode: "U+2714", htmlEntity: "&#10004;", htmlCode: "&#10004;", cssCode: "\\2714", jsCode: "\\u2714" },
      { name: "Cross Mark", char: "✗", unicode: "U+2717", htmlEntity: "&#10007;", htmlCode: "&#10007;", cssCode: "\\2717", jsCode: "\\u2717" },
      { name: "Heavy Cross", char: "✘", unicode: "U+2718", htmlEntity: "&#10008;", htmlCode: "&#10008;", cssCode: "\\2718", jsCode: "\\u2718" },
      { name: "Star", char: "★", unicode: "U+2605", htmlEntity: "&#9733;", htmlCode: "&#9733;", cssCode: "\\2605", jsCode: "\\u2605" },
      { name: "Star Outline", char: "☆", unicode: "U+2606", htmlEntity: "&#9734;", htmlCode: "&#9734;", cssCode: "\\2606", jsCode: "\\u2606" },
      { name: "Heart", char: "♥", unicode: "U+2665", htmlEntity: "&hearts;", htmlCode: "&#9829;", cssCode: "\\2665", jsCode: "\\u2665" },
      { name: "Diamond", char: "♦", unicode: "U+2666", htmlEntity: "&diams;", htmlCode: "&#9830;", cssCode: "\\2666", jsCode: "\\u2666" },
      { name: "Club", char: "♣", unicode: "U+2663", htmlEntity: "&clubs;", htmlCode: "&#9827;", cssCode: "\\2663", jsCode: "\\u2663" },
      { name: "Spade", char: "♠", unicode: "U+2660", htmlEntity: "&spades;", htmlCode: "&#9824;", cssCode: "\\2660", jsCode: "\\u2660" },
      { name: "Music Note", char: "♪", unicode: "U+266A", htmlEntity: "&#9834;", htmlCode: "&#9834;", cssCode: "\\266A", jsCode: "\\u266A" },
      { name: "Double Note", char: "♫", unicode: "U+266B", htmlEntity: "&#9835;", htmlCode: "&#9835;", cssCode: "\\266B", jsCode: "\\u266B" },
      { name: "Sun", char: "☀", unicode: "U+2600", htmlEntity: "&#9728;", htmlCode: "&#9728;", cssCode: "\\2600", jsCode: "\\u2600" },
      { name: "Cloud", char: "☁", unicode: "U+2601", htmlEntity: "&#9729;", htmlCode: "&#9729;", cssCode: "\\2601", jsCode: "\\u2601" },
      { name: "Umbrella", char: "☂", unicode: "U+2602", htmlEntity: "&#9730;", htmlCode: "&#9730;", cssCode: "\\2602", jsCode: "\\u2602" },
      { name: "Snowflake", char: "❄", unicode: "U+2744", htmlEntity: "&#10052;", htmlCode: "&#10052;", cssCode: "\\2744", jsCode: "\\u2744" },
      { name: "Skull", char: "☠", unicode: "U+2620", htmlEntity: "&#9760;", htmlCode: "&#9760;", cssCode: "\\2620", jsCode: "\\u2620" },
      { name: "Radioactive", char: "☢", unicode: "U+2622", htmlEntity: "&#9762;", htmlCode: "&#9762;", cssCode: "\\2622", jsCode: "\\u2622" },
      { name: "Biohazard", char: "☣", unicode: "U+2623", htmlEntity: "&#9763;", htmlCode: "&#9763;", cssCode: "\\2623", jsCode: "\\u2623" },
      { name: "Peace", char: "☮", unicode: "U+262E", htmlEntity: "&#9774;", htmlCode: "&#9774;", cssCode: "\\262E", jsCode: "\\u262E" },
      { name: "Yin Yang", char: "☯", unicode: "U+262F", htmlEntity: "&#9775;", htmlCode: "&#9775;", cssCode: "\\262F", jsCode: "\\u262F" },
      { name: "Female", char: "♀", unicode: "U+2640", htmlEntity: "&#9792;", htmlCode: "&#9792;", cssCode: "\\2640", jsCode: "\\u2640" },
      { name: "Male", char: "♂", unicode: "U+2642", htmlEntity: "&#9794;", htmlCode: "&#9794;", cssCode: "\\2642", jsCode: "\\u2642" },
      { name: "Scissors", char: "✂", unicode: "U+2702", htmlEntity: "&#9986;", htmlCode: "&#9986;", cssCode: "\\2702", jsCode: "\\u2702" },
      { name: "Phone", char: "☎", unicode: "U+260E", htmlEntity: "&#9742;", htmlCode: "&#9742;", cssCode: "\\260E", jsCode: "\\u260E" },
      { name: "Airplane", char: "✈", unicode: "U+2708", htmlEntity: "&#9992;", htmlCode: "&#9992;", cssCode: "\\2708", jsCode: "\\u2708" },
      { name: "Envelope", char: "✉", unicode: "U+2709", htmlEntity: "&#9993;", htmlCode: "&#9993;", cssCode: "\\2709", jsCode: "\\u2709" },
      { name: "Pencil", char: "✎", unicode: "U+270E", htmlEntity: "&#9998;", htmlCode: "&#9998;", cssCode: "\\270E", jsCode: "\\u270E" },
      { name: "Pointing Right", char: "☞", unicode: "U+261E", htmlEntity: "&#9758;", htmlCode: "&#9758;", cssCode: "\\261E", jsCode: "\\u261E" },
    ],
  },
  {
    name: "Box Drawing",
    entities: [
      { name: "Horizontal", char: "─", unicode: "U+2500", htmlEntity: "&#9472;", htmlCode: "&#9472;", cssCode: "\\2500", jsCode: "\\u2500" },
      { name: "Vertical", char: "│", unicode: "U+2502", htmlEntity: "&#9474;", htmlCode: "&#9474;", cssCode: "\\2502", jsCode: "\\u2502" },
      { name: "Top Left", char: "┌", unicode: "U+250C", htmlEntity: "&#9484;", htmlCode: "&#9484;", cssCode: "\\250C", jsCode: "\\u250C" },
      { name: "Top Right", char: "┐", unicode: "U+2510", htmlEntity: "&#9488;", htmlCode: "&#9488;", cssCode: "\\2510", jsCode: "\\u2510" },
      { name: "Bottom Left", char: "└", unicode: "U+2514", htmlEntity: "&#9492;", htmlCode: "&#9492;", cssCode: "\\2514", jsCode: "\\u2514" },
      { name: "Bottom Right", char: "┘", unicode: "U+2518", htmlEntity: "&#9496;", htmlCode: "&#9496;", cssCode: "\\2518", jsCode: "\\u2518" },
      { name: "T Left", char: "├", unicode: "U+251C", htmlEntity: "&#9500;", htmlCode: "&#9500;", cssCode: "\\251C", jsCode: "\\u251C" },
      { name: "T Right", char: "┤", unicode: "U+2524", htmlEntity: "&#9508;", htmlCode: "&#9508;", cssCode: "\\2524", jsCode: "\\u2524" },
      { name: "T Top", char: "┬", unicode: "U+252C", htmlEntity: "&#9516;", htmlCode: "&#9516;", cssCode: "\\252C", jsCode: "\\u252C" },
      { name: "T Bottom", char: "┴", unicode: "U+2534", htmlEntity: "&#9524;", htmlCode: "&#9524;", cssCode: "\\2534", jsCode: "\\u2534" },
      { name: "Cross", char: "┼", unicode: "U+253C", htmlEntity: "&#9532;", htmlCode: "&#9532;", cssCode: "\\253C", jsCode: "\\u253C" },
      { name: "Double Horizontal", char: "═", unicode: "U+2550", htmlEntity: "&#9552;", htmlCode: "&#9552;", cssCode: "\\2550", jsCode: "\\u2550" },
      { name: "Double Vertical", char: "║", unicode: "U+2551", htmlEntity: "&#9553;", htmlCode: "&#9553;", cssCode: "\\2551", jsCode: "\\u2551" },
      { name: "Block Full", char: "█", unicode: "U+2588", htmlEntity: "&#9608;", htmlCode: "&#9608;", cssCode: "\\2588", jsCode: "\\u2588" },
      { name: "Block Light", char: "░", unicode: "U+2591", htmlEntity: "&#9617;", htmlCode: "&#9617;", cssCode: "\\2591", jsCode: "\\u2591" },
      { name: "Block Medium", char: "▒", unicode: "U+2592", htmlEntity: "&#9618;", htmlCode: "&#9618;", cssCode: "\\2592", jsCode: "\\u2592" },
      { name: "Block Dark", char: "▓", unicode: "U+2593", htmlEntity: "&#9619;", htmlCode: "&#9619;", cssCode: "\\2593", jsCode: "\\u2593" },
    ],
  },
  {
    name: "Accented Letters",
    entities: [
      { name: "A Grave", char: "À", unicode: "U+00C0", htmlEntity: "&Agrave;", htmlCode: "&#192;", cssCode: "\\00C0", jsCode: "\\u00C0" },
      { name: "A Acute", char: "Á", unicode: "U+00C1", htmlEntity: "&Aacute;", htmlCode: "&#193;", cssCode: "\\00C1", jsCode: "\\u00C1" },
      { name: "A Circumflex", char: "Â", unicode: "U+00C2", htmlEntity: "&Acirc;", htmlCode: "&#194;", cssCode: "\\00C2", jsCode: "\\u00C2" },
      { name: "A Tilde", char: "Ã", unicode: "U+00C3", htmlEntity: "&Atilde;", htmlCode: "&#195;", cssCode: "\\00C3", jsCode: "\\u00C3" },
      { name: "A Umlaut", char: "Ä", unicode: "U+00C4", htmlEntity: "&Auml;", htmlCode: "&#196;", cssCode: "\\00C4", jsCode: "\\u00C4" },
      { name: "A Ring", char: "Å", unicode: "U+00C5", htmlEntity: "&Aring;", htmlCode: "&#197;", cssCode: "\\00C5", jsCode: "\\u00C5" },
      { name: "AE Ligature", char: "Æ", unicode: "U+00C6", htmlEntity: "&AElig;", htmlCode: "&#198;", cssCode: "\\00C6", jsCode: "\\u00C6" },
      { name: "C Cedilla", char: "Ç", unicode: "U+00C7", htmlEntity: "&Ccedil;", htmlCode: "&#199;", cssCode: "\\00C7", jsCode: "\\u00C7" },
      { name: "E Grave", char: "È", unicode: "U+00C8", htmlEntity: "&Egrave;", htmlCode: "&#200;", cssCode: "\\00C8", jsCode: "\\u00C8" },
      { name: "E Acute", char: "É", unicode: "U+00C9", htmlEntity: "&Eacute;", htmlCode: "&#201;", cssCode: "\\00C9", jsCode: "\\u00C9" },
      { name: "E Circumflex", char: "Ê", unicode: "U+00CA", htmlEntity: "&Ecirc;", htmlCode: "&#202;", cssCode: "\\00CA", jsCode: "\\u00CA" },
      { name: "E Umlaut", char: "Ë", unicode: "U+00CB", htmlEntity: "&Euml;", htmlCode: "&#203;", cssCode: "\\00CB", jsCode: "\\u00CB" },
      { name: "N Tilde", char: "Ñ", unicode: "U+00D1", htmlEntity: "&Ntilde;", htmlCode: "&#209;", cssCode: "\\00D1", jsCode: "\\u00D1" },
      { name: "O Umlaut", char: "Ö", unicode: "U+00D6", htmlEntity: "&Ouml;", htmlCode: "&#214;", cssCode: "\\00D6", jsCode: "\\u00D6" },
      { name: "O Stroke", char: "Ø", unicode: "U+00D8", htmlEntity: "&Oslash;", htmlCode: "&#216;", cssCode: "\\00D8", jsCode: "\\u00D8" },
      { name: "U Umlaut", char: "Ü", unicode: "U+00DC", htmlEntity: "&Uuml;", htmlCode: "&#220;", cssCode: "\\00DC", jsCode: "\\u00DC" },
      { name: "Sharp S", char: "ß", unicode: "U+00DF", htmlEntity: "&szlig;", htmlCode: "&#223;", cssCode: "\\00DF", jsCode: "\\u00DF" },
      { name: "a grave", char: "à", unicode: "U+00E0", htmlEntity: "&agrave;", htmlCode: "&#224;", cssCode: "\\00E0", jsCode: "\\u00E0" },
      { name: "a acute", char: "á", unicode: "U+00E1", htmlEntity: "&aacute;", htmlCode: "&#225;", cssCode: "\\00E1", jsCode: "\\u00E1" },
      { name: "e acute", char: "é", unicode: "U+00E9", htmlEntity: "&eacute;", htmlCode: "&#233;", cssCode: "\\00E9", jsCode: "\\u00E9" },
      { name: "n tilde", char: "ñ", unicode: "U+00F1", htmlEntity: "&ntilde;", htmlCode: "&#241;", cssCode: "\\00F1", jsCode: "\\u00F1" },
      { name: "o umlaut", char: "ö", unicode: "U+00F6", htmlEntity: "&ouml;", htmlCode: "&#246;", cssCode: "\\00F6", jsCode: "\\u00F6" },
      { name: "u umlaut", char: "ü", unicode: "U+00FC", htmlEntity: "&uuml;", htmlCode: "&#252;", cssCode: "\\00FC", jsCode: "\\u00FC" },
    ],
  },
];

type CodeType = "unicode" | "htmlEntity" | "htmlCode" | "cssCode" | "jsCode" | "char";

export default function HtmlEntitiesReference() {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return ENTITY_DATA.map((category) => ({
      ...category,
      entities: category.entities.filter((entity) => {
        if (!query) return true;
        return (
          entity.name.toLowerCase().includes(query) ||
          entity.char.includes(query) ||
          entity.htmlEntity.toLowerCase().includes(query) ||
          entity.unicode.toLowerCase().includes(query)
        );
      }),
    })).filter((category) => {
      if (selectedCategory && category.name !== selectedCategory) return false;
      return category.entities.length > 0;
    });
  }, [searchQuery, selectedCategory]);

  const totalEntities = useMemo(() => {
    return ENTITY_DATA.reduce((sum, cat) => sum + cat.entities.length, 0);
  }, []);

  const CopyButton = ({ value, entityName, codeType }: { value: string; entityName: string; codeType: CodeType }) => {
    const id = `${entityName}-${codeType}`;
    const isCopied = copiedId === id;

    return (
      <button
        onClick={() => handleCopy(value, id)}
        className={`${styles.copyBtn} ${isCopied ? styles.copied : ""}`}
        title={`Copy ${value}`}
      >
        {isCopied ? (
          <CheckIcon className={styles.copyIcon} />
        ) : (
          <ClipboardDocumentIcon className={styles.copyIcon} />
        )}
      </button>
    );
  };

  return (
    <div className={styles.container}>
      {/* Search and Filter Bar */}
      <div className={`flex flex-wrap gap-4 mb-6 max-sm:flex-col ${styles.controlsBar}`}>
        <div className={`flex-1 ${styles.searchWrapper}`}>
          <MagnifyingGlassIcon className={styles.searchIcon} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entities by name, character, or code..."
            className={styles.searchInput}
          />
        </div>
        <div className={styles.categoryFilter}>
          <select
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className={styles.categorySelect}
          >
            <option value="">All Categories ({totalEntities})</option>
            {ENTITY_DATA.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name} ({cat.entities.length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className={`flex flex-wrap gap-4 p-4 mb-6 text-xs ${styles.legend}`}>
        <span className={styles.legendItem}><strong>Unicode:</strong> Universal character code</span>
        <span className={styles.legendItem}><strong>Entity:</strong> Named HTML entity</span>
        <span className={styles.legendItem}><strong>HTML:</strong> Numeric HTML code</span>
        <span className={styles.legendItem}><strong>CSS:</strong> For content property</span>
        <span className={styles.legendItem}><strong>JS:</strong> JavaScript escape</span>
      </div>

      {/* Entity Categories */}
      {filteredData.map((category) => (
        <div key={category.name} className={`mb-8 ${styles.categorySection}`}>
          <h2 className={`text-xl font-semibold mb-4 pb-2 ${styles.categoryTitle}`}>{category.name}</h2>
          <div className={`grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] max-sm:grid-cols-1 gap-4 ${styles.entitiesGrid}`}>
            {category.entities.map((entity) => (
              <div key={`${category.name}-${entity.name}`} className={styles.entityCard}>
                <div className={`flex items-center gap-3 mb-3 pb-3 ${styles.entityHeader}`}>
                  <span className={styles.entityChar}>{entity.char}</span>
                  <span className={styles.entityName}>{entity.name}</span>
                </div>
                <div className={`flex flex-col gap-1.5 ${styles.codesGrid}`}>
                  <div className={`grid grid-cols-[50px_1fr_auto] items-center gap-2 py-1 ${styles.codeRow}`}>
                    <span className={styles.codeLabel}>Unicode</span>
                    <code className={styles.codeValue}>{entity.unicode}</code>
                    <CopyButton value={entity.unicode} entityName={entity.name} codeType="unicode" />
                  </div>
                  <div className={`grid grid-cols-[50px_1fr_auto] items-center gap-2 py-1 ${styles.codeRow}`}>
                    <span className={styles.codeLabel}>Entity</span>
                    <code className={styles.codeValue}>{entity.htmlEntity}</code>
                    <CopyButton value={entity.htmlEntity} entityName={entity.name} codeType="htmlEntity" />
                  </div>
                  <div className={`grid grid-cols-[50px_1fr_auto] items-center gap-2 py-1 ${styles.codeRow}`}>
                    <span className={styles.codeLabel}>HTML</span>
                    <code className={styles.codeValue}>{entity.htmlCode}</code>
                    <CopyButton value={entity.htmlCode} entityName={entity.name} codeType="htmlCode" />
                  </div>
                  <div className={`grid grid-cols-[50px_1fr_auto] items-center gap-2 py-1 ${styles.codeRow}`}>
                    <span className={styles.codeLabel}>CSS</span>
                    <code className={styles.codeValue}>{entity.cssCode}</code>
                    <CopyButton value={entity.cssCode} entityName={entity.name} codeType="cssCode" />
                  </div>
                  <div className={`grid grid-cols-[50px_1fr_auto] items-center gap-2 py-1 ${styles.codeRow}`}>
                    <span className={styles.codeLabel}>JS</span>
                    <code className={styles.codeValue}>{entity.jsCode}</code>
                    <CopyButton value={entity.jsCode} entityName={entity.name} codeType="jsCode" />
                  </div>
                  <div className={`grid grid-cols-[50px_1fr_auto] items-center gap-2 py-1 ${styles.codeRow} ${styles.charRow}`}>
                    <span className={styles.codeLabel}>Char</span>
                    <code className={styles.codeValue}>{entity.char}</code>
                    <CopyButton value={entity.char} entityName={entity.name} codeType="char" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filteredData.length === 0 && (
        <div className={`text-center p-12 ${styles.noResults}`}>
          <p>No entities found matching &quot;{searchQuery}&quot;</p>
        </div>
      )}
    </div>
  );
}
