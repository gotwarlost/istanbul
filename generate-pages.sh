export PAGES_DIR=../istanbul-pages
npm install
npm test --coverage
npm install -g yuidocjs
mkdir -p public/apidocs
yuidoc .
rsync -rvt ./public/apidocs/ ${PAGES_DIR}/public/apidocs/
rsync -rvt ./build/coverage/ ${PAGES_DIR}/public/coverage

