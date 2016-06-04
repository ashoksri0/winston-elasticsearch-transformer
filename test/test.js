var should = require('should');

var transformer = require('../index').transformer;

describe('the transformer', function() {
  it('should transform log data from winston into the desired format', function (done) {
    var transformed = transformer({
      message: 'some message',
      level: 'error',
      meta: {
        someField: true
      }
    });
    should.exist(transformed['@timestamp']);
    transformed.severity.should.equal('error');
    transformed.fields.someField.should.be.true();
    done();
  });
});
