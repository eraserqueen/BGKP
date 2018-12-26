const functions = require('firebase-functions');
const admin = require('firebase-admin');
const client = require('./bgg/bggClient');
const adapter = require('./bgg/bggAdapter');

admin.initializeApp();

exports.synchronizeGameCollection = functions.https.onRequest((req, res) => {
    admin.database().ref('/players').once('value')
        .then(snapshot => Object.values(snapshot.val()).map(p => p['bgg-username']).filter(p => p !== undefined))
        .then(bggUsers => bggUsers.map(username => client.getCollectionAsync(username)))
        .then(promises => Promise.all(promises))
        .then(jsonCollections => jsonCollections.map(adapter.mapCollectionToGamesList))
        .then(gameLists => adapter.mergeGameLists(gameLists))
        .then(mergedList => admin.database().ref('/games').set(mergedList).then(() => res.send(mergedList)))
        .catch(err => res.send(err));
});