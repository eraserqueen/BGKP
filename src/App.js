import React, {Component} from 'react';
import './App.css';
import fire from './firebase';
import _ from 'lodash';
import {withCookies, Cookies} from 'react-cookie';
import {instanceOf} from 'prop-types';

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
            currentPlayer: props.cookies.get('playerName') || null,
            selectedGame: null,
            submitted: false
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
        if(this.state.currentPlayer != null && !_.has(this.state.players, this.state.currentPlayer)) {
            this.setState({submitted: true})
        }
    }

    handleSubmit() {
        if (this.state.sessionId == null || this.state.currentPlayer == null || this.state.selectedGame == null) {
            return;
        }
        this.addPlayerVote(this.state.sessionId, this.state.currentPlayer, this.state.selectedGame);
        this.props.cookies.set('playerName', this.state.currentPlayer);
        this.setState({submitted: true});
    }

    addPlayerVote(sessionId, currentPlayer, selectedGame) {
        let message = fire.database().ref('/messages/votes').push();
        let key = message.key;

        message.set({
            id: key,
            created: new Date().toISOString(),
            data: {
                sessionId,
                player: currentPlayer,
                game: selectedGame
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
                    {this.state.submitted ?
                        (<div>
                            <p>Thanks, {this.state.currentPlayer} for your submission.</p>
                            <p>Waiting on {this.state.players.join(', ')} to vote.</p>
                        </div>)
                        :
                        <div>

                            <div>
                                My name is:
                                {this.state.players.map((name, i) =>
                                    (<div>
                                        <input type="radio" id={'player-' + i} name="current-player" value={name}
                                               onClick={() => this.setState({currentPlayer: name})}/>
                                        <label htmlFor={'player-' + i}>{name}</label>
                                    </div>)
                                )}
                            </div>
                            <div>
                                And I want to play:
                                {this.state.games.map((name, i) =>
                                    (<div>
                                        <input type="radio" id={'game-' + i} name="selected-game" value={name}
                                               onClick={() => this.setState({selectedGame: name})}/>
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
