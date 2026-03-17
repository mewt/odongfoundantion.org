#!/usr/bin/env python3
"""
Test script to verify clean URL configuration works correctly.
Simulates Nginx's try_files behavior for .html extensions.
"""

import os
import sys

def test_url_mapping(url_path, web_root="/tmp/test-clone"):
    """Test if a URL would correctly map to an HTML file."""
    
    # Remove leading/trailing slashes
    url_path = url_path.strip('/')
    
    # Test cases
    test_cases = [
        # (requested URL, expected file, should work)
        ("", "index.html", True),
        ("/", "index.html", True),
        ("about", "about.html", True),
        ("programs", "programs.html", True),
        ("contact", "contact.html", True),
        ("blog", "blog.html", True),
        ("blog-post", "blog-post.html", True),
        ("css/style.css", "css/style.css", True),
        ("img/logo-odong.png", "img/logo-odong.png", True),
        ("nonexistent", None, False),
        ("about/extra", None, False),
    ]
    
    print("🔍 Testing clean URL configuration...")
    print(f"Web root: {web_root}")
    print("-" * 60)
    
    all_pass = True
    
    for url, expected_file, should_work in test_cases:
        # Simulate Nginx try_files logic
        file_found = None
        test_paths = [
            os.path.join(web_root, url),
            os.path.join(web_root, f"{url}.html"),
            os.path.join(web_root, url, "index.html") if url else os.path.join(web_root, "index.html")
        ]
        
        for test_path in test_paths:
            if os.path.exists(test_path):
                file_found = os.path.relpath(test_path, web_root)
                break
        
        status = "✅ PASS" if (file_found == expected_file) == should_work else "❌ FAIL"
        
        if file_found:
            print(f"{status:8} {url:20} → {file_found}")
        else:
            print(f"{status:8} {url:20} → 404 (expected: {expected_file})")
        
        if status == "❌ FAIL":
            all_pass = False
    
    print("-" * 60)
    
    if all_pass:
        print("🎉 All tests passed! Clean URL configuration is correct.")
        return True
    else:
        print("⚠️  Some tests failed. Check your Nginx configuration.")
        return False

if __name__ == "__main__":
    # Use test clone directory if it exists
    test_dir = "/tmp/test-clone" if os.path.exists("/tmp/test-clone") else "."
    
    if len(sys.argv) > 1:
        test_dir = sys.argv[1]
    
    success = test_url_mapping("", test_dir)
    sys.exit(0 if success else 1)