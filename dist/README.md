## Histogram Panel Plugin for Grafana

This plugin show the Histogram of time series data.

![](https://raw.githubusercontent.com/mtanda/grafana-histogram-panel/master/dist/images/histogram.png)

### How this plugin works

This plugin receives raw time series data, and count each value occurrence, and then show the occurrence as histogram.

### Supported Datasources

I confirmed this plugin work with following datasource.

- Prometheus

But, this plugin can handle time series data (defined by Grafana plugin interface).

Should work with Graphite / InfluxDB / OpenTSDB.

### Options

- Bucket Size
  - Can configure bucket size to make histogram data.

### Known Issues

- This plugin doesn't support Elasticsearch aggregation.
  - As noted above, this plugin make histogram data in plugin.
  - Can't handle the Elasticsearch aggregation result yet.

------

#### Changelog

##### v0.1.6
- Support Grafana 4.0

##### v0.1.5
- Refactoring

##### v0.1.4
- Add template variable support
- Add bucket mode
- Fix sorting of buckets
- Fix tooltip display

##### v0.1.3
- Fix avg legend

##### v0.1.2
- Add min/max option

##### v0.1.1
- Update document
