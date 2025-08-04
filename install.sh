#!/bin/bash
echo "Setting npm registry to public registry..."
npm config set registry https://registry.npmjs.org/
npm config set @types:registry https://registry.npmjs.org/
npm config set always-auth false

echo "Current npm configuration:"
npm config list

echo "Installing dependencies..."
npm install
