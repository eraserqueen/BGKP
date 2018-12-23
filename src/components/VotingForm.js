import _ from 'lodash';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import GameSelector from "./GameSelector";
import PlayerSelector from "./PlayerSelector";

class VotingForm extends Component {
    static propTypes = {
        error: PropTypes.string,
        games: PropTypes.arrayOf(PropTypes.string).isRequired,
        players: PropTypes.arrayOf(PropTypes.string).isRequired,
        currentPlayerName: PropTypes.string,
        onSubmit: PropTypes.func.isRequired
    };

    ALLOWED_SELECTIONS = 3;

    constructor(props) {
        super(props);
        this.state = {
            error: null,
            playerName: props.currentPlayerName,
            gameSelectors: _.range(0, this.ALLOWED_SELECTIONS).map((i) => ({
                order: i,
                options: props.games,
                selected: null
            }))
        };
    }

    handleGameSelected(game, order) {
        let gameSelectors = _.orderBy(this.state.gameSelectors, ['order'], ['asc']);
        gameSelectors[order].selected = game;
        const selectedGames = this.getSelectedGames(gameSelectors);
        gameSelectors = gameSelectors.map(s => {
            s.options = _.without(this.props.games, ...(_.without(selectedGames, s.selected)));
            return s;
        });

        this.setState({gameSelectors});
    }

    handleSubmit(e) {
        e.preventDefault();
        const selectedGames = this.getSelectedGames(this.state.gameSelectors);
        this.props.onSubmit({playerName: this.state.playerName, selectedGames});
    }

    getSelectedGames(gameSelectors) {
        return _.filter(gameSelectors.map(s => s.selected), _.identity);
    }

    render() {
        return <form>
            {this.props.error && <div className='alert alert-danger'>{this.props.error}</div>}
            <div className='form-group row'>
                <label className='col text-left'>My name is:</label>
                <div className='col'>
                    {this.props.currentPlayerName ||
                    <PlayerSelector
                        players={this.props.players}
                        onSelected={(playerName) => this.setState({playerName})}/>
                    }
                </div>
            </div>
            <div className='form-group row'>
                <label className='col text-left'>And I want to play:</label>
                <div className='col'>
                    <ol>
                        {this.state.gameSelectors.map((s) => <li key={'game-selector-' + s.order}>
                            <GameSelector
                                games={s.options}
                                selected={s.selected}
                                onSelected={(game) => this.handleGameSelected(game, s.order)}/>
                        </li>)}
                    </ol>
                </div>
            </div>
            <div className='form-group row'>
                <div className='col'/>
                <div className='col'>
                    <button className='form-control btn btn-block btn-primary'
                            onClick={(e) => this.handleSubmit(e)}>
                        Send
                    </button>
                </div>
            </div>
        </form>;
    }
}

export default VotingForm;