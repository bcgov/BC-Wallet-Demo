#!/bin/bash

ENVSH_ENV="${ENVSH_ENV:-./.env}"
ENVSH_PREFIX="${ENVSH_PREFIX:-NEXT_PUBLIC_}"
ENVSH_PREFIX_STRIP="${ENVSH_PREFIX_STRIP:-true}"
ENVSH_PREPEND="${ENVSH_PREPEND:-window.__env = {}"
ENVSH_APPEND="${ENVSH_APPEND:-}"
ENVSH_OUTPUT="${ENVSH_OUTPUT:-./apps/bc-wallet-showcase-creator/public/__env.js}"
ENVSH_VERBOSE="${ENVSH_VERBOSE:-false}"

mkdir -p "$(dirname "$ENVSH_OUTPUT")"

echo "$ENVSH_PREPEND" > "$ENVSH_OUTPUT"

if [ -f "$ENVSH_ENV" ]; then
  if [ "$ENVSH_VERBOSE" = "true" ]; then
    echo "Loading environment variables from $ENVSH_ENV"
  fi
  
  while IFS= read -r line || [ -n "$line" ]; do
    if [[ $line =~ ^# ]] || [[ -z $line ]]; then
      continue
    fi
    
    if [[ $line =~ ^([^=]+)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      value="${BASH_REMATCH[2]}"
      
      if [[ $key == $ENVSH_PREFIX* ]]; then
        if [ "$ENVSH_PREFIX_STRIP" = "true" ]; then
          output_key="${key#$ENVSH_PREFIX}"
        else
          output_key="$key"
        fi
        
        echo "  $output_key: \"$value\"," >> "$ENVSH_OUTPUT"
        
        if [ "$ENVSH_VERBOSE" = "true" ]; then
          echo "Added $output_key from .env file"
        fi
      fi
    fi
  done < "$ENVSH_ENV"
fi

for var in $(env | sort); do
  if [[ $var =~ ^([^=]+)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"
    
    if [[ $key == $ENVSH_PREFIX* ]]; then
      if [ "$ENVSH_PREFIX_STRIP" = "true" ]; then
        output_key="${key#$ENVSH_PREFIX}"
      else
        output_key="$key"
      fi
      
      sed -i "/^  $output_key: /d" "$ENVSH_OUTPUT"
      
      echo "  $output_key: \"$value\"," >> "$ENVSH_OUTPUT"
      
      if [ "$ENVSH_VERBOSE" = "true" ]; then
        echo "Added $output_key from environment"
      fi
    fi
  fi
done

echo "}" >> "$ENVSH_OUTPUT"

if [ "$ENVSH_VERBOSE" = "true" ]; then
  echo "Environment variables written to $ENVSH_OUTPUT"
fi

echo "Generated __env.js at: $ENVSH_OUTPUT"
ls -la $(dirname "$ENVSH_OUTPUT")
cat "$ENVSH_OUTPUT"

if [ $# -gt 0 ]; then
  exec "$@"
fi 