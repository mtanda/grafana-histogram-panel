'use strict';

System.register(['angular', 'jquery', 'moment', 'lodash', 'app/core/utils/kbn', './histogram_tooltip.js', 'jquery.flot', 'jquery.flot.selection', 'jquery.flot.time', 'jquery.flot.stack', 'jquery.flot.stackpercent', 'jquery.flot.fillbelow', 'jquery.flot.crosshair', 'app/plugins/panel/graph/jquery.flot.events'], function (_export, _context) {
  var angular, $, moment, _, kbn, HistogramTooltip;

  return {
    setters: [function (_angular) {
      angular = _angular.default;
    }, function (_jquery) {
      $ = _jquery.default;
    }, function (_moment) {
      moment = _moment.default;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_appCoreUtilsKbn) {
      kbn = _appCoreUtilsKbn.default;
    }, function (_histogram_tooltipJs) {
      HistogramTooltip = _histogram_tooltipJs.default;
    }, function (_jqueryFlot) {}, function (_jqueryFlotSelection) {}, function (_jqueryFlotTime) {}, function (_jqueryFlotStack) {}, function (_jqueryFlotStackpercent) {}, function (_jqueryFlotFillbelow) {}, function (_jqueryFlotCrosshair) {}, function (_appPluginsPanelGraphJqueryFlotEvents) {}],
    execute: function () {

      angular.module('grafana.directives').directive('grafanaHistogram', function ($rootScope, timeSrv) {
        return {
          restrict: 'A',
          template: '<div> </div>',
          link: function link(scope, elem) {
            var ctrl = scope.ctrl;
            var dashboard = ctrl.dashboard;
            var panel = ctrl.panel;
            var data, annotations;
            var sortedSeries;
            var legendSideLastValue = null;
            var rootScope = scope.$root;

            rootScope.onAppEvent('setCrosshair', function (event, info) {
              // do not need to to this if event is from this panel
              if (info.scope === scope) {
                return;
              }

              if (dashboard.sharedCrosshair) {
                var plot = elem.data().plot;
                if (plot) {
                  plot.setCrosshair({ x: info.pos.x, y: info.pos.y });
                }
              }
            }, scope);

            rootScope.onAppEvent('clearCrosshair', function () {
              var plot = elem.data().plot;
              if (plot) {
                plot.clearCrosshair();
              }
            }, scope);

            // Receive render events
            ctrl.events.on('render', function (renderData) {
              data = renderData || data;
              if (!data) {
                ctrl.refresh();
                return;
              }
              annotations = data.annotations || annotations;
              render_panel();
            });

            function getLegendHeight(panelHeight) {
              if (!panel.legend.show || panel.legend.rightSide) {
                return 2;
              }

              if (panel.legend.alignAsTable) {
                var legendSeries = _.filter(data, function (series) {
                  return series.hideFromLegend(panel.legend) === false;
                });
                var total = 23 + 22 * legendSeries.length;
                return Math.min(total, Math.floor(panelHeight / 2));
              } else {
                return 26;
              }
            }

            function setElementHeight() {
              try {
                var height = ctrl.height - getLegendHeight(ctrl.height);
                elem.css('height', height + 'px');

                return true;
              } catch (e) {
                // IE throws errors sometimes
                console.log(e);
                return false;
              }
            }

            function shouldAbortRender() {
              if (!data) {
                return true;
              }

              if (!setElementHeight()) {
                return true;
              }

              if (_.isString(data)) {
                render_panel_as_graphite_png(data);
                return true;
              }

              if (elem.width() === 0) {
                return true;
              }
            }

            function drawHook(plot) {
              // Update legend values
              var yaxis = plot.getYAxes();
              for (var i = 0; i < data.length; i++) {
                var series = data[i];
                var axis = yaxis[series.yaxis - 1];
                var formater = kbn.valueFormats[panel.yaxes[series.yaxis - 1].format];

                // decimal override
                if (_.isNumber(panel.decimals)) {
                  series.updateLegendValues(formater, panel.decimals, null);
                } else {
                  // auto decimals
                  // legend and tooltip gets one more decimal precision
                  // than graph legend ticks
                  var tickDecimals = (axis.tickDecimals || -1) + 1;
                  series.updateLegendValues(formater, tickDecimals, axis.scaledDecimals + 2);
                }

                if (!rootScope.$$phase) {
                  scope.$digest();
                }
              }

              // add left axis labels
              if (panel.yaxes[0].label) {
                var yaxisLabel = $("<div class='axisLabel left-yaxis-label'></div>").text(panel.yaxes[0].label).appendTo(elem);

                yaxisLabel.css("margin-top", yaxisLabel.width() / 2);
              }

              // add right axis labels
              if (panel.yaxes[1].label) {
                var rightLabel = $("<div class='axisLabel right-yaxis-label'></div>").text(panel.yaxes[1].label).appendTo(elem);

                rightLabel.css("margin-top", rightLabel.width() / 2);
              }
            }

            function processOffsetHook(plot, gridMargin) {
              var left = panel.yaxes[0];
              var right = panel.yaxes[1];
              if (left.show && left.label) {
                gridMargin.left = 20;
              }
              if (right.show && right.label) {
                gridMargin.right = 20;
              }
            }

            function getHistogramPairs(series, fillStyle, bucketSize, minValue, maxValue) {
              if (bucketSize === null || bucketSize <= 0) {
                bucketSize = 1;
              }

              series.yaxis = 1; // TODO check
              series.stats.total = 0;
              series.stats.max = Number.MIN_VALUE;
              series.stats.min = Number.MAX_VALUE;
              series.stats.avg = null;
              series.stats.current = null;
              var ignoreNulls = fillStyle === 'connected' || fillStyle === 'null';
              var nullAsZero = fillStyle === 'null as zero';
              var values = {};
              var currentValue;
              var filterMin = false;
              var filterMax = false;
              if (_.isNumber(minValue) && !isNaN(minValue)) {
                values[minValue] = [minValue, 0];
                filterMin = true;
              }
              if (_.isNumber(maxValue) && !isNaN(maxValue)) {
                values[maxValue] = [maxValue, 0];
                filterMax = true;
              }
              for (var i = 0; i < series.datapoints.length; i++) {
                currentValue = series.datapoints[i][0];
                if (currentValue === null) {
                  if (ignoreNulls) {
                    continue;
                  }
                  if (nullAsZero) {
                    currentValue = 0;
                  }
                }
                if (_.isNumber(currentValue)) {
                  series.stats.total += currentValue;
                }
                if (currentValue > series.stats.max) {
                  series.stats.max = currentValue;
                }
                if (currentValue < series.stats.min) {
                  series.stats.min = currentValue;
                }
                if (filterMin && currentValue < minValue) continue;
                if (filterMax && currentValue > maxValue) continue;

                var bucket = Math.floor(currentValue / bucketSize) * bucketSize;
                if (bucket in values) {
                  values[bucket][1]++;
                } else {
                  values[bucket] = [bucket, 1];
                }
              }

              var result = _.sortBy(values, function (x) {
                return x[0];
              });
              series.stats.timeStep = bucketSize;
              if (series.stats.max === Number.MIN_VALUE) {
                series.stats.max = null;
              }
              if (series.stats.min === Number.MAX_VALUE) {
                series.stats.min = null;
              }
              if (result.length) {
                var count = _.reduce(_.values(values), function (memo, num) {
                  return memo + num;
                }, 0);
                series.stats.avg = series.stats.total / count;
                series.stats.current = currentValue;
              }
              series.stats.count = result.length;
              return result;
            }

            // Function for rendering panel
            function render_panel() {
              if (shouldAbortRender()) {
                return;
              }

              var stack = panel.stack ? true : null;

              // Populate element
              var options = {
                hooks: {
                  draw: [drawHook],
                  processOffset: [processOffsetHook]
                },
                legend: { show: false },
                series: {
                  stackpercent: panel.stack ? panel.percentage : false,
                  stack: panel.percentage ? null : stack,
                  bars: {
                    show: true,
                    fill: 1,
                    barWidth: 1,
                    zero: false,
                    lineWidth: 0,
                    align: 'center'
                  },
                  shadowSize: 0
                },
                yaxes: [],
                xaxis: {},
                grid: {
                  minBorderMargin: 0,
                  markings: [],
                  backgroundColor: null,
                  borderWidth: 0,
                  hoverable: true,
                  color: '#c8c8c8',
                  margin: { left: 0, right: 0 }
                },
                selection: {
                  mode: "x",
                  color: '#666'
                },
                crosshair: {
                  mode: panel.tooltip.shared || dashboard.sharedCrosshair ? "x" : null
                }
              };

              var scopedVars = ctrl.panel.scopedVars;
              var bucketSize = !panel.bucketSize && panel.bucketSize !== 0 ? null : parseFloat(ctrl.templateSrv.replaceWithText(panel.bucketSize.toString(), scopedVars));
              var minValue = !panel.minValue && panel.minValue !== 0 ? null : parseFloat(ctrl.templateSrv.replaceWithText(panel.minValue.toString(), scopedVars));
              var maxValue = !panel.maxValue && panel.maxValue !== 0 ? null : parseFloat(ctrl.templateSrv.replaceWithText(panel.maxValue.toString(), scopedVars));

              switch (panel.bucketMode) {
                case 'count':
                  bucketSize = (maxValue - minValue) / bucketSize;
                  break;
              }

              for (var i = 0; i < data.length; i++) {
                var series = data[i];
                series.data = getHistogramPairs(series, series.nullPointMode || panel.nullPointMode, bucketSize || 1, minValue, maxValue);

                // if hidden remove points and disable stack
                if (ctrl.hiddenSeries[series.alias]) {
                  series.data = [];
                  series.stack = false;
                }
              }

              if (data.length && data[0].stats.timeStep) {
                options.series.bars.barWidth = data[0].stats.timeStep / 1.5;
              }

              addHistogramAxis(options);
              options.selection = {};

              sortedSeries = _.sortBy(data, function (series) {
                return series.zindex;
              });

              function callPlot(incrementRenderCounter) {
                try {
                  $.plot(elem, sortedSeries, options);
                } catch (e) {
                  console.log('flotcharts error', e);
                }

                if (incrementRenderCounter) {
                  ctrl.renderingCompleted();
                }
              }

              if (shouldDelayDraw(panel)) {
                // temp fix for legends on the side, need to render twice to get dimensions right
                callPlot(false);
                setTimeout(function () {
                  callPlot(true);
                }, 50);
                legendSideLastValue = panel.legend.rightSide;
              } else {
                callPlot(true);
              }
            }

            function translateFillOption(fill) {
              return fill === 0 ? 0.001 : fill / 10;
            }

            function shouldDelayDraw(panel) {
              if (panel.legend.rightSide) {
                return true;
              }
              if (legendSideLastValue !== null && panel.legend.rightSide !== legendSideLastValue) {
                return true;
              }
            }

            function addHistogramAxis(options) {
              options.xaxis = {
                show: panel['x-axis'],
                label: "Values"
              };
            }

            function applyLogScale(axis, data) {
              if (axis.logBase === 1) {
                return;
              }

              var series, i;
              var max = axis.max;

              if (max === null) {
                for (i = 0; i < data.length; i++) {
                  series = data[i];
                  if (series.yaxis === axis.index) {
                    if (max < series.stats.max) {
                      max = series.stats.max;
                    }
                  }
                }
                if (max === void 0) {
                  max = Number.MAX_VALUE;
                }
              }

              axis.min = axis.min !== null ? axis.min : 0;
              axis.ticks = [0, 1];
              var nextTick = 1;

              while (true) {
                nextTick = nextTick * axis.logBase;
                axis.ticks.push(nextTick);
                if (nextTick > max) {
                  break;
                }
              }

              if (axis.logBase === 10) {
                axis.transform = function (v) {
                  return Math.log(v + 0.1);
                };
                axis.inverseTransform = function (v) {
                  return Math.pow(10, v);
                };
              } else {
                axis.transform = function (v) {
                  return Math.log(v + 0.1) / Math.log(axis.logBase);
                };
                axis.inverseTransform = function (v) {
                  return Math.pow(axis.logBase, v);
                };
              }
            }

            function configureAxisMode(axis, format) {
              axis.tickFormatter = function (val, axis) {
                return kbn.valueFormats[format](val, axis.tickDecimals, axis.scaledDecimals);
              };
            }

            function time_format(ticks, min, max) {
              if (min && max && ticks) {
                var range = max - min;
                var secPerTick = range / ticks / 1000;
                var oneDay = 86400000;
                var oneYear = 31536000000;

                if (secPerTick <= 45) {
                  return "%H:%M:%S";
                }
                if (secPerTick <= 7200 || range <= oneDay) {
                  return "%H:%M";
                }
                if (secPerTick <= 80000) {
                  return "%m/%d %H:%M";
                }
                if (secPerTick <= 2419200 || range <= oneYear) {
                  return "%m/%d";
                }
                return "%Y-%m";
              }

              return "%H:%M";
            }

            function render_panel_as_graphite_png(url) {
              url += '&width=' + elem.width();
              url += '&height=' + elem.css('height').replace('px', '');
              url += '&bgcolor=1f1f1f'; // @grayDarker & @grafanaPanelBackground
              url += '&fgcolor=BBBFC2'; // @textColor & @grayLighter
              url += panel.stack ? '&areaMode=stacked' : '';
              url += panel.fill !== 0 ? '&areaAlpha=' + (panel.fill / 10).toFixed(1) : '';
              url += panel.linewidth !== 0 ? '&lineWidth=' + panel.linewidth : '';
              url += panel.legend.show ? '&hideLegend=false' : '&hideLegend=true';
              url += panel.grid.leftMin !== null ? '&yMin=' + panel.grid.leftMin : '';
              url += panel.grid.leftMax !== null ? '&yMax=' + panel.grid.leftMax : '';
              url += panel.grid.rightMin !== null ? '&yMin=' + panel.grid.rightMin : '';
              url += panel.grid.rightMax !== null ? '&yMax=' + panel.grid.rightMax : '';
              url += panel['x-axis'] ? '' : '&hideAxes=true';
              url += panel['y-axis'] ? '' : '&hideYAxis=true';

              switch (panel.yaxes[0].format) {
                case 'bytes':
                  url += '&yUnitSystem=binary';
                  break;
                case 'bits':
                  url += '&yUnitSystem=binary';
                  break;
                case 'bps':
                  url += '&yUnitSystem=si';
                  break;
                case 'pps':
                  url += '&yUnitSystem=si';
                  break;
                case 'Bps':
                  url += '&yUnitSystem=si';
                  break;
                case 'short':
                  url += '&yUnitSystem=si';
                  break;
                case 'joule':
                  url += '&yUnitSystem=si';
                  break;
                case 'watt':
                  url += '&yUnitSystem=si';
                  break;
                case 'ev':
                  url += '&yUnitSystem=si';
                  break;
                case 'none':
                  url += '&yUnitSystem=none';
                  break;
              }

              switch (panel.nullPointMode) {
                case 'connected':
                  url += '&lineMode=connected';
                  break;
                case 'null':
                  break; // graphite default lineMode
                case 'null as zero':
                  url += "&drawNullAsZero=true";
                  break;
              }

              url += panel.steppedLine ? '&lineMode=staircase' : '';

              elem.html('<img src="' + url + '"></img>');
            }

            new HistogramTooltip(elem, dashboard, scope, function () {
              return sortedSeries;
            });

            elem.bind("plotselected", function (event, ranges) {
              scope.$apply(function () {
                timeSrv.setTime({
                  from: moment.utc(ranges.xaxis.from),
                  to: moment.utc(ranges.xaxis.to)
                });
              });
            });
          }
        };
      });
    }
  };
});
//# sourceMappingURL=histogram.js.map
