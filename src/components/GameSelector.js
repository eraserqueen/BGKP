import React, {Component} from 'react';
import PropTypes from 'prop-types';

class GameSelector extends Component {
    static propTypes = {
        games: PropTypes.arrayOf(PropTypes.string).isRequired,
        onSelected: PropTypes.func.isRequired
    };

    render() {
        return <select className='form-control'
                       onChange={(e) => this.props.onSelected(e.target.value)}
                       name="selected-game">
            <option/>
            {this.props.games.map((name, i) => <option key={'game-' + i} value={name}>{name} </option>)}
        </select>;
    }
}
export default GameSelector;