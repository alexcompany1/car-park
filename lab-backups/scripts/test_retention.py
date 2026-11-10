"""Prueba la retención en una carpeta temporal con copias del archivo real de ensayo."""
import os
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

import lab

class RetentionTests(unittest.TestCase):
    def test_retains_two_valid_copies_and_preserves_incomplete_folders(self):
        original, _ = lab.choose_backup('latest')
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            names = [f'backup-2026010{number}-local' for number in (1, 2, 3)]
            for name in names:
                shutil.copytree(original, root / name)
            (root / '.partial-incomplete').mkdir()
            (root / 'backup-0000-local').mkdir()
            with patch.object(lab, 'BACKUPS', root), patch.dict(os.environ, {'KEEP_BACKUPS': '2'}):
                lab.retention()
            self.assertFalse((root / names[0]).exists())
            self.assertTrue((root / names[1]).exists())
            self.assertTrue((root / names[2]).exists())
            self.assertTrue((root / '.partial-incomplete').exists())
            self.assertTrue((root / 'backup-0000-local').exists())

    def test_invalid_retention_cannot_remove_files(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            sentinel = root / 'do-not-remove'
            sentinel.write_text('test')
            with patch.object(lab, 'BACKUPS', root), patch.dict(os.environ, {'KEEP_BACKUPS': '0'}):
                with self.assertRaises(lab.LabError):
                    lab.retention()
            self.assertEqual(sentinel.read_text(), 'test')

if __name__ == '__main__':
    unittest.main()
