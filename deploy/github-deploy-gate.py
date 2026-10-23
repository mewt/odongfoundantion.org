#!/usr/bin/python3
"""Forced SSH command: accepts only this repository's image deployment."""
import os
import re
import sys

command = os.environ.get("SSH_ORIGINAL_COMMAND", "")
match = re.fullmatch(r"deploy (sha256:[0-9a-f]{64}) ([A-Za-z0-9][A-Za-z0-9-]{0,38})", command)
if not match:
    sys.exit("Only validated Odong image deployments are allowed.")
os.execv("/usr/bin/sudo", ["sudo", "/usr/local/sbin/odong-release", *match.groups()])
