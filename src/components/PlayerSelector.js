import React, {Component} from 'react';
import PropTypes from 'prop-types';

class PlayerSelector extends Component {
    static propTypes = {
        players: PropTypes.arrayOf(PropTypes.string).isRequired,
        onSelected: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {selected: null};
    }

    render() {
        return <div className='btn-group btn-group-toggle' role='group'>
            {this.props.players.map((name, i) =>
                (<label key={'player-' + i}
                        aria-pressed={this.state.selected === name}
                        role='button'
                        className={`btn btn-outline-info ${this.state.selected === name ? 'active' : ''}`}>
                        <input
                            type="radio" id={'player-' + i} name="selected-player" value={name}
                            className='d-none form-check-input'
                            onClick={() => {
                                this.setState({selected: name});
                                this.props.onSelected(name);
                            }}/>
                        {name}
                    </label>
                )
            )}</div>;
    }
}

export default PlayerSelector;