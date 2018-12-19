import _ from 'lodash';
import {instanceOf} from 'prop-types';
import React, {Component} from 'react';
import {Cookies, withCookies} from 'react-cookie';
import './App.css';
import fire from './firebase';

class App extends Component {
    static propTypes = {
        cookies: instanceOf(Cookies).isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            players: [],
            games: [],
            sessionId: null,
            currentPlayer: props.cookies.get('currentPlayer') || {
                name: null,
                preferredGame: null,
                hasVoted: false,
            },
            votes: [],
            selectedGame: null
        };
    }

    componentWillMount() {

        fire.database().ref('/games').orderByValue().once('value')
            .then(snapshot => {
                let games = snapshot.val().filter(p => p != null);
                this.setState({games});
            });
        fire.database().ref('/players').orderByValue().once('value')
            .then(snapshot => {
                let players = snapshot.val().filter(p => p != null);
                this.setState({players});
            });

        fire.database().ref('/sessions').orderByChild('created').limitToFirst(1).on('value', snapshot => {
            let sessionId;
            let sessionRef = snapshot.val();
            if (sessionRef) {
                let sessionData = _.values(sessionRef)[0];
                sessionId = sessionData.id;
                console.log('found latest session:', sessionData);
                let remainingPlayers = _.pullAll(this.state.players, _.keys(sessionData.votes));
                let selectedGame = null;
                if (remainingPlayers.length === 0) {
                    selectedGame = this.computeGameDecision(sessionData.id, sessionData.votes);
                }
                this.setState({votes: sessionData.votes, players: remainingPlayers, selectedGame});
            } else {
                sessionId = this.createNewSession();
                console.log('created new session', sessionId);
            }
            this.setState({sessionId});
        });
    }

    handlePlayerSelected(name) {
        this.setState({currentPlayer: _.assign(this.state.currentPlayer, {name})});
    }

    handleGameSelected(preferredGame) {
        this.setState({currentPlayer: _.assign(this.state.currentPlayer, {preferredGame})});
    }

    handleSubmit() {
        if (this.state.sessionId == null
            || this.state.currentPlayer == null
            || this.state.currentPlayer.name == null
            || this.state.currentPlayer.preferredGame == null
            || this.state.currentPlayer.hasVoted) {
            return;
        }
        this.addPlayerVote(this.state.sessionId, this.state.currentPlayer);
        let updatedPlayer = _.assign(this.state.currentPlayer, {hasVoted: true});
        this.props.cookies.set('currentPlayer', updatedPlayer);
        this.setState({currentPlayer: updatedPlayer});
    }

    addPlayerVote(sessionId, currentPlayer) {
        fire.database().ref('/sessions/' + sessionId + '/votes/' + currentPlayer.name).set(currentPlayer.preferredGame);
    }

    createNewSession() {
        let session = fire.database().ref('/sessions').push();
        let key = session.key;
        session.set({
            id: key,
            created: new Date().toISOString()
        });
        return key;
    }

    computeGameDecision(sessionId, votes) {
        if (votes.length === 0) return;
        let computedList =
            _.orderBy(
                _.map(
                    _.groupBy(
                        _.values(votes), _.identity), v => ({name: v[0], count: v.length})), 'count', 'desc');
        let selectedGame = computedList[0].name;
        fire.database().ref('/sessions/' + sessionId).update({selectedGame});
        return selectedGame;
    }

    render() {
        const sessionIdDisplay = <p>Session #{this.state.sessionId}</p>;
        const selectedGameDisplay = <p>We're playing {this.state.selectedGame}</p>;
        const currentPlayerDisplay =  <p>Thanks, {this.state.currentPlayer.name} for your submission.</p>;
        const remainingPlayersDisplay = <p>Waiting on votes from: {this.state.players.join(', ')}.</p>;
        const votingForm = (<div>
            <div>
                My name is:
                {this.state.players.map((name, i) =>
                    (<div key={'player-' + i}>
                        <input
                            type="radio" id={'player-' + i} name="current-player" value={name}
                            onClick={() => this.handlePlayerSelected(name)}/>
                        <label htmlFor={'player-' + i}>{name}</label>
                    </div>)
                )}
            </div>
            <div>
                And I want to play:
                {this.state.games.map((name, i) =>
                    (<div key={'game-' + i}>
                        <input
                            type="radio" id={'game-' + i} name="selected-game" value={name}
                            onClick={() => this.handleGameSelected(name)}/>
                        <label htmlFor={'game-' + i}>{name}</label>
                    </div>)
                )}
            </div>
            <button onClick={() => this.handleSubmit()}>Send</button>
        </div>);

        return (<div className="App">
            <header className="App-header">
                {sessionIdDisplay}
                {this.state.players.length > 0 && remainingPlayersDisplay}
                {this.state.currentPlayer.hasVoted ? currentPlayerDisplay : votingForm}
                {this.state.selectedGame !== null && selectedGameDisplay}
            </header>
        </div>);
    }
}


export default withCookies(App);
