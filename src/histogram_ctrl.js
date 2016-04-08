import {MetricsPanelCtrl} from 'app/plugins/sdk';
import {GraphCtrl} from 'app/plugins/panel/graph/module';

export class HistogramCtrl extends GraphCtrl {
  /** @ngInject */
  constructor($scope, $injector, $rootScope, annotationsSrv) {
    super($scope, $injector, annotationsSrv);
    this.$rootScope = $rootScope;
  }
}

HistogramCtrl.templateUrl = 'module.html';
