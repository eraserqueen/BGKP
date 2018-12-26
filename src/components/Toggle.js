import React from "react";
import {Component} from "react";
import PropTypes from 'prop-types';

class Toggle extends Component {
    static propTypes = {
        checked: PropTypes.bool,
        onLabel: PropTypes.string.isRequired,
        offLabel: PropTypes.string.isRequired,
        onClick: PropTypes.func.isRequired
    };

    static defaultProps = {
      checked: false
    };

    constructor(props) {
        super(props);
        this.state = {checked: this.props.checked};
    }

    render() {
        return (<button className={`btn btn-sm ${this.state.checked ? 'btn-info':'btn-outline-info'}`}
                        onClick={() => {
                            let checked = !this.state.checked;
                            this.setState({checked});
                            return this.props.onClick(checked);
                        }}>
            {this.state.checked ? this.props.onLabel : this.props.offLabel}
        </button>);
    }
}

export default Toggle;