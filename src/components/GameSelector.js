import React, {Component} from 'react';
import PropTypes from 'prop-types';

class GameSelector extends Component {
    static propTypes = {
        games: PropTypes.arrayOf(PropTypes.string).isRequired,
        onSelected: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {selected: ''}
    }

    render() {
        return <select className='form-control'
                       onChange={(e) => {
                           const selected = e.target.value;
                           this.setState({selected});
                           return this.props.onSelected(selected);
                       }}
                       name="selected-game"
                       value={this.state.selected}>
            <option/>
            {this.props.games.map((name, i) => <option key={'game-' + i} value={name}>{name} </option>)}
        </select>;
    }
}

export default GameSelector;