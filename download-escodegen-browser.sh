#!/bin/sh

ESCG_DIR=node_modules/escodegen
ESCG_VERSION=`grep '"version"' ${ESCG_DIR}/package.json  | awk '{print $2}' | sed 's/[",]//g'`
OUT_FILE=${ESCG_DIR}/escodegen.browser.min.js
if [ ! -f ${OUT_FILE} ]
then
    set -v
    curl -sSL -o ${ESCG_DIR}/escodegen.browser.min.js  https://raw.githubusercontent.com/estools/escodegen/${ESCG_VERSION}/escodegen.browser.min.js
fi

