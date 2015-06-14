import runloop from 'global/runloop';
import Item from './shared/Item';
import Fragment from '../Fragment';
import Attribute from './element/Attribute';
import EventHandler from './element/EventHandler';
import Transition from './element/Transition';
import updateLiveQueries from './element/updateLiveQueries';
import { voidElementNames } from 'utils/html';
import { bind, render, unrender, update } from 'shared/methodCallers';
import { matches } from 'utils/dom';
import { defineProperty } from 'utils/object';

export default class Element extends Item {
	constructor ( options ) {
		super( options );

		this.liveQueries = []; // TODO rare case. can we handle differently?

		this.isVoid = voidElementNames.test( options.template.e );

		this.attributes = this.template.a ?
			Object.keys( this.template.a ).map( name => {
				return new Attribute({
					name,
					element: this,
					parentFragment: this.parentFragment,
					template: this.template.a[ name ]
				})
			}) :
			[];

		// attach event handlers
		this.eventHandlers = [];
		if ( this.template.v ) {
			Object.keys( this.template.v ).forEach( key => {
				const eventNames = key.split( '-' );
				const template = this.template.v[ key ];

				eventNames.forEach( eventName => {
					this.eventHandlers.push( new EventHandler( this, eventName, template ) );
				});
			});
		}

		if ( options.template.f ) {
			this.fragment = new Fragment({
				template: options.template.f,
				owner: this
			});
		}
	}

	bind () {
		this.attributes.forEach( bind );
		this.eventHandlers.forEach( bind );

		if ( this.fragment ) {
			this.fragment.bind();
		}
	}

	detach () {
		const parentNode = this.node.parentNode;
		if ( parentNode ) parentNode.removeChild( this.node );

		return this.node;
	}

	find ( selector ) {
		if ( matches( this.node, selector ) ) return this.node;
		if ( this.fragment ) {
			return this.fragment.find( selector );
		}
	}

	findAll ( selector, query ) {
		// Add this node to the query, if applicable, and register the
		// query on this element
		if ( query._test( this, true ) && query.live ) {
			this.liveQueries.push( query );
		}

		if ( this.fragment ) {
			this.fragment.findAll( selector, query );
		}
	}

	findComponent ( name ) {
		if ( this.fragment ) {
			return this.fragment.findComponent( name );
		}
	}

	findAllComponents ( name, queryResult ) {
		if ( this.fragment ) {
			this.fragment.findAllComponents( name, queryResult );
		}
	}

	findNextNode () {
		return null;
	}

	firstNode () {
		return this.node;
	}

	render () {
		const node = document.createElement( this.template.e );
		this.node = node;

		defineProperty( node, '_ractive', {
			value: {
				events: {}
			}
		});

		if ( this.fragment ) {
			node.appendChild( this.fragment.render() );
		}

		this.attributes.forEach( render );
		this.eventHandlers.forEach( render );

		updateLiveQueries( this );

		// transitions
		const transitionTemplate = this.template.t0 || this.template.t1;
		if ( transitionTemplate && this.ractive.transitionsEnabled ) {
			const transition = new Transition( this, transitionTemplate, true );
			runloop.registerTransition( transition );

			this._introTransition = transition; // so we can abort if it gets removed
		}

		return node;
	}

	toString () {
		const tagName = this.template.e;

		const attrs = this.attributes
			.map( attr => {
				return ` ${attr.toString()}`;
			})
			.join( '' );

		if ( this.isVoid ) {
			return `<${tagName}${attrs}>`;
		}

		const contents = this.fragment ?
			this.fragment.toString( !/^(?:script|style)$/i.test( this.template.e ) ) : // escape text unless script/style
			'';

		return `<${tagName}${attrs}>${contents}</${tagName}>`;
	}

	unbind () {
		if ( this.fragment ) {
			this.fragment.unbind();
		}
	}

	unrender ( shouldDestroy ) {
		// unrendering before intro completed? complete it now
		// TODO should be an API for aborting transitions
		let transition = this._introTransition;
		if ( transition ) transition.complete();

		// Detach as soon as we can
		if ( this.name === 'option' ) {
			// <option> elements detach immediately, so that
			// their parent <select> element syncs correctly, and
			// since option elements can't have transitions anyway
			this.detach();
		} else if ( shouldDestroy ) {
			runloop.detachWhenReady( this );
		}

		if ( this.fragment ) this.fragment.unrender();

		this.eventHandlers.forEach( unrender );

		// TODO two-way bindings, decorators, event handlers

		// outro transition
		const transitionTemplate = this.template.t0 || this.template.t2;
		if ( transitionTemplate && this.ractive.transitionsEnabled ) {
			const transition = new Transition( this, transitionTemplate, false );
			runloop.registerTransition( transition );
		}

		// TODO update live queries
		// TODO forms are a special case
	}

	update () {
		if ( this.dirty ) {
			this.attributes.forEach( update );
			this.eventHandlers.forEach( update );

			if ( this.fragment ) {
				this.fragment.update();
			}

			this.dirty = false;
		}
	}
}