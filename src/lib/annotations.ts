import raw from './annotations.toml';

export interface Annotation {
	description?: string;
	document?: string;
}

const byHash = raw as Record<string, Annotation>;

export function annotationFor(hash: string | undefined): Annotation | undefined {
	return hash === undefined ? undefined : byHash[hash];
}

export const documents: { description?: string; document: string }[] = Object.values(byHash).filter(
	(a): a is Annotation & { document: string } => a.document !== undefined
);
