class Player {
    constructor(name = null) {
        this.name = name;
        this.hasVoted = false;
    }

    chooseName(name) {
        if (name == null) throw Error("player name cannot be null");
        this.name = name;
    }

    checkVotingStatus(session) {
        this.hasVoted = session.votes && session.votes[this.name] !== undefined;
    }

    vote(session, preferredGame) {
        if (session == null) {
            throw Error("session cannot be null");
        }
        if (preferredGame == null) {
            throw Error("preferred game cannot be null");
        }
        if (this.name == null) {
            throw Error("player name cannot be null");
        }
        if (this.hasVoted) {
            throw Error(this.name + " has already voted for this session");
        }
        session.registerVote(this.name, preferredGame);
        this.hasVoted = true;
    }
}

function loadExistingPlayer(name, session) {
    let player = new Player(name);
    player.checkVotingStatus(session);
    return player;
}

export default Player;
export {loadExistingPlayer}