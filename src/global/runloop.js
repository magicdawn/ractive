import Hook from '../events/Hook';
import { addToArray } from '../utils/array';
import Promise from '../utils/Promise';
import TransitionManager from './TransitionManager';

const changeHook = new Hook( 'change' );

let batch;

const runloop = {
	start ( instance, returnPromise ) {
		var promise, fulfilPromise;

		if ( returnPromise ) {
			promise = new Promise( f => ( fulfilPromise = f ) );
		}

		batch = {
			previousBatch: batch,
			transitionManager: new TransitionManager( fulfilPromise, batch && batch.transitionManager ),
			fragments: [],
			tasks: [],
			immediateObservers: [],
			deferredObservers: [],
			instance: instance
		};

		return promise;
	},

	end () {
		flushChanges();

		batch.transitionManager.init();
		batch = batch.previousBatch;
	},

	addFragment ( fragment ) {
		addToArray( batch.fragments, fragment );
	},

	addObserver ( observer, defer ) {
		addToArray( defer ? batch.deferredObservers : batch.immediateObservers, observer );
	},

	registerTransition ( transition ) {
		transition._manager = batch.transitionManager;
		batch.transitionManager.add( transition );
	},

	registerDecorator ( decorator ) {
		batch.transitionManager.addDecorator( decorator );
	},

	// synchronise node detachments with transition ends
	detachWhenReady ( thing ) {
		batch.transitionManager.detachQueue.push( thing );
	},

	scheduleTask ( task, postRender ) {
		var _batch;

		if ( !batch ) {
			task();
		} else {
			_batch = batch;
			while ( postRender && _batch.previousBatch ) {
				// this can't happen until the DOM has been fully updated
				// otherwise in some situations (with components inside elements)
				// transitions and decorators will initialise prematurely
				_batch = _batch.previousBatch;
			}

			_batch.tasks.push( task );
		}
	}
};

export default runloop;

function dispatch ( observer ) {
	observer.dispatch();
}

function flushChanges () {
	batch.immediateObservers.forEach( dispatch );

	// Now that changes have been fully propagated, we can update the DOM
	// and complete other tasks
	let i = batch.fragments.length;
	let fragment;

	while ( i-- ) {
		fragment = batch.fragments[i];

		// TODO deprecate this. It's annoying and serves no useful function
		const ractive = fragment.ractive;
		changeHook.fire( ractive, ractive.viewmodel.changes );
		ractive.viewmodel.changes = {};

		fragment.update();
	}
	batch.fragments.length = 0;

	batch.transitionManager.start();

	batch.deferredObservers.forEach( dispatch );

	const tasks = batch.tasks;
	batch.tasks = [];

	for ( i = 0; i < tasks.length; i += 1 ) {
		tasks[i]();
	}

	// If updating the view caused some model blowback - e.g. a triple
	// containing <option> elements caused the binding on the <select>
	// to update - then we start over
	if ( batch.fragments.length ) return flushChanges();
}
