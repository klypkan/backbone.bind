# Backbone.bind 1.0

Two-way binding between View and Model for <a href="http://backbonejs.org/" target="_blank">Backbone</a>.

## Quick start

Include Backbone.bind after having included Backbone.js:
```html
<script type="text/javascript" src="backbone.js"></script>
<script type="text/javascript" src="backbone.bind.js"></script>
```
Sample HTML markup
```html
<input name="firstName" type="text" />
<select name="color">
  <option value="Yellow">Yellow</option>
  <option value="Pink">Pink</option>
</select>
<input type="checkbox" name="married" />
<input type="radio" name="employed" value="Yes"/>Yes
<input type="radio" name="employed" value="No"/>No
```
Create your view like so:
```javascript
var someView = Backbone.View.extend({
 render: function () {
    this.bind();
 }
});
```

## API Documentation
**bind([options])** - to initial binding between View and Model.

**propNameAttr** - a name HTML attribute with a value containing name of a model property, default value is 'name'.

**eventsAttr** - a name HTML attribute with a value containing one or more space-separated event types, default value is 'data-bind-events'.

**handlerAttr** - a name HTML attribute with a value containing name of a function to execute when the element is binding, default value is 'data-bind-handler'.

**observeModel** - enable/disable observe a model, default value is true.

```javascript
this.bind({ propNameAttr: 'data-bind-prop-name', observeModel: false });
```

**unbind()** - to cancel binding between View and Model.
