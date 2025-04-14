#!/usr/bin/env bash

mongoimport --db lynk --collection users        --file /docker-entrypoint-initdb.d/lynk.users.json         --jsonArray
mongoimport --db lynk --collection messages     --file /docker-entrypoint-initdb.d/lynk.messages.json      --jsonArray
mongoimport --db lynk --collection groups       --file /docker-entrypoint-initdb.d/lynk.groups.json       --jsonArray
mongoimport --db lynk --collection friendships  --file /docker-entrypoint-initdb.d/lynk.friendships.json   --jsonArray
mongoimport --db lynk --collection blockedusers --file /docker-entrypoint-initdb.d/lynk.blockedusers.json  --jsonArray
