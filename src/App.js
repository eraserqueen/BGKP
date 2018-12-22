import './App.css';
import _ from 'lodash';
import {instanceOf} from 'prop-types';
import React, {Component} from 'react';
import {Cookies, withCookies} from 'react-cookie';
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
                error: null,
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
        this.setState({session: session, loading: false});
    }

    handlePlayerSelected(player) {
        this.setState({form: _.assign(this.state.form, {player})});
    }

    handleGameSelected(game) {
        this.setState({form: _.assign(this.state.form, {game})});
    }

    handleSubmit(e) {
        e.preventDefault();
        try {
            const currentPlayer = this.state.currentPlayer;
            if (currentPlayer.name === null) {
                currentPlayer.chooseName(this.state.form.player);
                this.props.cookies.set('playerName', currentPlayer.name);
            }
            currentPlayer.vote(this.state.session, this.state.form.game);
            this.setState({currentPlayer, form: _.assign(this.state.form, {error: null})});
        } catch (error) {
            this.setState({form: _.assign(this.state.form, {error: error.message})});
        }
    }


    render() {
        return <div className="App">
            <header className="App-header display-1">BGKP</header>
            <main className='container'>
                {this.state.session &&
                <div className='row'>Session #{this.state.session.id} | {this.state.session.created}</div>}
                {this.renderContent()}
            </main>
        </div>;
    }

    renderContent() {
        if (this.state.loading) {
            return <div>Loading...</div>;
        }
        if (this.state.session == null) {
            return <button className='btn btn-primary' onClick={() => this.handleCreateSessionClick()}>Create new
                Session</button>;
        }
        if (this.state.session.selectedGame) {
            return <p>We're playing {this.state.session.selectedGame}</p>;
        }
        if (this.state.currentPlayer.hasVoted) {
            return <div>
                <p>Thanks, {this.state.currentPlayer.name} for your submission.</p>
                <p>Waiting on votes from: {this.state.players.join(', ')}.</p>
            </div>;
        }
        return <form>
            {this.state.form.error && <div className='alert alert-danger'>{this.state.form.error}</div>}
            <div className='form-group row'>
                <label className='col text-left'>My name is:</label>

                {this.state.currentPlayer.name != null
                    ? <div className='col '>{this.state.currentPlayer.name}</div>
                    : <div className='col btn-group btn-group-toggle' role='group'>
                        {this.state.players.map((name, i) =>
                            (<label key={'player-' + i}
                                    aria-pressed={this.state.form.player === name}
                                    role='button'
                                    className={`btn btn-outline-info ${this.state.form.player === name ? 'active' : ''}`}>
                                    <input
                                        type="radio" id={'player-' + i} name="current-player" value={name}
                                        className='d-none form-check-input'
                                        onClick={() => this.handlePlayerSelected(name)}/>
                                    {name}
                                </label>
                            )
                        )}
                    </div>}
            </div>
            <div className='form-group row'>
                <label className='col text-left'>And I want to play:</label>
                <select className='col form-control' onChange={(e) => this.handleGameSelected(e.target.value)}
                        name="selected-game">
                    <option/>
                    {this.state.games.map((name, i) => <option key={'game-' + i} value={name}>{name} </option>)}
                </select>
            </div>
            <div className='form-group row'>
                <div className='col'/>
                <div className='col'>
                    <button onClick={(e) => this.handleSubmit(e)}
                            className='form-control btn btn-block btn-primary'>Send
                    </button>
                </div>
            </div>
        </form>;
    }
}


export default withCookies(App);
