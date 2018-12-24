const functions = require('firebase-functions');
const admin = require('firebase-admin');
const client = require('./bgg/bggClient');
const adapter = require('./bgg/bggAdapter');
const _ = require('lodash');

admin.initializeApp();

exports.synchronizeGameCollection = functions.https.onRequest((req, res) => {
    const users = req.query.users.split(',');
    if (_.isEmpty(users)) {
        res.send('missing parameter: users');
    }
    console.log('getting collection from users', users);
    Promise.all(_.map(users, username => client.getCollectionAsync(username)))
        .then(jsonCollections => _.map(jsonCollections, adapter.mapCollectionToGamesList))
        .then(adapter.mergeCollections)
        .then(collection => admin.database().ref('/games').set(collection))
        .then(() => res.send('done'))
        .catch(err => res.send(err));
});