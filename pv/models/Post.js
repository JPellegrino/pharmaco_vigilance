var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PostSchema = new Schema({
  post_id: {
    'type': Number,
    'index': true
  },
  creation_date: {
    'type': Date,
    'index': true
  },
  content: {
    'type': String
  },
  info: {
    'type': Schema.Types.Mixed
  }
});

PostSchema.index({
  'post_id': 1
}, {
  'unique': true
});

module.exports = mongoose.model('Post', PostSchema);
