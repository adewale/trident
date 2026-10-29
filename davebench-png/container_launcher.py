"""Run all PNG participants under an enforced one-CPU cgroup on this machine.

The tiny image supplies directory structure; readonly host mounts supply the
exact installed userland. No package download or library substitution occurs.
"""
import hashlib
import io
import json
import os
import shutil
from pathlib import Path
import subprocess
import sys
import tarfile

ROOT = Path(__file__).resolve().parents[1]


def main(profile, args):
    if profile not in ('controlled', 'seven'):
        raise SystemExit('Unknown PNG profile')
    runner = f'davebench-png/{profile}/run.mjs'
    if '--out' not in args:
        raise SystemExit('Pass run.mjs arguments, including a fresh --out')
    out = Path(args[args.index('--out') + 1]).resolve()
    out.relative_to(Path('/workspace'))
    control = Path(str(out) + '.container')
    control.mkdir()
    environment = dict(os.environ)
    for key in ['DOCKER_HOST', 'DOCKER_CONTEXT', 'DOCKER_TLS', 'DOCKER_TLS_VERIFY', 'DOCKER_CERT_PATH']:
        environment.pop(key, None)
    docker = ['docker', '--host=unix:///var/run/docker.sock']

    def call(*arguments, **kwargs):
        return subprocess.check_output([*docker, *arguments], env=environment, text=True, **kwargs).strip()

    rootfs = control / 'rootfs.tar'
    with tarfile.open(rootfs, 'w') as archive:
        for name in ['usr', 'opt', 'workspace', 'tmp', 'etc', 'etc/ssl', 'etc/ssl/certs', 'home', 'home/agent']:
            item = tarfile.TarInfo(name)
            item.type = tarfile.DIRTYPE
            item.mode = 0o1777 if name == 'tmp' else 0o755
            item.uid = os.getuid() if name.startswith('home') else 0
            item.gid = os.getgid() if name.startswith('home') else 0
            archive.addfile(item)
        for name, target in [('bin', 'usr/bin'), ('sbin', 'usr/sbin'), ('lib', 'usr/lib'), ('lib64', 'usr/lib64')]:
            item = tarfile.TarInfo(name)
            item.type = tarfile.SYMTYPE
            item.linkname = target
            archive.addfile(item)
        contents = {
            'etc/os-release': Path('/etc/os-release').read_bytes(),
            'etc/passwd': f'root:x:0:0:root:/root:/bin/bash\nagent:x:{os.getuid()}:{os.getgid()}:agent:/home/agent:/bin/bash\n'.encode(),
            'etc/group': f'root:x:0:\nagent:x:{os.getgid()}:\n'.encode(),
        }
        for name, data in contents.items():
            item = tarfile.TarInfo(name)
            item.mode = 0o644
            item.size = len(data)
            archive.addfile(item, io.BytesIO(data))
    rootfs_sha = hashlib.sha256(rootfs.read_bytes()).hexdigest()
    tag = 'trident-png-root:' + rootfs_sha[:20]
    probe = subprocess.run([*docker, 'image', 'inspect', tag, '--format', '{{.Id}}'], env=environment, text=True, capture_output=True)
    image = probe.stdout.strip() if probe.returncode == 0 else call('import', str(rootfs), tag)
    mounts = [('/usr', '/usr', True), ('/opt', '/opt', True), ('/workspace', '/workspace', False),
              ('/etc/ld.so.cache', '/etc/ld.so.cache', True), ('/etc/chromium.d', '/etc/chromium.d', True),
              ('/etc/ssl/certs/ca-certificates.crt', '/etc/ssl/certs/ca-certificates.crt', True)]
    selected_environment = {
        'LIBGL_ALWAYS_SOFTWARE': '1', 'LP_NUM_THREADS': '1',
        'FLUTTER_ROOT': os.environ.get('FLUTTER_ROOT', '/workspace/flutter'),
        'BENCH_SYSROOT': os.environ.get('BENCH_SYSROOT', '/workspace/sysroot'),
        'PUB_CACHE': os.environ.get('PUB_CACHE', '/workspace/pub-cache'),
        'XDG_CONFIG_HOME': '/workspace/config', 'XDG_CACHE_HOME': '/workspace/cache',
        'NODE_EXTRA_CA_CERTS': '/etc/ssl/certs/ca-certificates.crt',
        'SSL_CERT_FILE': '/etc/ssl/certs/ca-certificates.crt',
    }
    node_executable = shutil.which('node')
    if not node_executable:
        raise SystemExit('Node24+ must be installed on the host')
    create = ['create', '--cpuset-cpus=2', '--cpus=1', '--memory=16g', '--network=none',
              '--cap-drop=ALL', '--user', f'{os.getuid()}:{os.getgid()}', '--workdir', str(ROOT)]
    for source, target, readonly in mounts:
        create += ['--mount', f'type=bind,src={source},dst={target}' + (',readonly' if readonly else '')]
    for key, value in selected_environment.items():
        create += ['--env', key + '=' + value]
    receipt_path = control / 'runtime.json'
    command = '''set -e
    source native-flutter/env.sh
    Xvfb :91 -screen 0 1200x900x24 > "$1/xvfb.log" 2>&1 &
    png_xvfb=$!
    trap 'kill "$png_xvfb" 2>/dev/null || true' EXIT
    export DISPLAY=:91
    png_node="$2"
    "$png_node" "$3" "${@:4}"
    '''
    container = call(*create, image, '/bin/bash', '-c', command, 'png-container', str(control), node_executable, runner,
                     *args, '--runtime-receipt', str(receipt_path))
    try:
        inspected = json.loads(call('inspect', '--format', '{"Image":{{json .Image}},"HostConfig":{{json .HostConfig}},"User":{{json .Config.User}}}', container))
        config = {
            'image': inspected['Image'], 'rootfsSha256': rootfs_sha,
            'cpuset': inspected['HostConfig']['CpusetCpus'],
            'nanoCpus': inspected['HostConfig']['NanoCpus'],
            'memory': inspected['HostConfig']['Memory'],
            'network': inspected['HostConfig']['NetworkMode'],
            'user': inspected['User'], 'mounts': mounts,
            'capDrop': inspected['HostConfig']['CapDrop'],
            'environment': selected_environment, 'nodeExecutable': node_executable,
        }
        receipt_path.write_text(json.dumps({'container': container, 'config': config}, indent=2) + '\n')
        result = subprocess.run([*docker, 'start', '--attach', container], env=environment)
        state = json.loads(call('inspect', '--format', '{{json .State}}', container))
        (control / 'exit.json').write_text(json.dumps({'exitCode': state['ExitCode'], 'error': state['Error']}, indent=2) + '\n')
        raise SystemExit(state['ExitCode'] or result.returncode)
    finally:
        subprocess.run([*docker, 'rm', '--force', container], env=environment, stdout=subprocess.DEVNULL)
