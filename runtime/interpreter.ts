import { ArrayVal, MK_NULL, NumberVal, RuntimeVal, StringVal } from "./values.ts";
import {
	ArrayLiteral,
	AssignmentExpr,
	BinaryExpr,
	BooleanExpr,
	ConditionalExpr,
	DelExpr,
	RaiseExpr,
	CallExpr,
	FunctionDeclaration,
	LambdaDeclaration,
	Identifier,
	NumericLiteral,
	ObjectLiteral,
	Program,
	Stmt,
	StringLiteral,
	VarDeclaration,
  IfExpr,
} from "../frontend/ast.ts";
import Environment from "./environment.ts";
import {
	eval_function_declaration,
	eval_lambda_declaration,
	eval_program,
	eval_var_declaration,
} from "./eval/statements.ts";
import {
	eval_ifelse_expr,
	eval_assignment,
	eval_binary_expr,
	eval_boolean_expr,
	eval_call_expr,
	eval_identifier,
	eval_object_expr,
	eval_conditional_expr
} from "./eval/expressions.ts";

export function evaluate(astNode: Stmt, env: Environment): RuntimeVal {
	//console.log(astNode.kind)
	switch (astNode.kind) {
		case "StringLiteral":
			return {
				value : (astNode as StringLiteral).value,
				type : "String",
				lenght: (astNode as StringLiteral).lenght
			} as StringVal
		case "NumericLiteral":
			return {
				value: (astNode as NumericLiteral).value,
				type: "Number",
				lenght: (astNode as NumericLiteral).lenght
			} as NumberVal;
		case "ArrayLiteral":
			if (astNode.kind == "ArrayLiteral"){
				for (let index = 0; (astNode as ArrayLiteral).lenght > index; index ++){
					(astNode as ArrayLiteral).value[index] = evaluate((astNode as ArrayLiteral).value[index], env)
				}
				return {
					value: (astNode as ArrayLiteral).value,
					type: "Array",
					lenght: (astNode as ArrayLiteral).lenght,
				} as ArrayVal
			}else{
				return evaluate((astNode).value[0], env)
			}
		case "Null":
			return MK_NULL()
		case "Identifier":
			return eval_identifier(astNode as Identifier, env);
		case "ObjectLiteral":
			return eval_object_expr(astNode as ObjectLiteral, env);
		case "CallExpr":
			return eval_call_expr(astNode as CallExpr, env);
		case "AssignmentExpr":
			return eval_assignment(astNode as AssignmentExpr, env);
		case "BinaryExpr":
			return eval_binary_expr(astNode as BinaryExpr, env);
		case "BooleanExpr":
			return eval_boolean_expr(astNode as BooleanExpr, env)
		case "ConditionalExpr":
			return eval_conditional_expr(astNode as ConditionalExpr, env)
		case "IfExpr":
			return eval_ifelse_expr(astNode as IfExpr, env)
		case "Program":
			return eval_program(astNode as Program, env);
		// Handle statements
		case "VarDeclaration":
			return eval_var_declaration(astNode as VarDeclaration, env);
		case "FunctionDeclaration":
			return eval_function_declaration(astNode as FunctionDeclaration, env);
		case "LambdaDeclaration":
			return eval_lambda_declaration(astNode as LambdaDeclaration, env)
		case "DelExpr":
			return env.deletedeclareVar((astNode as DelExpr).value)
		case "RaiseExpr":
			console.error((astNode as RaiseExpr).value)
			Deno.exit()
			break
		// Handle unimplimented ast types as error.
		default:
			console.error(
				"This AST Node has not yet been setup for interpretation.\n",
				astNode
			);
			Deno.exit(0);
	}
}
