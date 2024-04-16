import {
	AssignmentExpr,
	BinaryExpr,
	BooleanExpr,
	ConditionalExpr,
	CallExpr,
	ReturnExpr,
	Identifier,
	ObjectLiteral,
  IfExpr,
} from "../../frontend/ast.ts";
import Environment from "../environment.ts";
import { evaluate } from "../interpreter.ts";
import {
	BooleanVal,
	FunctionValue,
	LambdaValue,
	MK_NULL,
	NativeFnValue,
	NumberVal,
	ObjectVal,
	RuntimeVal,
} from "../values.ts";

function eval_numeric_binary_expr(
	lhs: NumberVal,
	rhs: NumberVal,
	operator: string
): NumberVal{
	let result: number;
	switch (operator){
		case "+":
			result = lhs.value + rhs.value
			break
		case "-":
			result = lhs.value - rhs.value
			break
		case "*":
			result = lhs.value * rhs.value
			break
		case "/":
			if (rhs.value != 0){
				result = lhs.value / rhs.value
				break
			}else{
				console.error("Can't divide by 0")
				Deno.exit()
				break
			}
		case "%":
			if (rhs.value != 0){
				result = lhs.value % rhs.value
				break
			}else{
				console.error("Can't divide by 0")
				Deno.exit()
				break
			}
		case "~":
			if (rhs.value != 0){
				result = Math.floor(lhs.value/rhs.value)
				break
			} else {
				console.error("Can't divide by 0")
				Deno.exit()
				break
			}
		case "^":
			result = Math.pow(lhs.value, rhs.value)
			break
		default:
			console.error("Opération non prise en compte")
			Deno.exit()
	}
	return { value: result, type: "Number", lenght: lhs.lenght};
}



/**
 * Evaulates expressions following the binary operation type.
 */
export function eval_binary_expr(
	binop: BinaryExpr,
	env: Environment
	): RuntimeVal {
	const lhs = evaluate(binop.left, env);
	const rhs = evaluate(binop.right, env);
	if (rhs == undefined){
		console.error("Can't do binary operation on undefined \'" + (binop.right as Identifier).symbol +"\'")
		Deno.exit()
	} else if ( lhs == undefined){
		console.error("Can't do binary operation on undefined \'" + (binop.left as Identifier).symbol +"\'")
		Deno.exit()
	}

	// Only currently support numeric operations
	if (lhs.type == "Number" && rhs.type == "Number") {
		return eval_numeric_binary_expr(
			lhs as NumberVal,
			rhs as NumberVal,
			binop.operator
		);
	}
	
	// One or both are NULL
	return MK_NULL();
}

export function eval_boolean_expr(
	boolop: BooleanExpr,
	env: Environment
	){
		const lhs = evaluate(boolop.left, env);
		const rhs = evaluate(boolop.right, env);

		if (rhs == undefined){
			console.error("Can't do binary operation on undefined \'" + (boolop.right as Identifier).symbol +"\'")
			Deno.exit()
		} else if ( lhs == undefined){
			console.error("Can't do binary operation on undefined \'" + (boolop.left as Identifier).symbol +"\'")
			Deno.exit()
		}
		if (boolop.operator == "and" ||
			boolop.operator == "or" ||
			boolop.operator == "xor"){
				const exceplhs = eval_numeric_boolean_expr(
					lhs as BooleanVal,
					rhs as BooleanVal,
					boolop.operator
				)
				const exceprhs = eval_numeric_boolean_expr(
					lhs as BooleanVal,
					rhs as BooleanVal,
					boolop.operator
				)
				//console.log("enter:", lhs, rhs)
				return eval_numeric_boolean_expr(
					exceplhs as BooleanVal,
					exceprhs as BooleanVal,
					boolop.operator
				)
			}
		if (lhs.type == "Number" && rhs.type == "Number"){
			return eval_numeric_boolean_expr(
				lhs as BooleanVal,
				rhs as BooleanVal,
				boolop.operator
			)
		}
	return MK_NULL()
	}

function eval_numeric_boolean_expr(
	lhs: BooleanVal,
	rhs: BooleanVal,
	operator: string
	): BooleanVal{
		let result = null
		//console.log(lhs, operator, rhs)
		switch (operator){
			case ">=":
				result = lhs.value >= rhs.value
				break
			case "<=":
				result = lhs.value <= rhs.value
				break
			case ">":
				result = lhs.value > rhs.value
				break
			case "<":
				result = lhs.value < rhs.value
				break
			case "==":
				result = lhs.value == rhs.value
				break
			case "!=":
				result = lhs.value != rhs.value
				break
			case "and":
				if (lhs.value == true && rhs.value == true){
					result = true
				} else {
					result = false
				}
				break
			case "or":
				if (lhs.value === true || rhs.value === true){
					result = true
				} else {
					result = false
				}
				break
			case "xor":
				if (lhs.value === true !== rhs.value === true){
					result = true
				} else {
					result = false
				}
				break

			default:
				result = false
		}
	return {value: result, type: "Bool"} as BooleanVal
	}

