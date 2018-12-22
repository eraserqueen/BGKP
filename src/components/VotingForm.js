import React, {Component} from 'react';
import PropTypes from 'prop-types';
import GameSelector from "./GameSelector";
import PlayerSelector from "./PlayerSelector";

class VotingForm extends Component {
    static propTypes = {
        error: PropTypes.string,
        games: PropTypes.arrayOf(PropTypes.string).isRequired,
        players: PropTypes.arrayOf(PropTypes.string).isRequired,
        onSubmit: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            error: null,
            player: null,
            game: null
        };
    }

    render() {
        return <form>
            {this.props.error && <div className='alert alert-danger'>{this.props.error}</div>}
            <div className='form-group row'>
                <label className='col text-left'>My name is:</label>
                <div className='col'>
                    <PlayerSelector
                        players={this.props.players}
                        onSelected={(player) => this.setState({player})}/>
                </div>
            </div>
            <div className='form-group row'>
                <label className='col text-left'>And I want to play:</label>
                <div className='col'>
                    <GameSelector
                        games={this.props.games}
                        onSelected={(game) => this.setState({game})}/>
                </div>
            </div>
            <div className='form-group row'>
                <div className='col'/>
                <div className='col'>
                    <button className='form-control btn btn-block btn-primary'
                            onClick={(e) => {
                                e.preventDefault();
                                this.props.onSubmit(this.state);
                            }}>
                        Send
                    </button>
                </div>
            </div>
        </form>;
    }
}

export default VotingForm;