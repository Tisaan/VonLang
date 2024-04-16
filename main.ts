import Parser from "./frontend/parser.ts";
import { createGlobalEnv } from "./runtime/environment.ts";
import { evaluate } from "./runtime/interpreter.ts";


const start = performance.now()

async function run() {
	const parser = new Parser();
	const env = createGlobalEnv();

	const input = await Deno.readTextFile("./test.txt")

	const program = parser.produceAST(input);
	//console.log(program)
	const result = evaluate(program, env)
	console.log(result, "result obtain in", (performance.now() - start), "milliseconds")
}

run()