set -ex
export PAGES_DIR=../istanbul-pages
npm test --coverage
mkdir -p public/apidocs
yuidoc .
rsync -rvt ./public/apidocs/ ${PAGES_DIR}/public/apidocs/
rsync -rvt ./build/coverage/ ${PAGES_DIR}/public/coverage

