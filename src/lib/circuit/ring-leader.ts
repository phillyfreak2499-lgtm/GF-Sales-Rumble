export function weekOpen(week: number, totalWeeks: number, circuitName: string) {
  if (week === totalWeeks) {
    return `${circuitName}, week ${week} — title night. Nobody leaves until the belts have names.`;
  }
  if (week === 1) {
    return `${circuitName} is open. Week 1. The locker is full. Cards stay live until the commissioner rings the bell.`;
  }
  return `Week ${week} of ${totalWeeks}. Same building. New card.`;
}

export function weekClose(week: number, isFinal: boolean) {
  if (isFinal) {
    return "That is a wrap on the period. The belts stay in the building.";
  }
  return `Week ${week} is in the books. Ice the wrists. See you on the next card.`;
}
