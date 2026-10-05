export function serviceHealth() {
  return {
    status: "ok" as const,
    name: "SiteSense",
    prototype: true,
    humanReviewRequired: true,
  };
}
