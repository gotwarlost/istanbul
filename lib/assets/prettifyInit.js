/* globals prettyPrint: true */

var initPrettyPrint = (function () {
  "use strict";
  if (typeof prettyPrint === 'function') {
    prettyPrint();
  }
})();

window.addEventListener('load', initPrettyPrint);
