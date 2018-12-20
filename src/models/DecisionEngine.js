import fire from '../firebase'
import _ from 'lodash';

function selectGame({id, votes}) {
    if (votes.length === 0) return;
    let computedList =
        _.orderBy(
            _.map(
                _.groupBy(
                    _.values(votes), _.identity), v => ({name: v[0], count: v.length})), 'count', 'desc');
    let selectedGame = computedList[0].name;
    fire.database().ref('/sessions/' + id).update({selectedGame});
    return selectedGame;
}

export default {
    selectGame
}