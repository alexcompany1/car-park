#!/bin/bash
set -e

echo "Iniciando Mosquitto..."
docker compose -f simulador-mqtt/compose.yaml up -d

echo "Iniciando Carpark..."
npm run demo