export function eval_conditional_expr(
	condop: ConditionalExpr,
	env: Environment
): RuntimeVal {
	const left: RuntimeVal = evaluate(condop.left, env)
	const right: RuntimeVal = evaluate(condop.right, env)
	
	let result = Boolean()
	switch (condop.operator){
		case "and":{
			result = (left as BooleanVal).value && (right as BooleanVal).value
		}break
		case "or":{
			result = (left as BooleanVal).value || (right as BooleanVal).value
		}break
		case "xor":{
			let value = false
			if (
				((left as BooleanVal).value === true ||
				(right as BooleanVal).value === true) &&
				(right as BooleanVal).value !== (left as BooleanVal).value
			) {
				value = true
			}
			result = value
		}break
		case "is":
			if (Object.is((left as BooleanVal).value, (right as BooleanVal).value)){
				result = true
			} else {
				result = false
			}
			break
		default :{
			result = false
		}
	}
	return {value: result, type: "Bool"} as BooleanVal


}

export function eval_ifelse_expr(
	ifvalue: IfExpr, 
	env: Environment
): RuntimeVal {
	for (let ident = 0; ident < ifvalue.condition.length; ident ++){
		const result = evaluate(ifvalue.condition[ident], env)
		if (result.type == "Bool" && (result as BooleanVal).value){
			return evaluate(ifvalue.body[ident], env)
		} else if (result.type != "Bool"){
			const context = ifvalue.condition[ident]
			throw `If condition result should be a boolean not ${result.type} in ${context}`; 
		}
	}
	if (ifvalue.other.length === 1){
		return evaluate(ifvalue.other[0], env)
	}
	return MK_NULL()
}


export function eval_identifier(
	ident: Identifier,
	env: Environment
): RuntimeVal {
	return env.lookupVar(ident.symbol);
}

export function eval_assignment(
	node: AssignmentExpr,
	env: Environment
): RuntimeVal {
	if (node.assigne.kind !== "Identifier") {
		throw `Invalid LHS inaide assignment expr ${JSON.stringify(node.assigne)}`;
	}

	const varname = (node.assigne as Identifier).symbol;
	return env.assignVar(varname, evaluate(node.value, env));
}

export function eval_object_expr(
	obj: ObjectLiteral,
	env: Environment
): RuntimeVal {
	const object = { type: "object", properties: new Map() } as ObjectVal;
	for (const { key, value } of obj.properties) {
		const runtimeVal =
			value == undefined ? env.lookupVar(key) : evaluate(value, env);

		object.properties.set(key, runtimeVal);
	}

	return object;
}

export function eval_call_expr(expr: CallExpr, env: Environment): RuntimeVal {
	
	//console.log(expr)
	const args = []
	for (const arg of expr.args){
		args.push(evaluate(arg, env))
	}
	//const args = expr.args.map((arg) => evaluate(arg, env));
	const fn = evaluate(expr.caller, env);
	//console.log(fn.type)
	if (fn.type == "native-fn") {
		const result = (fn as NativeFnValue).call(args, env);
		return result;
	}

	if (fn.type == "function") {
		const func = fn as FunctionValue;
		const scope = new Environment(func.declarationEnv);
		// Create the variables for the parameters list
		for (let i = 0; i < func.parameters.length; i++) {
			// TODO Check the bounds here.
			// verify arity of function
			const varname = func.parameters[i];
			scope.declareVar(varname, args[i], false);
		}

		let result: RuntimeVal = MK_NULL();
		// Evaluate the function body line by line
		for (const stmt of func.body) {
			if (stmt.kind == "ReturnExpr"){
				result = evaluate((stmt as ReturnExpr).Value, scope)
				break
			}else{
				evaluate(stmt, scope);
			}
		}
		return result;
	}
	
	if (fn.type == "lambda"){
		const func = fn as LambdaValue;
		const scope = new Environment(func.declarationEnv);

		// Create the variables for the parameters list
		for (let i = 0; i < func.parameters.length; i++) {
			// TODO Check the bounds here.
			// verify arity of function
			const varname = func.parameters[i];
			scope.declareVar(varname, args[i], false);
		}
		//console.log(func.body)
		return evaluate((func.body as ReturnExpr).Value, scope)
	}

	throw "Cannot call value that is not a function: " + JSON.stringify(fn);
}
