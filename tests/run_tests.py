#!/usr/bin/env python3
"""
Test runner for Quickbase MCP Integration tests.
Run all tests or specify tests to run.
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

# Add parent directory to path to import modules properly
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

TESTS = {
    "connection": "test_connection.py",
    "file": "test_file_operations.py",
    "pagination": "test_pagination.py",
    "validate": "validate_implementation.py",
    "remaining": "test_remaining_operations.py",
}

def run_test(test_script):
    """Run a specific test script"""
    test_path = os.path.join(os.path.dirname(__file__), test_script)
    if not os.path.exists(test_path):
        print(f"Error: Test script '{test_script}' not found at {test_path}")
        return False
    
    print(f"Running {test_script}...")
    result = subprocess.run(
        [sys.executable, test_path],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        universal_newlines=True
    )
    
    print(result.stdout)
    if result.stderr:
        print(f"Errors:\n{result.stderr}")
    
    return result.returncode == 0

def run_all_tests():
    """Run all test scripts"""
    success = True
    results = {}
    
    for test_name, test_script in TESTS.items():
        print(f"\n{'=' * 40}\nRunning {test_name} test\n{'=' * 40}")
        test_success = run_test(test_script)
        results[test_name] = "PASSED" if test_success else "FAILED"
        if not test_success:
            success = False
    
    # Print summary
    print("\n\n")
    print("=" * 40)
    print(" Test Results Summary ")
    print("=" * 40)
    for test_name, result in results.items():
        print(f"{test_name.ljust(15)}: {result}")
    print("=" * 40)
    
    return success

def main():
    parser = argparse.ArgumentParser(description='Run Quickbase MCP Integration tests')
    parser.add_argument('tests', nargs='*', help='Specific tests to run (connection, file, pagination, validate, remaining)')
    parser.add_argument('--all', action='store_true', help='Run all tests')
    args = parser.parse_args()
    
    # If no tests specified, show help
    if not args.tests and not args.all:
        parser.print_help()
        return 1
    
    # Run specified tests or all tests
    if args.all:
        success = run_all_tests()
    else:
        success = True
        for test in args.tests:
            if test not in TESTS:
                print(f"Unknown test: {test}")
                print(f"Available tests: {', '.join(TESTS.keys())}")
                return 1
            
            test_script = TESTS[test]
            test_success = run_test(test_script)
            if not test_success:
                success = False
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())