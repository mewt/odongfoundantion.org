#!/usr/bin/env python3
"""Read-only validation of a trusted Odong backup before root extraction."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import tarfile


def validate(folder: Path) -> dict:
    required = {"databases.sql.gz", "runtime.tar.gz"}
    optional = {"docker-images.tar.gz", "migration-images.json", "source-commit.txt", "deploy.pub"}
    if not (folder / "COMPLETE").is_file():
        raise ValueError("Backup has no COMPLETE marker")
    recorded = set()
    for line in (folder / "SHA256SUMS").read_text().splitlines():
        match = re.fullmatch(r"([a-fA-F0-9]{64}) [ *]([^/\\]+)", line)
        if not match or match[2] not in required | optional or match[2] in recorded:
            raise ValueError("Unexpected or duplicate checksum entry")
        name = match[2]
        path = folder / name
        if path.is_symlink() or not path.is_file():
            raise ValueError(f"Not a regular backup file: {name}")
        digest = hashlib.sha256()
        with path.open("rb") as stream:
            for block in iter(lambda: stream.read(1024 * 1024), b""):
                digest.update(block)
        if digest.hexdigest() != match[1].lower():
            raise ValueError(f"Checksum mismatch: {name}")
        recorded.add(name)
    if not required <= recorded:
        raise ValueError("Missing required checksums")
    present_optional = {name for name in optional if (folder / name).exists()}
    if present_optional and (present_optional != optional or not optional <= recorded):
        raise ValueError("Migration image bundle is incomplete or not checksummed")
    needed = {"stack.env", "secrets/db-root", "secrets/init-users.sql",
              "secrets/ebike-wp-config.php", "secrets/blog-wp-config.php",
              "sites/ebikeland/wp-includes/version.php",
              "sites/blog/wp-includes/version.php", "source/deploy/compose.yaml"}
    found = set()
    unpacked = 0
    with tarfile.open(folder / "runtime.tar.gz", "r:gz") as archive:
        for member in archive:
            name = member.name.rstrip("/")
            path = PurePosixPath(name)
            if (not name or name != str(path) or path.is_absolute() or ".." in path.parts
                    or "\\" in name or any(ord(c) < 32 for c in name)):
                raise ValueError("Unsafe archive member path")
            allowed = path.parts[0] in {
                "sites", "secrets", "mail", "caddy-data", "caddy-config", "stack.env"
            } or name == "source" or name == "source/deploy" or name.startswith("source/deploy/")
            if not allowed or not (member.isdir() or member.isfile()):
                raise ValueError(f"Unsupported archive member (links/devices are rejected): {name}")
            if name in found:
                raise ValueError(f"Duplicate archive member: {name}")
            found.add(name)
            unpacked += member.size
        for name in needed:
            if name not in found or not archive.getmember(name).isfile():
                raise ValueError(f"Required file missing: {name}")
        if archive.getmember('stack.env').size > 16384:
            raise ValueError('Unexpectedly large environment file')
        env = archive.extractfile("stack.env").read().decode()
    images = re.findall(r"^ODONG_IMAGE=(\S+)$", env, re.MULTILINE)
    if len(images) != 1 or not re.fullmatch(
        r"ghcr\.io/mewt/odongfoundation@sha256:[0-9a-f]{64}|odong-transfer:odong-[0-9a-f]{12}", images[0]
    ):
        raise ValueError("Backup must select an immutable Odong image or a verified transfer tag")
    metadata = None
    if present_optional:
        commit = (folder / "source-commit.txt").read_text().strip()
        if not re.fullmatch(r"[0-9a-f]{40}", commit):
            raise ValueError("Invalid source commit")
        metadata = json.loads((folder / "migration-images.json").read_text())
        if set(metadata) != {"edge", "odong", "blog", "ebike", "db", "mail"}:
            raise ValueError("Unexpected image service list")
        for service, spec in metadata.items():
            if (set(spec) != {"id", "tag"}
                    or not re.fullmatch(r"sha256:[0-9a-f]{64}", spec["id"])
                    or spec["tag"] != f"odong-transfer:{service}-{spec['id'][7:19]}"):
                raise ValueError("Invalid saved image identity")
    return {"image": images[0], "unpacked_bytes": unpacked, "bundled_images": metadata is not None}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("backup", type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(validate(args.backup)))
    except (ValueError, OSError, tarfile.TarError, KeyError) as exc:
        parser.exit(1, f"Backup validation failed: {exc}\n")
