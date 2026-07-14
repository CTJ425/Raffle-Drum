#!/bin/sh
set -e

: "${BACKEND_HOST:=backend}"
export BACKEND_HOST

envsubst '${BACKEND_HOST}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
