var request = require('superagent');
var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/pharma');


var Post = require('./models/Post.js');
var url_base = 'http://forum.doctissimo.fr/api/forums/sante/';

var harvester = {
  getCategories: function () {
    request
    .get(url_base + 'categories/')
    .end(function (err, res) {
      if (err) console.log(err);
      var categories = res.body.resource.resources;
      categories.forEach( function (category) {
        var cat_info = {
          'id': category.id,
          'name': category.name
        }
        harvester.getTopics(cat_info, category.links.last_topics.href)
      });
    });
  },
  getTopics: function (cat_info, topics_url) {
    request
    .get(topics_url)
    .end(function (err, res) {
      if (err) return console.log(err);
      if (!res.body.resource) console.log(res.body);
      var topics = res.body.resource.resources;
      var tasks = [];
      topics.forEach(function (topic) {
        var info = {
          'category' : cat_info,
          'topic': {
            'id': topic.id,
            'title': topic.title
          }
        }
        tasks.push(
          function (info, topic) {
            return function (callback) {
              harvester.getPosts(info, topic.links.posts.href, function () {
                callback(null)
              })
            }
          } (info, topic)
        )
      })
      async.series(tasks, function (err, res) {
        if (err) console.log(err);
      })
    })
  },
  getPosts: function (info, last_topics_url, callback) {
    request
    .get(last_topics_url)
    .end(function (err, res) {
      if (err) {
        console.log('getPosts err', err, last_topics_url );
      }
      if (!res.body.resource) {
        console.log(last_topics_url);
        return callback();
      } else {
        var posts = res.body.resource.resources;
        posts.forEach(function (post) {
          info['user'] = {
            'id': post.user_id
          }
          q.push({
            'post_id': post.id,
            'creation_date': post.creation_date,
            'content': post.content,
            'info':info
          });
        })
        callback();
      }
    })
  }
}

q = async.queue(function (task, callback) {
  var doc = new Post();
  doc.set(task);
  doc.save(function (err) {
    if (err) console.log(err);
    callback();
  })
},5)

q.drain = function () {
  console.log('drained');
}


harvester.getCategories()
