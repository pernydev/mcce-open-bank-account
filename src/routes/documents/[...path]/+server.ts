import { error } from '@sveltejs/kit';
import path from 'node:path';

const base = path.resolve('documents');

export const GET = async ({ params }) => {
	const filePath = path.resolve(base, params.path);
	if (!filePath.startsWith(base + path.sep)) {
		error(404, 'Not found');
	}

	const file = Bun.file(filePath);
	if (!(await file.exists())) {
		error(404, 'Not found');
	}

	return new Response(file, {
		headers: {
			'Content-Type': file.type,
			'Access-Control-Allow-Origin': '*',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
