/* ==========================================================================
   Parallax Calculator - simulation logic
   HTML5 port of parallaxDiagram001.swf (ActionScript 1, frame 1 DoAction).

   The original sim is a single frame holding a static diagram plus three
   editable text fields - arcsecField, parsecField, lightyearField - wired
   together by onChanged handlers. All of the arithmetic below is a verbatim
   port of that ActionScript; see CONVERSION_NOTES.md for the mapping.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     Constants ported verbatim from the ActionScript
     ------------------------------------------------------------------------ */

  // ly_in_pc = 3.26;      1 parsec (pc) = 3.26 lightyears (ly)
  var LY_IN_PC = 3.26;

  // The original writes the literal string "..." into a field whose value
  // cannot be computed (division by zero, or a non-numeric entry).
  var ELLIPSIS = '...';

  // arcsecField.restrict = "0123456789.";  (same for the other two fields)
  var RESTRICT = /[^0-9.]/g;

  // Initial contents of the three fields on the original stage.
  var INITIAL = {
    'arcsec-field':    '1',
    'parsec-field':    '1',
    'lightyear-field': '3.26'
  };

  // Step used by the arrow keys / mouse wheel when a field is empty or zero
  // and so has no significant digit to step. (Keyboard support is an
  // accessibility addition; the original was pointer-and-typing only.)
  var BASE_STEP = {
    'arcsec-field':    0.01,
    'parsec-field':    0.1,
    'lightyear-field': 0.1
  };

  var ANNOUNCE_DELAY_MS = 700;

  /* ------------------------------------------------------------------------
     Math.toSigDigits - verbatim port of the AS1 prototype extension.

         num2 = round( num * 10^(digits - 1 - floor(log10(num))) )
                / 10^(digits - 1 - floor(log10(num)))

     2.302585092994046 is ln(10); the original divides by it to get log10.
     ------------------------------------------------------------------------ */

  function toSigDigits(value, digits) {
    var num  = parseFloat(value);
    var digs = Math.abs(parseInt(digits, 10));

    if (!isFinite(digs) || !isFinite(num)) { return NaN; }
    if (num === 0 || digs === 0)           { return 0;   }
    if (digs > 15)                         { digs = 15;  }

    var sign = 1;
    if (num < 0) { sign = -1; num = Math.abs(num); }

    var tmp  = Math.floor(Math.log(num) / 2.302585092994046);
    var fact = Math.pow(10, digs - (1 + tmp));
    var num2 = Math.round(fact * num) / fact;

    return sign * num2;
  }

  /* ------------------------------------------------------------------------
     Single source of truth: the three fields. Every path - typing, arrow
     keys, mouse wheel, Reset - writes through the same three handlers, so
     the boxes, the live region and the display never drift apart.
     ------------------------------------------------------------------------ */

  var fields  = {};
  var srStatus;
  var announceTimer = null;

  function text(id)      { return fields[id].value; }
  function setText(id, v) { fields[id].value = v;   }

  // arcsecField.onChanged: d = 1 / pi
  function arcsecChanged() {
    var tmp = 1 / parseFloat(text('arcsec-field'));

    if (isFinite(tmp) && !isNaN(tmp)) {
      setText('parsec-field',    String(toSigDigits(tmp, 3)));
      setText('lightyear-field', String(toSigDigits(LY_IN_PC * tmp, 3)));
    } else {
      setText('parsec-field',    ELLIPSIS);
      setText('lightyear-field', ELLIPSIS);
    }
  }

  // parsecField.onChanged: pi = 1 / d,  ly = 3.26 * d
  function parsecChanged() {
    var tmp = parseFloat(text('parsec-field'));

    if (isFinite(tmp) && !isNaN(tmp)) {
      if (tmp === 0) {
        setText('arcsec-field',    ELLIPSIS);
        setText('lightyear-field', '0');
      } else {
        setText('arcsec-field',    String(toSigDigits(1 / tmp, 3)));
        setText('lightyear-field', String(toSigDigits(LY_IN_PC * tmp, 3)));
      }
    } else {
      setText('arcsec-field',    ELLIPSIS);
      setText('lightyear-field', ELLIPSIS);
    }
  }

  // lightyearField.onChanged: pi = 3.26 / ly,  d = ly / 3.26
  function lightyearChanged() {
    var tmp = parseFloat(text('lightyear-field'));

    if (isFinite(tmp) && !isNaN(tmp)) {
      if (tmp === 0) {
        setText('arcsec-field', ELLIPSIS);
        setText('parsec-field', '0');
      } else {
        setText('arcsec-field', String(toSigDigits(LY_IN_PC / tmp, 3)));
        setText('parsec-field', String(toSigDigits(tmp / LY_IN_PC, 3)));
      }
    } else {
      setText('arcsec-field', ELLIPSIS);
      setText('parsec-field', ELLIPSIS);
    }
  }

  var CHANGED = {
    'arcsec-field':    arcsecChanged,
    'parsec-field':    parsecChanged,
    'lightyear-field': lightyearChanged
  };

  /* ------------------------------------------------------------------------
     Screen-reader narration. Announced once a change has settled, never on
     every keystroke, and always with the quantity name and its unit.
     ------------------------------------------------------------------------ */

  function spoken(value, singular, plural) {
    if (value === ELLIPSIS || value === '') { return 'not defined'; }
    return value + ' ' + (value === '1' ? singular : plural);
  }

  function statusSentence() {
    return 'Parallax angle ' +
           spoken(text('arcsec-field'), 'arcsecond', 'arcseconds') +
           '. Distance ' +
           spoken(text('parsec-field'), 'parsec', 'parsecs') +
           ', or ' +
           spoken(text('lightyear-field'), 'lightyear', 'lightyears') + '.';
  }

  function announce(prefix) {
    if (!srStatus) { return; }
    srStatus.textContent = (prefix || '') + statusSentence();
  }

  function scheduleAnnounce(prefix) {
    if (announceTimer) { clearTimeout(announceTimer); }
    announceTimer = setTimeout(function () {
      announceTimer = null;
      announce(prefix);
    }, ANNOUNCE_DELAY_MS);
  }

  /* ------------------------------------------------------------------------
     Input handling
     ------------------------------------------------------------------------ */

  // arcsecField.restrict = "0123456789."  -  drop anything else the user
  // types or pastes, keeping the caret where they left it.
  function applyRestrict(el) {
    var cleaned = el.value.replace(RESTRICT, '');
    if (cleaned === el.value) { return; }

    var removed = el.value.length - cleaned.length;
    var caret   = (el.selectionStart === null) ? cleaned.length
                                               : el.selectionStart - removed;
    el.value = cleaned;
    try { el.setSelectionRange(caret, caret); } catch (err) { /* not selectable */ }
  }

  function onFieldInput(event) {
    var el = event.currentTarget;
    applyRestrict(el);
    CHANGED[el.id]();
    scheduleAnnounce();
  }

  // arcsecField.onSetFocus: a field showing "..." is cleared so the reader
  // can type straight into it.
  function onFieldFocus(event) {
    var el = event.currentTarget;
    if (el.value === ELLIPSIS) { el.value = ''; }
  }

  /* ------------------------------------------------------------------------
     Keyboard and mouse-wheel stepping (accessibility addition).

     The step scales with the value - it is one unit in the second significant
     digit - so a field reads naturally at any magnitude: 1 -> 1.1, but
     0.005 -> 0.0051. Page Up and Page Down move ten steps. Values are never
     taken below zero.
     ------------------------------------------------------------------------ */

  function stepSize(el, value) {
    if (!(value > 0)) { return BASE_STEP[el.id]; }
    // one unit in the second significant digit
    return Math.pow(10, Math.floor(Math.log(value) / Math.LN10) - 1);
  }

  function step(el, direction, multiplier) {
    var value = parseFloat(el.value);
    if (!isFinite(value)) { value = 0; }

    var next = value + direction * multiplier * stepSize(el, value);
    next = toSigDigits(next, 3);

    if (!isFinite(next) || next < 0) { next = 0; }

    el.value = String(next);
    CHANGED[el.id]();
    scheduleAnnounce();
  }

  function onFieldKeyDown(event) {
    var el = event.currentTarget;
    var handled = true;

    switch (event.key) {
      case 'ArrowUp':   step(el,  1,  1); break;
      case 'ArrowDown': step(el, -1,  1); break;
      case 'PageUp':    step(el,  1, 10); break;
      case 'PageDown':  step(el, -1, 10); break;
      default:          handled = false;
    }

    if (handled) { event.preventDefault(); }
  }

  // Wheel steps the value only while the field actually holds focus, so
  // scrolling the page over a field never changes it by accident.
  function onFieldWheel(event) {
    var el = event.currentTarget;
    if (document.activeElement !== el || event.deltaY === 0) { return; }

    event.preventDefault();
    step(el, event.deltaY < 0 ? 1 : -1, 1);
  }

  /* ------------------------------------------------------------------------
     Reset - driven by the shared masthead's "sim-reset" event. Restores the
     exact initial state of the original stage.
     ------------------------------------------------------------------------ */

  function resetSim() {
    Object.keys(INITIAL).forEach(function (id) { setText(id, INITIAL[id]); });
    if (announceTimer) { clearTimeout(announceTimer); announceTimer = null; }
    announce('Calculator reset. ');
  }

  /* ------------------------------------------------------------------------
     Equations. All mathematics on this page is typeset by MathJax through
     the foundation helper klunlShowEquation(), which also feeds the paired
     screen-reader description elements.
     ------------------------------------------------------------------------ */

  var EQUATIONS = [
    // [ element id, LaTeX ]   ( '' is TeX for the double-prime arcsecond mark )
    ['eqn-d',          "d"],
    ['eqn-eq-1',       "="],
    ['eqn-eq-2',       "="],
    ['eqn-eq-3',       "="],
    ['eqn-eq-4',       "="],
    ['eqn-frac1-num',  "1"],
    ['eqn-frac1-den',  "\\pi\\,''"],
    ['eqn-frac2-num',  "1"],
    ['unit-arcsec',    "''"],
    ['unit-parsec',    "\\mathrm{pc}"],
    ['unit-lightyear', "\\mathrm{ly}"],
    ['note-pi',        "\\pi"],
    ['note-arcsec',    "''"],
    ['note-conversion',
     "1\\ \\text{parsec (pc)} = 3.26\\ \\text{lightyears (ly)}"],
    ['label-d',        "d"],
    ['label-au',       "1\\ \\mathrm{AU}"],
    ['label-pi-star',  "\\pi"],
    ['label-pi-sky',   "\\pi"]
  ];

  // Redefines the foundation's placeholder hook (kl-unl.js) so this sim owns
  // its own equation set-up, exactly as that file intends.
  window.klunlInitEqn = function () {
    EQUATIONS.forEach(function (item, index) {
      if (index === 0) {
        // The head of the formula carries the spoken description of the
        // whole relationship, and of the figure it refers to.
        klunlShowEquation(
          [item[0], '\\(' + item[1] + '\\)'],
          ['eqn-sr-description',
           'The distance d to a star equals 1 divided by its parallax angle ' +
           'measured in arcseconds. The result is in parsecs; multiplying it ' +
           'by 3.26 gives the distance in lightyears.']
        );
      } else {
        klunlShowEquation([item[0], '\\(' + item[1] + '\\)']);
      }
    });
  };

  /* ------------------------------------------------------------------------
     Keep typeset mathematics out of the Tab order. It is content to read,
     not a control to operate; the MathJax context menu still works, and the
     assistive MathML still reaches screen readers.
     ------------------------------------------------------------------------ */

  function untabMath() {
    var nodes = document.querySelectorAll(
      'mjx-container[tabindex], mjx-container svg[tabindex], mjx-container g[tabindex]'
    );
    Array.prototype.forEach.call(nodes, function (node) {
      node.setAttribute('tabindex', '-1');
    });
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */

  function boot() {
    srStatus = document.getElementById('sr-status');

    Object.keys(INITIAL).forEach(function (id) {
      var el = document.getElementById(id);
      fields[id] = el;

      el.addEventListener('input',   onFieldInput);
      el.addEventListener('focus',   onFieldFocus);
      el.addEventListener('keydown', onFieldKeyDown);
      el.addEventListener('wheel',   onFieldWheel, { passive: false });
    });

    // The masthead dispatches a bubbling, composed "sim-reset" event.
    document.addEventListener('sim-reset', resetSim);

    announce('');

    // Typeset once MathJax has finished starting up, then make sure none of
    // its output has landed in the Tab order.
    var typeset = function () {
      window.klunlInitEqn();
      if (window.MathJax && MathJax.startup && MathJax.startup.promise) {
        MathJax.startup.promise.then(untabMath);
      } else {
        setTimeout(untabMath, 0);
      }
    };

    if (window.MathJax && MathJax.startup && MathJax.startup.promise) {
      MathJax.startup.promise.then(typeset);
    } else {
      typeset();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
