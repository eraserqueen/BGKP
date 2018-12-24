const functions = require('firebase-functions');
const admin = require('firebase-admin');
const client = require('./bgg/bggClient');
const adapter = require('./bgg/bggAdapter');

admin.initializeApp();

exports.synchronizeGameCollection = functions.https.onRequest((req, res) => {
    const username = req.query.username;
    console.log('getting collection from user', username);
    if(!username) {
        res.send('missing parameter: username');
    }
    client.getCollectionAsync(username)
        .then(onlineList => adapter.mapCollectionToGamesList(onlineList))
        .then(collection => admin.database().ref('/games').set(collection))
        .then(() => res.send('done'))
        .catch(err => res.send(err));
});