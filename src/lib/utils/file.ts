export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isValidImageType(type: string): boolean {
	return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(type);
}
