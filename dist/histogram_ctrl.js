'use strict';

System.register(['app/plugins/panel/graph/legend', 'app/plugins/panel/graph/series_overrides_ctrl', './template', 'angular', 'moment', 'app/core/utils/kbn', 'lodash', 'app/core/time_series2', 'app/core/utils/file_export', 'app/plugins/sdk'], function (_export, _context) {
  var template, angular, moment, kbn, _, TimeSeries, fileExport, MetricsPanelCtrl, _createClass, _get, HistogramCtrl;

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
    setters: [function (_appPluginsPanelGraphLegend) {}, function (_appPluginsPanelGraphSeries_overrides_ctrl) {}, function (_template) {
      template = _template.default;
    }, function (_angular) {
      angular = _angular.default;
    }, function (_moment) {
      moment = _moment.default;
    }, function (_appCoreUtilsKbn) {
      kbn = _appCoreUtilsKbn.default;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_appCoreTime_series) {
      TimeSeries = _appCoreTime_series.default;
    }, function (_appCoreUtilsFile_export) {
      fileExport = _appCoreUtilsFile_export;
    }, function (_appPluginsSdk) {
      MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
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

      _get = function get(object, property, receiver) {
        if (object === null) object = Function.prototype;
        var desc = Object.getOwnPropertyDescriptor(object, property);

        if (desc === undefined) {
          var parent = Object.getPrototypeOf(object);

          if (parent === null) {
            return undefined;
          } else {
            return get(parent, property, receiver);
          }
        } else if ("value" in desc) {
          return desc.value;
        } else {
          var getter = desc.get;

          if (getter === undefined) {
            return undefined;
          }

          return getter.call(receiver);
        }
      };

      _export('HistogramCtrl', HistogramCtrl = function (_MetricsPanelCtrl) {
        _inherits(HistogramCtrl, _MetricsPanelCtrl);

        /** @ngInject */

        function HistogramCtrl($scope, $injector, annotationsSrv) {
          _classCallCheck(this, HistogramCtrl);

          var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(HistogramCtrl).call(this, $scope, $injector));

          _this.annotationsSrv = annotationsSrv;
          _this.hiddenSeries = {};
          _this.seriesList = [];
          _this.colors = [];

          var panelDefaults = {
            // datasource name, null = default datasource
            datasource: null,
            // sets client side (flot) or native graphite png renderer (png)
            renderer: 'flot',
            // sets bucket mode (size) for wxact bucket size or (count) to calculate size from min,max and count values
            bucketMode: 'size',
            yaxes: [{
              label: null,
              show: true,
              logBase: 1,
              min: null,
              max: null,
              format: 'short'
            }, {
              label: null,
              show: true,
              logBase: 1,
              min: null,
              max: null,
              format: 'short'
            }],
            xaxis: {
              show: true
            },
            grid: {
              threshold1: null,
              threshold2: null,
              threshold1Color: 'rgba(216, 200, 27, 0.27)',
              threshold2Color: 'rgba(234, 112, 112, 0.22)'
            },
            // show/hide lines
            lines: true,
            // fill factor
            fill: 1,
            // line width in pixels
            linewidth: 2,
            // show hide points
            points: false,
            // point radius in pixels
            pointradius: 5,
            // show hide bars
            bars: false,
            // enable/disable stacking
            stack: false,
            // stack percentage mode
            percentage: false,
            // legend options
            legend: {
              show: true, // disable/enable legend
              values: false, // disable/enable legend values
              min: false,
              max: false,
              current: false,
              total: false,
              avg: false
            },
            // how null points should be handled
            nullPointMode: 'connected',
            // staircase line mode
            steppedLine: false,
            // tooltip options
            tooltip: {
              value_type: 'cumulative',
              shared: true,
              ordering: 'alphabetical',
              msResolution: false
            },
            // time overrides
            timeFrom: null,
            timeShift: null,
            // metric queries
            targets: [{}],
            // series color overrides
            aliasColors: {},
            // other style overrides
            seriesOverrides: []
          };

          _.defaults(_this.panel, panelDefaults);
          _.defaults(_this.panel.tooltip, panelDefaults.tooltip);
          _.defaults(_this.panel.grid, panelDefaults.grid);
          _.defaults(_this.panel.legend, panelDefaults.legend);

          _this.colors = $scope.$root.colors;

          _this.events.on('render', _this.onRender.bind(_this));
          _this.events.on('data-received', _this.onDataReceived.bind(_this));
          _this.events.on('data-error', _this.onDataError.bind(_this));
          _this.events.on('data-snapshot-load', _this.onDataSnapshotLoad.bind(_this));
          _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
          _this.events.on('init-panel-actions', _this.onInitPanelActions.bind(_this));
          return _this;
        }

        _createClass(HistogramCtrl, [{
          key: 'onInitEditMode',
          value: function onInitEditMode() {
            this.addEditorTab('Legend', 'public/app/plugins/panel/graph/tab_legend.html', 2);
            this.addEditorTab('Display', 'public/plugins/mtanda-histogram-panel/tab_display.html', 3);
            this.addEditorTab('Histogram Options', 'public/plugins/mtanda-histogram-panel/tab_options.html', 4);

            this.logScales = {
              'linear': 1,
              'log (base 2)': 2,
              'log (base 10)': 10,
              'log (base 32)': 32,
              'log (base 1024)': 1024
            };
            this.unitFormats = kbn.getUnitFormats();
          }
        }, {
          key: 'onInitPanelActions',
          value: function onInitPanelActions(actions) {
            actions.push({ text: 'Export CSV (series as rows)', click: 'ctrl.exportCsv()' });
            actions.push({ text: 'Export CSV (series as columns)', click: 'ctrl.exportCsvColumns()' });
            actions.push({ text: 'Toggle legend', click: 'ctrl.toggleLegend()' });
          }
        }, {
          key: 'setUnitFormat',
          value: function setUnitFormat(axis, subItem) {
            axis.format = subItem.value;
            this.render();
          }
        }, {
          key: 'issueQueries',
          value: function issueQueries(datasource) {
            this.annotationsPromise = this.annotationsSrv.getAnnotations({
              dashboard: this.dashboard,
              panel: this.panel,
              range: this.range
            });
            return _get(Object.getPrototypeOf(HistogramCtrl.prototype), 'issueQueries', this).call(this, datasource);
          }
        }, {
          key: 'zoomOut',
          value: function zoomOut(evt) {
            this.publishAppEvent('zoom-out', evt);
          }
        }, {
          key: 'onDataSnapshotLoad',
          value: function onDataSnapshotLoad(snapshotData) {
            this.annotationsPromise = this.annotationsSrv.getAnnotations({
              dashboard: this.dashboard,
              panel: this.panel,
              range: this.range
            });
            this.onDataReceived(snapshotData);
          }
        }, {
          key: 'onDataError',
          value: function onDataError(err) {
            this.seriesList = [];
            this.render([]);
          }
        }, {
          key: 'onDataReceived',
          value: function onDataReceived(dataList) {
            var _this2 = this;

            // png renderer returns just a url
            if (_.isString(dataList)) {
              this.render(dataList);
              return;
            }

            this.datapointsWarning = false;
            this.datapointsCount = 0;
            this.datapointsOutside = false;
            this.seriesList = dataList.map(this.seriesHandler.bind(this));
            this.datapointsWarning = this.datapointsCount === 0 || this.datapointsOutside;

            this.annotationsPromise.then(function (annotations) {
              _this2.loading = false;
              _this2.seriesList.annotations = annotations;
              _this2.render(_this2.seriesList);
            }, function () {
              _this2.loading = false;
              _this2.render(_this2.seriesList);
            });
          }
        }, {
          key: 'seriesHandler',
          value: function seriesHandler(seriesData, index) {
            var datapoints = seriesData.datapoints;
            var alias = seriesData.target;
            var colorIndex = index % this.colors.length;
            var color = this.panel.aliasColors[alias] || this.colors[colorIndex];

            var series = new TimeSeries({
              datapoints: datapoints,
              alias: alias,
              color: color,
              unit: seriesData.unit
            });

            if (datapoints && datapoints.length > 0) {
              var last = moment.utc(datapoints[datapoints.length - 1][1]);
              var from = moment.utc(this.range.from);
              if (last - from < -10000) {
                this.datapointsOutside = true;
              }

              this.datapointsCount += datapoints.length;
              this.panel.tooltip.msResolution = this.panel.tooltip.msResolution || series.isMsResolutionNeeded();
            }

            return series;
          }
        }, {
          key: 'onRender',
          value: function onRender() {
            if (!this.seriesList) {
              return;
            }

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = this.seriesList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var series = _step.value;

                series.applySeriesOverrides(this.panel.seriesOverrides);

                if (series.unit) {
                  this.panel.yaxes[series.yaxis - 1].format = series.unit;
                }
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }
          }
        }, {
          key: 'changeSeriesColor',
          value: function changeSeriesColor(series, color) {
            series.color = color;
            this.panel.aliasColors[series.alias] = series.color;
            this.render();
          }
        }, {
          key: 'toggleSeries',
          value: function toggleSeries(serie, event) {
            if (event.ctrlKey || event.metaKey || event.shiftKey) {
              if (this.hiddenSeries[serie.alias]) {
                delete this.hiddenSeries[serie.alias];
              } else {
                this.hiddenSeries[serie.alias] = true;
              }
            } else {
              this.toggleSeriesExclusiveMode(serie);
            }
            this.render();
          }
        }, {
          key: 'toggleSeriesExclusiveMode',
          value: function toggleSeriesExclusiveMode(serie) {
            var _this3 = this;

            var hidden = this.hiddenSeries;

            if (hidden[serie.alias]) {
              delete hidden[serie.alias];
            }

            // check if every other series is hidden
            var alreadyExclusive = _.every(this.seriesList, function (value) {
              if (value.alias === serie.alias) {
                return true;
              }

              return hidden[value.alias];
            });

            if (alreadyExclusive) {
              // remove all hidden series
              _.each(this.seriesList, function (value) {
                delete _this3.hiddenSeries[value.alias];
              });
            } else {
              // hide all but this serie
              _.each(this.seriesList, function (value) {
                if (value.alias === serie.alias) {
                  return;
                }

                _this3.hiddenSeries[value.alias] = true;
              });
            }
          }
        }, {
          key: 'toggleAxis',
          value: function toggleAxis(info) {
            var override = _.findWhere(this.panel.seriesOverrides, { alias: info.alias });
            if (!override) {
              override = { alias: info.alias };
              this.panel.seriesOverrides.push(override);
            }
            info.yaxis = override.yaxis = info.yaxis === 2 ? 1 : 2;
            this.render();
          }
        }, {
          key: 'addSeriesOverride',
          value: function addSeriesOverride(override) {
            this.panel.seriesOverrides.push(override || {});
          }
        }, {
          key: 'removeSeriesOverride',
          value: function removeSeriesOverride(override) {
            this.panel.seriesOverrides = _.without(this.panel.seriesOverrides, override);
            this.render();
          }
        }, {
          key: 'toggleLegend',
          value: function toggleLegend() {
            this.panel.legend.show = !this.panel.legend.show;
            this.refresh();
          }
        }, {
          key: 'legendValuesOptionChanged',
          value: function legendValuesOptionChanged() {
            var legend = this.panel.legend;
            legend.values = legend.min || legend.max || legend.avg || legend.current || legend.total;
            this.render();
          }
        }, {
          key: 'exportCsv',
          value: function exportCsv() {
            fileExport.exportSeriesListToCsv(this.seriesList);
          }
        }, {
          key: 'exportCsvColumns',
          value: function exportCsvColumns() {
            fileExport.exportSeriesListToCsvColumns(this.seriesList);
          }
        }]);

        return HistogramCtrl;
      }(MetricsPanelCtrl));

      _export('HistogramCtrl', HistogramCtrl);

      HistogramCtrl.template = template;
    }
  };
});
//# sourceMappingURL=histogram_ctrl.js.map
