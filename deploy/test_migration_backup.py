"""Archive safety and restore preflight tests; no production connections."""
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("backup_validator", Path(__file__).with_name("validate-backup.py"))
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


class BackupValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.files = {
            "stack.env": "ODONG_IMAGE=ghcr.io/mewt/odongfoundation@sha256:" + "a" * 64 + "\n",
            "secrets/db-root": "test-password",
            "secrets/init-users.sql": "-- fixture only",
            "secrets/ebike-wp-config.php": "<?php",
            "secrets/blog-wp-config.php": "<?php",
            "sites/ebikeland/wp-includes/version.php": "<?php",
            "sites/blog/wp-includes/version.php": "<?php",
            "source/deploy/compose.yaml": "services: {}",
        }

    def snapshot(self, extra=None):
        with tarfile.open(self.root / "runtime.tar.gz", "w:gz") as archive:
            for name, text in self.files.items():
                data = text.encode()
                member = tarfile.TarInfo(name)
                member.size = len(data)
                archive.addfile(member, io.BytesIO(data))
            if extra is not None:
                archive.addfile(extra)
        (self.root / "databases.sql.gz").write_bytes(b"fixture-checksum-content")
        (self.root / "COMPLETE").touch()
        self.hashes()

    def hashes(self):
        names = ["databases.sql.gz", "runtime.tar.gz"]
        names += [name for name in ("docker-images.tar.gz", "migration-images.json", "source-commit.txt", "deploy.pub") if (self.root / name).exists()]
        (self.root / "SHA256SUMS").write_text("".join(
            hashlib.sha256((self.root / name).read_bytes()).hexdigest() + "  " + name + "\n" for name in names
        ))

    def test_valid_daily_backup(self):
        self.snapshot()
        self.assertFalse(validator.validate(self.root)["bundled_images"])

    def test_valid_image_bundle(self):
        self.snapshot()
        images = {name: {"id": "sha256:" + "b" * 64, "tag": "odong-transfer:" + name + "-" + "b" * 12}
                  for name in ("edge", "odong", "blog", "ebike", "db", "mail")}
        (self.root / "migration-images.json").write_text(json.dumps(images))
        (self.root / "docker-images.tar.gz").write_bytes(b"fixture-image-export")
        (self.root / "source-commit.txt").write_text("c" * 40 + "\n")
        (self.root / "deploy.pub").write_text("public-key-fixture\n")
        self.hashes()
        self.assertTrue(validator.validate(self.root)["bundled_images"])

    def test_corruption(self):
        self.snapshot()
        (self.root / "databases.sql.gz").write_bytes(b"changed")
        with self.assertRaisesRegex(ValueError, "Checksum mismatch"):
            validator.validate(self.root)

    def test_incomplete_backup(self):
        self.snapshot()
        (self.root / "COMPLETE").unlink()
        with self.assertRaisesRegex(ValueError, "COMPLETE"):
            validator.validate(self.root)

    def test_archive_path_escape(self):
        for path in ("../../etc/shadow", "/etc/shadow", "sites/../outside", "sites//ambiguous"):
            with self.subTest(path=path):
                self.snapshot(tarfile.TarInfo(path))
                with self.assertRaisesRegex(ValueError, "Unsafe"):
                    validator.validate(self.root)

    def test_links_and_devices(self):
        for kind in (tarfile.SYMTYPE, tarfile.LNKTYPE, tarfile.CHRTYPE):
            with self.subTest(kind=kind):
                member = tarfile.TarInfo("sites/untrusted")
                member.type = kind
                member.linkname = "/etc/shadow"
                self.snapshot(member)
                with self.assertRaisesRegex(ValueError, "Unsupported"):
                    validator.validate(self.root)

    def test_duplicate_member(self):
        self.snapshot(tarfile.TarInfo("stack.env"))
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            validator.validate(self.root)

    def test_missing_database_grants(self):
        del self.files["secrets/init-users.sql"]
        self.snapshot()
        with self.assertRaisesRegex(ValueError, "Required file missing"):
            validator.validate(self.root)

    def test_incomplete_images(self):
        self.snapshot()
        (self.root / "docker-images.tar.gz").write_bytes(b"partial")
        self.hashes()
        with self.assertRaisesRegex(ValueError, "incomplete"):
            validator.validate(self.root)

    def test_checksum_path_escape(self):
        self.snapshot()
        (self.root / "SHA256SUMS").write_text("a" * 64 + "  ../../etc/passwd\n")
        with self.assertRaisesRegex(ValueError, "Unexpected"):
            validator.validate(self.root)

    def test_unpinned_application_image(self):
        self.files["stack.env"] = "ODONG_IMAGE=ghcr.io/mewt/odongfoundation:latest\n"
        self.snapshot()
        with self.assertRaisesRegex(ValueError, "immutable"):
            validator.validate(self.root)


if __name__ == "__main__":
    unittest.main()
