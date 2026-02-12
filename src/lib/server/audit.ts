export function audit(userId: number, action: string, detail?: Record<string, unknown>): void {
	const entry = {
		ts: new Date().toISOString(),
		userId,
		action,
		...detail
	};
	console.log(`[audit] ${JSON.stringify(entry)}`);
}
