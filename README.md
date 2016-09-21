# ExpressionParser
A JavaScript boolean/mathematical expression parser

This is yet another tool I originally created for use with my [grid widget](https://github.com/mosbymc/HTML-Data-Grid-Widget) but have since decided to create a new repository for the functionality. Intended future functionality will be for this tool to be able to parse any mathematical and/or boolean expression and determine the truth value for either the entire tree, or for any given node within the tree. I also plan on allowing the truth to be determined while the parsing/tokenizing is occurring, or at a later time; in either case, allowing the context within which to evaluate the truth to be specified. Eventually, and we're talking way down the road, but I may include visualization of the expression as a tree.

As with my other spin-off repos, my main focus right now is with the grid; until that starts to wind down, there most likely won't be much progress made here.


The expressionParser.js file does currently support very primitive boolean expression evaluation behavior. To use it, I will give a brief description.

The expressionParser is a singleton defined in the global environment. It returns an object with a single function attached ('createFilterTreeFromFilterObject'). In order for the parser to work (as it currently stands), you must pass in an object that contains a list of filter groups and the conjunctions for all filters in those groups. If you have a boolean expression such as:

expr1 || expr2 || (expr3 && expr4 && (expr5 || expr6)

Then filter object structure should look something like the following:

````javascript

var filters = {
	conjunct: 'or',
	filterGroup: [
		{
		  field: 'somefield1',
		  value: 'somevalue1',
		  operation: 'some boolean or mathemathical operation'
		},
		{
		  field: 'somefield2',
		  value: 'somevalue2',
		  operation: 'some boolean or mathemathical operation'
		},
		{
			conjunct: 'and',
			filterGroup: [
				{
		      field: 'somefield3',
		      value: 'somevalue3',
		      operation: 'some boolean or mathemathical operation'
		    },
				{
		      field: 'somefield4',
		      value: 'somevalue4',
		      operation: 'some boolean or mathemathical operation'
		    },
				{
					conjunct: 'or',
					filterGroup: [
					  {
					    field: 'somefield5',
					    value: 'somevalue5',
					    operation: 'some boolean or mathemathical operation'
					  },
					  {
					    field: 'somefield6',
					    value: 'somevalue6',
					    operation: 'some boolean or mathemathical operation'
					  }
					]
				}
			]
		}
	]
};

````

Here, each field is an attribute of a javascript object, each value is some value (number, string, boolean, date, etc.) that the field should be compared to, and the operation is a shorthand for various javascript operators (listed below).

When you call 'expressionParser.createFilterTreeFromFilterObject()' and pass in the filter object, it will build up a tree structure and return an object containing the tree; waiting to be evaluated. Whenever you are ready for the tree to be evaluated against some collection of javascript models, you just need to call the 'filterCollection' function on the object returned from the previous call, passing in the collection of models you wished to be filtered.

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
- Not: '!' or 'not'
- Truthy: '' (will internally use '!!' to determine a truthy value)
- Contains: 'ct' (this is for strings; i.e. ~val.toLowerCase().indexOf('some string')
- Does not Contain: 'nct' (same as above but with ! to cause the flip)
