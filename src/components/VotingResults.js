import React, {Component} from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Toggle from "./Toggle";

class VotingResults extends Component {
    static propTypes = {
        games: PropTypes.arrayOf(PropTypes.shape({score: PropTypes.number, game: PropTypes.string})).isRequired,
        gamesPlayed: PropTypes.arrayOf(PropTypes.string),
        onGamePlayedToggle: PropTypes.func.isRequired
    };

    render() {
        return <div>
            <h2> We're playing:</h2>
            <ol className='list-type'>
                {_.map(_.reverse(_.sortBy(this.props.games, ['score'])), (result, i) =>
                    <li key={`result-${i}`}>
                        <Toggle checked={this.props.gamesPlayed.indexOf(result.game) !== -1}
                                offLabel='Not played'
                                onLabel='Played'
                                onClick={(played) => this.props.onGamePlayedToggle(result.game, played)}/>
                        <span className='ml-2'>{result.game} ({result.score})</span>
                    </li>)}
            </ol>
        </div>;
    }
}

export default VotingResults;