export function validateReview(review, identity, participants, cases) {
  if (!review || review.renderIdentity !== identity ||
      JSON.stringify(review.participants) !== JSON.stringify(participants)) {
    throw Error('Reviewed qualification identity/participants mismatch');
  }
  for (const input of cases) {
    const record = review.cases?.[input.id];
    if (input.role !== 'candidate' || record?.eligible !== true) throw Error('Invalid reviewed timing input: ' + input.id);
    for (const participant of participants) {
      if (record.checks?.[participant]?.pass !== true || !/^[a-f0-9]{64}$/.test(record.pixels?.[participant] ?? '')) {
        throw Error('Missing source-fact review or pixel hash: ' + input.id + '/' + participant);
      }
    }
  }
}

export function requireWarmupSuccess(row) {
  if (row.status !== 'ok') throw Error('Warmup failed; measured process history invalid: ' + row.participant + '/' + row.case + ': ' + row.status);
}
