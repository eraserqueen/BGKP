import './App.css';
import {version} from '../package.json';
import _ from 'lodash';
import {instanceOf} from 'prop-types';
import React, {Component} from 'react';
import {Cookies, withCookies} from 'react-cookie';
import moment from 'moment';
import VotingForm from "./components/VotingForm";
import VotingResults from "./components/VotingResults";
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
        fire.database().ref('/sessions').orderByChild('created').limitToLast(1).on('value', snapshot => {
            let session = null;
            let sessionRef = snapshot.val();
            if (sessionRef) {
                const sessionData = _.values(sessionRef)[0];
                session = new Session(sessionData);

                if (_.isEmpty(session.selectedGames) && session.hasAllRequiredVotes()) {
                    session.selectedGames = DecisionEngine.getSelectedGames(session);
                } else {
                    this.loadAvailableGames();
                    this.loadPlayers(session);
                }
                this.setState({session, loading: _.assign(this.state.loading, {session: false})});
            }
        })
    }

    loadPlayers(session) {
        fire.database().ref('/players').orderByValue().once('value')
            .then(snapshot => {
                let allPlayers = snapshot.val().filter(p => p != null);
                allPlayers.sort();

                const cachedPlayerName = this.props.cookies.get('playerName');
                let currentPlayer = null;
                if (!_.isEmpty(cachedPlayerName) && allPlayers.indexOf(cachedPlayerName) !== -1) {
                    currentPlayer = loadExistingPlayer(cachedPlayerName, session);
                } else {
                    currentPlayer = new Player();
                }

                let players = _.without(allPlayers, ..._.keys(session.votes));
                this.setState({currentPlayer, players, loading: _.assign(this.state.loading, {players: false})});
            });
    }

    loadAvailableGames() {
        fire.database().ref('/games').once('value')
            .then(snapshot => {
                let games = snapshot.val().filter(p => p != null).map(g => g.title);
                games.sort();
                this.setState({games, loading: _.assign(this.state.loading, {games: false})});
            });
    }

    appIsLoading() {
        return _.isEmpty(_.get(this.state.session, 'selectedGames')) && _.filter(this.state.loading, _.identity).length > 0;
    }

    handleCreateSessionClick() {
        const session = new Session();
        this.loadAvailableGames();
        this.loadPlayers(session);
        this.setState({session: session, loading: _.assign(this.state.loading, {session: false})});
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
            <header className="App-header"><span className='display-1'>BGKP</span> v{version}</header>
            <main className='container'>
                {this.state.session && <h1>Gaming session of {moment(this.state.session.created).format('LL')}</h1>}
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
        if (this.state.session.selectedGames) {
            return <div>
                <VotingResults games={this.state.session.selectedGames}/>
                <button className='btn btn-primary' onClick={() => this.handleCreateSessionClick()}>
                    Create new Session
                </button>
            </div>
        }
        if (this.state.currentPlayer.hasVoted) {
            return <div>
                <p>Thanks, {this.state.currentPlayer.name} for your submission.</p>
                <p>Waiting on votes from: {this.state.players.join(', ')}.</p>
            </div>;
        }

        return <VotingForm error={this.state.error}
                           currentPlayerName={_.get(this.state.currentPlayer, 'name')}
                           players={this.state.players}
                           games={this.state.games}
                           onSubmit={(vote) => this.handlePlayerVote(vote)}/>;
    }
}


export default withCookies(App);
