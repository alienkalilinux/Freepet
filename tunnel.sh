#!/bin/bash
# Публичный туннель для ФРИПЕТ
# Использование: ./tunnel.sh start | stop | url

TUNNEL_LOG="$HOME/frpet-tunnel.log"

start() {
  pkill -f "a.pinggy.io" 2>/dev/null
  sleep 1
  setsid nohup ssh -o StrictHostKeyChecking=accept-new -o ServerAliveInterval=25 \
    -o ServerAliveCountMax=4 -o ExitOnForwardFailure=yes \
    -p 443 -R 0:localhost:3000 a.pinggy.io > "$TUNNEL_LOG" 2>&1 < /dev/null &
  sleep 10
  echo "Туннель запущен."
  url
}

stop() {
  pkill -f "a.pinggy.io" 2>/dev/null
  echo "Туннель остановлен."
}

url() {
  echo "Публичные адреса:"
  grep -oE "https://[^ ]+" "$TUNNEL_LOG" 2>/dev/null | grep -vE "dashboard|docs" | sort -u
}

case "$1" in
  start) start ;;
  stop) stop ;;
  url) url ;;
  *) echo "Использование: $0 {start|stop|url}" ;;
esac