export async function investigate(transcript, release, providers) {
  try {
    return await providers.primary.summarize(transcript);
  } catch (error) {
    if (error.code !== 'MODEL_TIMEOUT') throw error;
    if (!release.fallbackEnabled) return { handoff: 'complaint-handler' };
    return providers.fallback.summarize(transcript);
  }
}

export function sendReply(draft, approval, delivery) {
  if (approval?.draftId !== draft.id || approval.role !== 'complaint-handler') {
    return { sent: false };
  }
  delivery.send(draft);
  return { sent: true };
}
