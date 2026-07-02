#!/usr/bin/env bash
# Phase 5 of the DynamoDB migration: wire the deployed Lambda to DynamoDB.
# Run this manually with admin AWS credentials — it touches production:
#   1. attaches the least-privilege DynamoDB policy (scripts/lambda-dynamodb-policy.json)
#      to the Lambda execution role
#   2. merges the DynamoDB table names + READ_SOURCE into the Lambda's
#      existing environment variables (nothing is removed or overwritten
#      except READ_SOURCE itself)
#
# AWS_REGION is NOT set on the Lambda — it's a reserved variable that AWS
# populates automatically with the function's own region (ap-southeast-1).
#
# Usage: bash scripts/apply-lambda-config.sh [mongo|dynamo]
#   The argument sets READ_SOURCE (default mongo). Flip to dynamo only after
#   the dual-write deploy has soaked and scripts/reconcile-dynamo.js passes.
set -euo pipefail

REGION=ap-southeast-1
FUNCTION=desktop-notes
ROLE=desktop-notes-role-v24s2oto
READ_SOURCE="${1:-mongo}"

if [[ "$READ_SOURCE" != "mongo" && "$READ_SOURCE" != "dynamo" ]]; then
  echo "READ_SOURCE must be 'mongo' or 'dynamo', got: $READ_SOURCE" >&2
  exit 1
fi

echo "Attaching DynamoDB policy to role $ROLE ..."
aws iam put-role-policy \
  --role-name "$ROLE" \
  --policy-name lively-notes-dynamodb \
  --policy-document "file://$(dirname "$0")/lambda-dynamodb-policy.json"

echo "Merging env vars into $FUNCTION (READ_SOURCE=$READ_SOURCE) ..."
MERGED=$(aws lambda get-function-configuration \
  --function-name "$FUNCTION" --region "$REGION" \
  --query 'Environment.Variables' --output json |
  jq --arg rs "$READ_SOURCE" '. + {
    "READ_SOURCE": $rs,
    "DDB_TABLE_NOTES": "lively-notes-notes",
    "DDB_TABLE_SECTIONS": "lively-notes-sections",
    "DDB_TABLE_TODOS": "lively-notes-todos",
    "DDB_TABLE_CALENDAR_NOTES": "lively-notes-calendar-notes",
    "DDB_TABLE_SETTINGS": "lively-notes-settings",
    "DDB_TABLE_PUSH_SUBSCRIPTIONS": "lively-notes-push-subscriptions",
    "DDB_TABLE_IG_POSTS": "lively-notes-ig-posts",
    "DDB_TABLE_USER": "lively-notes-user"
  } | {Variables: .}')

aws lambda update-function-configuration \
  --function-name "$FUNCTION" --region "$REGION" \
  --environment "$MERGED" \
  --query '{State: State, LastUpdateStatus: LastUpdateStatus}' \
  --output table

echo "Done. Current READ_SOURCE on the Lambda:"
aws lambda get-function-configuration \
  --function-name "$FUNCTION" --region "$REGION" \
  --query 'Environment.Variables.READ_SOURCE' --output text
