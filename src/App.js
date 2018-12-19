import React, {Component} from 'react';
import './App.css';
import fire from './firebase';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {players: [], games: [], sessionId: null, currentPlayer: null, selectedGame: null};
    }

    componentWillMount() {
        fire.database().ref('/players').orderByValue().on('value', snapshot => {
            let players = snapshot.val().filter(p => p != null);
            this.setState({players});
        });
        fire.database().ref('/games').orderByValue().on('value', snapshot => {
            let games = snapshot.val().filter(p => p != null);
            this.setState({games});
        });
    }

    handleSubmit() {
        if (this.state.currentPlayer == null || this.state.selectedGame == null) {
            return;
        }

        let {sessionId, currentPlayer, selectedGame} = this.state;
        if (sessionId == null) {
            sessionId = this.createNewSession();
            this.setState({sessionId});
        }

        this.addPlayerVote(sessionId, currentPlayer, selectedGame);
    }
    addPlayerVote(sessionId, currentPlayer, selectedGame) {
        let message = fire.database().ref('/messages').push();
        let key = message.key;

        message.set({
            id: key,
            created: new Date().toISOString(),
            event: "PlayerVote",
            sessionId,
            player: currentPlayer,
            game: selectedGame
        });
        return key;

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
        return (
            <div className="App">
                <header className="App-header">
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
                </header>
            </div>
        );
    }

}

export default App;
