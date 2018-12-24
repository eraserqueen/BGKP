const _ = require('lodash');

function mapAttributes(item) {
    const id = _.get(item, '_attributes.objectid');
    if (!id) {
        return null;
    }
    const playingTime = _.get(item, 'stats._attributes.playingtime');
    return {
        id: parseInt(id),
        title: _.get(item, 'name._text', ''),
        image: _.get(item, 'thumbnail._text', ''),
        minPlayers: parseInt(_.get(item, 'stats._attributes.minplayers')) || null,
        maxPlayers: parseInt(_.get(item, 'stats._attributes.maxplayers')) || null,
        playingTime: playingTime ? parseInt(playingTime) : null
    };
}

function mapCollectionToGamesList(json) {
    console.log('Mapping collection to games list');
    let collection = _.get(json, 'items.item');
    if (_.isEmpty(collection)) {
        return [];
    }
    if (collection.name) {
        collection = new Array(collection);
    }
    return collection.map(mapAttributes).map(game => _.assign(game, {owner: json.username})).filter(_.identity);
}

function mergeCollections(collections) {
    let merged = _.groupBy(_.union(...collections), 'id');
    let dedup = _.flatten(_.map(merged, arr => _.assign(arr[0], {owner: arr.map(a => a.owner)})));
    return _.sortBy(dedup, 'id');
}

module.exports = {
    mapCollectionToGamesList,
    mergeCollections
};