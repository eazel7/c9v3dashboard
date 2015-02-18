var DataStore = require('nedb'),
    sha1 = require('sha1');

function LocalUsers(dataFile) {
  this.collection = new DataStore({
    filename: dataFile,
    autoload: true});
}

LocalUsers.prototype.listUsers = function (callback) {
  this.collection.find({}, function (err, docs) {
    if (err) return callback (err);

    var users = [];

    for (var i = 0; i < docs.length; i++) {
      users.push({
        username: docs[i].username,
        displayName: docs[i].displayName || docs[i].username,
        roles: docs[i].roles || []
      });
    }

    callback(null, users)
  });
};

LocalUsers.prototype.getUser = function (username, callback) {
  if (!username) return callback (new Error('Username is required'));

  this.collection.findOne({username: username}, function (err, doc) {
    if (err) return callback (err);

    if (doc) {
      return callback (null, {
        username: doc.username,
        displayName: doc.displayName,
        roles: doc.roles
      });
    } else {
      return callback(null, null);
    }
  });
};

LocalUsers.prototype.setUser = function (newUser, callback) {
  if (!newUser) return callback (new Error('User is required'));
  if (!newUser.username) return callback (new Error('Username is required'));

  var collection = this.collection;

  this.getUser(newUser.username, function (err, user) {
    if (err) return callback(err);
    if (user) {
      collection.update({
        username: newUser.username
      }, {
        $set: {
          displayName: newUser.displayName || user.username,
          roles: newUser.roles || []
        }
      }, callback);
    } else {
      if (!newUser.password) return callback (new Error('A password is required'));

      collection.insert({
        username: newUser.username,
        displayName: newUser.displayName || newUser.username,
        roles: newUser.roles || [],
        password: sha1(newUser.password)
      }, callback);
    }
  });
};

module.exports = LocalUsers;
