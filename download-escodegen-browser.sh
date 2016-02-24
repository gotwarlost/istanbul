#!/bin/sh

ESCG_DIR=node_modules/escodegen
ESCG_VERSION=`grep '"version"' ${ESCG_DIR}/package.json  | awk '{print $2}' | sed 's/[",]//g'`
OUT_FILE=${ESCG_DIR}/escodegen.browser.min.js
if [ ! -f ${OUT_FILE} ]
then
    set -v
    rm -rf __escodegen_clone__
    git clone --branch ${ESCG_VERSION} https://github.com/estools/escodegen.git __escodegen_clone__
    cd __escodegen_clone__

    # Temporarily ignore missing package, see #489
    perl -i -ne '/esprima\-moz/ or print' package.json

    npm i && npm run build-min
    mv escodegen.browser.min.js ../${OUT_FILE}
    cd -
    rm -rf __escodegen_clone__
fi

