import fire from '../firebase'
import _ from 'lodash';

function Random(games) {
    return games[_.random(0, games.length - 1)];
}

function PriorityVoting(votes) {
    const weighedVotes = _.map(votes, games => _.map(games, (game, order) => ({game, weight: 3 - order})));
    const votesPerGame = _.groupBy(_.flatMap(weighedVotes), o => o.game);
    const totalScores = _.map(votesPerGame, (votes, game) => ({game, score: _.sumBy(votes, v => v.weight)}));
    const maxScore = _.sortBy(totalScores, 'score', 'desc')[0].score;
    const ties = _.map(_.filter(totalScores, entry => entry.score === maxScore), entry => entry.game);

    if(ties.length === 1) return ties[0];
    return Random(ties);
}

function selectGame(session) {
    if (!session.hasAllRequiredVotes()) return;
    session.selectedGame = PriorityVoting(session.votes);
    fire.database().ref('/sessions/' + session.id).update(session);
    return session.selectedGame;
}

export default {
    selectGame
}