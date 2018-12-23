import React, {Component} from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

class VotingResults extends Component {
    static propTypes = {
        games: PropTypes.arrayOf(PropTypes.shape({score: PropTypes.number, game: PropTypes.string})).isRequired
    };

    render() {
        return <div>
            <h2> We're playing:</h2>
            <ol className='list-type'>
                {_.map(_.reverse(_.sortBy(this.props.games, ['score'])), (result,i) =>
                    <li key={`result-${i}`}>{result.game} ({result.score})</li>)}
            </ol>
        </div>;
    }
}

export default VotingResults;