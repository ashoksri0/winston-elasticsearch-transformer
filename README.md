# winston-elasticsearch-transformer

Transformer function for the
[winston-elasticsearch](https://github.com/vanthome/winston-elasticsearch)
which transforms winston log messages in a
[Logstash](https://github.com/elastic/logstash)/
[Kibana](https://github.com/elastic/kibana) compatible form.

The following transformations are applied:

- Adds a `@timestamp` field with the current date/ time
- Adds a `source_host` property with the curren host name
- Transforms `level` into `severity`
- Several name and strcutural transformations for _known properties_
- _Unknown properties_ are just dumped into the `fields` property
