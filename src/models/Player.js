import fire from '../firebase';


class Player {
    constructor() {
        this.name = null;
        this.hasVoted = false;
    }
    chooseName(name) {
        if(name == null) throw Error("player name cannot be null");
        this.name = name;
    }

    registerPreferencesForSession(sessionId, preferredGame) {
        if (sessionId == null) {
            throw Error("sessionId cannot be null");
        }
        if (preferredGame == null) {
            throw Error("preferred game cannot be null");
        }
        if (this.name == null) {
            throw Error("player name cannot be null");
        }
        if (this.hasVoted) {
            throw Error("player has already registered their vote for this session");
        }
        this.hasVoted = true;
        return fire.database().ref('/sessions/' + sessionId + '/votes/' + this.name).set(preferredGame);
    }
}

const PlayerBuilder = {
    build: () => new Player()
};

export default PlayerBuilder;