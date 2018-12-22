import fire from '../firebase'
import _ from 'lodash';

class Session {
    constructor(data = {}) {
        if (data.id) {
            console.log('loading existing session', data.id);
        } else {
            let session = fire.database().ref('/sessions').push();
            data.id = session.key;
            data.created = new Date().toISOString();
            session.set(data);
            console.log('created new session', data.id);
        }
        this.id = data.id;
        this.created = data.created;
        this.votes = data.votes || [];
        this.selectedGame = data.selectedGame || null;
    }

    hasAllRequiredVotes() {
        return _.values(this.votes).length === 4;
    }

    registerVote(playerName, preferredGame) {
        if (playerName == null) {
            throw Error("player name cannot be null");
        }
        if (preferredGame == null) {
            throw Error("preferred game cannot be null");
        }
        if (this.votes[playerName] !== undefined) {
            throw Error(playerName + " has already voted for this session");
        }

        this.votes[playerName] = preferredGame;
        fire.database().ref('/sessions/' + this.id + '/votes').set(this.votes);

        console.log('updated votes', this.votes)
    }
}


export default Session;
