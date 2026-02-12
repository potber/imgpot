export function bbcodeImage(url: string): string {
	return `[img]${url}[/img]`;
}

export function bbcodeClickToEnlarge(fullUrl: string, previewUrl: string): string {
	return `[url=${fullUrl}][img]${previewUrl}[/img][/url]`;
}
