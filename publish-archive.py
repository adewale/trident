"""One-time evidence transport. No benchmark collection runs in this job."""
import base64
import hashlib
import json
import os
from pathlib import Path
import subprocess

manifest = json.loads(Path('archive-upload.json').read_text())
repository = os.environ['GH_REPO']
archive = Path(manifest['filename'])
with archive.open('wb') as output:
    for part in manifest['parts']:
        response = subprocess.check_output(['gh', 'api', f'repos/{repository}/git/blobs/{part["sha"]}'])
        data = base64.b64decode(json.loads(response)['content'])
        assert len(data) == part['bytes'], 'Chunk length mismatch'
        assert hashlib.sha256(data).hexdigest() == part['sha256'], 'Chunk hash mismatch'
        output.write(data)
assert archive.stat().st_size == manifest['bytes'], 'Archive length mismatch'
with archive.open('rb') as source:
    assert hashlib.file_digest(source, 'sha256').hexdigest() == manifest['sha256'], 'Archive hash mismatch'
checksum = Path(archive.name + '.sha256')
checksum.write_text(manifest['sha256'] + '  ' + archive.name + '\n')
subprocess.run(['gh', 'release', 'upload', manifest['releaseTag'], str(archive), str(checksum), '--clobber'], check=True)
subprocess.run(['gh', 'api', f'repos/{repository}/releases/{manifest["releaseId"]}', '--method', 'PATCH', '-F', 'draft=false', '--jq', '{html_url, draft, assets: [.assets[] | {name, size}]}'], check=True)
