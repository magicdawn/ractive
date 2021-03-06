import { test } from 'qunit';

test( 'Merging an array of strings only creates the necessary fragments', function ( t ) {
	let entered = 0;
	let exited = 0;

	const ractive = new Ractive({
		el: fixture,
		template: '<ul>{{#items}}<li id="{{.}}" intro-outro="log">{{.}}</li>{{/items}}</ul>',
		data: {
			items: [ 'foo', 'bar', 'baz' ]
		},
		transitions: {
			log ( t ) {
				if ( t.isIntro ) {
					entered += 1;
				} else {
					exited += 1;
				}

				t.complete();
			}
		}
	});

	const foo = ractive.nodes.foo;
	const bar = ractive.nodes.bar;
	const baz = ractive.nodes.baz;

	t.htmlEqual( fixture.innerHTML, '<ul><li id="foo">foo</li><li id="bar">bar</li><li id="baz">baz</li></ul>' );
	t.equal( entered, 3 );

	entered = 0; // reset
	ractive.merge( 'items', [ 'foo', 'bip', 'bar', 'baz' ] );
	t.htmlEqual( fixture.innerHTML, '<ul><li id="foo">foo</li><li id="bip">bip</li><li id="bar">bar</li><li id="baz">baz</li></ul>' );
	t.equal( entered, 1 );

	t.ok( foo === ractive.nodes.foo );
	t.ok( bar === ractive.nodes.bar );
	t.ok( baz === ractive.nodes.baz );
});

test( 'Merging an array of strings only removes the necessary fragments', function ( t ) {
	let entered = 0;
	let exited = 0;

	const ractive = new Ractive({
		el: fixture,
		template: '<ul>{{#items}}<li id="{{.}}" intro-outro="log">{{.}}</li>{{/items}}</ul>',
		data: {
			items: [ 'foo', 'bar', 'baz' ]
		},
		transitions: {
			log ( t ) {
				if ( t.isIntro ) {
					entered += 1;
				} else {
					exited += 1;
				}

				t.complete();
			}
		}
	});

	const foo = ractive.nodes.foo;
	const bar = ractive.nodes.bar;
	const baz = ractive.nodes.baz;

	t.htmlEqual( fixture.innerHTML, '<ul><li id="foo">foo</li><li id="bar">bar</li><li id="baz">baz</li></ul>' );
	t.equal( entered, 3 );

	ractive.merge( 'items', [ 'foo', 'baz' ] );
	t.htmlEqual( fixture.innerHTML, '<ul><li id="foo">foo</li><li id="baz">baz</li></ul>' );
	t.equal( exited, 1 );

	t.ok( foo === ractive.nodes.foo );
	t.ok( isOrphan( bar ) );
	t.ok( baz === ractive.nodes.baz );
});

test( 'Merging an array of same-looking objects only adds/removes the necessary fragments if `compare` is `true`', function ( t ) {
	let entered = 0;
	let exited = 0;

	const ractive = new Ractive({
		el: fixture,
		template: '<ul>{{#items}}<li id="{{name}}" intro-outro="log">{{name}}</li>{{/items}}</ul>',
		data: {
			items: [{ name: 'foo' }, { name: 'bar' }, { name: 'baz' }]
		},
		transitions: {
			log ( t ) {
				if ( t.isIntro ) {
					entered += 1;
				} else {
					exited += 1;
				}

				t.complete();
			}
		}
	});

	const foo = ractive.nodes.foo;
	const bar = ractive.nodes.bar;
	const baz = ractive.nodes.baz;

	t.htmlEqual( fixture.innerHTML, '<ul><li id="foo">foo</li><li id="bar">bar</li><li id="baz">baz</li></ul>' );
	t.equal( entered, 3 );

	entered = 0;
	ractive.merge( 'items', [{ name: 'foo' }, { name: 'baz' }, { name: 'bip' }], { compare: true });
	t.htmlEqual( fixture.innerHTML, '<ul><li id="foo">foo</li><li id="baz">baz</li><li id="bip">bip</li></ul>' );
	t.equal( entered, 1 );
	t.equal( exited, 1 );

	t.ok( foo === ractive.nodes.foo );
	t.ok( isOrphan( bar ) );
	t.ok( baz === ractive.nodes.baz );
});

