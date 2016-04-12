'use strict';

System.register(['lodash', './histogram_ctrl', './histogram'], function (_export, _context) {
  var _, HistogramCtrl;

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_histogram_ctrl) {
      HistogramCtrl = _histogram_ctrl.HistogramCtrl;
    }, function (_histogram) {}],
    execute: function () {
      _export('PanelCtrl', HistogramCtrl);
    }
  };
});
//# sourceMappingURL=module.js.map
