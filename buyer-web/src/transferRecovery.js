export const walletTotal = wallet => Number(wallet?.balance ?? wallet?.availableBalance);
export function waitingSession(account,previous,wallet,need=0) {
  const since=account.since || previous?.since || new Date().toISOString();
  return {...account,since,baseline:previous?.since===since?previous.baseline:walletTotal(wallet),expectedAmount:previous?.since===since?previous.expectedAmount:Math.max(100,Number(account.expectedAmount || need) || 100)};
}
export const balanceCredit = (waiting,wallet) => {
  const delta=walletTotal(wallet)-Number(waiting?.baseline);
  return waiting && Number.isFinite(delta) && delta>=waiting.expectedAmount ? {reference:`balance/${waiting.since}`,amount:delta,source:'transfer',createdAt:new Date().toISOString()} : null;
};
