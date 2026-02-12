declare global {
	namespace App {
		interface Locals {
			user: {
				id: number;
				potberUserId: string;
				username: string;
				avatarUrl: string | null;
			} | null;
			sessionId: string | null;
		}
	}
}

export {};
