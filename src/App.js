import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import fire from './firebase';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {players: [], games: []};
    }

    componentWillMount() {
        fire.database().ref('/players').on('value', snapshot => {
            let players = snapshot.val().filter(p => p != null);
            this.setState({players});
        });
    }

    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo"/>
                    <p>
                        Players: {this.state.players.join(', ')}
                    </p>
                </header>
            </div>
        );
    }
}

export default App;
