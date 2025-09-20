#!/bin/bash
# deploy hook trigger
if [ -z "$VERCEL_DEPLOY_HOOK" ]; then echo 'No hook'; exit 1; fi
curl -X POST "$VERCEL_DEPLOY_HOOK"