test( 'Merging an array of same-looking objects only adds/removes the necessary fragments if `compare` is a string id field', function ( t ) {
	let entered = 0;
	let exited = 0;

	const ractive = new Ractive({
		el: fixture,
		template: '<ul>{{#items}}<li id="{{name}}" intro-outro="log">{{name}}</li>{{/items}}</ul>',
		data: {
			items: [{ name: 'foo' }, { name: 'bar' }, { name: 'baz' }]
		},
		transitions: {
			log ( t ) {
				if ( t.isIntro ) {
					entered += 1;
				} else {
					exited += 1;
				}

				t.complete();
			}
		}
	});

	const foo = ractive.nodes.foo;
	const bar = ractive.nodes.bar;
	const baz = ractive.nodes.baz;

	t.htmlEqual( fixture.innerHTML, '<ul><li id="foo">foo</li><li id="bar">bar</li><li id="baz">baz</li></ul>' );
	t.equal( entered, 3 );

	entered = 0;
	ractive.merge( 'items', [{ name: 'foo' }, { name: 'baz' }, { name: 'bip' }], { compare: 'name' });
	t.htmlEqual( fixture.innerHTML, '<ul><li id="foo">foo</li><li id="baz">baz</li><li id="bip">bip</li></ul>' );
	t.equal( entered, 1 );
	t.equal( exited, 1 );

	t.ok( foo === ractive.nodes.foo );
	t.ok( isOrphan( bar ) );
	t.ok( baz === ractive.nodes.baz );
});

test( 'Merging an array of same-looking objects only adds/removes the necessary fragments if `compare` is a comparison function', function ( t ) {
	let entered = 0;
	let exited = 0;

	const ractive = new Ractive({
		el: fixture,
		template: '<ul>{{#items}}<li id="{{name}}" intro-outro="log">{{name}}</li>{{/items}}</ul>',
		data: {
			items: [{ name: 'foo' }, { name: 'bar' }, { name: 'baz' }]
		},
		transitions: {
			log ( t ) {
				if ( t.isIntro ) {
					entered += 1;
				} else {
					exited += 1;
				}

				t.complete();
			}
		}
	});

	const foo = ractive.nodes.foo;
	const bar = ractive.nodes.bar;
	const baz = ractive.nodes.baz;

	t.htmlEqual( fixture.innerHTML, '<ul><li id="foo">foo</li><li id="bar">bar</li><li id="baz">baz</li></ul>' );
	t.equal( entered, 3 );

	entered = 0;
	ractive.merge( 'items', [{ name: 'foo' }, { name: 'baz' }, { name: 'bip' }], {
		compare: item => item.name
	});
	t.htmlEqual( fixture.innerHTML, '<ul><li id="foo">foo</li><li id="baz">baz</li><li id="bip">bip</li></ul>' );
	t.equal( entered, 1 );
	t.equal( exited, 1 );

	t.ok( foo === ractive.nodes.foo );
	t.ok( isOrphan( bar ) );
	t.ok( baz === ractive.nodes.baz );
});

