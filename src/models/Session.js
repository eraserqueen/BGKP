import fire from '../firebase'

class Session {
    constructor(data = null) {
        const {id, created, votes = [], selectedGame = null} = data;
        if (id) {
            console.log('loading existing session', id);
        } else {
            let session = fire.database().ref('/sessions').push();
            let id = session.key;
            let created = new Date().toISOString();
            session.set({id, created, votes, selectedGame});
            console.log('created new session', id);
        }
        this.id = id;
        this.created = created;
        this.votes = votes;
        this.selectedGame = selectedGame;

    }

    hasAllRequiredVotes() {
        return this.votes.length === 4;
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
