#!/bin/sh

FAKE=0
echo $1
if [[ $1 != "--fake" ]]; then
	FAKE=1
fi

# if the tests fail (and we're not trying to work with bloody Windows), abort (errexit)
if [[ $FAKE -eq 0 ]]; then
	set -e
fi

MOD='node_modules/.bin'

echo "> linting..."
$MOD/jshint src

# build library plus tests
echo "> emptying tmp dir..."
rm -rf tmp/*

echo "> building Ractive..."
export COMMIT_HASH=`git rev-parse HEAD`
$MOD/gobble build tmp

# run the tests
echo "> running tests..."
./scripts/test.sh

# if the tests passed, copy to the build folder...
echo "> tests passed. minifying..."

compress () {
	local src=$1
	local dest=${src%.js}.min.js

	$MOD/uglifyjs \
		--compress \
		--mangle \
		--source-map $dest.map \
		--source-map-root $dest \
		--output $dest \
		-- $src \
		> /dev/null 2>&1

	echo "  minified $src"

	$MOD/sorcery -i $dest
	echo "  fixed $dest sourcemap"

}

( cd tmp
	for i in *.js; do compress "$i" & done
	wait
)
echo "> emptying build folder..."
rm -rf build

# make sure there is a build folder
if [[ ! -d build ]]; then
	mkdir build
fi

echo "> copying to build folder..."
mkdir -p build
cp tmp/*.js build
cp tmp/*.map build

echo "> ...aaaand we're done"

if [[ $FAKE -eq 1 ]]; then
	exit 0
fi
