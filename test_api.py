#!/usr/bin/env python3
"""Test the registration API"""

import json
import urllib.request
import urllib.error

payload = json.dumps({
    'name': 'Test User',
    'email': 'testuser@example.com',
    'password': 'password123'
}).encode('utf-8')

try:
    req = urllib.request.Request(
        'http://127.0.0.1:5000/api/register',
        data=payload,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        body = response.read().decode('utf-8')
        print(f'Status: {response.status}')
        print(f'Response: {body}')
except urllib.error.HTTPError as e:
    print(f'HTTP Error {e.code}')
    print(f'Response: {e.read().decode("utf-8")}')
except Exception as e:
    print(f'Error: {type(e).__name__}: {e}')
