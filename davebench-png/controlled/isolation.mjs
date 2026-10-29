import fs from 'node:fs';

/** Kernel cgroup limits constrain attempts by renderers to reset CPU affinity. */
export function isolationSnapshot() {
  const cpuset = fs.readFileSync('/sys/fs/cgroup/cpuset.cpus.effective', 'utf8').trim();
  const quota = fs.readFileSync('/sys/fs/cgroup/cpu.max', 'utf8').trim();
  const memory = fs.readFileSync('/sys/fs/cgroup/memory.max', 'utf8').trim();
  if (cpuset !== '2' || quota !== '100000 100000' || memory !== '17179869184') {
    throw Error(`Wrong enforced limits: ${cpuset}; ${quota}; ${memory}`);
  }
  const threads = [];
  for (const pid of fs.readdirSync('/proc').filter(name => /^\d+$/.test(name))) {
    let tids;
    try { tids = fs.readdirSync(`/proc/${pid}/task`); } catch (error) { if (error.code === 'ENOENT' || error.code === 'ESRCH') continue; throw error; }
    for (const tid of tids) {
      let status;
      try { status = fs.readFileSync(`/proc/${pid}/task/${tid}/status`, 'utf8'); } catch (error) { if (error.code === 'ENOENT' || error.code === 'ESRCH') continue; throw error; }
      const affinity = status.match(/^Cpus_allowed_list:\s*(.+)$/m)?.[1].trim();
      if (affinity !== '2') throw Error(`Thread ${pid}/${tid} escaped CPU2: ${affinity}`);
      threads.push({pid, tid, name: status.match(/^Name:\s*(.+)$/m)?.[1], affinity});
    }
  }
  if (!threads.length) throw Error('No live threads attested');
  return {capturedAt: new Date().toISOString(), cpuset, quota, memory, threads};
}
