#!/bin/bash

echo "🧪 Testing Quiz Backend with Google Sheets..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo -e "\n${YELLOW}1. Checking if backend server is running...${NC}"
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${RED}✗ Server is not running. Start it with: node server.js${NC}"
    exit 1
fi

# Test health endpoint
echo -e "\n${YELLOW}2. Testing health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:5000/api/health)
echo "Response: $HEALTH_RESPONSE"

# Check if Google Sheets is connected
if echo "$HEALTH_RESPONSE" | grep -q '"googleSheets":"Connected"'; then
    echo -e "${GREEN}✓ Google Sheets is connected${NC}"
else
    echo -e "${YELLOW}⚠ Google Sheets may not be connected${NC}"
fi

# Test questions endpoint
echo -e "\n${YELLOW}3. Testing questions endpoint...${NC}"
QUESTIONS_RESPONSE=$(curl -s http://localhost:5000/api/questions)

# Check source
if echo "$QUESTIONS_RESPONSE" | grep -q '"source":"google-sheets"'; then
    echo -e "${GREEN}✓ Questions are loading from Google Sheets${NC}"
elif echo "$QUESTIONS_RESPONSE" | grep -q '"success":false'; then
    echo -e "${RED}✗ Questions endpoint returned error (no Google Sheets configured)${NC}"
else
    echo -e "${RED}✗ Unexpected response from questions endpoint${NC}"
fi

# Count questions
QUESTION_COUNT=$(echo "$QUESTIONS_RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)
if [ ! -z "$QUESTION_COUNT" ]; then
    echo -e "${GREEN}✓ Found $QUESTION_COUNT questions${NC}"
fi

# Test specific question
echo -e "\n${YELLOW}4. Testing specific question endpoint...${NC}"
SINGLE_QUESTION=$(curl -s http://localhost:5000/api/questions/1)
if echo "$SINGLE_QUESTION" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Single question endpoint working${NC}"
else
    echo -e "${RED}✗ Single question endpoint failed${NC}"
fi

# Test stats endpoint
echo -e "\n${YELLOW}5. Testing stats endpoint...${NC}"
STATS_RESPONSE=$(curl -s http://localhost:5000/api/questions/stats)
if echo "$STATS_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Stats endpoint working${NC}"
    TOTAL_WEIGHTAGE=$(echo "$STATS_RESPONSE" | grep -o '"totalWeightage":[0-9]*' | cut -d':' -f2)
    if [ ! -z "$TOTAL_WEIGHTAGE" ]; then
        echo -e "${GREEN}✓ Total weightage: $TOTAL_WEIGHTAGE points${NC}"
    fi
else
    echo -e "${RED}✗ Stats endpoint failed${NC}"
fi

echo -e "\n${GREEN}🎉 Backend testing complete!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Start your frontend: cd .. && npm run dev"
echo "2. Open http://localhost:5173 in your browser"
echo "3. Check that the quiz loads questions from Google Sheets"
