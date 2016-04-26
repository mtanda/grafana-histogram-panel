'use strict';

System.register(['app/plugins/sdk', 'app/plugins/panel/graph/module', 'app/core/utils/kbn', './template'], function (_export, _context) {
  var MetricsPanelCtrl, GraphCtrl, kbn, template, _createClass, HistogramCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_appPluginsSdk) {
      MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
    }, function (_appPluginsPanelGraphModule) {
      GraphCtrl = _appPluginsPanelGraphModule.GraphCtrl;
    }, function (_appCoreUtilsKbn) {
      kbn = _appCoreUtilsKbn.default;
    }, function (_template) {
      template = _template.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export('HistogramCtrl', HistogramCtrl = function (_GraphCtrl) {
        _inherits(HistogramCtrl, _GraphCtrl);

        /** @ngInject */

        function HistogramCtrl($scope, $injector, $rootScope, annotationsSrv) {
          _classCallCheck(this, HistogramCtrl);

          var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(HistogramCtrl).call(this, $scope, $injector, annotationsSrv));

          _this.$rootScope = $rootScope;
          return _this;
        }

        _createClass(HistogramCtrl, [{
          key: 'onInitEditMode',
          value: function onInitEditMode() {
            this.addEditorTab('Legend', 'public/app/plugins/panel/graph/tab_legend.html', 2);
            this.addEditorTab('Display', 'public/plugins/grafana-histogram-panel/tab_display.html', 3);
            this.addEditorTab('Histogram Options', 'public/plugins/grafana-histogram-panel/tab_options.html', 4);

            this.logScales = {
              'linear': 1,
              'log (base 2)': 2,
              'log (base 10)': 10,
              'log (base 32)': 32,
              'log (base 1024)': 1024
            };
            this.unitFormats = kbn.getUnitFormats();
          }
        }]);

        return HistogramCtrl;
      }(GraphCtrl));

      _export('HistogramCtrl', HistogramCtrl);

      HistogramCtrl.template = template;
    }
  };
});
//# sourceMappingURL=histogram_ctrl.js.map
