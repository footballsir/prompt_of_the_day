#!/bin/bash

echo "=== Prompt of the Day Status Check ==="
echo "Date: $(date)"
echo ""

echo "🐳 Docker Status:"
docker-compose ps

echo ""
echo "🌐 Nginx Status:"
systemctl is-active nginx

echo ""
echo "📅 Scheduler Status:"
systemctl is-active prompt-scheduler

echo ""
echo "🔗 Health Check:"
curl -s http://localhost:3000/api/health | python3 -m json.tool 2>/dev/null || echo "Health check failed"

echo ""
echo "📊 System Resources:"
df -h / | grep -v Filesystem
free -h | grep Mem

echo ""
echo "📝 Recent Logs (last 10 lines):"
docker-compose logs --tail=10 prompt-of-the-day
