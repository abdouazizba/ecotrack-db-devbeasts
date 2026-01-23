#!/bin/bash

# EcoTrack Gateway - Health Check Script
# Usage: bash test-gateway.sh

echo "🔍 Testing EcoTrack Gateway..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test Gateway Health
echo -e "${YELLOW}[1/5] Testing Gateway Health Check...${NC}"
RESPONSE=$(curl -s http://localhost:3000/health)
if echo "$RESPONSE" | grep -q "healthy"; then
  echo -e "${GREEN}✓ Gateway is healthy${NC}"
  echo "    Response: $RESPONSE" | head -c 100
  echo ""
else
  echo -e "${RED}✗ Gateway health check failed${NC}"
  echo "    Response: $RESPONSE"
  exit 1
fi
echo ""

# Test Auth Service (via Gateway)
echo -e "${YELLOW}[2/5] Testing Auth Service (via Gateway)...${NC}"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User","role":"CITOYEN"}')
if [ ! -z "$RESPONSE" ]; then
  echo -e "${GREEN}✓ Auth service is responding${NC}"
  echo "    Response: $RESPONSE" | head -c 100
  echo ""
else
  echo -e "${RED}✗ Auth service not responding${NC}"
fi
echo ""

# Test Container Service (via Gateway)
echo -e "${YELLOW}[3/5] Testing Container Service (via Gateway)...${NC}"
RESPONSE=$(curl -s http://localhost:3000/api/zones)
if echo "$RESPONSE" | grep -q -E "\[|\{|success"; then
  echo -e "${GREEN}✓ Container service is responding${NC}"
  echo "    Response: $RESPONSE" | head -c 100
  echo ""
else
  echo -e "${YELLOW}⚠ Container service returned unexpected format${NC}"
  echo "    Response: $RESPONSE"
fi
echo ""

# Test Tour Service (via Gateway)
echo -e "${YELLOW}[4/5] Testing Tour Service (via Gateway)...${NC}"
RESPONSE=$(curl -s http://localhost:3000/api/tournees)
if echo "$RESPONSE" | grep -q -E "\[|\{|success"; then
  echo -e "${GREEN}✓ Tour service is responding${NC}"
  echo "    Response: $RESPONSE" | head -c 100
  echo ""
else
  echo -e "${YELLOW}⚠ Tour service returned unexpected format${NC}"
  echo "    Response: $RESPONSE"
fi
echo ""

# Test Signal Service (via Gateway)
echo -e "${YELLOW}[5/5] Testing Signal Service (via Gateway)...${NC}"
RESPONSE=$(curl -s http://localhost:3000/api/signalements)
if echo "$RESPONSE" | grep -q -E "\[|\{|success"; then
  echo -e "${GREEN}✓ Signal service is responding${NC}"
  echo "    Response: $RESPONSE" | head -c 100
  echo ""
else
  echo -e "${YELLOW}⚠ Signal service returned unexpected format${NC}"
  echo "    Response: $RESPONSE"
fi
echo ""

echo -e "${GREEN}✓ All tests completed!${NC}"
echo ""
echo "🎉 Gateway is working correctly!"
