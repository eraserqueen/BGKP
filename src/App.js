import _ from 'lodash';
import {instanceOf} from 'prop-types';
import React, {Component} from 'react';
import {Cookies, withCookies} from 'react-cookie';
import './App.css';
import fire from './firebase';
import PlayerBuilder from './models/Player'
import DecisionEngine from './models/DecisionEngine'

class App extends Component {
    static propTypes = {
        cookies: instanceOf(Cookies).isRequired
    };

    constructor(props) {
        super(props);

        const cachedPlayerName = props.cookies.get('playerName');
        const currentPlayer = PlayerBuilder.build(cachedPlayerName);
        this.state = {
            players: [],
            games: [],
            currentPlayer,
            session: {
                id: null,
                votes: [],
                selectedGame: null
            },
            form: {
                player: currentPlayer.name,
                game: null
            }
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
            let session = {};
            let sessionRef = snapshot.val();
            if (sessionRef) {
                session = _.values(sessionRef)[0];
                console.log('found latest session:', session);
                this.state.currentPlayer.recallVotingHistory(session);
                let remainingPlayers = _.pullAll(this.state.players, _.keys(session.votes));
                if (remainingPlayers.length === 0) {
                    session.selectedGame = DecisionEngine.selectGame(session);
                }
                this.setState({session, players: remainingPlayers});
            } else {
                session.id = this.createNewSession();
                console.log('created new session', session);
            }
            this.setState({session});
        });
    }

    handlePlayerSelected(player) {
        this.setState({form: _.assign(this.state.form, {player})});
    }

    handleGameSelected(game) {
        this.setState({form: _.assign(this.state.form, {game})});
    }

    handleSubmit() {
        this.state.currentPlayer.chooseName(this.state.form.player);
        this.state.currentPlayer.registerPreferencesForSession(this.state.session.id, this.state.form.game);
        this.props.cookies.set('playerName', this.state.currentPlayer.name);
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


    render() {
        const sessionIdDisplay = <p>Session #{this.state.session.id}</p>;
        const selectedGameDisplay = <p>We're playing {this.state.session.selectedGame}</p>;
        const currentPlayerDisplay = <p>Thanks, {this.state.currentPlayer.name} for your submission.</p>;
        const remainingPlayersDisplay = <p>Waiting on votes from: {this.state.players.join(', ')}.</p>;
        const votingForm = (<div>
            <div>
                My name is:
                {this.state.currentPlayer.name != null ?
                    this.state.currentPlayer.name
                    : this.state.players.map((name, i) =>
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
                {!this.state.session.selectedGame || selectedGameDisplay}
            </header>
        </div>);
    }
}


export default withCookies(App);