test( 'If identity comparison fails, the resulting shape of the DOM is still correct', function ( t ) {
	let entered = 0;
	let exited = 0;

	const ractive = new Ractive({
		el: fixture,
		template: '<ul>{{#items}}<li id="{{name}}" intro-outro="log">{{name}}</li>{{/items}}</ul>',
		data: {
			items: [{ name: 'foo' }, { name: 'bar' }, { name: 'baz' }]
		},
		transitions: {
			log ( t ) {
				if ( t.isIntro ) {
					entered += 1;
				} else {
					exited += 1;
				}

				t.complete();
			}
		}
	});

	const foo = ractive.nodes.foo;
	const bar = ractive.nodes.bar;
	const baz = ractive.nodes.baz;

	t.htmlEqual( fixture.innerHTML, '<ul><li id="foo">foo</li><li id="bar">bar</li><li id="baz">baz</li></ul>' );
	t.equal( entered, 3 );

	entered = 0;
	ractive.merge( 'items', [{ name: 'foo' }, { name: 'baz' }, { name: 'bip' }] );
	t.htmlEqual( fixture.innerHTML, '<ul><li id="foo">foo</li><li id="baz">baz</li><li id="bip">bip</li></ul>' );
	t.equal( entered, 3 );
	t.equal( exited, 3 );

	t.ok( foo !== ractive.nodes.foo );
	t.ok( isOrphan( bar ) );
	t.ok( baz !== ractive.nodes.baz );
});

test( 'Merging will trigger upstream updates regardless of whether items are being added/removed', function ( t ) {
	const ractive = new Ractive({
		el: fixture,
		template: '{{items}} {{JSON.stringify(items)}}',
		data: {
			items: [ 'a', 'b', 'c' ]
		}
	});

	ractive.merge( 'items', [ 'b', 'a', 'c' ]);

	t.htmlEqual( fixture.innerHTML, 'b,a,c ["b","a","c"]' );
});

test( '#if section with merged array (#952)', function ( t ) {
	const ractive = new Ractive({
		el: fixture,
		template: '{{#if list}}yes{{else}}no{{/if}}',
		data: {
			list: [ 'a', 'b', 'c' ]
		}
	});

	t.htmlEqual( fixture.innerHTML, 'yes' );

	ractive.merge( 'list', [ 'a', 'b', 'c', 'd' ] );
	t.htmlEqual( fixture.innerHTML, 'yes' );
});

test( 'Unbound sections disregard merge instructions (#967)', function ( t ) {
	const ractive = new Ractive({
		el: fixture,
		template: `
			<ul>
				{{#list:i}}
					<li>{{.}}: {{#list}}{{.}}{{/}}</li>
				{{/list}}
			</ul>`,
		data: {
			list: [ 'a', 'b', 'c' ]
		}
	});

	ractive.merge( 'list', [ 'a', 'c' ] );
	t.htmlEqual( fixture.innerHTML, '<ul><li>a: ac</li><li>c: ac</li></ul>' );
});

test( 'Shuffling the order of array members', function ( t ) {
	const ractive = new Ractive({
		el: fixture,
		template: '<ul>{{#each items}}<li>{{this}}</li>{{/each}}</ul>',
		data: {
			items: [ 'a', 'b', 'c', 'd' ]
		}
	});

	ractive.merge( 'items', [ 'c', 'b', 'd', 'a' ]);
	t.htmlEqual( fixture.innerHTML, '<ul><li>c</li><li>b</li><li>d</li><li>a</li></ul>' );
});

test( 'Merging works with unrendered instances (#1314)', function ( t ) {
	const ractive = new Ractive({
		template: '{{#items}}{{.}}{{/}}',
		data: {
			items: [ 'a','b' ]
		}
	});

	ractive.merge( 'items', [ 'b', 'a' ]);
	t.htmlEqual( ractive.toHTML(), 'ba' );
});

test( 'Expressions with index references survive a merge', t => {
	const ractive = new Ractive({
		el: fixture,
		template: `
			{{#each items :i}}
				<p>{{i+1}} ({{i}}): {{this.toUpperCase()}} ({{this}})</p>
			{{/each}}`,
		data: {
			items: [ 'a', 'b', 'c' ]
		}
	});

	ractive.merge( 'items', [ 'c', 'a' ]);

	t.htmlEqual( fixture.innerHTML, '<p>1 (0): C (c)</p><p>2 (1): A (a)</p>' );
});

function isOrphan ( node ) {
	// IE8... when you detach a node from its parent it thinks the document
	// is its parent
	return !node.parentNode || node.parentNode instanceof HTMLDocument;
}
