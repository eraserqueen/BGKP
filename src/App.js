import _ from 'lodash';
import {instanceOf} from 'prop-types';
import React, {Component} from 'react';
import {Cookies, withCookies} from 'react-cookie';
import './App.css';
import fire from './firebase';
import DecisionEngine from './models/DecisionEngine'
import Player, {loadExistingPlayer} from './models/Player'
import Session from "./models/Session";

class App extends Component {
    static propTypes = {
        cookies: instanceOf(Cookies).isRequired
    };

    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            players: [],
            games: [],
            currentPlayer: null,
            session: null,
            form: {
                player: null,
                game: null
            }
        };
    }


    componentWillMount() {

        fire.database().ref('/sessions').orderByChild('created').limitToFirst(1).on('value', snapshot => {
            let session = null;
            let sessionRef = snapshot.val();
            if (sessionRef) {
                const sessionData = _.values(sessionRef)[0];
                session = new Session(sessionData);

                if (!session.selectedGame && session.hasAllRequiredVotes()) {
                    session.selectedGame = DecisionEngine.selectGame(session);
                } else {
                    this.loadAvailableGames();
                    this.loadPlayers(session);
                }
            }
            this.setState({session, loading: false});
        })
    }

    loadPlayers(session) {
        const cachedPlayerName = this.props.cookies.get('playerName');
        if (!_.isEmpty(cachedPlayerName)) {
            let currentPlayer = loadExistingPlayer(cachedPlayerName, session);
            this.setState({currentPlayer, form: {player: currentPlayer.name, game: null}});
        } else {
            this.setState({currentPlayer: new Player()});
        }

        fire.database().ref('/players').orderByValue().once('value')
            .then(snapshot => {
                let players = snapshot.val().filter(p => p != null);
                _.pullAll(players, _.keys(session.votes));
                this.setState({players});
            });
    }

    loadAvailableGames() {
        fire.database().ref('/games').orderByValue().once('value')
            .then(snapshot => {
                let games = snapshot.val().filter(p => p != null);
                this.setState({games});
            });
    }

    handleCreateSessionClick() {
        const session = new Session();
        this.loadAvailableGames();
        this.loadPlayers(session);
        this.setState({session: session, loading:false});
    }

    handlePlayerSelected(player) {
        this.setState({form: _.assign(this.state.form, {player})});
    }

    handleGameSelected(game) {
        this.setState({form: _.assign(this.state.form, {game})});
    }

    handleSubmit() {
        const currentPlayer = this.state.currentPlayer;
        if (currentPlayer.name === null) {
            currentPlayer.chooseName(this.state.form.player);
            this.props.cookies.set('playerName', currentPlayer.name);
        }
        currentPlayer.vote(this.state.session, this.state.form.game);
        this.setState({currentPlayer});
    }


    render() {
        if (this.state.loading) {
            return <div>Loading...</div>;
        }
        if(this.state.session == null) {
            return <div className="App">
                <header className="App-header">
                    <button onClick={() => this.handleCreateSessionClick()}>Create new Session</button>
                </header>
            </div>
        }
        return <div className="App">
            <header className="App-header">
                {<p>Session #{this.state.session.id} | {this.state.session.created}</p>}
                {this.renderContent()}
            </header>
        </div>;
    }

    renderContent() {
        if (this.state.session.selectedGame) {
            return <p>We're playing {this.state.session.selectedGame}</p>;
        }
        if (this.state.currentPlayer.hasVoted) {
            return <div>
                <p>Thanks, {this.state.currentPlayer.name} for your submission.</p>
                <p>Waiting on votes from: {this.state.players.join(', ')}.</p>
            </div>;
        }
        return <div>
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
        </div>;
    }
}


export default withCookies(App);
