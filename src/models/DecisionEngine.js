import _ from 'lodash';
import fire from '../firebase'

function PriorityVoting(votes) {
    const weighedVotes = _.map(votes, games => _.map(games, (game, order) => ({game, weight: 3 - order})));
    const votesPerGame = _.groupBy(_.flatMap(weighedVotes), o => o.game);
    return _.map(votesPerGame, (votes, game) => ({game, score: _.sumBy(votes, v => v.weight)}));
}

function getSelectedGames(session) {
    if (!session.hasAllRequiredVotes()) return;
    session.selectedGames = PriorityVoting(session.votes);
    fire.database().ref('/sessions/' + session.id).update(session);
    return session.selectedGames;
}

export default {
    getSelectedGames
}