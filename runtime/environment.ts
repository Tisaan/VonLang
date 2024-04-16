import { evaluate } from "./interpreter.ts";
import {
	MK_BOOL,
	MK_NATIVE_FN,
	MK_NULL,
	MK_Number,
	MK_String,
	MK_ARRAY,
	ArrayVal,
	RuntimeVal,
	NumberVal,
} from "./values.ts";

export function createGlobalEnv() {
	const env = new Environment();
	// Create Default Global Enviornment
	env.declareVar("true", MK_BOOL(true), true);
	env.declareVar("false", MK_BOOL(false), true);
	env.declareVar("null", MK_NULL(), true);

	// Define a native builtin method
	env.declareVar(
		"print",
		MK_NATIVE_FN((args, _scope) => {
			console.log(...args);
			return MK_NULL();
		}),
		true
	);
	env.declareVar(
		"type",
		MK_NATIVE_FN((args, _scope) => {
			if (args.length !== 1){
				console.error('TypeError: Only need the variable name or callable in arguement')
				Deno.exit()
			}
			return MK_String(typeof(args[0]))
		}), true
	)
	env.declareVar(
		"range",
		MK_NATIVE_FN((args, _scope) => {
			if (args.length !== 3){
				console.error("RangeError: Need the argument: 'start', 'end', 'step'")
			}
			const range_object = []
			if ((args[0] as NumberVal).value < (args[1] as NumberVal).value && (args[2] as NumberVal).value > 0){
				for (let index:number = (args[0] as NumberVal).value;index < (args[1] as NumberVal).value; index += (args[2] as NumberVal).value){
					range_object.push(({type: "Number", value:index, lenght:index.toString().length} as NumberVal))
				}
			} else if ((args[0] as NumberVal).value > (args[1] as NumberVal).value && (args[2] as NumberVal).value < 0){
				for (let index:number = (args[0] as NumberVal).value;(args[1] as NumberVal).value < index; index += (args[2] as NumberVal).value){
					range_object.push(MK_Number(index))
				}
			}
			return MK_ARRAY(range_object)
		}), true
	)
	return env;
}

export default class Environment {
	private parent?: Environment;
	private variables: Map<string, RuntimeVal>;
	private constants: Set<string>;

	constructor(parentENV?: Environment) {
		const _global = parentENV ? true : false;
		this.parent = parentENV;
		this.variables = new Map();
		this.constants = new Set();
	}

	public declareVar(
		varname: string,
		value: RuntimeVal,
		constant: boolean
	): RuntimeVal {
		if (this.variables.has(varname)) {
			throw `Cannot declare variable ${varname}. As it already is defined.`;
		}

		this.variables.set(varname, value);
		if (constant) {
			this.constants.add(varname);
		}
		return value;
	}

	public assignVar(varname: string, value: RuntimeVal): RuntimeVal {
		const env = this.resolve(varname);

		// Cannot assign to constant
		if (env.constants.has(varname)) {
			throw `Cannot reasign to variable ${varname} as it was declared constant.`;
		}

		env.variables.set(varname, value);
		return value;
	}

	public lookupVar(varname: string): RuntimeVal {
		const env = this.resolve(varname);
		return env.variables.get(varname) as RuntimeVal;
	}

	public resolve(varname: string): Environment {
		if (this.variables.has(varname)) {
			return this;
		}

		if (this.parent == undefined) {
			throw `Cannot resolve '${varname}' as it does not exist.`;
		}

		return this.parent.resolve(varname);
	}

	public deletedeclareVar(varname: string): RuntimeVal{
		const env = this.resolve(varname)
		env.variables.delete(varname)
		env.constants.delete(varname)
		return {type: "null"}
	}
}

