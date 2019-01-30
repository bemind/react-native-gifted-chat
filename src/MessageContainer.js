import PropTypes from 'prop-types';
import React from 'react';

import {
	ListView,
	View,
	StyleSheet,
	TouchableOpacity,
	Image
} from 'react-native';

import shallowequal from 'shallowequal';
import InvertibleScrollView from 'react-native-invertible-scroll-view';
import md5 from 'md5';
import LoadEarlier from './LoadEarlier';
import Message from './Message';

export default class MessageContainer extends React.Component {
	constructor(props) {
		super(props);
		this.renderRow = this.renderRow.bind(this);
		this.renderFooter = this.renderFooter.bind(this);
		this.renderLoadEarlier = this.renderLoadEarlier.bind(this);
		this.renderScrollComponent = this.renderScrollComponent.bind(this);

		const dataSource = new ListView.DataSource({
			rowHasChanged: (r1, r2) => {
				return r1.hash !== r2.hash;
			}
		});

		const messagesData = this.prepareMessages(props.messages);
		this.state = {
			dataSource: dataSource.cloneWithRows(messagesData.blob, messagesData.keys)
		};
	}

	prepareMessages(messages) {
		return {
			keys: messages.map(m => m._id),
			blob: messages.reduce((o, m, i) => {
				const previousMessage = messages[i + 1] || {};
				const nextMessage = messages[i - 1] || {};
				// add next and previous messages to hash to ensure updates
				const toHash =
					JSON.stringify(m) + previousMessage._id + nextMessage._id;
				o[m._id] = {
					...m,
					previousMessage,
					nextMessage,
					hash: md5(toHash)
				};
				return o;
			}, {})
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		//GoTop on Lifecycle (DEPRECATED)
		// const { dataSource } = nextState;
		// const { _cachedRowCount } = dataSource;
		// if (_cachedRowCount.length > 20) {
		//   this.GoTo_bottom_function();
		// }
		if (!shallowequal(this.props, nextProps)) {
			return true;
		}
		if (!shallowequal(this.state, nextState)) {
			return true;
		}
		return false;
	}

	componentWillReceiveProps(nextProps) {
		//GoTop on Lifecycle (DEPRECATED)
		// if (nextProps.messages.length > 20) {
		//   this.GoTo_bottom_function();
		// }
		// if (this.props.messages === nextProps.messages) {
		//   return;
		// }
		const messagesData = this.prepareMessages(nextProps.messages);
		this.setState({
			dataSource: this.state.dataSource.cloneWithRows(
				messagesData.blob,
				messagesData.keys
			)
		});
	}

	renderFooter() {
		if (this.props.renderFooter) {
			const footerProps = {
				...this.props
			};
			return this.props.renderFooter(footerProps);
		}
		return null;
	}

	renderLoadEarlier() {
		if (this.props.loadEarlier === true) {
			const loadEarlierProps = {
				...this.props
			};
			if (this.props.renderLoadEarlier) {
				return this.props.renderLoadEarlier(loadEarlierProps);
			}
			return <LoadEarlier {...loadEarlierProps} />;
		}
		return null;
	}

	scrollTo(options) {
		this._invertibleScrollViewRef.scrollTo(options);
	}

	renderRow(message, sectionId, rowId) {
		if (!message._id && message._id !== 0) {
			console.warn(
				'GiftedChat: `_id` is missing for message',
				JSON.stringify(message)
			);
		}
		if (!message.user) {
			console.warn(
				'GiftedChat: `user` is missing for message',
				JSON.stringify(message)
			);
			message.user = {};
		}

		const messageProps = {
			...this.props,
			key: message._id,
			currentMessage: message,
			previousMessage: message.previousMessage,
			nextMessage: message.nextMessage,
			position: message.user._id === this.props.user._id ? 'right' : 'left'
		};

		if (this.props.renderMessage) {
			return this.props.renderMessage(messageProps);
		}
		return <Message {...messageProps} />;
	}

	renderScrollComponent(props) {
		const invertibleScrollViewProps = this.props.invertibleScrollViewProps;
		return (
			<InvertibleScrollView
				{...props}
				{...invertibleScrollViewProps}
				ref={component => (this._invertibleScrollViewRef = component)}
			/>
		);
	}

	//Send to the Bottom of Screen (InvertibleScrollView: Top = Bottom)
	GoTo_top_function = () => {
		this.refs.ListView_Reference.scrollTo({ animated: true }, 0);
	};

	//Send to the Top of Screen (InvertibleScrollView: Bottom = Top)
	GoTo_bottom_function = () => {
		this._invertibleScrollViewRef._scrollComponent.scrollToEnd(
			{ animated: true },
			0
		);
	};

	render() {
		if (this.props.autoScrollingBottom) {
			setTimeout(() => {
				if (this._invertibleScrollViewRef) {
					this.GoTo_bottom_function();
				}
			}, 300);
		}

		return (
			<View ref="container" style={styles.container}>
				<ListView
					enableEmptySections={true}
					automaticallyAdjustContentInsets={false}
					initialListSize={20}
					pageSize={20}
					{...this.props.listViewProps}
					dataSource={this.state.dataSource}
					renderRow={this.renderRow}
					renderHeader={this.renderFooter}
					renderFooter={this.renderLoadEarlier}
					renderScrollComponent={this.renderScrollComponent}
					ref="ListView_Reference"
				/>

				{/* // buttons to teste GoTop and GoBottom
            <TouchableOpacity
          activeOpacity={0.5}
          onPress={this.GoTo_bottom_function}
          style={{
            position: 'absolute',
            width: 50,
            height: 50,
            alignItems: 'center',
            justifyContent: 'center',
            right: 30,
            bottom: 70
          }}
        >
          <Image
            source={{
              uri:
                'https://reactnativecode.com/wp-content/uploads/2018/01/top_arrow_icon.png'
            }}
            style={{
              resizeMode: 'contain',
              width: 30,
              height: 30
            }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.5}
          onPress={this.GoTo_top_function}
          style={{
            position: 'absolute',
            width: 50,
            height: 50,
            alignItems: 'center',
            justifyContent: 'center',
            right: 30,
            bottom: 30
          }}
        >
          <Image
            source={{
              uri:
                'https://reactnativecode.com/wp-content/uploads/2018/01/bottom_arrow_icon.png'
            }}
            style={{
              resizeMode: 'contain',
              width: 30,
              height: 30
            }}
          />
        </TouchableOpacity>
        */}
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1
	}
});

MessageContainer.defaultProps = {
	messages: [],
	user: {},
	renderFooter: null,
	renderMessage: null,
	onLoadEarlier: () => {}
};

MessageContainer.propTypes = {
	messages: PropTypes.array,
	user: PropTypes.object,
	renderFooter: PropTypes.func,
	renderMessage: PropTypes.func,
	onLoadEarlier: PropTypes.func,
	listViewProps: PropTypes.object
};
