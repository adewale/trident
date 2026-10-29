import { expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const root = resolve(import.meta.dir, '..')
test('both PNG entrypoints share container isolation, preserve runner arguments and write the runtime receipt', () => {
  const script = `
import importlib.util, json, pathlib, runpy, subprocess, sys
from unittest.mock import patch, MagicMock
root = pathlib.Path(sys.argv[1])
spec = importlib.util.spec_from_file_location('container_launcher', root / 'davebench-png/container_launcher.py')
launcher = importlib.util.module_from_spec(spec); spec.loader.exec_module(launcher)
sys.modules['container_launcher'] = launcher
results = []
for profile, wrapper in [('controlled', 'controlled/run-container.py'), ('seven', 'seven/container.py')]:
    calls, writes = [], []
    def output(argv, **kwargs):
        calls.append(argv)
        if argv[2] == 'create': return 'fixture-container'
        if '.State' in argv[4]: return json.dumps({'ExitCode': 0, 'Error': ''})
        return json.dumps({'Image': 'fixture-image', 'HostConfig': {'CpusetCpus': '2', 'NanoCpus': 1000000000, 'Memory': 17179869184, 'NetworkMode': 'none', 'CapDrop': ['ALL']}, 'User': '1000:1000'})
    def execute(argv, **kwargs):
        calls.append(argv)
        return subprocess.CompletedProcess(argv, 0, stdout='fixture-image')
    def write(path, text): writes.append((str(path), text))
    args = ['--out', '/workspace/fixture output', '--review', 'review with spaces.json', '--literal', '$(not-a-command)']
    with patch.object(sys, 'argv', [wrapper, *args]), patch.object(pathlib.Path, 'mkdir'), patch.object(pathlib.Path, 'read_bytes', return_value=b'fixture'), patch.object(pathlib.Path, 'write_text', write), patch.object(launcher.tarfile, 'open', return_value=MagicMock()), patch.object(launcher.shutil, 'which', return_value='/fixture/node'), patch.object(launcher.subprocess, 'check_output', side_effect=output), patch.object(launcher.subprocess, 'run', side_effect=execute):
        try: runpy.run_path(str(root / 'davebench-png' / wrapper), run_name='__main__')
        except SystemExit as error: assert error.code == 0, error.code
    create = next(call for call in calls if call[2] == 'create')
    shell = create.index('-c')
    assert create[shell + 4] == '/fixture/node'
    assert create[shell + 5] == 'davebench-png/' + profile + '/run.mjs'
    assert create[shell + 6:-2] == args
    assert create[-2:] == ['--runtime-receipt', '/workspace/fixture output.container/runtime.json']
    assert '"$png_node" "$3" "' in create[shell + 1]
    for flag in ['--cpuset-cpus=2', '--cpus=1', '--memory=16g', '--network=none', '--cap-drop=ALL']: assert flag in create
    receipt = json.loads(next(text for path, text in writes if path.endswith('/runtime.json')))
    assert receipt['config']['cpuset'] == '2'
    assert receipt['config']['nanoCpus'] == 1000000000
    assert receipt['config']['network'] == 'none'
    assert any(call[2:] == ['rm', '--force', 'fixture-container'] for call in calls)
    results.append(profile)
print(json.dumps(results))
`
  const result = spawnSync('python3', ['-c', script, root], { encoding: 'utf8', timeout: 10_000 })
  expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: '' })
  expect(JSON.parse(result.stdout)).toEqual(['controlled', 'seven'])
})
