# ExpressionParser
A JavaScript boolean/mathematical expression parser

This is yet another tool I originally created for use with my [grid widget](https://github.com/mosbymc/HTML-Data-Grid-Widget) but have since decided to create a new repository to host the functionality as a standalone library. Intended future functionality will be for this tool to be able to parse any mathematical and/or boolean expression and determine the truth value for either the entire tree, or for any given node within the tree. I also plan on allowing the truth to be determined while the parsing/tokenizing is occurring, or deferred until the consumer is ready to evaluate; in either case, allowing the context within which the truth is evaluated to be specified. Eventually, and we're talking way down the road, but I may include visualization of the expression as a tree.

As with my other spin-off repos, my main focus right now is with the grid; until that starts to wind down, there most likely won't be much progress made here.


The expressionParser.js file does currently support very primitive boolean expression evaluation behavior. To use it, I will give a brief description.

The expressionParser is a singleton defined in the global environment. It returns an object with a single function attached ('createFilterTreeFromFilterObject'). In order for the parser to work (as it currently stands), you must pass in an object that contains a list of filter groups and the conjunctions for all filters in those groups. If you have a boolean expression such as:

expr1 || expr2 || (expr3 && expr4 && (expr5 || expr6))
- where an 'expr' is something along the lines of obj[field] >= some_value

Then filter object structure should look something like the following:

````javascript

var filters = {
	conjunct: 'or',
	filterGroup: [
		{
			field: 'somefield1',
			value: 'somevalue1',
			operation: 'some boolean or mathemathical operation',
			dataType: 'string'
		},
		{
			field: 'somefield2',
			value: 'somevalue2',
			operation: 'some boolean or mathemathical operation',
			dataType: 'number'
		},
		{
			conjunct: 'and',
			filterGroup: [
		  		{
					field: 'somefield3',
					value: 'somevalue3',
					operation: 'some boolean or mathemathical operation',
					dataType: 'date'
				},
				{
					field: 'somefield4',
					value: 'somevalue4,
					operation: 'some boolean or mathemathical operation',
					dataType: 'time'
				},
				{
					conjunct: 'or',
					filterGroup: [
						{
							field: 'somefield5',
							value: 'somevalue5',
							operation: 'some boolean or mathemathical operation',
							dataType: 'number'
						},
						{
							field: 'somefield6',
							value: 'somevalue6',
							operation: 'some boolean or mathemathical operation',
							dataType: 'string'
						}
					]
				}
			]
		}
	]
};

````

Here, each 'field' is an attribute of a javascript object, each 'value' is some primative data type value (number, string, boolean) that the field should be compared to. The 'operation' is a shorthand for various javascript operators (listed below). The 'dataType' property lets the tree know how to handle each data point when evaluating the tree against a collection. If not set, the tree will try to determine the desired data type by using the 'typeof' operator on the field of the object being evaluated. If your collection of objects each have some property called 'field_x' and in some objects, 'field_x' holds a number, but in others, 'field_x' holds a string representation of a number, those same fields for the different objects will be evaluated differently when the dataType is not specified and left to the parser to determine. The best thing to do is to just set the value of the .dataType property on the filter object itself, then the parser will coerce each value to the proper type for comparison. If you see results that do not look accurate, ensure you are setting the dataType properly for each filter item.

When you invoke expressionParser#createFilterTreeFromFilterObject and pass in a filter object similar to the example above, it will build up a tree structure and return an object containing the tree and certain metadata. At this point, only the expression has been built, there is no truth value until the expression tree is applied to one or more javascript object. When ready to determine the truthiness of some list of objects, invoke the 'filterCollection' function on the object that was returned from the 'createFilterTreeFromFilterObject' function and pass it the collection of objects you wish to be filtered.

The 'filterCollection' function will map the collection you passed against each node and node conjunction in the tree, returning a new collection with only those models that met the criteria specified in the original expression.

Here are the list of operations and their alias used by the expressionParser that are currently supported:
- Loose Equality: '=='
- Strict Equality: '===' or 'eq'
- Loose Inequality: '!='
- Strict Inequality: '!==' or 'neq'
- Less Than: '<' or 'lt'
- Less Than or Equal: '<=' or 'lte'
- Greater Than: '>' or 'gt'
- Greater Than or Equal: '>=' or 'gte'
- Not: '!' or 'not' or 'falsey'
- Truthy: 'truthy' (will internally use '!!' to determine a truthy value)
- Contains: 'ct' (this is for strings; i.e. ~val.toLowerCase().indexOf('some string')
- Does not Contain: 'nct' (same as above but with ! to cause the flip)
