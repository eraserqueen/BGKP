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
            selectedGame: null
        };
    }

    componentWillMount() {
        fire.database().ref('/sessions').orderByChild('created').limitToFirst(1).on('value', snapshot => {
            let sessionId;
            if (snapshot.val()) {
                sessionId = _.values(snapshot.val())[0].id;
                console.log('found latest session:', _.values(snapshot.val()), sessionId);
            } else {
                sessionId = this.createNewSession();
                console.log('created new session', sessionId);
            }
            this.setState({sessionId});
        });
        fire.database().ref('/players').orderByValue().on('value', snapshot => {
            let players = snapshot.val().filter(p => p != null);
            this.setState({players});
        });
        fire.database().ref('/games').orderByValue().on('value', snapshot => {
            let games = snapshot.val().filter(p => p != null);
            this.setState({games});
        });
        fire.database().ref('/messages/votes').on('child_added', snapshot => {
            let data = snapshot.val().data;
            if (data.sessionId !== this.state.sessionId)
                return;
            this.setState({players: _.pull(this.state.players, data.player)});
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
        let message = fire.database().ref('/messages/votes').push();
        let key = message.key;

        message.set({
            id: key,
            created: new Date().toISOString(),
            data: {
                sessionId,
                player: currentPlayer.name,
                game: currentPlayer.preferredGame
            }
        });
        return key;

    }

    createNewSession() {
        let session = fire.database().ref('/sessions').push();
        let key = session.key;
        console.log(key);
        session.set({
            id: key,
            created: new Date().toISOString()
        });
        console.log(key);
        return key;
    }

    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <p>Voting for session {this.state.sessionId}</p>
                    {this.state.currentPlayer && this.state.currentPlayer.hasVoted ?
                        (<div>
                            <p>Thanks, {this.state.currentPlayer.name} for your submission.</p>
                            <p>Waiting on votes from: {this.state.players.join(', ')}.</p>
                        </div>)
                        :
                        <div>

                            <div>
                                My name is:
                                {this.state.players.map((name, i) =>
                                    (<div>
                                        <input type="radio" id={'player-' + i} name="current-player" value={name}
                                               onClick={() => this.handlePlayerSelected(name)}/>
                                        <label htmlFor={'player-' + i}>{name}</label>
                                    </div>)
                                )}
                            </div>
                            <div>
                                And I want to play:
                                {this.state.games.map((name, i) =>
                                    (<div>
                                        <input type="radio" id={'game-' + i} name="selected-game" value={name}
                                               onClick={() => this.handleGameSelected(name)}/>
                                        <label htmlFor={'game-' + i}>{name}</label>
                                    </div>)
                                )}
                            </div>
                            <button onClick={() => this.handleSubmit()}>Send</button>
                        </div>
                    }
                </header>
            </div>
        );
    }

}

export default withCookies(App);
