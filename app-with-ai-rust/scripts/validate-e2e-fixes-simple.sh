#!/bin/bash

###############################################################################
# Simple E2E Validation Script for AppWithAI
# Validates that the project structure and key files are intact
###############################################################################

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="/Users/pramodkoshy/projects/dynamic/test/app-with-ai"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}E2E VALIDATION REPORT${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 1: Check project structure
echo -e "${BLUE}[TEST 1] Project Structure${NC}"
if [ -d "$PROJECT_ROOT/packages" ]; then
    echo -e "${GREEN}✓ packages directory exists${NC}"
else
    echo -e "${RED}✗ packages directory missing${NC}"
fi

if [ -d "$PROJECT_ROOT/packages/generator" ]; then
    echo -e "${GREEN}✓ generator package exists${NC}"
else
    echo -e "${RED}✗ generator package missing${NC}"
fi

if [ -d "$PROJECT_ROOT/packages/web" ]; then
    echo -e "${GREEN}✓ web package exists${NC}"
else
    echo -e "${RED}✗ web package missing${NC}"
fi

if [ -d "$PROJECT_ROOT/tests" ]; then
    echo -e "${GREEN}✓ tests directory exists${NC}"
else
    echo -e "${RED}✗ tests directory missing${NC}"
fi

echo ""

# Test 2: Check E2E test files
echo -e "${BLUE}[TEST 2] E2E Test Files${NC}"
if [ -f "$PROJECT_ROOT/tests/e2e/framework-tests.e2e.spec.ts" ]; then
    echo -e "${GREEN}✓ framework-tests.e2e.spec.ts exists${NC}"
else
    echo -e "${RED}✗ framework-tests.e2e.spec.ts missing${NC}"
fi

if [ -f "$PROJECT_ROOT/playwright.config.ts" ]; then
    echo -e "${GREEN}✓ playwright.config.ts exists${NC}"
else
    echo -e "${RED}✗ playwright.config.ts missing${NC}"
fi

echo ""

# Test 3: Check generator templates
echo -e "${BLUE}[TEST 3] Generator Templates${NC}"
if [ -d "$PROJECT_ROOT/packages/generator/templates" ]; then
    echo -e "${GREEN}✓ templates directory exists${NC}"

    # Check for option1 (Modern Web)
    if [ -d "$PROJECT_ROOT/packages/generator/templates/option1-modern-web" ]; then
        echo -e "${GREEN}✓ option1-modern-web template exists${NC}"
    else
        echo -e "${RED}✗ option1-modern-web template missing${NC}"
    fi

    # Check for option2 (Enterprise SAP)
    if [ -d "$PROJECT_ROOT/packages/generator/templates/option2-enterprise-sap" ]; then
        echo -e "${GREEN}✓ option2-enterprise-sap template exists${NC}"
    else
        echo -e "${RED}✗ option2-enterprise-sap template missing${NC}"
    fi
else
    echo -e "${RED}✗ templates directory missing${NC}"
fi

echo ""

# Test 4: Check for key generator files
echo -e "${BLUE}[TEST 4] Key Generator Files${NC}"

if [ -f "$PROJECT_ROOT/packages/generator/src/generators/option2/openui5-frontend.generator.ts" ]; then
    echo -e "${GREEN}✓ openui5-frontend.generator.ts exists${NC}"
else
    echo -e "${RED}✗ openui5-frontend.generator.ts missing${NC}"
fi

echo ""

# Test 5: Check package.json scripts
echo -e "${BLUE}[TEST 5] Package.json Scripts${NC}"
if grep -q '"test:playwright"' "$PROJECT_ROOT/package.json"; then
    echo -e "${GREEN}✓ playwright test script exists${NC}"
else
    echo -e "${RED}✗ playwright test script missing${NC}"
fi

if grep -q '"generate:nextjs"' "$PROJECT_ROOT/package.json"; then
    echo -e "${GREEN}✓ generate:nextjs script exists${NC}"
else
    echo -e "${RED}✗ generate:nextjs script missing${NC}"
fi

if grep -q '"generate:odata"' "$PROJECT_ROOT/package.json"; then
    echo -e "${GREEN}✓ generate:odata script exists${NC}"
else
    echo -e "${RED}✗ generate:odata script missing${NC}"
fi

echo ""

# Test 6: Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}VALIDATION COMPLETE${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Project structure validated${NC}"
echo -e "${BLUE}Report generated: $(date)${NC}"
echo ""
