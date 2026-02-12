import { vi } from 'vitest';

type MockFn = ReturnType<typeof vi.fn>;

function mockDbChain(result: unknown = []) {
	const chain: Record<string, MockFn> = {};

	const methods = [
		'select',
		'from',
		'where',
		'orderBy',
		'limit',
		'offset',
		'set',
		'values',
		'returning',
		'insert',
		'update',
		'delete'
	];

	for (const method of methods) {
		chain[method] = vi.fn().mockReturnValue(chain);
	}

	// Make the chain thenable so it can be awaited
	chain.then = vi.fn().mockImplementation((resolve: (value: unknown) => void) => {
		resolve(result);
	});

	return chain;
}

export function createMockDb() {
	const selectChain = mockDbChain();
	const insertChain = mockDbChain();
	const updateChain = mockDbChain();
	const deleteChain = mockDbChain();

	const db = {
		select: vi.fn().mockReturnValue(selectChain),
		insert: vi.fn().mockReturnValue(insertChain),
		update: vi.fn().mockReturnValue(updateChain),
		delete: vi.fn().mockReturnValue(deleteChain),
		transaction: vi.fn(),
		_selectChain: selectChain,
		_insertChain: insertChain,
		_updateChain: updateChain,
		_deleteChain: deleteChain
	};

	return db;
}

export { mockDbChain };
