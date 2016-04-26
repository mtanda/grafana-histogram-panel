import {MetricsPanelCtrl} from 'app/plugins/sdk';
import {GraphCtrl} from 'app/plugins/panel/graph/module';
import kbn from 'app/core/utils/kbn';
import template from './template';

export class HistogramCtrl extends GraphCtrl {
  /** @ngInject */
  constructor($scope, $injector, $rootScope, annotationsSrv) {
    super($scope, $injector, annotationsSrv);
    this.$rootScope = $rootScope;
  }

  onInitEditMode() {
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
}

HistogramCtrl.template = template;
