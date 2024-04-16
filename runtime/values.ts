import Environment from "./environment.ts";
import {Literal, Stmt } from "../frontend/ast.ts";
export type ValueType =
	| "null"
	| "Number"
	| "Bool"
	| "String"
	| "Array"
	| "object"
	| "native-fn"
	| "function"
	| "lambda";

export interface RuntimeVal {
	type: ValueType;
}

/**
 * Defines a value of undefined meaning
 */
export interface NullVal extends RuntimeVal {
	type: "null";
	value: null;
}

export function MK_NULL() {
	return { type: "null", value: null } as NullVal;
}

export interface BooleanVal extends RuntimeVal {
	type: "Bool";
	value: boolean;
}

export function MK_BOOL(b = true) {
	return { type: "Bool", value: b } as BooleanVal;
}

/**
 * Runtime value that has access to the raw native javascript number.
 */
export interface NumberVal extends RuntimeVal {
	type: "Number";
	value: number;
	lenght: number;
}

export function MK_Number(n = 0){
	return {type: "Number", value: n, lenght: n.toString().length} as NumberVal
}

export interface StringVal extends RuntimeVal{
	type: "String";
	value: string;
	lenght: number;
}

export function MK_String(n = "") {
	return { type: "String", value: n, lenght: n.length} as StringVal;
}

export interface ArrayVal extends RuntimeVal{
	type: "Array",
	value: RuntimeVal[]|[]|Literal[]
	lenght: number
}

export function MK_ARRAY(value:RuntimeVal[]|[]|[RuntimeVal] = []){
	return {type: "Array", value: value, lenght: value.length} as ArrayVal
}

/**
 * Runtime value that has access to the raw native javascript number.
 */
export interface ObjectVal extends RuntimeVal {
	type: "object";
	properties: Map<string, RuntimeVal>;
}

export type FunctionCall = (args: RuntimeVal[], env: Environment) => RuntimeVal;

export interface NativeFnValue extends RuntimeVal {
	type: "native-fn";
	call: FunctionCall;
}
export function MK_NATIVE_FN(call: FunctionCall) {
	return { type: "native-fn", call } as NativeFnValue;
}

export interface FunctionValue extends RuntimeVal {
	type: "function";
	name: string;
	parameters: string[];
	declarationEnv: Environment;
	body: Stmt[];
}

export interface LambdaValue extends RuntimeVal {
	type: "lambda",
	parameters: string[],
	declarationEnv: Environment,
	body: Stmt;
}