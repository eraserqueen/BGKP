import './App.css';
import _ from 'lodash';
import {instanceOf} from 'prop-types';
import React, {Component} from 'react';
import {Cookies, withCookies} from 'react-cookie';
import VotingForm from "./components/VotingForm";
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
            loading: {players: true, games: true, session: true},
            players: [],
            games: [],
            currentPlayer: null,
            session: null,
        };
    }


    componentWillMount() {
        fire.database().ref('/sessions').orderByChild('created').limitToFirst(1).on('value', snapshot => {
            let session = null;
            let sessionRef = snapshot.val();
            if (sessionRef) {
                const sessionData = _.values(sessionRef)[0];
                session = new Session(sessionData);

                if (session.selectedGame === null && session.hasAllRequiredVotes()) {
                    session.selectedGame = DecisionEngine.selectGame(session);
                } else {
                    this.loadAvailableGames();
                    this.loadPlayers(session);
                }
            }
            this.setState({session, loading: _.assign(this.state.loading, {session:false})});
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
                players.sort();
                _.pullAll(players, _.keys(session.votes));
                this.setState({players, loading: _.assign(this.state.loading, {players:false})});
            });
    }

    loadAvailableGames() {
        fire.database().ref('/games').orderByValue().once('value')
            .then(snapshot => {
                let games = snapshot.val().filter(p => p != null);
                games.sort();
                this.setState({games, loading: _.assign(this.state.loading, {games:false})});
            });
    }

    appIsLoading() {
        return _.filter(this.state.loading, _.identity).length > 0;
    }

    handleCreateSessionClick() {
        const session = new Session();
        this.loadAvailableGames();
        this.loadPlayers(session);
        this.setState({session: session, loading: _.assign(this.state.loading, {session:false})});
    }

    handlePlayerVote({playerName, selectedGames}) {
        try {
            const currentPlayer = this.state.currentPlayer;
            currentPlayer.chooseName(playerName);
            currentPlayer.vote(this.state.session, selectedGames);

            this.props.cookies.set('playerName', playerName);
            this.setState({currentPlayer});
        } catch (error) {
            this.setState({error: error.message});
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
        if (this.appIsLoading()) {
            return <div>Loading...</div>;
        }
        if (this.state.session == null) {
            return <button className='btn btn-primary' onClick={() => this.handleCreateSessionClick()}>
                Create new Session
            </button>;
        }
        if (this.state.session.selectedGame) {
            return <div>We're playing {this.state.session.selectedGame}</div>;
        }
        if (this.state.currentPlayer.hasVoted) {
            return <div>
                <p>Thanks, {this.state.currentPlayer.name} for your submission.</p>
                <p>Waiting on votes from: {this.state.players.join(', ')}.</p>
            </div>;
        }

        return <VotingForm error={this.state.error}
                           players={this.state.players}
                           games={this.state.games}
                           onSubmit={(vote) => this.handlePlayerVote(vote)}/>;
    }
}


export default withCookies(App);
