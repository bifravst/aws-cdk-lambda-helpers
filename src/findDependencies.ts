import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import ts, { type ImportDeclaration, type StringLiteral } from 'typescript'

type TSConfigWithPaths = {
	compilerOptions?: {
		baseUrl: string
		paths: Record<string, Array<string>>
	}
}

/**
 * Resolve project-level dependencies for the given file using TypeScript compiler API
 */
export const findDependencies = ({
	sourceFilePath,
	tsConfigFilePath,
	imports: importsArg,
	visited: visitedArg,
}: {
	sourceFilePath: string
	tsConfigFilePath?: string
	imports?: string[]
	visited?: string[]
}): string[] => {
	const visited = visitedArg ?? []
	const imports = importsArg ?? []
	if (visited.includes(sourceFilePath)) return imports
	const tsConfig =
		tsConfigFilePath !== undefined
			? JSON.parse(readFileSync(tsConfigFilePath, 'utf-8').toString())
			: undefined

	const fileNode = ts.createSourceFile(
		sourceFilePath,
		readFileSync(sourceFilePath, 'utf-8').toString(),
		ts.ScriptTarget.ES2022,
		/*setParentNodes */ true,
	)

	const parseChild = (node: ts.Node) => {
		if (node.kind !== ts.SyntaxKind.ImportDeclaration) return
		const moduleSpecifier = (
			(node as ImportDeclaration).moduleSpecifier as StringLiteral
		).text
		const file = resolve({
			moduleSpecifier,
			sourceFilePath,
			tsConfigFilePath,
			tsConfig,
		})
		try {
			const s = statSync(file)
			if (!s.isDirectory()) imports.push(file)
		} catch {
			// Module or file not found
			visited.push(file)
		}
	}
	ts.forEachChild(fileNode, parseChild)
	visited.push(sourceFilePath)

	for (const file of imports) {
		findDependencies({
			sourceFilePath: file,
			imports,
			visited,
			tsConfigFilePath,
		})
	}

	return imports
}

const resolve = ({
	moduleSpecifier,
	sourceFilePath,
	tsConfigFilePath,
	tsConfig,
}: {
	moduleSpecifier: string
	sourceFilePath: string
} & (
	| {
			tsConfigFilePath: undefined
			tsConfig: undefined
	  }
	| { tsConfigFilePath: string; tsConfig: TSConfigWithPaths }
)): string => {
	if (moduleSpecifier.startsWith('.'))
		return (
			path
				.resolve(path.parse(sourceFilePath).dir, moduleSpecifier)
				// In ECMA Script modules, all imports from local files must have an extension.
				// See https://nodejs.org/api/esm.html#mandatory-file-extensions
				// So we need to replace the `.js` in the import specification to find the TypeScript source for the file.
				// Example: import { Network, notifyClients } from './notifyClients.js'
				// The source file for that is actually in './notifyClients.ts'
				.replace(/\.js$/, '.ts')
		)
	if (
		tsConfigFilePath !== undefined &&
		tsConfig?.compilerOptions?.paths !== undefined
	) {
		for (const [key, value] of Object.entries(tsConfig.compilerOptions.paths)) {
			const [resolvedPath] = value
			if (resolvedPath === undefined) continue
			// Exact match
			if (moduleSpecifier === key) {
				return path.join(
					path.parse(tsConfigFilePath).dir,
					tsConfig.compilerOptions.baseUrl,
					resolvedPath,
				)
			}
			// Wildcard match
			if (!key.includes('*')) continue
			const rx = new RegExp(`^${key.replace('*', '(?<wildcard>.*)')}`)
			const maybeMatch = rx.exec(moduleSpecifier)
			if (maybeMatch?.groups?.wildcard === undefined) continue
			return (
				path
					.resolve(
						path.parse(tsConfigFilePath).dir,
						tsConfig.compilerOptions.baseUrl,
						resolvedPath.replace('*', maybeMatch.groups.wildcard),
					)
					// Same as above, replace `.js` with `.ts`
					.replace(/\.js$/, '.ts')
			)
		}
	}
	return moduleSpecifier
}
