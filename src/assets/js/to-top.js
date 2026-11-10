/* The back-to-top button, on the home page and the scripture index.
 *
 * Its own file rather than a block inside search.js, where it started. That
 * script returns early when the devo list is not on the page, so moving the
 * button to the scripture index without moving this would have shipped the
 * markup with no behaviour attached to it.
 *
 * The button starts hidden in the markup: without this script it would not
 * do anything, so it should not be there to press. */
(function () {
  "use strict";

  var btn = document.getElementById("to-top");
  if (!btn) return;

  btn.hidden = false;

  var show = function () {
    btn.classList.toggle("is-shown", window.scrollY > 320);
  };
  show();
  window.addEventListener("scroll", show, { passive: true });

  btn.addEventListener("click", function () {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    // The home page puts the caret back in the search box; the scripture
    // index names nothing and simply scrolls.
    var id = btn.getAttribute("data-focus");
    var el = id && document.getElementById(id);
    if (el) el.focus({ preventScroll: true });
  });
})();
