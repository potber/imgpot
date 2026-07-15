const IMAGE_EXTENSIONS: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/gif': 'gif',
	'image/webp': 'webp'
};

export interface ClipboardItemLike {
	types: readonly string[];
	getType(type: string): Promise<Blob>;
}

export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isValidImageType(type: string): boolean {
	return type in IMAGE_EXTENSIONS;
}

export async function getClipboardImageFiles(
	items: readonly ClipboardItemLike[],
	timestamp = Date.now()
): Promise<File[]> {
	const files: File[] = [];

	for (const item of items) {
		const imageType = item.types.find(isValidImageType);
		if (!imageType) continue;

		const blob = await item.getType(imageType);
		const extension = IMAGE_EXTENSIONS[imageType];
		files.push(
			new File([blob], `clipboard-${timestamp}-${files.length + 1}.${extension}`, {
				type: imageType
			})
		);
	}

	return files;
}
