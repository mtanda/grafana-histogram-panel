import {MetricsPanelCtrl} from 'app/plugins/sdk';
import {GraphCtrl} from 'app/plugins/panel/graph/module';
import template from './template';

export class HistogramCtrl extends GraphCtrl {
  /** @ngInject */
  constructor($scope, $injector, $rootScope, annotationsSrv) {
    super($scope, $injector, annotationsSrv);
    this.$rootScope = $rootScope;
  }

  onInitEditMode() {
    super.onInitEditMode();
    this.addEditorTab('Histogram Options', 'public/plugins/grafana-histogram-panel/tab_options.html');
  }
}

HistogramCtrl.template = template;
