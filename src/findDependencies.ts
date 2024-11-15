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
export const findDependencies = (args: {
	sourceFilePath: string
	imports?: string[]
	visited?: string[]
	packages?: Set<string>
	tsConfigFilePath?: string
	importsSubpathPatterns?: Record<string, string>
}): {
	dependencies: string[]
	/**
	 * A map of import subpath patterns to their resolved paths
	 * @see https://nodejs.org/api/packages.html#subpath-patterns
	 */
	importsSubpathPatterns: Record<string, string>
	/**
	 * The external packages that the source file depends on
	 */
	packages: Set<string>
} => {
	const sourceFilePath = args.sourceFilePath
	const visited = args.visited ?? []
	const dependencies = args.imports ?? []
	const packages = args.packages ?? new Set<string>()
	let importsSubpathPatterns = args.importsSubpathPatterns ?? {}
	if (visited.includes(sourceFilePath))
		return {
			dependencies,
			importsSubpathPatterns,
			packages,
		}
	const tsConfigFilePath = args.tsConfigFilePath
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
		if (
			node.kind !== ts.SyntaxKind.ImportDeclaration &&
			node.kind !== ts.SyntaxKind.ExportDeclaration
		)
			return
		const moduleSpecifier = (
			(node as ImportDeclaration).moduleSpecifier as StringLiteral
		).text
		const {
			resolvedPath: file,
			importsSubpathPatterns: updatedImportsSubpathPatterns,
		} = resolve({
			moduleSpecifier,
			sourceFilePath,
			tsConfigFilePath,
			tsConfig,
			importsSubpathPatterns,
		})
		importsSubpathPatterns = updatedImportsSubpathPatterns
		try {
			const s = statSync(file)
			if (!s.isDirectory()) dependencies.push(file)
		} catch {
			// Module or file not found
			visited.push(file)
			packages.add(moduleSpecifier)
		}
	}
	ts.forEachChild(fileNode, parseChild)
	visited.push(sourceFilePath)

	for (const file of dependencies) {
		findDependencies({
			sourceFilePath: file,
			imports: dependencies,
			visited,
			tsConfigFilePath,
			importsSubpathPatterns,
			packages,
		})
	}

	return {
		dependencies,
		importsSubpathPatterns,
		packages: new Set(
			[
				...packages.difference(
					new Set([
						'aws-lambda', // Ignore type-only package
					]),
				),
			]
				.filter((p) => !p.startsWith('node:'))
				.filter((p) => !p.startsWith('@aws-crypto/'))
				.filter((p) => !p.startsWith('@aws-sdk/'))
				.map((d) => {
					if (d.startsWith('@')) {
						const [org, packageName] = d.split('/')
						return `${org}/${packageName}`
					}
					return d.split('/')[0] as string
				}),
		),
	}
}

const resolve = ({
	moduleSpecifier,
	sourceFilePath,
	tsConfigFilePath,
	tsConfig,
	importsSubpathPatterns,
}: {
	moduleSpecifier: string
	sourceFilePath: string
	importsSubpathPatterns: Record<string, string>
} & (
	| {
			tsConfigFilePath: undefined
			tsConfig: undefined
	  }
	| {
			tsConfigFilePath: string
			tsConfig: TSConfigWithPaths
	  }
)): {
	resolvedPath: string
	importsSubpathPatterns: Record<string, string>
} => {
	if (moduleSpecifier.startsWith('.'))
		return {
			resolvedPath: path
				.resolve(path.parse(sourceFilePath).dir, moduleSpecifier)
				// In ECMA Script modules, all imports from local files must have an extension.
				// See https://nodejs.org/api/esm.html#mandatory-file-extensions
				// So we need to replace the `.js` in the import specification to find the TypeScript source for the file.
				// Example: import { Network, notifyClients } from './notifyClients.js'
				// The source file for that is actually in './notifyClients.ts'
				.replace(/\.js$/, '.ts'),
			importsSubpathPatterns,
		}
	if (
		tsConfigFilePath !== undefined &&
		tsConfig?.compilerOptions?.paths !== undefined
	) {
		for (const [key, value] of Object.entries(tsConfig.compilerOptions.paths)) {
			const [resolvedPath] = value
			if (resolvedPath === undefined) continue
			// Exact match
			if (moduleSpecifier === key) {
				const fullResolvedPath = path.join(
					path.parse(tsConfigFilePath).dir,
					tsConfig.compilerOptions.baseUrl,
					resolvedPath,
				)
				return {
					resolvedPath: fullResolvedPath,
					importsSubpathPatterns: {
						...importsSubpathPatterns,
						[key]: [
							tsConfig.compilerOptions.baseUrl,
							path.sep,
							resolvedPath.replace(/\.ts$/, '.js'),
						].join(''),
					},
				}
			}
			// Wildcard match
			if (!key.includes('*')) continue
			const rx = new RegExp(`^${key.replace('*', '(?<wildcard>.*)')}`)
			const maybeMatch = rx.exec(moduleSpecifier)
			if (maybeMatch?.groups?.wildcard === undefined) continue
			return {
				resolvedPath: path
					.resolve(
						path.parse(tsConfigFilePath).dir,
						tsConfig.compilerOptions.baseUrl,
						resolvedPath.replace('*', maybeMatch.groups.wildcard),
					)
					// Same as above, replace `.js` with `.ts`
					.replace(/\.js$/, '.ts'),
				importsSubpathPatterns: {
					...importsSubpathPatterns,
					[key]: [
						tsConfig.compilerOptions.baseUrl,
						path.sep,
						resolvedPath.replace(/\.ts$/, '.js'),
					].join(''),
				},
			}
		}
	}
	return {
		resolvedPath: moduleSpecifier,
		importsSubpathPatterns,
	}
}
