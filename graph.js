define([
  'angular',
  'app/app',
  'jquery',
  'lodash',
  'app/core/utils/kbn',
  './graph.tooltip',
  'jquery.flot',
  'jquery.flot.orderBars',
  'jquery.flot.events',
  'jquery.flot.selection',
  'jquery.flot.time',
  'jquery.flot.stack',
  'jquery.flot.stackpercent',
  'jquery.flot.fillbelow'
],
function (angular, app, $, _, kbn, GraphTooltip) {
  'use strict';

  var module = angular.module('grafana.panels.histogram');
  app.useModule(module);

  module.directive('grafanaHistogram', function($rootScope, timeSrv) {
    return {
      restrict: 'A',
      template: '<div> </div>',
      link: function(scope, elem) {
        var dashboard = scope.dashboard;
        var data;
        var sortedSeries;
        var graphHeight;
        var legendSideLastValue = null;

        // Receive render events
        scope.$on('render',function(event, renderData) {
          data = renderData || data;
          if (!data) {
            scope.get_data();
            return;
          }
          render_panel();
        });

        function getLegendHeight(panelHeight) {
          if (!scope.panel.legend.show || scope.panel.legend.rightSide) {
            return 0;
          }
          if (scope.panel.legend.alignAsTable) {
            var total = 30 + (25 * data.length);
            return Math.min(total, Math.floor(panelHeight/2));
          } else {
            return 26;
          }
        }

        function setElementHeight() {
          try {
            graphHeight = scope.height || scope.panel.height || scope.row.height;
            if (_.isString(graphHeight)) {
              graphHeight = parseInt(graphHeight.replace('px', ''), 10);
            }

            graphHeight -= 5; // padding
            graphHeight -= scope.panel.title ? 24 : 9; // subtract panel title bar

            graphHeight = graphHeight - getLegendHeight(graphHeight); // subtract one line legend

            elem.css('height', graphHeight + 'px');

            return true;
          } catch(e) { // IE throws errors sometimes
            return false;
          }
        }

        function shouldAbortRender() {
          if (!data) {
            return true;
          }

          if ($rootScope.fullscreen && !scope.fullscreen) {
            return true;
          }

          if (!setElementHeight()) { return true; }

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
            var formater = kbn.valueFormats[scope.panel.y_formats[series.yaxis - 1]];

            // decimal override
            if (_.isNumber(scope.panel.decimals)) {
              series.updateLegendValues(formater, scope.panel.decimals, null);
            } else {
              // auto decimals
              // legend and tooltip gets one more decimal precision
              // than graph legend ticks
              var tickDecimals = (axis.tickDecimals || -1) + 1;
              series.updateLegendValues(formater, tickDecimals, axis.scaledDecimals + 2);
            }

            if(!scope.$$phase) { scope.$digest(); }
          }

          // add left axis labels
          if (scope.panel.leftYAxisLabel) {
            var yaxisLabel = $("<div class='axisLabel left-yaxis-label'></div>")
              .text(scope.panel.leftYAxisLabel)
              .appendTo(elem);

            yaxisLabel.css("margin-top", yaxisLabel.width() / 2);
          }

          // add right axis labels
          if (scope.panel.rightYAxisLabel) {
            var rightLabel = $("<div class='axisLabel right-yaxis-label'></div>")
              .text(scope.panel.rightYAxisLabel)
              .appendTo(elem);

            rightLabel.css("margin-top", rightLabel.width() / 2);
          }
        }

        function processOffsetHook(plot, gridMargin) {
          if (scope.panel.leftYAxisLabel) { gridMargin.left = 20; }
          if (scope.panel.rightYAxisLabel) { gridMargin.right = 20; }
        }

        function getHistogramPairs(series, fillStyle, bucketSize) {
          var result = [];
          if (bucketSize === null || bucketSize === 0) {
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

          for (var i = 0; i < series.datapoints.length; i++) {
            currentValue = series.datapoints[i][0];
            //currentValue = series.datapoints[i][1];

            if (currentValue === null) {
              if (ignoreNulls) { continue; }
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
            var bucket = (Math.floor(currentValue / bucketSize)*bucketSize).toFixed(3);
            if (bucket in values) {
              values[bucket]++;
            } else {
              values[bucket] = 1;
            }
          }

          _.forEach(Object.keys(values).sort(), function(key) {
            result.push([key, values[key]]);
          });
          series.stats.timeStep = bucketSize;
          if (series.stats.max === Number.MIN_VALUE) { series.stats.max = null; }
          if (series.stats.min === Number.MAX_VALUE) { series.stats.min = null; }

          if (result.length) {
            series.stats.avg = (series.stats.total / result.length);
            series.stats.current = currentValue;
          }

          series.stats.count = result.length;

          result = [];
           _.forEach(series.datapoints, function(item) { result.push([item[1], item[0]]); });
          return result;
        }

        // Function for rendering panel
        function render_panel() {
          if (shouldAbortRender()) {
            return;
          }

          var panel = scope.panel;
          var stack = panel.stack ? true : null;

          // Populate element
          var options = {
            hooks: {
              draw: [drawHook],
              processOffset: [processOffsetHook],
            },
            legend: { show: false },
            series: {
              stackpercent: panel.stack ? panel.percentage : false,
              stack: panel.percentage ? null : stack,
              bars:   {
                show: true,
                //fill: 1,
                barWidth: 0.2,
                //zero: false,
                zero: true,
                lineWidth: 1,
                align: "center"
              },
              shadowSize: 1
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
              margin: { left: 0, right: 0 },
            }
          };

          for (var i = 0; i < data.length; i++) {
            var series = data[i];
            series.applySeriesOverrides(panel.seriesOverrides);
            series.data = getHistogramPairs(series, series.nullPointMode || panel.nullPointMode, panel.bucketSize);

            // if hidden remove points and disable stack
            if (scope.hiddenSeries[series.alias]) {
              series.data = [];
              series.stack = false;
            }
          }

          /*
          if (data.length && data[0].stats.timeStep) {
            options.series.bars.barWidth = data[0].stats.timeStep / 1.5;
          } */
          if (data.length) {
            if (panel.ordered) {
                options.series.bars.barWidth = (1 / data.length) - 0.05;
            } else {
                options.series.bars.barWidth = 0.9;
            }
          }

          addHistogramAxis(options);
          configureAxisOptions(data, options);

          sortedSeries = _.sortBy(data, function(series) { return series.zindex; });

          if (panel.ordered) {
              var order = 0;
              _.forEach(sortedSeries, function(item) {
                item.bars.order = order++;
              });
          }

          function callPlot(incrementRenderCounter) {
            try {
              $.plot(elem, sortedSeries, options);
            } catch (e) {
              console.log('flotcharts error', e);
            }

            if (incrementRenderCounter) {
              scope.panelRenderingComplete();
            }
          }

          if (shouldDelayDraw(panel)) {
            // temp fix for legends on the side, need to render twice to get dimensions right
            callPlot(false);
            setTimeout(function() { callPlot(true); }, 50);
            legendSideLastValue = panel.legend.rightSide;
          }
          else {
            callPlot(true);
          }
        }

        function translateFillOption(fill) {
          return fill === 0 ? 0.001 : fill/10;
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
            show: scope.panel['x-axis'],
            label: "Values"
          };
        }

        function configureAxisOptions(data, options) {
          var defaults = {
            position: 'left',
            show: scope.panel['y-axis'],
            min: scope.panel.grid.leftMin,
            index: 1,
            logBase: scope.panel.grid.leftLogBase || 1,
            max: scope.panel.percentage && scope.panel.stack ? 100 : scope.panel.grid.leftMax,
          };

          options.yaxes.push(defaults);

          if (_.findWhere(data, {yaxis: 2})) {
            var secondY = _.clone(defaults);
            secondY.index = 2,
            secondY.logBase = scope.panel.grid.rightLogBase || 1,
            secondY.position = 'right';
            secondY.min = scope.panel.grid.rightMin;
            secondY.max = scope.panel.percentage && scope.panel.stack ? 100 : scope.panel.grid.rightMax;
            options.yaxes.push(secondY);

            applyLogScale(options.yaxes[1], data);
            configureAxisMode(options.yaxes[1], scope.panel.percentage && scope.panel.stack ? "percent" : scope.panel.y_formats[1]);
          }

          applyLogScale(options.yaxes[0], data);
          configureAxisMode(options.yaxes[0], scope.panel.percentage && scope.panel.stack ? "percent" : scope.panel.y_formats[0]);
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
            axis.transform = function(v) { return Math.log(v+0.1); };
            axis.inverseTransform  = function (v) { return Math.pow(10,v); };
          } else {
            axis.transform = function(v) { return Math.log(v+0.1) / Math.log(axis.logBase); };
            axis.inverseTransform  = function (v) { return Math.pow(axis.logBase,v); };
          }
        }

        function configureAxisMode(axis, format) {
          axis.tickFormatter = function(val, axis) {
            return kbn.valueFormats[format](val, axis.tickDecimals, axis.scaledDecimals);
          };
        }

        function time_format(interval, ticks, min, max) {
          if (min && max && ticks) {
            var secPerTick = ((max - min) / ticks) / 1000;

            if (secPerTick <= 45) {
              return "%H:%M:%S";
            }
            if (secPerTick <= 7200) {
              return "%H:%M";
            }
            if (secPerTick <= 80000) {
              return "%m/%d %H:%M";
            }
            if (secPerTick <= 2419200) {
              return "%m/%d";
            }
            return "%Y-%m";
          }

          return "%H:%M";
        }

        new GraphTooltip(elem, dashboard, scope, function() {
          return sortedSeries;
        });
      }
    };
  });

});
