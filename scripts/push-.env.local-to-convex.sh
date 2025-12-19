#!/bin/bash

set -e

ENV_FILE=".env.local"
DEPLOYMENT=""

# Check for optional deployment parameter
if [[ -n "$1" ]]; then
  if [ $1 == "prod" ]; then
    DEPLOYMENT="--prod"
  else
    DEPLOYMENT="--deployment-name $1"
    echo "Using deployment: $1"
  fi
fi

# Check if .env.local exists
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE file not found"
  exit 1
fi

echo "Pushing environment variables from $ENV_FILE to Convex..."

# Read .env.local and process each line
while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip empty lines and comments
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

  # Parse var=value
  if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=[[:space:]]*(.*)[[:space:]]*$ ]]; then
    var_name="${BASH_REMATCH[1]}"
    var_value="${BASH_REMATCH[2]}"

    # Remove surrounding quotes
    var_value=${var_value#[\"\']}
    var_value=${var_value%[\"\']}

    echo "Setting $var_name..."
    npx convex env set $DEPLOYMENT "$var_name" -- "$var_value"
  fi
done <"$ENV_FILE"

echo "Done! Current environment variables:"
echo npx convex env list $DEPLOYMENT
