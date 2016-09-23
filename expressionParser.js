var expressionParser = (function _expressionParser() {
    var booleanExpressionTree = {
        init: function _init() {
            this.tree = null;
            this.context = null;
            this.rootNode = null;
            return this;
        }
    };

    booleanExpressionTree.setTree = function _setTree(tree) {
        this.queue = tree;
        this.rootNode = tree[this.queue.length - 1];
        return this;
    };
    booleanExpressionTree.createTree = function _createTree() {
        this.queue.pop();
        if (this.queue.length)
            this.rootNode.addChildren(this.queue);
    };
    booleanExpressionTree.filterCollection = function _filterCollection(collection) {
        return collection.filter(function collectionMap(curr) {
            this.context = curr;
            return this.rootNode.evaluate(curr);
        }, this);
    };
    booleanExpressionTree.internalGetContext = function _internalGetContext() {
        return this.context;
    };
    booleanExpressionTree.getContext = function _getContext() {
        return this.internalGetContext.bind(this);
    };
    booleanExpressionTree.isTrue = function _isTrue(item) {
        this.context = item;
        return this.rootNode.value;
    };

    var astNode = {
        createNode: function _createNode(node) {
            var operatorCharacteristics = getOperatorPrecedence(node);
            if (operatorCharacteristics) {
                this.operator = node;
                this.numberOfOperands = getNumberOfOperands(this.operator);
                this.precedence = operatorCharacteristics.precedence;
                this.associativity = operatorCharacteristics.associativity;
                this.children = [];
            }
            else {
                this.field = node.field;
                this.standard = node.value;
                this.operation = node.operation;
                this.dataType = node.dataType;
                this.context = null;
            }
            this._value = null;
            this.getContext = null;
            this.queue = null;
        }
    };

    astNode.createTree = function _createTree(queue) {
        this.queue = queue.reverse();
        this.tree = this.queue;
        this.addChildren(this.queue);
    };

    astNode.addChildren = function _addChildren(tree) {
        if (this.children && this.children.length < this.numberOfOperands) {
            var child = tree.pop();
            child.addChildren(tree);
            this.children.push(child);
            child = tree.pop();
            child.addChildren(tree);
            this.children.push(child);
        }
        return this;
    };

    astNode.addChild = function _addChild(child) {
        if (this.children && this.children.length < this.numberOfOperands)
            this.children.push(child);
        return this;
    };

    astNode.evaluate = function _evaluate() {
        if (this.children && this.children.length) {
            switch (this.operator) {
                case 'or':
                    return this.children[1].evaluate() || this.children[0].evaluate();
                case 'and':
                    return this.children[1].evaluate() && this.children[0].evaluate();
                case 'xor':
                    return !!(this.children[1].evaluate() ^ this.children[0].evaluate());
                case 'nor':
                    return !(this.children[1].evaluate() || this.children[0].evaluate());
                case 'nand':
                    return !(this.children[1].evaluate() && this.children[0].evaluate());
                case 'xnor':
                    return !(this.children[1].evaluate() ^ this.children[0].evaluate());
            }
        }
        else {
            var baseVal,
                curVal,
                initialVal = this.getContext()[this.field];

            switch(this.dataType) {
                case 'time':
                    curVal = getNumbersFromTime(initialVal);
                    baseVal = getNumbersFromTime(this.standard);

                    if (initialVal.indexOf('PM') > -1) curVal[0] += 12;
                    if (this.standard.indexOf('PM') > -1) baseVal[0] += 12;

                    curVal = convertTimeArrayToSeconds(curVal);
                    baseVal = convertTimeArrayToSeconds(baseVal);
                    break;
                case 'number':
                    curVal = parseFloat(initialVal);
                    baseVal = parseFloat(this.standard);
                    break;
                case 'date':
                    curVal = new Date(initialVal);
                    baseVal = new Date(this.standard);
                    break;
                default:
                    curVal = initialVal;
                    baseVal = this.standard;
                    break;
            }

            this._value = comparator(curVal, baseVal, this.operation);
            return this._value;
        }
    };

    astNode.getValue = function _getValue() {
        if (this._value == null)
            this._value = this.evaluate();
        return this._value;
    };

    Object.defineProperty(astNode, 'value', {
        get: function _getValue() {
            if (!this._value) {
                this._value = this.evaluate();
            }
            return this._value;
        }
    });

    function getNodeContext(bet) {
        return bet.internalGetContext.bind(bet);
    }

    function createFilterTreeFromFilterObject(filterObject) {
        var ret = Object.create(booleanExpressionTree);
        ret.init();
        var operandStack = Object.create(stack);
        operandStack.init();
        var queue = [],
            topOfStack;

        iterateFilterGroup(filterObject, operandStack, queue, getNodeContext(ret));

        while (operandStack.length()) {
            topOfStack = operandStack.peek();
            if (topOfStack.operator !== '(')
                queue.push(operandStack.pop());
            else operandStack.pop();
        }

        ret.setTree(queue);
        ret.createTree();
        return ret;
    }

    function iterateFilterGroup(filterObject, stack, queue, contextGetter) {
        var conjunction = filterObject.conjunct,
            idx = 0,
            topOfStack;

        while (idx < filterObject.filterGroup.length) {
            if (idx > 0) {
                var conjunctObj = Object.create(astNode);
                conjunctObj.createNode(conjunction);
                pushConjunctionOntoStack(conjunctObj, stack, queue);
            }
            if (filterObject.filterGroup[idx].conjunct) {
                var paren = Object.create(astNode);
                paren.createNode('(');
                stack.push(paren);
                iterateFilterGroup(filterObject.filterGroup[idx], stack, queue, contextGetter);
                while (stack.length()) {
                    topOfStack = stack.peek();
                    if (topOfStack.operator !== '(')
                        queue.push(stack.pop());
                    else {
                        stack.pop();
                        break;
                    }
                }
            }
            else {
                var leafNode = Object.create(astNode);
                leafNode.createNode(filterObject.filterGroup[idx]);
                leafNode.getContext = contextGetter;
                queue.push(leafNode);
            }
            ++idx;
        }
    }

    function pushConjunctionOntoStack(conjunction, stack, queue) {
        while (stack.length()) {
            var topOfStack = stack.peek();
            if ((conjunction.associativity === associativity.LTR && conjunction.precedence <= topOfStack.precedence)
                || (conjunction.associativity === associativity.RTL && conjunction.precedence < topOfStack.precedence))
                queue.push(stack.pop());
            else
                break;
        }
        stack.push(conjunction);
    }

    var stack = {
        init: function _init() {
            this.data = [];
            this.top = 0;
        },
        push: function _push(item) {
            this.data[this.top++] = item;
        },
        pop: function _pop() {
            return this.data[--this.top];
        },
        peek: function _peek() {
            return this.data[this.top - 1];
        },
        clear: function _clear() {
            this.top = 0;
        },
        length: function _length() {
            return this.top;
        }
    };

    function comparator(val, base, type) {
        switch (type) {
            case 'eq':
            case '===':
                return val === base;
            case '==':
                return val == base;
            case 'neq':
            case '!==':
                return val !== base;
            case '!=':
                return val != base;
            case 'gte':
            case '>=':
                return val >= base;
            case 'gt':
            case '>':
                return val > base;
            case 'lte':
            case '<=':
                return val <= base;
            case 'lt':
            case '<':
                return val < base;
            case 'not':
            case '!':
            case 'falsey':
                return !val;
            case 'truthy':
                return !!val;
            case 'ct':
                return !!~val.toLowerCase().indexOf(base.toLowerCase());
            case 'nct':
                return !~val.toLowerCase().indexOf(base.toLowerCase());
        }
    }

    function getNumberOfOperands(operator) {
        switch (operator) {
            case '!':
                return 1;
            case '(':
            case ')':
                return 0;
            default:
                return 2;
        }
    }

    var associativity = { RTL: 1, LTR: 2 };

    function getOperatorPrecedence(operator) {
        switch (operator) {
            case '!':
                return {
                    precedence: 1,
                    associativity: associativity.LTR
                };
            case 'and':
                return {
                    precedence: 2,
                    associativity: associativity.RTL
                };
            case 'xor':
                return {
                    precedence: 3,
                    associativity: associativity.RTL
                };
            case 'or':
                return {
                    precedence: 4,
                    associativity: associativity.RTL
                };
            case '(':
            case ')':
                return {
                    precedence: null,
                    associativity: null
                };
            default:
                return null;
        }
    }

    function getNumbersFromTime(val) {
        var re = /^(0?[1-9]|1[012])(?:(?:(:|\.)([0-5]\d))(?:\2([0-5]\d))?)?(?:(\ [AP]M))$|^([01]?\d|2[0-3])(?:(?:(:|\.)([0-5]\d))(?:\7([0-5]\d))?)$/;
        if (!re.test(val)) return [];
        var timeGroups = re.exec(val);
        var hours = timeGroups[1] ? +timeGroups[1] : +timeGroups[6];
        var minutes, seconds, meridiem, retVal = [];
        if (timeGroups[2]) {
            minutes = timeGroups[3] || '00';
            seconds = timeGroups[4]  || '00';
            meridiem = timeGroups[5].replace(' ', '') || null;
        }
        else if (timeGroups[6]) {
            minutes = timeGroups[8] || '00';
            seconds = timeGroups[9] || '00';
        }
        else{
            minutes = '00';
            seconds = '00';
        }
        retVal.push(hours);
        retVal.push(minutes);
        retVal.push(seconds);
        if (meridiem) retVal.push(meridiem);
        return retVal;
    }

    function convertTimeArrayToSeconds(timeArray) {
        var hourVal = timeArray[0] === 12 || timeArray[0] === 24 ? timeArray[0] - 12 : timeArray[0];
        return 3660 * hourVal + 60*timeArray[1] + timeArray[2];
    }

    return {
        createFilterTreeFromFilterObject: createFilterTreeFromFilterObject
    };
})();
