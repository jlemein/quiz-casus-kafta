#!/bin/bash

# display opened topics
curl -H "Accept:application/json" localhost:9090/connectors/

# register new topics
curl -i -X POST -H "Accept:application/json" -H "Content-Type:application/json" localhost:9090/connectors/ -d @pg-questions-config.json
curl -i -X POST -H "Accept:application/json" -H "Content-Type:application/json" localhost:9090/connectors/ -d @pg-votes-config.json
