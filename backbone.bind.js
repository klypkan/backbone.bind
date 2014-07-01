//     Backbone.bind.js 1.0.1
//     For all details and documentation:
//     https://github.com/klypkan/backbone.bind

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['underscore', 'jquery', 'backbone'], factory);
    } else {
        // Browser globals
        factory(_, $, Backbone);
    }
}(function (_, $, Backbone) {
    Backbone.View.prototype.bind = function (options) {
        setBindingOptions.call(this, options);
        var propNameAttr = this.bindingOptions.propNameAttr;
        var eventsAttr = this.bindingOptions.eventsAttr;
        var defaultElEvents = "change";
        var elEvents = null;
        var el = null;
        var propName = null;
        var viewContext = this;

        this.$el.find('[' + propNameAttr + ']').each(function (index) {
            el = $(this);
            propName = el.attr(propNameAttr);
            var proxy = $.proxy(getModelPropVal, viewContext, propName);
            var propVal = proxy();
            proxy = $.proxy(setElVal, viewContext, el, propVal);
            proxy();

            elEvents = el.attr(eventsAttr);
            elEvents = elEvents || defaultElEvents;
            el.on(elEvents, { propName: propName, el: el }, function (event) {
                var proxy = $.proxy(getElVal, viewContext, event.data.el, event.data.propName);
                var elVal = proxy();
                proxy = $.proxy(setModelPropVal, viewContext, event.data.propName, elVal);
                proxy();
            });
        });

        if (this.bindingOptions.observeModel) {
            this.model.on("change", modelChangeHandler, this);
        }
    }
    function modelChangeHandler() {
        var changedAttributes = this.model.changedAttributes();
        var propNameAttr = this.bindingOptions.propNameAttr;
        var viewContext = this;
        for (var propName in changedAttributes) {
            this.$el.find('[' + propNameAttr + '="' + propName + '"]').each(function (index) {
                el = $(this);
                var proxy = $.proxy(getElVal, viewContext, el, propName);
                var elVal = proxy();
                if (elVal != changedAttributes[propName]) {
                    proxy = $.proxy(setElVal, viewContext, el, changedAttributes[propName]);
                    proxy();
                }
            });
        }
    }

    Backbone.View.prototype.unbind = function () {
        if (this.bindingOptions) {
            if (this.bindingOptions.observeModel) {
                this.model.off("change", modelChangeHandler, this);
            }

            var propNameAttr = this.bindingOptions.propNameAttr;
            this.$el.find('[' + propNameAttr + ']').each(function (index) {
                $(this).off();
            });
        }
    }

    function setElVal(el, propVal) {
        var handler = el.attr(this.bindingOptions.handlerAttr);
        if (handler) {
            this[handler]({ type: "setElVal", data: { el: el, propVal: propVal } });
            return;
        }
        var tagName = el.prop("tagName").toLowerCase();
        if (tagName == 'input' || tagName == 'select' || tagName == 'textarea') {
            attrType = el.attr('type');
            if (attrType == 'radio') {
                el.val([propVal]);
            }
            else if (attrType == 'checkbox') {
                if (typeof (propVal) == 'boolean') {
                    el.prop('checked', propVal);
                }
                else {
                    el.val([propVal]);
                }
            }
            else {
                el.val(propVal);
            }
        }
        else {
            el.html(propVal);
        }
    }

    function getElVal(el, propName) {
        var handler = el.attr(this.bindingOptions.handlerAttr);
        if (handler) {
            return this[handler]({ type: "getElVal", data: { el: el, propName: propName } });
        }
        var elVal = null;
        var tagName = el.prop("tagName").toLowerCase();
        if (tagName == 'input' || tagName == 'select' || tagName == 'textarea') {
            var attrType = el.attr('type');
            if (attrType == 'radio') {
                if (el.prop('checked')) {
                    elVal = el.val();
                }
                else {
                    elVal = getModelPropVal(propName);
                }
            }
            else if (attrType == 'checkbox') {
                if (el.prop('checked')) {
                    if (el.val() == 'on') {
                        elVal = true;
                    }
                    else {
                        elVal = el.val();
                    }
                }
                else {
                    if (el.val() == 'on') {
                        elVal = false;
                    }
                    else {
                        elVal = null;
                    }
                }
            }
            else {
                elVal = el.val();
            }
        }
        else {
            elVal = el.html();
        }

        return elVal;
    }

    function getModelPropVal(propName) {
        var props = propName.split('.');
        var propsLength = props.length;
        if (propsLength == 1) {
            return this.model.get(propName);
        }
        else {
            var currObj = this.model;
            var currPropVal = null;
            var currPropName = '';
            var currArrayName = '';
            var indexStartArray = -1;
            var indexEndArray = -1;
            var indexItemArray = -1;

            for (var i = 0; i < propsLength; i++) {
                currPropName = props[i];
                indexStartArray = currPropName.indexOf('[');
                if (indexStartArray < 0) {
                    if (currObj instanceof Backbone.Model) {
                        currPropVal = currObj.get(currPropName);
                    }
                    else {
                        currPropVal = currObj[currPropName];
                    }
                    if (!currPropVal) {
                        return null;
                    }
                    currObj = currPropVal;
                }
                else {
                    currArrayName = currPropName.substring(0, indexStartArray);
                    if (currObj instanceof Backbone.Model) {
                        currObj = currObj.get(currArrayName);
                    }
                    else {
                        currObj = currObj[currArrayName];
                    }
                    indexEndArray = currPropName.indexOf(']');
                    indexItemArray = parseInt(currPropName.substring(indexStartArray + 1, indexEndArray));
                    currObj = currObj[indexItemArray];
                }
            }

            return currPropVal;
        }
    }

    function setModelPropVal(propName, propVal) {
        var newVal = propVal;

        var props = propName.split('.');
        var propsLength = props.length;
        if (propsLength == 1) {
            this.model.set(propName, propVal);
        }
        else {
            var currObj = this.model;
            var currPropVal = null;
            var currPropName = '';
            var currArrayName = '';
            var indexStartArray = -1;
            var indexEndArray = -1;
            var keyItemArray = '';
            var indexItemArray = -1;;

            for (var i = 0, itemsLength = propsLength - 1; i < itemsLength; i++) {
                currPropName = props[i];
                keyItemArray = keyItemArray + (keyItemArray == '' ? '' : '.') + currPropName;
                indexStartArray = currPropName.indexOf('[');
                if (indexStartArray < 0) {
                    if (currObj instanceof Backbone.Model) {
                        currPropVal = currObj.get(currPropName);
                        if (!currPropVal) {
                            currObj.set(currPropName, {});
                            currPropVal = currObj.get(currPropName);
                        }
                        currObj = currPropVal;
                    }
                    else {
                        currPropVal = currObj[currPropName];
                        if (!currPropVal) {
                            currObj[currPropName] = {};
                            currPropVal = currObj[currPropName];
                        }
                        currObj = currPropVal;
                    }
                }
                else {
                    currArrayName = currPropName.substring(0, indexStartArray);
                    if (currObj instanceof Backbone.Model) {
                        currObj = currObj.get(currArrayName);
                    }
                    else {
                        currObj = currObj[currArrayName];
                    }
                    indexEndArray = currPropName.indexOf(']');
                    indexItemArray = parseInt(currPropName.substring(indexStartArray + 1, indexEndArray));
                    currObj = currObj[indexItemArray];
                }
            }
            currPropName = props[propsLength - 1];
            if (currObj instanceof Backbone.Model) {
                currObj.set(currPropName, propVal);
            }
            else {
                currObj[currPropName] = propVal;
            }
        }
    }

    function setBindingOptions(options) {
        this.bindingOptions = $.extend({ propNameAttr: 'name', eventsAttr: 'data-bind-events', handlerAttr: 'data-bind-handler', observeModel: true }, options);
    }

    return Backbone.View;
}));
